import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "check_base_deps.py");
const nodeVersion = "24.22.3\n";
const conventionsBytes = Buffer.from("# Conventions\n\nUse the shared conventions.\n");
const changedConventionsBytes = Buffer.from("# Conventions\n\nUse a different convention.\n");

function createFixture(t, copyBytes = conventionsBytes) {
  const root = mkdtempSync(join(tmpdir(), "check-base-deps-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const template = join(root, "template");
  const consumer = join(root, "consumer");
  mkdirSync(template);
  mkdirSync(consumer);
  writeFileSync(join(template, ".node-version"), nodeVersion);
  writeFileSync(join(template, "CONVENTIONS.md"), conventionsBytes);
  writeFileSync(join(consumer, ".node-version"), nodeVersion);
  mkdirSync(join(consumer, "docs"));
  writeFileSync(join(consumer, "docs", "conventions.md"), copyBytes);
  return { consumer, template };
}

function runChecker(...args) {
  return spawnSync("python3", ["-B", script, ...args], { encoding: "utf8" });
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function assertDriftLine(stderr, expected) {
  assert.equal(stderr, `${expected}\n`);
}

test("template mode reports the exact hashes for a changed conventions copy", (t) => {
  const { consumer, template } = createFixture(t, changedConventionsBytes);
  const result = runChecker(consumer, "--template", template);

  assert.equal(result.status, 1);
  assertDriftLine(
    result.stderr,
    `DRIFT repo=consumer path=docs/conventions.md declared=${sha256(changedConventionsBytes)} expected=${sha256(conventionsBytes)}`,
  );
});

test("template mode reports a missing conventions copy", (t) => {
  const { consumer, template } = createFixture(t);
  rmSync(join(consumer, "docs", "conventions.md"));
  const result = runChecker(consumer, "--template", template);

  assert.equal(result.status, 1);
  assertDriftLine(
    result.stderr,
    `DRIFT repo=consumer path=docs/conventions.md declared=<missing> expected=${sha256(conventionsBytes)}`,
  );
});

test("template mode accepts an identical conventions copy", (t) => {
  const { consumer, template } = createFixture(t, conventionsBytes);
  const result = runChecker(consumer, "--template", template);

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stderr, /^DRIFT\b/m);
});

test("template mode rejects a template without CONVENTIONS.md", (t) => {
  const { consumer, template } = createFixture(t);
  rmSync(join(template, "CONVENTIONS.md"));
  const result = runChecker(consumer, "--template", template);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /^ERROR:.*(?:\n|$)/m);
  assert.doesNotMatch(result.stderr, /^DRIFT\b/m);
});

test("single-repo mode does not require a conventions copy", (t) => {
  const { consumer } = createFixture(t);
  rmSync(join(consumer, "docs", "conventions.md"));
  const result = runChecker(consumer);

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stderr, /^DRIFT\b/m);
});
