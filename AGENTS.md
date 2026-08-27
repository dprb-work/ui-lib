# AGENTS

`ui-lib` is the shared React component library for dprb-work products. It owns reusable interaction primitives, not product screens or domain models.

## Commands

```bash
corepack pnpm install
corepack pnpm run verify
corepack pnpm run build
corepack pnpm run dev
```

## Component boundary

- Add a component only when its behavior and API make sense in at least two products.
- Keep product vocabulary, data models, routing, application shells, and feature workflows in the consuming repository.
- Prefer semantic HTML and Radix primitives over custom interaction machinery.
- Every interactive component must preserve keyboard access, visible focus, accessible naming, disabled behavior, and dark mode.
- The parent owns layout. Components accept `className` for point-of-use presentation, and conflict-aware Tailwind merging makes consumer classes replace defaults without `!important`.
- Tailwind class names must remain statically detectable. Use the CSS-first Tailwind v4 setup in `src/styles.css`.
- The package ships scoped component utilities without Tailwind Preflight. Consumers import `@dprb-work/ui-lib/styles.css` once.
- Do not add compatibility aliases during extraction. Migrate all consumers in the same change.

## Evidence

- Unit tests cover behavior and accessibility contracts.
- Storybook stories cover visual states in light and dark themes.
- Run the real Storybook in Chromium for visual changes; builds alone do not prove appearance.
