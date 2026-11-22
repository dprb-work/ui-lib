import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const hookPath = join(repoRoot, ".githooks", "pre-push");
const gitLocalEnvNames = execFileSync("git", ["rev-parse", "--local-env-vars"], {
  encoding: "utf8",
}).trim().split("\n");

function cleanGitEnvironment(environment = process.env) {
  const cleaned = { ...environment };
  for (const name of gitLocalEnvNames) {
    delete cleaned[name];
  }
  return cleaned;
}

function git(repo, args, environment) {
  return execFileSync("git", args, {
    cwd: repo,
    env: cleanGitEnvironment(environment),
    stdio: "pipe",
  }).toString().trim();
}

function createRepo(change) {
  const root = mkdtempSync(join(tmpdir(), "ui-lib-pre-push-"));
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["-c", "init.defaultBranch=main", "init", repo], {
    env: cleanGitEnvironment(),
    stdio: "pipe",
  });
  git(repo, ["config", "user.name", "CI Test"]);
  git(repo, ["config", "user.email", "ci-test@example.invalid"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-m", "base"]);
  const base = git(repo, ["rev-parse", "HEAD"]);
  git(repo, ["update-ref", "refs/remotes/origin/main", base]);

  if (change) {
    const changedPath = join(repo, change.path);
    mkdirSync(dirname(changedPath), { recursive: true });
    writeFileSync(changedPath, change.content);
    git(repo, ["add", change.path]);
    git(repo, ["commit", "-m", "change"]);
  }

  return { root, repo };
}

function createFakePnpm(root, status = 0) {
  const bin = join(root, "bin");
  mkdirSync(bin);
  const logPath = join(root, "pnpm-argv.txt");
  const executable = join(bin, "pnpm");
  writeFileSync(
    executable,
    "#!/bin/sh\nprintf '%s\\n' \"$@\" > \"$PNPM_LOG\"\nexit \"$FAKE_PNPM_STATUS\"\n",
  );
  chmodSync(executable, 0o755);
  return { logPath, path: `${bin}:${process.env.PATH}`, status };
}

function invokeHook(repo, root, input, status = 0) {
  const fakePnpm = createFakePnpm(root, status);
  return {
    fakePnpm,
    result: spawnSync("sh", [hookPath, "origin", "url"], {
      cwd: repo,
      env: cleanGitEnvironment({
        ...process.env,
        PATH: fakePnpm.path,
        PNPM_LOG: fakePnpm.logPath,
        FAKE_PNPM_STATUS: String(fakePnpm.status),
      }),
      input,
      encoding: "utf8",
    }),
  };
}

function pushLine(repo, localSha = git(repo, ["rev-parse", "HEAD"])) {
  return `refs/heads/main ${localSha} refs/heads/main ${"0".repeat(40)}\n`;
}

function recordedPnpmArgs(path) {
  try {
    return readFileSync(path, "utf8").trim().split("\n");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

const scenarios = [
  {
    name: "clean docs changes run whitespace validation without pnpm",
    change: { path: "docs/guide.md", content: "clean docs\n" },
    input: (_repo, head) => pushLine(_repo, head),
    expected: 0,
    whitespace: false,
  },
  {
    name: "docs changes with trailing whitespace fail without pnpm",
    change: { path: "docs/guide.md", content: "trailing whitespace \n" },
    input: (_repo, head) => pushLine(_repo, head),
    expected: 1,
    whitespace: true,
  },
];

for (const scenario of scenarios) {
  test(scenario.name, () => {
    const { root, repo } = createRepo(scenario.change);
    try {
      const head = git(repo, ["rev-parse", "HEAD"]);
      const { fakePnpm, result } = invokeHook(
        repo,
        root,
        scenario.input(repo, head),
      );
      assert.equal(result.status, scenario.expected, result.stderr);
      assert.equal(recordedPnpmArgs(fakePnpm.logPath), null);
      assert.equal(scenario.whitespace, result.status !== 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("source changes invoke exactly pnpm run verify and propagate success or failure", () => {
  const { root, repo } = createRepo({ path: "src/component.ts", content: "export {};\n" });
  try {
    const head = git(repo, ["rev-parse", "HEAD"]);
    for (const status of [0, 17]) {
      const { fakePnpm, result } = invokeHook(repo, root, pushLine(repo, head), status);
      assert.equal(result.status, status, result.stderr);
      assert.deepEqual(recordedPnpmArgs(fakePnpm.logPath), ["run", "verify"]);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unknown changed paths run pnpm run verify", () => {
  const { root, repo } = createRepo({ path: "new/input.bin", content: "opaque\n" });
  try {
    const { fakePnpm, result } = invokeHook(repo, root, pushLine(repo));
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(recordedPnpmArgs(fakePnpm.logPath), ["run", "verify"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing origin/main invokes pnpm run verify", () => {
  const { root, repo } = createRepo({ path: "src/component.ts", content: "export {};\n" });
  try {
    git(repo, ["update-ref", "-d", "refs/remotes/origin/main"]);
    const { fakePnpm, result } = invokeHook(repo, root, pushLine(repo));
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(recordedPnpmArgs(fakePnpm.logPath), ["run", "verify"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("empty stdin and deletion-only stdin exit successfully without pnpm", () => {
  const { root, repo } = createRepo();
  try {
    const deletion = `refs/heads/main ${"0".repeat(40)} refs/heads/main ${"1".repeat(40)}\n`;
    for (const input of ["", deletion]) {
      const { fakePnpm, result } = invokeHook(repo, root, input);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(recordedPnpmArgs(fakePnpm.logPath), null);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pushed sha that differs from HEAD fails without pnpm", () => {
  const { root, repo } = createRepo();
  try {
    const mismatch = "f".repeat(40);
    assert.notEqual(mismatch, git(repo, ["rev-parse", "HEAD"]));
    const { fakePnpm, result } = invokeHook(repo, root, pushLine(repo, mismatch));
    assert.notEqual(result.status, 0);
    assert.equal(recordedPnpmArgs(fakePnpm.logPath), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a dirty worktree fails without pnpm", () => {
  const { root, repo } = createRepo({ path: "src/component.ts", content: "export {};\n" });
  try {
    writeFileSync(join(repo, "src/component.ts"), "export const dirty = true;\n");
    const { fakePnpm, result } = invokeHook(repo, root, pushLine(repo));
    assert.notEqual(result.status, 0);
    assert.equal(recordedPnpmArgs(fakePnpm.logPath), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
