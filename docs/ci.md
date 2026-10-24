# CI checks

Pull requests and pushes to `main` run the full `pnpm run verify` workflow,
including browser-backed Storybook tests. Draft pull requests skip application
verification and do not satisfy the aggregate check. README and documentation
Markdown-only changes run `git diff --check`; all other changes run full verify.
`workflow_dispatch` requests the full verification.

The aggregate requires the selected check to succeed for the current pull
request head and base, or the current `main` head. Skipped or stale verification
does not count as a successful full run.
