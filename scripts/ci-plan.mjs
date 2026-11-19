const appChecks = ["verify"];
const fullPaths = [
  /^\.github\//, /^\.storybook\//,
  /^(?:package\.json|pnpm-lock\.yaml|eslint\.config\.js|tsconfig(?:\.[^/]+)?\.json|vite\.config\.ts|vitest\.config\.ts)$/,
  /\.ya?ml$/,
];
const knownPaths = [
  /^docs\//, /^src\//, /^scripts\//, /^tests\//,
  /^(?:AGENTS\.md|\.editorconfig|\.gitignore|README\.md)$/,
];
const proseDocs = (path) => path === "README.md" || /^docs\/.+\.md$/.test(path);
const appPlan = (tier) => ({ tier, checks: appChecks, run_heavy: true });
const manualPlan = () => ({ tier: "full", checks: ["docs", ...appChecks], run_heavy: true });

export function plan({ event, draft, paths }) {
  if (event === "pull_request" && draft === true) return { tier: "draft", checks: [], run_heavy: false };
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string" || path === "" || path === "." || path.startsWith("/") || path.split("/").includes(".."))) return appPlan("full");
  if (event === "workflow_dispatch") return manualPlan();
  if (event !== "pull_request" && event !== "push") return appPlan("full");
  if (paths.length > 0 && paths.every(proseDocs)) return { tier: "docs", checks: ["docs"], run_heavy: false };
  if (paths.length > 0 && paths.every((path) => fullPaths.some((pattern) => pattern.test(path)))) return appPlan("full");
  if (paths.length > 0 && paths.every((path) => [...knownPaths, ...fullPaths].some((pattern) => pattern.test(path)))) return appPlan("targeted");
  return appPlan("full");
}

export function aggregateSuccess(selectedChecks, results, expectedHead, actualHead, expectedBase, actualBase) {
  const allowed = ["docs", ...appChecks];
  if (!Array.isArray(selectedChecks) || selectedChecks.length === 0
      || selectedChecks.some((check) => !allowed.includes(check))
      || new Set(selectedChecks).size !== selectedChecks.length
      || !results || typeof results !== "object" || Array.isArray(results)
      || selectedChecks.some((check) => results[check] !== "success")
      || typeof expectedHead !== "string" || expectedHead === "" || expectedHead !== actualHead
      || typeof expectedBase !== "string" || expectedBase === "" || expectedBase !== actualBase) return false;
  return true;
}
