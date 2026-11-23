const appChecks = ["verify"];
const fullPaths = [
  /^\.github\//, /^\.storybook\//,
  /^(?:\.node-version|package\.json|pnpm-lock\.yaml|eslint\.config\.js|tsconfig(?:\.[^/]+)?\.json|vite\.config\.ts|vitest\.config\.ts)$/,
  /\.ya?ml$/,
];
const knownPaths = [
  /^docs\//, /^src\//, /^scripts\//, /^tests\//,
  /^(?:AGENTS\.md|\.editorconfig|\.gitignore|README\.md)$/,
];
const proseDocs = (path) => ["README.md", "AGENTS.md", "CONTEXT.md"].includes(path) || /^docs\/.+\.md$/.test(path);
const validPaths = (paths) => Array.isArray(paths) && paths.length > 0
  && !paths.some((path) => typeof path !== "string" || path === "" || path === "." || path.startsWith("/") || path.split("/").includes(".."));
const appPlan = (tier) => ({ tier, checks: appChecks, run_heavy: true });
const docsPlan = () => ({ tier: "docs", checks: ["docs"], run_heavy: false });
const cheapPlan = () => ({ tier: "cheap", checks: ["fast"], run_heavy: false });
const manualPlan = () => ({ tier: "full", checks: ["docs", ...appChecks], run_heavy: true });

export function plan({ event, draft, paths }) {
  if (event === "pull_request" && draft === true) return { tier: "draft", checks: [], run_heavy: false };
  if (event === "workflow_dispatch") return manualPlan();
  // A ready pull request runs only the cheap hosted tier; the browser-backed verify stays in the local push hook.
  if (event === "pull_request") return validPaths(paths) && paths.every(proseDocs) ? docsPlan() : cheapPlan();
  if (!validPaths(paths) || (event !== "push" && event !== "local")) return appPlan("full");
  if (paths.every(proseDocs)) return docsPlan();
  if (paths.every((path) => fullPaths.some((pattern) => pattern.test(path)))) return appPlan("full");
  if (paths.every((path) => [...knownPaths, ...fullPaths].some((pattern) => pattern.test(path)))) return appPlan("targeted");
  return appPlan("full");
}

export function aggregateSuccess(selectedChecks, results, expectedHead, actualHead, expectedBase, actualBase) {
  const allowed = new Set(["docs", "fast", ...appChecks]);
  if (!Array.isArray(selectedChecks) || selectedChecks.length === 0
      || selectedChecks.some((check) => !allowed.has(check))
      || new Set(selectedChecks).size !== selectedChecks.length
      || !results || typeof results !== "object" || Array.isArray(results)
      || selectedChecks.some((check) => results[check] !== "success")
      || typeof expectedHead !== "string" || expectedHead === "" || expectedHead !== actualHead
      || typeof expectedBase !== "string" || expectedBase === "" || expectedBase !== actualBase) return false;
  return true;
}
