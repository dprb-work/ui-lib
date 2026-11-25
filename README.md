# ui-lib

Shared React and Tailwind CSS components for dprb-work products.

The library contains reusable controls, feedback and chat presentation. Product navigation, session lifecycle, service connections, model policy and screenshot capture remain in consuming applications. [CONTEXT.md](CONTEXT.md) defines the visual language used here.

## Components

The base entry point contains controls and interaction primitives:

- `Button`, `IconButton`, `CopyButton`, `CopyableText`
- `Checkbox`, `Switch`, `SegmentedControl`
- `TextInput`, `TextareaInput`, `NumberInput`, `SelectInput`, `NativeSelect`, `ColorPicker`, `ColorSelector`
- `Image`, `Breadcrumbs`
- `Badge`, `StatusPanel`, `StatusMessage`, `MenuItem`, `ContentBlock`, `CodeViewport`
- `Calendar`
- `Dialog`, `Tabs`, `Tooltip`, `TooltipProvider`, `PortalProvider`
- `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverArrow`, `PopoverClose`

Heavy components use separate entry points so consumers do not install or bundle
their dependencies unless they import those components:

| Entry point | Components | Required peer |
| --- | --- | --- |
| `@dprb-work/ui-lib/data-table` | `MatrixDataTable` | `@tanstack/react-table` |
| `@dprb-work/ui-lib/charts` | `CartesianChart`, `DistributionChart`, `MultiSeriesLineChart`, `MultiSeriesLinePlot`, `StackedBarChart`, `StackedBarPlot` | `chart.js` |
| `@dprb-work/ui-lib/chat` | Composer, transcript, model controls, Markdown, code, diff and tool renderers | See chat dependencies below |

## Use

Install `@dprb-work/ui-lib` from your configured package source:

```bash
corepack pnpm add @dprb-work/ui-lib react react-dom
```

Import its stylesheet once, before product styles, at the application entry point:

```tsx
import "@dprb-work/ui-lib/styles.css";

import { Button, Checkbox } from "@dprb-work/ui-lib";
import "./product.css";
```

If your application builds Tailwind v4 utilities, reference the authored theme
from its CSS entry point:

```css
@import "tailwindcss";
@reference "@dprb-work/ui-lib/theme.css";
```

Keep the runtime `styles.css` import above. `@reference` supplies the token and
variant metadata without emitting another copy of the theme or Preflight.
Use complete utility names such as `bg-ui-surface`, `stroke-ui-series-3`
and `text-ui-accent`; no local role mapping is needed.

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

Wrap the application with `TooltipProvider` when a product needs one tooltip
delay, placement, or visual treatment. The default delay is 500 ms, including
tooltips used without a provider. Tooltips fade in and out over 80 ms; that fade
is disabled when reduced motion is requested. `Tooltip` keeps its `label` API and
returns its child unchanged when `label` is omitted or `false`. Shared controls
accept `tooltip?: ReactNode | false`; `IconButton` and `CopyButton` use their
accessible label by default, while `false` opts out. Do not pass native `title`
to these controls.

```tsx
<TooltipProvider delayDuration={500} side="bottom" className="bg-ui-tooltip text-ui-tooltip-foreground">
  <App />
</TooltipProvider>
```

Tooltips are arrowless by default. Set `arrowClassName` on `Tooltip` to render
and style an optional arrow through a consumer-owned class.

`Image` requires `alt`. It uses a nonempty `alt` as its default tooltip, retains
that alt text for accessibility, and leaves decorative `alt=""` images
unwrapped. Pass `tooltip={false}` to opt out, or a React node to override the
fallback.

`Breadcrumbs` renders an accessible navigation list. Give it `"aria-label"` and
ordered `{ key, label, href?, onClick?, current? }` items. The final item defaults
to the noninteractive current page. Set `current: false` when the trail ends at
an ancestor that must remain navigable rather than the current page.

