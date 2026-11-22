// Local push check: the hosted planner routes the pushed commit, and the browser-backed verify runs here.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { plan } from "./ci-plan.mjs";

// The hook runs the developer's own git and pnpm from PATH, like the git push that started it.
const git = (args) => spawnSync("git", args, { encoding: "utf8" }); // NOSONAR S4036: developer toolchain from PATH
const fail = (message) => {
  console.error(`pre-push: ${message}`);
  process.exit(1);
};

// Git writes one "<local ref> <local sha> <remote ref> <remote sha>" line per pushed ref; an all-zero local sha deletes.
const pushed = readFileSync(0, "utf8").split("\n").filter((line) => line.trim() !== "")
  .map((line) => line.trim().split(/\s+/)[1] ?? "")
  .filter((sha) => !/^0+$/.test(sha));
if (pushed.length === 0) process.exit(0);

const head = git(["rev-parse", "HEAD"]).stdout.trim();
if (pushed.some((sha) => sha !== head)) fail("an outgoing commit is not HEAD; check out the pushed branch and push again.");
if (git(["status", "--porcelain", "--untracked-files=all"]).stdout.trim() !== "") {
  fail("the checkout has uncommitted changes; commit or stash them so the checks see the pushed commit.");
}

const mergeBase = git(["merge-base", "HEAD", "origin/main"]);
const base = mergeBase.status === 0 ? mergeBase.stdout.trim() : "";
// Without a merge base with origin/main the change set is unknown, and the planner selects the full verify.
const paths = base === "" ? null : git(["diff", "--name-only", "-z", "--no-renames", base, "HEAD"]).stdout.split("\0").filter(Boolean);
const selected = plan({ event: "local", paths });
console.error(`pre-push: ${selected.tier} tier (${selected.checks.join(", ")})`);

if (selected.checks.includes("verify")) {
  const verify = spawnSync("pnpm", ["run", "verify"], { stdio: "inherit" }); // NOSONAR S4036: developer toolchain from PATH
  if (verify.error) throw verify.error;
  process.exit(verify.status ?? 1);
}
if (spawnSync("git", ["diff", "--check", base, "HEAD"], { stdio: "inherit" }).status !== 0) { // NOSONAR S4036: developer toolchain from PATH
  fail("whitespace errors in the changed prose.");
}
