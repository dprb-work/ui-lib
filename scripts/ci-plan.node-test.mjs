import assert from "node:assert/strict";
import test from "node:test";

import { aggregateSuccess, plan } from "./ci-plan.mjs";

const appChecks = ["verify"];
const allChecks = ["docs", ...appChecks];

function assertChecks(result, expected) {
  assert.deepEqual(new Set(result.checks), new Set(expected));
}

function assertFullOrFail(input, expectedChecks) {
  let result;
  try {
    result = plan(input);
  } catch (error) {
    assert.ok(error instanceof Error);
    return;
  }
  assert.equal(result.tier, "full");
  assertChecks(result, expectedChecks);
}

test("ready README and positive docs prose select only documentation validation", () => {
  for (const path of ["README.md", "docs/accessibility.md"]) {
    const result = plan({ event: "pull_request", draft: false, paths: [path] });
    assert.equal(result.tier, "docs");
    assert.equal(result.run_heavy, false);
    assertChecks(result, ["docs"]);
  }
});

test("runtime Markdown and configuration are not docs-only", () => {
  for (const path of [".storybook/README.md", ".storybook/main.ts", "tsconfig.json"]) {
    const result = plan({ event: "pull_request", draft: false, paths: [path] });
    assert.notEqual(result.tier, "docs");
    assert.equal(result.run_heavy, true);
    assertChecks(result, appChecks);
  }
});

test("known component source and test changes select the existing verify boundary", () => {
  for (const path of ["src/components/Popover.tsx", "src/components/Popover.test.tsx"]) {
    const result = plan({ event: "pull_request", draft: false, paths: [path] });
    assert.notEqual(result.tier, "docs");
    assert.equal(result.run_heavy, true);
    assertChecks(result, appChecks);
  }
});

test("dependency and workflow inputs do not select docs-only work", () => {
  for (const path of ["pnpm-lock.yaml", ".github/workflows/ci.yml"]) {
    const result = plan({ event: "pull_request", draft: false, paths: [path] });
    assert.notEqual(result.tier, "docs");
    assertChecks(result, appChecks);
  }
});

test("unmapped and broad changes cannot produce a narrow plan", () => {
  for (const paths of [[], ["unknown/new-input.bin"], ["**/*"], ["."]]) {
    assertFullOrFail({ event: "pull_request", draft: false, paths }, appChecks);
  }
});

test("draft skips every automatic app check; manual dispatch selects the full contract", () => {
  const draft = plan({
    event: "pull_request",
    draft: true,
    paths: [".github/workflows/new-heavy-job.yml", "src/components/Popover.tsx"],
  });
  assert.equal(draft.tier, "draft");
  assert.equal(draft.run_heavy, false);
  assertChecks(draft, []);
  assert.equal(aggregateSuccess([], {}, "head-1", "head-1", "base-1", "base-1"), false);

  const manual = plan({ event: "workflow_dispatch", draft: false, paths: ["README.md"] });
  assert.equal(manual.tier, "full");
  assert.equal(manual.run_heavy, true);
  assertChecks(manual, allChecks);
});

test("push and pull request planning preserve the same selected verify boundary", () => {
  for (const event of ["pull_request", "push"]) {
    const result = plan({ event, draft: false, paths: ["src/components/Popover.tsx"] });
    assertChecks(result, appChecks);
  }
});

test("required aggregate rejects selected failures and stale candidate or base", () => {
  const selected = ["verify"];
  const results = { verify: "success" };
  const revision = ["head-1", "head-1", "base-1", "base-1"];
  assert.equal(aggregateSuccess(selected, results, ...revision), true);
  for (const outcome of ["failure", "cancelled", "skipped", "unknown"]) {
    assert.equal(aggregateSuccess(selected, { verify: outcome }, ...revision), false);
  }
  assert.equal(aggregateSuccess(selected, {}, ...revision), false);
  assert.equal(aggregateSuccess([], results, ...revision), false);
  assert.equal(aggregateSuccess(selected, results, "head-1", "head-2", "base-1", "base-1"), false);
  assert.equal(aggregateSuccess(selected, results, "head-1", "head-1", "base-1", "base-2"), false);
});