Tooltip owners are `TooltipProvider`, `Tooltip`, `IconButton`, `CopyButton`,
`Button`, `Checkbox`, `Switch`, `TextInput`, `TextareaInput`, `NumberInput`,
`SelectInput`, `NativeSelect`, and `Image`. When a shared interactive component
gains contextual help, add its `tooltip?: ReactNode | false` prop and compose
the canonical `Tooltip`; never add a native `title` or a second tooltip
renderer. Chart tooltips remain chart-owned because Chart.js positions them
against canvas data coordinates. They use the shared tooltip appearance tokens
but do not inherit `TooltipProvider` defaults.

`ThemeProvider` resolves `system` against `prefers-color-scheme` with `"dark"`
as the fallback when no system preference is available, applies the resolved
`data-theme` and selected `data-theme-mode` to the document root, sets
`color-scheme`, and owns persistence. Product code must not duplicate that
lifecycle. Storybook follows the same system preference with a dark fallback
while keeping explicit toolbar theme selections persisted across stories.

Use `Popover` compound parts for non-modal disclosed content. The trigger owns
its visible or ARIA label, and `PopoverContent` requires `aria-label` or
`aria-labelledby`. Use a menu component instead when choices require menu roles
and menu keyboard behavior.

`MatrixDataTable` keeps both its static matrix and opt-in interactive modes.
Consumers own domain formatting, captions, chart pairing, and surrounding
workflow.

The stylesheet ships Tailwind Preflight, the current light and dark palette, and
component utilities. Green is the accent and current success family. Warning
uses Amber, info uses Blue, and danger is an independent red used only for
status, not one of the ten palette families.
Pair every status with an icon and words; color alone does not communicate
status. Links use the readable Green link role and stay underlined. Danger
buttons use an outlined treatment by default. Reserve a solid danger button for
the confirming step; consumers can apply the complete treatment through `className`:

```tsx
<Button
  variant="danger"
  className="bg-ui-danger text-ui-on-danger hover:bg-ui-danger-hover active:bg-[color-mix(in_srgb,var(--color-ui-danger-hover)_88%,black)] focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-on-danger)]"
>
  Confirm deletion
</Button>
```

