# ui-lib visual language

ui-lib owns reusable UI controls and their shared visual language. The final
palette values and adopted Green accent/success relationship are current.

## Language

### Roles

**UI component**:
A reusable interface control or presentation primitive, not a planning unit.
_Avoid_: Unqualified “component” when planning could be meant.

**Background**:
The page-level color behind content.
_Avoid_: Canvas, which may mean a graph editor.

**Surface**:
A bounded content region with its own text color; a card is one component shape, not every surface.
_Avoid_: Card for every content region.

**Primary action**:
The highest-priority action in a local group, not a color.
_Avoid_: Accent when describing action hierarchy.

**Accent**:
The interface emphasis color, separate from status and data identity. Green is
the accent family.
_Avoid_: Primary as a color name; any fixed hue as its definition.

**Tone**:
A UI component's semantic intent.
_Avoid_: Hue, status, selected state.

**Status**:
A user-visible condition or outcome, such as running, failed or ready.
_Avoid_: Tone, color, StatusPanel as the condition itself.

### Palette roles

Current status roles are success Green, warning Amber, info Blue, and
danger independent red. Danger is status-only, not a family in the ten-color
palette. Pair every status with an icon and words; color alone is not enough.

Primary actions and success intentionally share Green because a primary action
is positive. The adopted anti-crowding rule is: at most one primary action per
view region; show success with an icon and words; do not color unrelated
elements green.

The final ten-family palette retains Pearl and drops Slate. Its series order is
Blue, Amber, Green, Violet, Rose, Olive, Cyan, Magenta, Copper and Pearl.
Light uses 650 for all ten. Dark uses 700 for Blue, Amber, Violet, Rose,
Magenta, Copper and Pearl; Green, Olive and Cyan stay at 650.

Links use the readable Green link role and remain underlined. Danger buttons
are outlined by default. Reserve a solid danger button for the confirming step;
the [README](README.md#styling-and-composition) owns styling and composition.



### States

**Hover**:
Temporary feedback while a hover-capable pointer is over a target.
_Avoid_: Selected.

**Focus**:
The current keyboard or input target.
_Avoid_: Selection for keyboard focus.

**Selected**:
A persistent choice within a set.
_Avoid_: Expanded for a chosen item; selected for an open picker.

**Expanded**:
A disclosure's content is open.
_Avoid_: Selected, pressed for a disclosure.

**Press feedback**:
The temporary pointer-down or key-down visual response (`:active`).
_Avoid_: Pressed, which describes a toggle's persistent on/off state (`aria-pressed`).

**Disabled**:
An unavailable action or input.
_Avoid_: Busy as the reason implied by the state.

**Busy**:
Work is in progress; this does not itself mean a control is unavailable.
_Avoid_: Disabled as a synonym.

**Invalid**:
A draft violates an input rule, distinct from an operation failing after invocation.
_Avoid_: Failed command, error as the draft state.

**Error**:
A failed operation or an explained problem, not the invalid-input state itself.
_Avoid_: Invalid as a synonym for an operation failure.

#### Showing states

This direction is confirmed after visual comparison; component changes are not
yet shipped.

- **Color says what it is:** selected or on uses the accent; status uses its role color.
- **Fill says what the pointer is doing:** hover gets a faint tint; press feedback gets a stronger tint. Neither means a toggle is on.
- **Shape says where the keyboard is:** focus has no floating offset ring. Fields get a 2px accent underline and faint tint. Buttons get a 2px border inside the edge, using the on-accent color on filled buttons. Icon-only buttons get a small tinted plate behind the icon, leaving the icon's color free to mean on.
- **Disabled is faded. Busy has a spinner, not fading. Invalid uses danger color plus words.**

### Interactions

**One-tap answer**:
One activation records an answer without another submit action.
_Avoid_: One-tap for choosing an option followed by “Record answer.”

**Undo**:
Reversal of the latest eligible committed action.
_Avoid_: Reset changes, Cancel, Skip.

**Inline edit**:
Editing in place while retaining surrounding context.
_Avoid_: Generic editor for a specific picker field.

**Popover**:
Anchored, non-modal disclosed content; a menu requires its own menu behavior.
_Avoid_: Popup, dialog, tooltip.

**Dialog**:
A modal task with contained focus and focus return.
_Avoid_: Popover; fullscreen as a separate interaction class.

**Tooltip**:
Brief supplemental, noninteractive help.
_Avoid_: Popover for controls, native title as the shared tooltip.

**Drag**:
Pointer movement used to move or insert an object.
_Avoid_: Resize when the result is movement; unnamed “drag interaction.”

**Resize**:
A change to a dimension; dragging may be its input.
_Avoid_: Drag as the result.

### Layout and feedback

**Density**:
How much content and control space fit in an area; core standard/compact and chat comfortable/compact remain distinct scales.
_Avoid_: Spacing as a synonym; one implied global density scale.

**Spacing**:
A measured gap or internal padding.
_Avoid_: Density; component padding for consumer-owned sibling gaps.

**Motion**:
A visual transition explaining a state or spatial change.
_Avoid_: One animation duration for every behavior.

## Visual language

- Use the shared neutral background and distinct light or deep-dark content surfaces.
- Put ordinary UI text in Inter/system sans and code identifiers in the declared monospace stack.
- Give primary actions one emphasis color; keep status tones and data categories separate.
- Keep secondary text quieter without using color as the only hierarchy signal.
- Use underlined fields; keep their labels and actionable error descriptions attached.
- Let dense technical grids remain local; keep phone-facing targets usable.
- Give buttons, panels, cards and pills the radii their roles already require.
- Use borders to show structure and shadows to show actual elevation.
- Describe selection, disclosure, keyboard focus and work in progress as different states.
- Use brief feedback motion; reserve spatial reveals for content that actually opens or moves.
