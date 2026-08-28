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
- Expose the smallest boundary that remains useful on its own: separate browser behavior, visual rendering, data transformation, and product composition when consumers can use those parts independently. No primitive may require an optional sibling such as a table, caption, toolbar, or alternate renderer.
- Hooks may own reusable non-visual behavior. Keep icons, labels, notifications, and product workflows in composed components. For example, clipboard behavior belongs in `useClipboard`; a product-specific copy control composes it with `IconButton`.
- Own a small focused hook when that is cheaper than adapting a dependency. When hooks start repeating browser fallbacks, subscriptions, async status, timers, or feature detection, evaluate maintained hook libraries and suggest the best fit to the user before adding one. Compare API fit, bundle and peer cost, React and SSR behavior, maintenance, license, and migration impact. Export a stable `ui-lib` API so the dependency remains replaceable.
- Prefer composition over mode props that replace whole structures. A convenience component may assemble primitives, but consumers must be able to import a renderer or behavior without its product wrapper. Add compound subcomponents or hooks only when concrete consumers need the independent parts.
- Prefer semantic HTML and Radix primitives over custom interaction machinery.
- `Popover` is the shared styled primitive for non-modal disclosed content. Consumers own trigger copy, visible labels, and product content. Use a menu primitive, not `Popover`, when options require menu roles, roving focus, or menu keyboard behavior.
- `ThemeProvider`, `useTheme`, and the three-way `ThemeSwitch` are the canonical theme contract. Applications provide one root provider and may choose the persistence key; consumers do not duplicate system-preference listeners, document attributes, or theme persistence.
- `MatrixDataTable` owns both its static matrix and opt-in interactive table behavior. Consumers own domain columns, value formatting, surrounding figures and captions, chart pairing, and product workflows. Do not move those concerns into the table or remove the static mode without new evidence.
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
