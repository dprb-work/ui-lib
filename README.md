# ui-lib

Shared React and Tailwind CSS components for dprb-work products.

The library starts with controls proven in OLAF's visual builder and feedback surfaces extracted from Archmap. It deliberately excludes product navigation, review streams, function cards, diff renderers, graph editors, and domain-specific field composition.

## Components

The base entry point contains controls and interaction primitives:

- `Button`, `IconButton`, `CopyButton`
- `Checkbox`, `Switch`
- `TextInput`, `NumberInput`, `SelectInput`
- `Badge`, `StatusPanel`
- `Dialog`, `InfoPopover`, `Tabs`, `ThemeSelector`, `Tooltip`

Heavy components use separate entry points so consumers do not install or bundle
their dependencies unless they import those components:

| Entry point | Components | Required peer |
| --- | --- | --- |
| `@dprb-work/ui-lib/data-table` | `MatrixDataTable` | `@tanstack/react-table` |
| `@dprb-work/ui-lib/charts` | `CartesianChart`, `DistributionChart` | `chart.js` |

## Use

Install the package, then import its stylesheet once, before product styles, at
the application entry point:

```tsx
import "@dprb-work/ui-lib/styles.css";

import { Button, Checkbox } from "@dprb-work/ui-lib";
import "./product.css";
```

Install the matching peer before importing an optional entry point:

```bash
corepack pnpm add @tanstack/react-table
corepack pnpm add chart.js
```

The stylesheet ships Tailwind Preflight, the default light and dark application
palette, and component utilities. The palette follows the baseline established
in the OLAF visual builder: slate surfaces, teal actions, and rose destructive
states. Add `.dark` to an ancestor or set `data-theme="dark"` on one.

Consumers may override these semantic variables at their application root:
`--ui-background`, `--ui-foreground`, `--ui-surface`,
`--ui-surface-foreground`, `--ui-muted`, `--ui-muted-foreground`,
`--ui-border`, `--ui-accent`, `--ui-accent-hover`, `--ui-on-accent`,
`--ui-danger`, `--ui-danger-hover`, and `--ui-on-danger`. Product styles loaded
after the package remain authoritative.

The consuming component owns layout. Pass `className` at the usage site to change
size, spacing, radius, color, or typography; conflict-aware Tailwind merging makes
those classes replace the component defaults without `!important`.

Set `Dialog`'s `unstyled` prop when a consumer supplies its complete overlay,
content, and title treatment through plain CSS.

## Develop

```bash
corepack pnpm install
corepack pnpm run dev
```

Storybook is the component catalog and browser verification surface.

## Verify

```bash
corepack pnpm run verify
corepack pnpm run build
```

`verify` runs ESLint, strict TypeScript, unit tests, browser-backed Storybook tests, and the library build.
