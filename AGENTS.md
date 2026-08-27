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

- Add a component only when its behavior and API make sense in at least two products. A second proven use, not visual similarity alone, is the extraction threshold.
- Keep product vocabulary, data models, routing, application shells, and feature workflows in the consuming repository.
- Prefer semantic HTML and Radix primitives over custom interaction machinery.
- Every interactive component must preserve keyboard access, visible focus, accessible naming, disabled behavior, and dark mode.
- The parent owns layout. Components accept `className` for point-of-use presentation, and conflict-aware Tailwind merging makes consumer classes replace defaults without `!important`.
- Tailwind class names must remain statically detectable. Use the CSS-first Tailwind v4 setup in `src/styles.css`.
- The package stylesheet owns Tailwind Preflight, shared application color defaults, and scoped component utilities. Consumers import `@dprb-work/ui-lib/styles.css` once and may override semantic variables at the application root.
- When a consumer exposes a credible shared-component candidate, document the concrete call sites and product-specific residue first. Suggest the hoist; do not perform it without that evidence and explicit scope.
- Do not add compatibility aliases during extraction. Migrate all consumers in the same change.

## Evidence

- Unit tests cover behavior and accessibility contracts.
- Storybook stories cover visual states in light and dark themes.
- Run the real Storybook in Chromium for visual changes; builds alone do not prove appearance.