The inside focus edge uses the filled button's on-danger color; the held-press
fill stays dark enough for its label. Do not copy only the resting fill.
The adopted anti-crowding rule is in [CONTEXT.md](CONTEXT.md#palette-roles):
allow at most one primary action per view region, show success with an icon and
words, and keep unrelated elements neutral. The ten-family selection and values
are final for this release: Pearl replaces Slate.
Add `.dark` to an ancestor or set `data-theme="dark"` on one.
Shared color roles use Tailwind's canonical `--color-ui-*` namespace:
`--color-ui-background`, `--color-ui-foreground`, `--color-ui-surface`,
`--color-ui-surface-foreground`, `--color-ui-muted`, `--color-ui-muted-foreground`,
`--color-ui-border`, `--color-ui-tooltip`, `--color-ui-tooltip-foreground`,
`--color-ui-accent`, `--color-ui-accent-hover`, `--color-ui-on-accent`,
`--color-ui-accent-link`, `--color-ui-success`,
`--color-ui-danger`, `--color-ui-danger-hover`, and `--color-ui-on-danger`.
Each status has `--color-ui-<status>-ink` and `--color-ui-<status>-fill`
for readable text and its tinted background. `--color-ui-success` remains
the readable success text color. `text-ui-danger` uses danger ink, not the solid
confirming fill. `text-ui-accent` uses the readable link role; action fills use
`--color-ui-accent`.

**CSS-variable migration:** the old role, palette, series and icon-gap names
are removed. Existing utility names do not change.

| Previous property | Canonical property |
| --- | --- |
| `--ui-<role>` | `--color-ui-<role>` |
| `--ui-palette-<family>-<stop>` | `--color-ui-palette-<family>-<stop>` |
| `--ui-series-<slot>` | `--color-ui-series-<slot>` |
| `--ui-icon-text-gap` | `--spacing-ui-icon-text` |

Migrate plain CSS, JavaScript readers and root overrides together. Remove copied
theme mappings that point to the retired properties, including the two readable
`--text-color-ui-accent` and `--text-color-ui-danger` mappings.
The `--ui-chart-*` runtime properties are retained; they are not color-role aliases
for generating utilities.

Set canonical role overrides in product CSS loaded after the library, at the
application root or on a local container. Utilities and plain CSS read the same
properties. Use `var(--color-ui-surface)` in plain CSS, not a separate token copy.
For example:

```css
.product-region {
  --color-ui-surface: #f4f2ee;
  --color-ui-surface-foreground: #172b4d;
}
```

Override accent fill, hover, on-accent and link together and verify their contrast.
CSS variable references resolve where they are declared: replace palette stops
at the root, where shared roles reference them. On a local container, override the
role itself, or redeclare its relationship there. Dark theme values are scoped
to `.dark` or `[data-theme="dark"]`; override that scope's canonical roles when
customizing dark colors. Portalled content follows its portal container's scope.

Chart.js still reads `--ui-chart-accent`, `--ui-chart-surface`,
`--ui-chart-muted` and `--ui-chart-foreground` from the document root.
Their defaults reference the canonical accent, surface, muted-foreground and
foreground roles; the grid reads `--color-ui-border`.
Keep chart palette overrides as named root properties passed through `palette`;
saved per-slot colors remain consumer-owned. This migration does not add
scoped chart theme resolution or change saved values.

Only palette stops used by roles ship: `650` for all ten families; `700` for
Blue, Amber, Violet, Rose, Magenta, Pearl and Copper in dark; `600` and `750`
for Green, Amber and Blue; and `50` and `950` for Green, Amber and Blue.
`--color-ui-series-1..10` follow this order: Blue, Amber, Green, Violet, Rose, Olive,
Cyan, Magenta, Copper and Pearl. Utilities include `bg-ui-series-1` and `stroke-ui-series-1`.
`MultiSeriesLineChart` plots one or more line series using `--color-ui-series-1..10`
in order (wrapping modulo 10), pairs them with a neutral-text legend, and switches
between the `Graph` and `Values` tabs using the shared full-width `Tabs` control.
Import `MultiSeriesLinePlot` when a consumer needs the legend and canvas without
the view tabs (for example compact sidebar previews or maximized dialogs).
`StackedBarChart` and `StackedBarPlot` take the same props and stack the series
per label as bars, with exact values on hover and in the `Values` tab.
Pass `timestamps` (epoch milliseconds, one per label) to either tabbed chart to show
the time-range presets `Last 24 hours`, `Last week` (7 days) and `Last month` (30 days),
plus `All` when the data reaches further back. Both tabs show the selected range, which is
anchored at the latest timestamp rather than the wall clock; `defaultTimeRange` picks
the initial preset (default: the widest). Custom ranges and zoom are out of scope.
`SERIES_COLOR_TOKENS` exports the ten canonical series custom property names in order.
Use `StatusMessage` for icon-plus-text status feedback and `MenuItem` for
icon-plus-text Radix menu entries. `StatusPanel` owns the gap between its
optional icon and title, and input error messages own their decorative error
icon. These components use the shared `--spacing-ui-icon-text` theme token through
`gap-ui-icon-text`; callers provide content and do not add a second gap or a literal space.

`Badge` preserves caller-supplied letter case and uses untracked 12px text by
default. Its tone colors, status words and component-owned icon gap are unchanged.

`StatusPanel` has no `eyebrow` prop. Move useful operation or scope context into
`title` or `description`; the component retains its icon, status tone and recovery
actions, without a static elevation shadow. For example, replace an
`eyebrow="Analysis failed"` plus a generic title with
`title="Analysis failed: the base revision is unavailable"`. Do not pass the
removed prop or add a replacement preheading.

### Styling and composition

Use the existing UI component before writing replacement markup. Find controls
in the [component list](#components), then inspect their stories in `src/components`
or `src/chat`. Run the [Storybook catalog](#develop) to compare behavior and states.
Compose controls and hooks around product content rather than copying their markup
or adding a parallel primitive for a different visual treatment.

Prefer Tailwind utilities for readable point-of-use layout, spacing, sizing and
typography. Use semantic roles such as `bg-ui-surface`, `text-ui-foreground` and
`border-ui-border`; do not substitute a hex value or a palette class such as
`bg-slate-100` for a role. Raw palette values belong to palette definitions or
explicit data-color contracts, not application emphasis or status.

Use plain CSS for shared token definitions, pseudo-elements, complex selectors,
structural geometry, keyframes and motion, or when one cohesive rule is clearer
than utilities. Do not express the same declarations in both places. Keep
utility names complete and statically detectable rather than assembling fragments.

`src/styles.css` imports `src/theme.css`, the authored theme published as
`@dprb-work/ui-lib/theme.css`. The runtime stylesheet uses CSS-first Tailwind v4
through `@tailwindcss/vite` (the lockfile resolves both to 4.3.3), with no
JavaScript theme config.
`@theme static` owns the `--color-ui-*` role values, used
`--color-ui-palette-*` stops, `--color-ui-series-1..10`, icon-text spacing and
font stacks. Static emission keeps colors available to CSS and canvas readers
even when a utility is not used. Dark selectors override those same properties.
Readable accent and danger text specializations and derived interaction fills use
`@theme inline`; they resolve canonical roles at the control so scoped overrides
work. Hover and press fills mix the existing accent with the control's base;
they do not introduce another authored palette or focus color. Filled accent
and outlined danger controls have their own derived press fills to preserve
their foreground contrast.
The theme imports `src/palette.css` for the existing raw `--color-*` ramps;
both authored files ship with the package. Products reference the public theme
entry instead of copying either source.

The consuming component owns layout. Pass `className` at the usage site to change
size, spacing, radius, color, or typography; conflict-aware Tailwind merging makes
those classes replace the component defaults without `!important`.

Use parent layout gaps for space between sibling components. Internal content
padding belongs to the component; page gutters and safe areas belong to the
consumer's container. A component must not add external top/bottom spacing to
separate itself from its neighbors.

Keep navigation, domain models, workflow policy and dense technical grids in the
product. Local density must not shrink the library's phone-facing defaults.
Root semantic-variable overrides and point-of-use classes may adapt presentation;
preserve accessible names, keyboard behavior, focus, state semantics and theme
contrast. Data-series colors remain distinct from action emphasis, even when
their hues overlap.

Shared controls own hover, held-press and keyboard-focus presentation. Fields
use a 2px underline and faint tint; ordinary buttons use a 2px inside edge,
and unfilled icon-only buttons use a tinted plate. Disabled controls fade.
`Button` renders a spinner for `aria-busy={true}` or `aria-busy="true"` without
implicitly disabling or fading the action; pass `disabled` separately when
invocation is unavailable. Its icon-only content stays mounted in an internal
wrapper while the spinner is visible. Consumer CSS must not assume the action
SVG is a direct button child.

Selected secondary buttons use the filled accent treatment. Persistent
`aria-pressed` state is separate from temporary `:active` feedback. The
**Foundations / States** story shows the controls in both themes.

In forced-colors mode, `Switch` uses a system-color thumb while its track and
focus remain system-adjusted. `ColorSelector` preserves authored data-color
paint and the contrasting inside focus edge only on each swatch; the picker
still follows forced colors.

`CopyableText` takes `text`, `copyLabel`, and an optional React `label`. It
renders wrapped code text with the existing `CopyButton`; callers retain layout
and copy-button styling through `className` and `copyButtonClassName`.

`TextareaInput` accepts native textarea props, including `ref`, and shares the
input appearance and accessible error contract. It grows with content where
the browser supports `field-sizing`; `rows` supplies the native fallback.
Consumers control maximum height, resizing, and submission behavior.

`NativeSelect` styles a native HTML select with a decorative chevron. Use native
`option` children and select props, including `ref`, `name`, `value`,
`defaultValue`, and `onChange`. The browser owns its picker, keyboard interaction,
and form submission. `density` accepts `standard` or `compact`; standard density
keeps a 44px control height and uses 0.875rem selected text near the underline.
`className` styles the select, and `wrapperClassName` controls its surrounding
layout. Consumers own labels, options, and selection policy. Use `SelectInput`
instead when the existing Radix-backed picker and its `onValueChange` API is needed.

`ContentBlock` is the container for charts, images, diagrams, tables, code, logs,
and embedded pages. It draws a rounded box with the content viewport on top and
a caption bar at the bottom: the content-type `icon`, the optional `title`, and
`metadata` on the left, the content actions and Expand/Close on the right. `label` names the region and
the expanded dialog. The container owns every control and renders it as an
icon button with a tooltip; content declares `actions` (`kind: "button"` with
`icon`, `onSelect`, optional `pressed` and `disabled`, or `kind: "copy"` with
`text`). Inline, the block is at most 80% of the viewport height and the content
owns its scrolling; the wheel never zooms. `expansion` adds an Expand control
that opens the same box as a modal overlay of 90% by 90% (full screen
below 640px) with Close in its place; Escape, a click outside, Close, or the
browser's back action close it, and focus returns to Expand. The backdrop is
90% black; the inner viewport has its own opaque background and no container
padding. The dialog uses a subtle zoom-in/out animation,
disabled under reduced motion. With `expansion="zoom"` (charts, images, diagrams),
Zoom in, Zoom out, and Reset view appear at the left of the footer. Zoom in and
Zoom out are mutually exclusive toggles: select a direction, then click the
content to zoom at that point; select the active toggle again to turn click zoom
off. Selecting a toggle does not itself zoom. The wheel zooms around the pointer
from 25% to 800%, drag pans, `0` resets, and `+`/`-` step. With
`expansion="scroll"` (tables, code, pages) the expanded content scrolls.
Content may style its expanded layout with the
`in-data-[content-block-viewport=expanded]:` variant. Links and domain behavior
remain in the consumer.

`CodeViewport` accepts native `pre` props, including `ref`, and a `wrap` boolean.
Its scroll container spans the available width. The consumer owns preferences,
syntax highlighting, line numbers, and streaming behavior.

Chat `CodeBlock`, `CodeText`, file excerpts, and tool text always show
lower-contrast line numbers drawn by CSS, outside selected and copied text.
`startLine` changes the first number (default `1`); the `lineNumbers` boolean is
removed. Chart/data actions retain their inline viewport height and show the
destination view's icon without a persistent pressed state. Chat chart tables
keep their headers above the vertically scrolling body; an outer horizontal
scroller moves the entire table, including its header. Rows and zebra backgrounds
span the table width, with an inset scrollbar and right padding on the last
column to protect text. Sorting shows a chevron only on the sorted column;
column rules distinguish cells without horizontal row rules.

`ColorPicker` is controlled by `value` and `onValueChange` using opaque
`#rrggbb` strings. It provides RGB sliders, a native color well, and an editable
hex field. Invalid drafts stay in the field without changing the selected color.
Supply `label` for the controls' accessible names. Compose it with `Popover`
when selection should open on click; the consumer owns persistence.

`ColorSelector` composes `Popover`, `ColorPicker`, and the shared `Tooltip` into
a controlled row of opaque `#rrggbb` color slots. Its public API is
`colors: readonly string[]`, `onValueChange(index, value)`, optional `label`,
`disabled`, and `className`. Slot buttons are named `${label} ${index + 1}`
(or `Color ${index + 1}` when no label is supplied), have 24px hit areas, and
open their picker with click, Enter, or Space. Escape closes the picker and
returns focus to its slot. The open slot is expanded, not selected.
Consumers may bind swatch presentation to existing CSS tokens with
`--ui-color-selector-1`, `--ui-color-selector-2`, and so on at the group.
The controlled hex values still supply the picker; the optional CSS slots let
charts, legends, and swatches inherit one palette without copying color values.
Consumers may map these slots to their existing `--series-N` variables and must
keep the painted colors consistent with the controlled hex values.

Set `Dialog`'s `unstyled` prop when a consumer supplies its complete overlay,
content, and title treatment through plain CSS.

`Calendar` is a controlled date grid. Pass the selected `value` and visible
`month`, then update them through `onValueChange` and `onMonthChange`.
`onValueChange` receives the selected local calendar day at midnight. It derives
weekday order and labels from `locale`, unless `weekStartsOn` overrides the
locale's first weekday. `min`, `max`, and `disabled` disable dates. Arrow keys
move by day or week, Home and End move within a week, Page Up and Page Down move
by month, and Shift plus Page Up or Page Down moves by year.

`PortalProvider` redirects `Dialog`, `Tooltip`, and `PopoverContent` portals to
its required `HTMLElement` or `DocumentFragment` container. Put it around a
rendered subtree that must stay inside a shadow root or another host boundary.
For one `PopoverContent`, its `portalContainer` prop takes precedence over the
provider container.

### Chat presentation

Import chat separately from the base controls. Load both stylesheets before
product styles:

```tsx
import "@dprb-work/ui-lib/styles.css";
import "@dprb-work/ui-lib/chat/styles.css";
import { ChatPresentationProvider, ChatTranscript, ComposerFrame, ModelControls } from "@dprb-work/ui-lib/chat";
import "./product.css";
```

The chat entry requires these optional peers:

```bash
corepack pnpm add @icons-pack/react-simple-icons katex lowlight mdast-util-directive react-markdown rehype-katex remark-directive remark-gfm remark-math strip-ansi unist-util-visit
```

`ChatPresentationProvider` accepts a controlled `wrapText` boolean and an optional
`density` of `"comfortable"` or `"compact"`. Compact density reduces composer
spacing and gives rich blocks an inline header. The application owns preference
persistence.

`ChatTranscript` accepts application messages and a `renderMessage` callback.
It owns scrolling, not history fetching or DSH state. Change `followKey` when the
application wants to follow a new submission. Incoming messages and delayed
queue acknowledgments otherwise preserve manual scrollback.
Keep unchanged message objects and renderer callbacks stable so streaming updates
skip historical message rendering. Replace a message object when its content changes.
`ChatMessageContent` composes rich text, reasoning, attachments, and tool content.

`ComposerFrame`, `ComposerInput`, `ComposerSubmitButton`, `ModelControls`, and
`ReasoningSlider` accept controlled values and callbacks. The application owns
drafts, submission, model options, permission checks, and session lifecycle.
The application container also owns width and page gutters.

`ComposerSubmitButton` delegates its busy spinner to `Button`; it does not add
a second spinner. While running, hover or keyboard focus reveals the available
stop or queue action without fading or disabling the control.

Consuming applications use this entry independently; they are not dependencies
of the library or of one another.

## Develop

```bash
corepack pnpm install
corepack pnpm run dev
```

Storybook is the component catalog and browser verification surface.

### Input, select and tab defaults

`TextInput`, `NativeSelect` and `Tabs` own these defaults; consumers do not need a stylesheet override.

`TextInput` accepts native input props and forwards its `ref` to the input. Its `type` accepts `"text"` or `"search"`. Search inputs retain native search semantics and show the shared small decorative leading magnifying-glass icon with the underlined appearance, focus, disabled and invalid-input treatment. Consumers own accessible labels, query state, routing and page layout.

`NativeSelect` accepts native select props and forwards its `ref` to the select. Its standard appearance is underlined and includes a decorative right-side chevron. Standard density keeps the native control at 44px high, uses 0.875rem selected text, and places it close to the underline. The chevron does not receive pointer events, so the browser retains ownership of the picker, keyboard interaction and form submission. `density`, `className` and `wrapperClassName` retain the contracts described above. `SelectInput` remains the Radix-backed alternative with its own `onValueChange` contract.

`Tabs` accepts `renderTabList` for consumers that must place the tab list within a composed layout while retaining the component's keyboard navigation and selected-panel semantics.

The tab group spans its container and tabs share the width equally. It retains
the rounded border and selected fill/bold text, with no selected underline.
Consumers must delete copied fixed-width/flex and selected underline rules to
receive these defaults. In particular, Reporter's `.tab-list button` and
`[aria-selected="true"]` overrides currently own its underline and auto width;
remove those overrides during the later consumer migration, not by adding
library `!important` rules.

Preserve controlled and uncontrolled values, native form behavior, refs, labels, error descriptions, focus, disabled state, light/dark appearance and tab accessibility when changing these components. Do not add a parallel primitive for a style-only variation. Consumer migration follows the library slices.

## Verify

```bash
corepack pnpm run verify
corepack pnpm run build
git config core.hooksPath .githooks
```

`verify` runs the base dependency check, ESLint, strict TypeScript, unit tests,
the library build and browser-backed Storybook tests. `verify:fast` omits the
Storybook tests; it is the hosted check for ready pull requests. The routed
pre-push hook runs `verify` for non-prose changes; [CI checks](docs/ci.md)
owns the routing.
