import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { aggregateSuccess, plan } from "./ci-plan.mjs";

const allChecks = ["docs", "verify"];

function assertPlan(result, { tier, checks, runHeavy }) {
  if (tier !== undefined) {
    assert.equal(result.tier, tier);
  }
  assert.deepEqual(result.checks, checks);
  assert.equal(result.run_heavy, runHeavy);
}

test("ready pull requests route every non-prose, unknown, mixed, empty, and invalid path set to fast", () => {
  const pathSets = [
    ["src/index.ts"],
    ["src/index.test.ts"],
    [".storybook/main.ts"],
    [".github/workflows/ci.yml"],
    ["pnpm-lock.yaml"],
    [".node-version"],
    ["new/input.bin"],
    ["README.md", "src/index.ts"],
    [],
    ["../x"],
    ["/abs"],
    ["."],
    [""],
  ];

  for (const paths of pathSets) {
    assertPlan(
      plan({ event: "pull_request", draft: false, paths }),
      { tier: "cheap", checks: ["fast"], runHeavy: false },
    );
  }
  for (const paths of [undefined, null, "src/index.ts", {}]) {
    assertPlan(
      plan({ event: "pull_request", draft: false, paths }),
      { tier: "cheap", checks: ["fast"], runHeavy: false },
    );
  }
});

test("local planning runs verify for non-prose and unknown paths", () => {
  for (const paths of [
    ["src/index.ts"],
    ["src/index.test.ts"],
    [".storybook/main.ts"],
    [".github/workflows/ci.yml"],
    ["pnpm-lock.yaml"],
    [".node-version"],
    ["new/input.bin"],
    ["README.md", "src/index.ts"],
  ]) {
    const result = plan({ event: "local", paths });
    assertPlan(result, { checks: ["verify"], runHeavy: true });
    assert.ok(["targeted", "full"].includes(result.tier));
  }
});

test("invalid local and push paths select the full verify plan", () => {
  const invalidPathSets = [[], ["../x"], ["/abs"], ["."], [""], null, undefined, "README.md"];
  for (const event of ["local", "push"]) {
    for (const paths of invalidPathSets) {
      assertPlan(
        plan({ event, paths }),
        { tier: "full", checks: ["verify"], runHeavy: true },
      );
    }
  }
});

test("AGENTS.md and CONTEXT.md route as prose on pull requests, pushes, and locally", () => {
  const prosePathSets = [
    ["AGENTS.md"],
    ["CONTEXT.md"],
    ["README.md", "docs/guide.md"],
    ["AGENTS.md", "CONTEXT.md", "README.md", "docs/guide.md"],
  ];

  for (const event of ["pull_request", "push", "local"]) {
    for (const paths of prosePathSets) {
      assertPlan(
        plan({ event, draft: false, paths }),
        { tier: "docs", checks: ["docs"], runHeavy: false },
      );
    }
  }
});

test("draft pull requests select nothing even for workflow paths", () => {
  assertPlan(
    plan({
      event: "pull_request",
      draft: true,
      paths: [".github/workflows/ci.yml", "src/index.ts"],
    }),
    { tier: "draft", checks: [], runHeavy: false },
  );
});

test("workflow dispatch selects docs and verify for any paths", () => {
  assertPlan(
    plan({ event: "workflow_dispatch", paths: ["README.md"] }),
    { tier: "full", checks: allChecks, runHeavy: true },
  );
  assertPlan(
    plan({ event: "workflow_dispatch", paths: [] }),
    { tier: "full", checks: allChecks, runHeavy: true },
  );
});

test("aggregate accepts only selected successful known checks with matching nonempty heads and bases", () => {
  const revision = ["head-1", "head-1", "base-1", "base-1"];
  assert.equal(
    aggregateSuccess(["fast"], { fast: "success", verify: "skipped" }, ...revision),
    true,
  );
  assert.equal(
    aggregateSuccess(["docs", "fast", "verify"], {
      docs: "success",
      fast: "success",
      verify: "success",
    }, ...revision),
    true,
  );

  for (const outcome of ["failure", "cancelled", "skipped", undefined]) {
    assert.equal(
      aggregateSuccess(["fast"], { fast: outcome }, ...revision),
      false,
    );
  }
  for (const selected of [[], ["fast", "fast"], ["unknown"], ["fast", "unknown"]]) {
    assert.equal(
      aggregateSuccess(selected, { fast: "success", unknown: "success" }, ...revision),
      false,
    );
  }
  for (const values of [
    ["", "head-1", "base-1", "base-1"],
    ["head-1", "", "base-1", "base-1"],
    ["head-1", "head-1", "", "base-1"],
    ["head-1", "head-1", "base-1", ""],
    ["head-1", "head-2", "base-1", "base-1"],
    ["head-1", "head-1", "base-1", "base-2"],
  ]) {
    assert.equal(
      aggregateSuccess(["fast"], { fast: "success" }, ...values),
      false,
    );
  }
});

test("other events select verify", () => {
  const result = plan({ event: "schedule", paths: ["README.md"] });
  assertPlan(result, { checks: ["verify"], runHeavy: true });
});


test("ui-lib declares Node 24.22.3 and passes base dependency drift check", () => {
  const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const declared = readFileSync(join(repoRoot, ".node-version"), "utf8").trim();
  assert.equal(declared, "24.22.3");
  const output = execFileSync("python3", ["scripts/check_base_deps.py"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.match(output, /24\.22\.3/);
  const drifted = spawnSync(
    "python3",
    ["scripts/check_base_deps.py", "--expected-node", "24.19.0"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  assert.notEqual(drifted.status, 0);
});
