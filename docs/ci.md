# CI checks

`scripts/ci-plan.mjs` selects the checks for the hosted workflow and the local
push hook.

| Event | Prose only | Anything else |
|---|---|---|
| Ready pull request | `docs`: `git diff --check` | `fast`: `pnpm run verify:fast` |
| Local push hook | `docs`: `git diff --check` | `verify`: `pnpm run verify` |
| Push to `main` | `docs`: `git diff --check` | `verify`: `pnpm run verify` |
| `workflow_dispatch` | `docs` and `verify` | `docs` and `verify` |

Prose is `README.md`, `AGENTS.md`, `CONTEXT.md` and Markdown under `docs/`.
`verify:fast` runs the base dependency check, dead-code check, ESLint, strict
TypeScript, unit tests and the library build. `verify` adds the browser-backed Storybook tests
and starts `pnpm run dev` to check that the Storybook dev server listens only
on loopback and refuses framing by foreign sites.

A ready pull request never runs the browser-backed `verify` on the hosted
runner. Unknown, malformed or empty change sets select `fast` there and the full
`verify` in the local push hook. Push to `main` keeps the full `verify` as the
post-merge check. Draft pull requests skip application verification and do not
satisfy the aggregate check.

## Dead-code checks

`pnpm run check:dead-code` runs locked Vulture 2.16 and Knip 6.48.0 through
the checker adopted from project-template#38, revision
`8668acb30bf90b11cbb647072c76705c9b107090`. The only checker adaptation is the
default comparison branch, `origin/main` rather than `origin/release`.
The existing `verify:fast` owns this check for local pushes and hosted checks;
there is no separate workflow or hook.

`dead-code.json` is the native analyzer configuration and allow list.
Vulture scans repository Python scripts; its ignored names are Knip enum
members consumed by iteration. Knip scans the library, scripts, tests and
configuration with its installed Storybook, Vitest, Vite and Playwright plugins.
The four authored package entry points preserve the public library exports.
The hook's Node entry point and the TypeScript compile-only public API fixture
are explicit entries because they are invoked outside the import graph.
Knip itself is launched from Python; Tailwind is imported from CSS. Those two
dependencies are explicitly admitted rather than mistaken for unused packages.

`dead-code-baseline.json` records pre-existing findings without removing code.
Identity is analyzer, path, kind and name, including repeated occurrence counts;
line-number movement does not create new debt. Both analyzers scan the full
configured project before selecting new findings in changed files. Baseline
findings remain visible in inventory, but only new findings in changed files
fail. Referenced optional peers are not unused code and are excluded.

```bash
corepack pnpm run check:dead-code
corepack pnpm run check:dead-code --base origin/main
uv run --locked --no-sync python scripts/check_dead_code.py --write-baseline
```

The last command explicitly replaces the baseline for review; normal checks
never refresh it. Missing/malformed configuration, baseline or analyzer output,
and analyzer failures fail verification. Local changes include staged,
unstaged and nonignored untracked files. Missing default history checks all
files conservatively. Hosted checks fetch history and pass the planner's base
SHA through `DEAD_CODE_BASE`; an invalid explicit base fails rather than
silently broadening. Python tooling setup is `uv sync --locked`; pnpm and uv
both enforce the 72-hour admission cooldown for dependency resolution.

## Local push hook

Enable the routed hook once per clone:

```bash
git config core.hooksPath .githooks
```

`.githooks/pre-push` runs `scripts/ci-local.mjs`. It plans the commit's changes
against `origin/main` and runs the selected check on `HEAD`. It refuses a push
whose outgoing commit is not `HEAD` or whose checkout has uncommitted changes.
Without `origin/main` it runs the full `verify`.

## Aggregate

Title/body-only pull-request edits take the metadata-only route and do not
create or satisfy the stable aggregate check. Ready-for-review and
converted-to-draft transitions run the normal policy route.

The aggregate requires the selected check to succeed for the current pull
request head and base, or the current `main` head. Skipped or stale checks do
not count as a successful run.
