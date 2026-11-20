# AGENTS

`ui-lib` is the shared React component library for dprb-work products. It owns reusable interaction primitives, not product screens or domain models.

Read [CONTEXT.md](CONTEXT.md) before changes and use its words in code comments, stories, pull requests and reviews. [README.md](README.md#use) owns consumer setup, styling and composition guidance; follow it rather than duplicating its rules here.

## Commands

```bash
corepack pnpm install
corepack pnpm run verify
corepack pnpm run build
corepack pnpm run dev
```

## Component boundary

- Look for an existing UI component before writing markup. Use the README component list and the Storybook catalog (`corepack pnpm run dev`); inspect stories in `src/components` and `src/chat` for supported behavior.
- Add a component only when its behavior and API make sense in at least two products. A second proven use, not visual similarity alone, is the extraction threshold.
- Propose a new UI component with its two concrete product uses, existing alternatives, smallest useful API and state examples. Propose a token with its semantic role, unmet need, call sites and light/dark contrast pairings; get agreement before adding a public role or changing a default. No new name or hue follows from visual similarity alone.
- Keep product vocabulary, data models, routing, application shells, and feature workflows in the consuming repository.
- Expose the smallest boundary that remains useful on its own: separate browser behavior, visual rendering, data transformation, and product composition when consumers can use those parts independently. No primitive may require an optional sibling such as a table, caption, toolbar, or alternate renderer.
- Hooks may own reusable non-visual behavior. Keep icons, labels, notifications, and product workflows in composed components. For example, clipboard behavior belongs in `useClipboard`; a product-specific copy control composes it with `IconButton`.
- Own a small focused hook when that is cheaper than adapting a dependency. When hooks start repeating browser fallbacks, subscriptions, async status, timers, or feature detection, evaluate maintained hook libraries and suggest the best fit to the user before adding one. Compare API fit, bundle and peer cost, React and SSR behavior, maintenance, license, and migration impact. Export a stable `ui-lib` API so the dependency remains replaceable.
- Prefer composition over mode props that replace whole structures. A convenience component may assemble primitives, but consumers must be able to import a renderer or behavior without its product wrapper. Add compound subcomponents or hooks only when concrete consumers need the independent parts.
- Prefer semantic HTML and Radix primitives over custom interaction machinery.
- `Popover` is the shared styled primitive for non-modal disclosed content. Consumers own trigger copy, visible labels, and product content. Use a menu primitive, not `Popover`, when options require menu roles, roving focus, or menu keyboard behavior.
- `ThemeProvider`, `useTheme`, and the three-way `ThemeSwitch` are the canonical theme contract. Applications provide one root provider and may choose the persistence key; consumers do not duplicate system-preference listeners, document attributes, or theme persistence.
- `MatrixDataTable` owns both its static matrix and opt-in interactive table behavior. Consumers own domain columns, value formatting, surrounding figures and captions, chart pairing, and product workflows. Do not move those concerns into the table or remove the static mode without new evidence.
- The parent owns layout. Components accept `className` for point-of-use presentation, and conflict-aware Tailwind merging makes consumer classes replace defaults without `!important`.
- When a consumer exposes a credible shared-component candidate, document the concrete call sites and product-specific residue first. Suggest the hoist; do not perform it without that evidence and explicit scope.
- Do not add compatibility aliases during extraction. Migrate all consumers in the same change.

## Styling

- Follow [Styling and composition](README.md#styling-and-composition) for Tailwind versus plain CSS, role tokens, product-local density and consumer overrides.
- `src/theme.css` is the authored theme entry: shared role values, light/dark overrides and Tailwind token metadata. It imports the raw ramps from `src/palette.css`. `src/styles.css` imports that theme and owns Preflight and runtime component CSS. Do not add a JavaScript theme config or copied token mappings.

## Evidence

- Unit tests cover behavior and accessibility contracts.
- For UI changes, the pull request must show applicable hover, focus, selected, expanded, press feedback/toggle, disabled, busy and invalid states. Identify inapplicable states rather than inventing them.
- Storybook examples and browser evidence must cover light and dark themes, a 390px-wide viewport and keyboard operation, including focus return for disclosed content where applicable.
- Run the real Storybook in Chromium for visual changes; builds alone do not prove appearance. Documentation-only pull requests need wording and link checks, not new visual claims.
