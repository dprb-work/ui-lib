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
`verify:fast` runs the base dependency check, ESLint, strict TypeScript, unit
tests and the library build. `verify` adds the browser-backed Storybook tests.

A ready pull request never runs the browser-backed `verify` on the hosted
runner. Unknown, malformed or empty change sets select `fast` there and the full
`verify` in the local push hook. Push to `main` keeps the full `verify` as the
post-merge check. Draft pull requests skip application verification and do not
satisfy the aggregate check.

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
