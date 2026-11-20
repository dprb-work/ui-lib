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
- `Calendar`, `Fullscreen`
- `Dialog`, `Tabs`, `Tooltip`, `TooltipProvider`, `PortalProvider`
- `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverArrow`, `PopoverClose`

Heavy components use separate entry points so consumers do not install or bundle
their dependencies unless they import those components:

| Entry point | Components | Required peer |
| --- | --- | --- |
| `@dprb-work/ui-lib/data-table` | `MatrixDataTable` | `@tanstack/react-table` |
| `@dprb-work/ui-lib/charts` | `CartesianChart`, `DistributionChart` | `chart.js` |
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

The stylesheet ships Tailwind Preflight, the current light and dark palette, and
component utilities. Green is the accent and current success family. Warning
uses Amber, info uses Blue, and danger is an independent red used only for
status, not one of the ten palette families.
Pair every status with an icon and words; color alone does not communicate
status. Links use the readable Green link role and stay underlined. Danger
buttons use an outlined treatment by default. Reserve a solid danger button for
the confirming step; consumers can apply
`bg-ui-danger text-ui-on-danger hover:bg-ui-danger-hover` through `className`.
The adopted anti-crowding rule is in [CONTEXT.md](CONTEXT.md#palette-roles):
allow at most one primary action per view region, show success with an icon and
words, and keep unrelated elements neutral. The ten-family selection and values
are final for this release: Pearl replaces Slate.
Add `.dark` to an ancestor or set `data-theme="dark"` on one.
Consumers may override these semantic variables at their application root:
`--ui-background`, `--ui-foreground`, `--ui-surface`,
`--ui-surface-foreground`, `--ui-muted`, `--ui-muted-foreground`,
`--ui-border`, `--ui-accent`, `--ui-accent-hover`, `--ui-on-accent`,
`--ui-accent-link`, `--ui-success`,
`--ui-danger`, `--ui-danger-hover`, and `--ui-on-danger`.
`--ui-success` remains the readable success text color. Each status has
`--ui-<status>-ink` and `--ui-<status>-fill` for readable text and its tinted
background; `text-ui-danger` uses danger ink, not the solid confirming fill.
`text-ui-accent` uses the readable link role; action fills retain `--ui-accent`.
Override accent fill, hover, on-accent and link together and verify their contrast;
an old accent fill with the new label color may be unreadable. Consumers with
copied Tailwind theme mappings must remove or update those copies on adoption,
including the readable `--text-color-ui-accent` and `--text-color-ui-danger`
mappings. Product styles loaded after the package remain authoritative.

Only palette stops used by roles ship: `650` for all ten families; `700` for
Blue, Amber, Violet, Rose, Magenta, Pearl and Copper in dark; `600` and `750`
for Green, Amber and Blue; and `50` and `950` for Green, Amber and Blue.
`--ui-series-1..10` follow this order: Blue, Amber, Green, Violet, Rose, Olive,
Cyan, Magenta, Copper and Pearl.
Use `StatusMessage` for icon-plus-text status feedback and `MenuItem` for
icon-plus-text Radix menu entries. `StatusPanel` owns the gap between its
optional icon and title, and input error messages own their decorative error
icon. These components use the shared `--ui-icon-text-gap` token; callers
provide content and do not add a second gap or a literal space.
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

`src/styles.css` uses CSS-first Tailwind v4 through `@tailwindcss/vite`
(the lockfile resolves both to 4.3.3), with no JavaScript theme config.
Light/dark `--ui-*` properties hold application, tooltip, action, status and
chart roles. `@theme inline` maps the non-chart roles to `--color-ui-*`
theme values and declares `--font-sans` and `--font-mono`.
`src/styles.css` owns the used `--ui-palette-*` stops and `--ui-series-1..10`;
`src/palette.css` retains the existing raw `--color-*` ramps in `@theme static`.

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

The affected shared stories and consumers were updated with these defaults. Preserve controlled and uncontrolled values, native form behavior, refs, labels, error descriptions, focus, disabled state, light/dark appearance and tab accessibility when changing these components. Do not add a parallel primitive for a style-only variation.

## Verify

```bash
corepack pnpm run verify
corepack pnpm run build
```

`verify` runs ESLint, strict TypeScript, unit tests, browser-backed Storybook tests, and the library build.
