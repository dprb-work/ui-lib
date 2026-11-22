# Auto-sizing `TextareaInput`: options and recommendation

Status: research only (22 Nov 2026). No auto-sizing behavior changes in this round.

## Question

Daniel asked for a textarea that grows with its text, "kinda hard ... to do this
cleanly". This note compares the three clean techniques against the cases that
usually break them: minimum and maximum rows, scrolling after the maximum, no
layout jump while typing, IME composition and paste, server rendering and
hydration, and what our Storybook and Playwright checks can prove.

## Where ui-lib is today

- `TextareaInput` already sets `field-sizing: content` with `min-h-16` (4rem) and
  no maximum. The chat composer (`src/chat/composer/styles.css`) uses the same
  property with `max-height: min(14rem, 30dvh)`.
- The `SubtleTextareaGrowth` contract story already proves growth in Chromium:
  typing twelve lines increases the height and leaves nothing clipped.
- With `field-sizing: content`, the browser ignores `rows` and `cols`. `rows`
  only matters in browsers without the property, where it sets the fixed
  height. The README's "`rows` supplies the native fallback" is accurate, but a
  minimum height in supporting browsers must come from `min-height`, not `rows`.

## Options

### A. CSS `field-sizing: content`

The browser sizes the control from its content in the same layout pass as any
other intrinsic size.

- Support: Chrome and Edge 123 (March 2024), Safari 26.2 (December 2025),
  Firefox 152 (June 2026). Baseline "newly available" since June 2026
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing),
  [web.dev, June 2026](https://web.dev/blog/web-platform-06-2026)).
- Fallback: older browsers keep the fixed `rows` height and scroll. Nothing
  breaks, the field simply does not grow.
- Minimum and maximum rows: `min-height` and `max-height` in `lh` units plus
  the vertical padding, for example `min-height: calc(2lh + 0.375rem)` and
  `max-height: calc(8lh + 0.375rem)`. Past the maximum the textarea scrolls on
  its own (`overflow-y: auto` is the default for textareas).
- Layout jump: none. There is no frame in which the height is wrong, because no
  script measures after paint.
- IME and paste: handled by the browser. Composition text is content like any
  other, so the field grows during composition without extra events.
- SSR and hydration: nothing to hydrate. The server markup carries no inline
  height, and the first paint already has the content size.
- Gotchas: without a width the control shrink-wraps its text (`w-full` already
  prevents this); a placeholder sets the empty size; height changes do not
  animate; a fixed `height` cancels the effect.

### B. Mirrored element (the "replicated value" grid)

A wrapper is a one-cell grid. The textarea and an `aria-hidden` mirror (a div or
`::after` with `content: attr(data-value) " "`) share the cell. The mirror holds
the same text, the cell grows to the mirror's height, and the textarea stretches
to fill it.

- Support: every browser, since only grid and `white-space: pre-wrap` are needed.
- Minimum and maximum rows: `min-height`/`max-height` on the wrapper; past the
  maximum the textarea must switch to `overflow-y: auto` while the mirror stays
  capped.
- Layout jump: none if the mirror is updated in the same render as the value.
  Uncontrolled use needs an `input` listener that writes the attribute, which is
  one more moving part.
- Risk: the mirror must match the textarea's font, padding, border, line height,
  `word-break` and `tab-size` exactly. Any drift shows up as a missing or extra
  line at wrap points, and it is easy to break when someone changes the field's
  classes.
- IME and paste: fine as long as the mirror is fed from `input` events, which
  fire during composition.
- SSR: the mirror renders from the initial value, so server and client agree.
- Cost: duplicated text in the DOM (kept away from screen readers), a wrapper
  element around the native control, and a second copy of the field's
  typography rules.

### C. Measure `scrollHeight` in script

On each input, set `height: auto`, read `scrollHeight`, then set the height
(clamped to the maximum, switching on scrolling once clamped). This is what
`react-textarea-autosize` does, with a hidden clone to avoid the collapse.

- Support: every browser.
- Layout jump: each keystroke forces a synchronous layout (write, read, write).
  Collapsing to `auto` can make an enclosing scroll container jump and can
  flicker when lines are removed, unless a hidden clone is measured instead.
  It must also re-measure when the width changes (a `ResizeObserver`) and after
  web fonts load.
- IME and paste: `input` fires for both; fine once wired.
- SSR and hydration: the server paints the `rows` height, then the client
  resizes after hydration, which is a visible layout shift on any textarea
  rendered with content.
- Cost: an effect, a resize observer and font-load handling in a shared
  primitive; this is the "hard to do cleanly" path.

## What our checks can prove

| Case | Storybook play test (Vitest browser, Chromium) | Separate Playwright run |
| --- | --- | --- |
| Grows with typed text | Yes, already (`SubtleTextareaGrowth`) | Yes, and in Firefox and WebKit too |
| Minimum and maximum rows | Yes: compare heights to `lh` multiples | Yes |
| Scrolls after the maximum | Yes: `scrollHeight > clientHeight` and the height stays at the cap | Yes |
| No jump while typing | Yes: sample the height every animation frame while typing and require it never to drop below the previous value | Yes, and a video for review |
| Paste | Yes: `userEvent.paste` | Yes: real clipboard |
| IME composition | Chromium only, through CDP `Input.imeSetComposition` | Same limit; WebKit and Firefox have no composition hook |
| Fallback without `field-sizing` | Only by forcing `field-sizing: fixed` in a story | Older engines are not available in Playwright |
| SSR and hydration | No: Storybook renders on the client | No; a unit test with `renderToString` can check that the markup has no inline height |

## Recommendation

Keep option A, the CSS property ui-lib already ships, as the only mechanism, and
add no script. It is now supported by all current engines, it has no
measurement code to drift, it cannot jump or mismatch during hydration, and its
fallback (a fixed height that scrolls) is acceptable.

When auto-sizing is picked up as its own change:

1. Express the minimum in lines rather than `min-h-16`: `min-height` in `lh`
   plus padding, so it follows the new 0.875rem text.
2. Decide whether a maximum is a ui-lib prop (`maxRows`) or stays consumer
   owned through `className` as the README says today. A prop is justified only
   if two products need the same cap.
3. Add play tests for the maximum, scrolling after it, and the per-frame "no
   drop" check; add an IME composition check in Chromium.

Option B is the fallback if we must grow in pre-June-2026 Firefox or
pre-26.2 Safari; option C is not recommended for a shared primitive.
