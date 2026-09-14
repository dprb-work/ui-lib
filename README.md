# ui-lib

Shared React and Tailwind CSS components for dprb-work products.

The library starts with controls proven in OLAF's visual builder and feedback surfaces extracted from Archmap. It deliberately excludes product navigation, review streams, function cards, diff renderers, graph editors, and domain-specific field composition.

## Components

The base entry point contains controls and interaction primitives:

- `Button`, `IconButton`, `CopyButton`, `CopyableText`
- `Checkbox`, `Switch`, `SegmentedControl`
- `TextInput`, `TextareaInput`, `NumberInput`, `SelectInput`, `ColorPicker`
- `Badge`, `StatusPanel`, `ContentBlock`, `CodeViewport`
- `Calendar`, `Fullscreen`
- `Dialog`, `Tabs`, `Tooltip`, `PortalProvider`
- `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverArrow`, `PopoverClose`

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

Wrap the application once to apply and persist the canonical three-way theme:

```tsx
import { ThemeProvider, ThemeSwitch } from "@dprb-work/ui-lib";

createRoot(root).render(
  <ThemeProvider storageKey="my-product-theme">
    <App />
  </ThemeProvider>,
);

function Settings() {
  return <ThemeSwitch />;
}
```

`ThemeProvider` resolves `system` against `prefers-color-scheme`, applies the
resolved `data-theme` and selected `data-theme-mode` to the document root, sets
`color-scheme`, and owns persistence. Product code must not duplicate that
lifecycle.

Use `Popover` compound parts for non-modal disclosed content. The trigger owns
its visible or ARIA label, and `PopoverContent` requires `aria-label` or
`aria-labelledby`. Use a menu component instead when choices require menu roles
and menu keyboard behavior.

`MatrixDataTable` keeps both its static matrix and opt-in interactive modes.
Consumers own domain formatting, captions, chart pairing, and surrounding
workflow.

The stylesheet ships Tailwind Preflight, the default light and dark application
palette, and component utilities. The palette follows the baseline established
in the OLAF visual builder: slate surfaces, teal actions, and rose destructive
states. Add `.dark` to an ancestor or set `data-theme="dark"` on one.

Consumers may override these semantic variables at their application root:
`--ui-background`, `--ui-foreground`, `--ui-surface`,
`--ui-surface-foreground`, `--ui-muted`, `--ui-muted-foreground`,
`--ui-border`, `--ui-accent`, `--ui-accent-hover`, `--ui-on-accent`,
`--ui-success`, `--ui-danger`, `--ui-danger-hover`, and `--ui-on-danger`.
`--ui-success` is the semantic success color. Product styles loaded after the
package remain authoritative.

The consuming component owns layout. Pass `className` at the usage site to change
size, spacing, radius, color, or typography; conflict-aware Tailwind merging makes
those classes replace the component defaults without `!important`.

`CopyableText` takes `text`, `copyLabel`, and an optional React `label`. It
renders wrapped code text with the existing `CopyButton`; callers retain layout
and copy-button styling through `className` and `copyButtonClassName`.

`TextareaInput` accepts native textarea props, including `ref`, and shares the
input appearance and accessible error contract. It grows with content where
the browser supports `field-sizing`; `rows` supplies the native fallback.
Consumers control maximum height, resizing, and submission behavior.

`ContentBlock` renders a bordered container with an inset title and an absolutely
positioned `corner` action. It does not reserve a column for the action.
Consumers supply the title, icon, metadata, accessible name, content segments,
and surrounding spacing. Links and domain behavior remain in the consumer.

`CodeViewport` accepts native `pre` props, including `ref`, and a `wrap` boolean.
Its scroll container spans the available width. The consumer owns preferences,
syntax highlighting, line numbers, and streaming behavior.

`ColorPicker` is controlled by `value` and `onValueChange` using opaque
`#rrggbb` strings. It provides RGB sliders, a native color well, and an editable
hex field. Invalid drafts stay in the field without changing the selected color.
Supply `label` for the controls' accessible names. Compose it with `Popover`
when selection should open on click; the consumer owns persistence.

Set `Dialog`'s `unstyled` prop when a consumer supplies its complete overlay,
content, and title treatment through plain CSS.

`Calendar` is a controlled date grid. Pass the selected `value` and visible
`month`, then update them through `onValueChange` and `onMonthChange`.
`onValueChange` receives the selected local calendar day at midnight. It derives
weekday order and labels from `locale`, unless `weekStartsOn` overrides the
locale's first weekday. `min`, `max`, and `disabled` disable dates. Arrow keys
move by day or week, Home and End move within a week, Page Up and Page Down move
by month, and Shift plus Page Up or Page Down moves by year.

`Fullscreen` is a controlled `Dialog` wrapper. Pass its required `trigger`,
`open`, `onOpenChange`, and `closeLabel`; `onOpenChange(false)` closes it. The
component provides its own stationary close button, modal overlay, focus trap,
Escape handling, scroll lock, and focus return. Set `zoomable` for content that
remains usable when its width grows from 100% to 300% in 25% steps. The content
area scrolls in that mode.

`PortalProvider` redirects `Dialog`, `Tooltip`, and `PopoverContent` portals to
its required `HTMLElement` or `DocumentFragment` container. Put it around a
rendered subtree that must stay inside a shadow root or another host boundary.
For one `PopoverContent`, its `portalContainer` prop takes precedence over the
provider container.

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
