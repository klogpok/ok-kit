# @vplans/ui-kit

The in-house Angular design system for the VPlans app. This glossary fixes the words used for its components' concepts.

## Tree

**Node**:
One item of a tree; it has a stable key and may have child nodes.
_Avoid_: item, row, element

**Branch**:
A node that has, or may have, child nodes.
_Avoid_: folder, parent node (when the role, not the relation, is meant)

**Leaf**:
A node that has no child nodes.
_Avoid_: end node

**Lazy branch**:
A branch whose child nodes are not known until it is first expanded.
_Avoid_: async node, deferred node

**Checked**:
The state of a node in multiple selection when it and every descendant are selected; only checked nodes are part of the tree's value.
_Avoid_: selected (in multiple selection), ticked

**Partially checked**:
The state of a branch when some, but not all, of its descendants are checked; it is never part of the tree's value.
_Avoid_: indeterminate (except for the native checkbox property), mixed

**Selected node**:
The one node chosen in single selection.
_Avoid_: active node, current node

## Dropdowns

**Dropdown panel**:
A surface that a field opens next to itself and closes on an outside click, Escape or a choice; it follows the field's direction and width.
_Avoid_: popup, dropdown (for the surface), overlay (for this role)

**Popup listbox**:
A dropdown panel that holds a list of options the user moves through with the keyboard while focus stays in the field.
_Avoid_: option panel, select panel, menu (a menu holds commands, not values)

**Popup listbox field**:
A form field that owns a popup listbox and whose inner control is a combobox: select, multi-select, autocomplete and time input. A date picker opens a calendar, not a popup listbox, so it is not one.
_Avoid_: combobox (for the whole field; the combobox is its inner control), dropdown field

**Option**:
One value the user can choose in a popup listbox.
_Avoid_: item, entry

**Active option**:
The option the keyboard currently points to; Enter chooses it. It is not necessarily chosen.
_Avoid_: highlighted option, focused option, selected option

**Leading action**:
A choice at the top of a popup listbox that acts on the value instead of being one value: "Add «…»" adds the typed text, "Select all" selects or deselects every option shown. The keyboard reaches it before the options.
_Avoid_: leading option, action option, action row

## Typed values

**Parsed text field**:
A form field whose value is read from text the user types and shown back as formatted text: date picker, date range picker, time input and number input. A field may also be a popup listbox field (the time input is both).
_Avoid_: masked input, text-entry field

**Typed text**:
The text a parsed text field shows instead of its formatted value while the user is typing; it belongs to the value it produced and is dropped when the value changes elsewhere.
_Avoid_: draft, raw text, input text

**Commit**:
The moment the user leaves a parsed text field or presses Enter: valid typed text is replaced by the formatted value, invalid typed text stays and shows a parse error.
_Avoid_: confirm, apply, submit (a form is submitted, a field is committed)

**Parse error**:
The message a parsed text field shows for committed typed text that does not give an allowed value. It belongs to the field, never to the bound form control, which only sees the value.
_Avoid_: validation error (that is the form control's), invalid input

## Overlays

**Trigger**:
The element a tooltip, popover or menu opens from and is placed against.
_Avoid_: host, origin, anchor

**Placement**:
Where an overlay sits against its trigger: a side, a corner, or an aligned placement. Start and end follow the text direction.
_Avoid_: position (for where it ended up after a flip), location

**Side**:
A placement on one edge of the trigger (top, bottom, start or end), centered along that edge.
_Avoid_: direction, top-start (that is an aligned placement)

**Corner**:
A placement diagonally outside one corner of the trigger: above or below it, entirely before its start edge or after its end edge.
_Avoid_: diagonal, top-start (that is an aligned placement)

**Aligned placement**:
A placement above or below the trigger with one inline edge lined up with the same edge of the trigger, as a menu opens.
_Avoid_: corner

**Flip**:
Moving an overlay to the opposite side or the vertically mirrored corner when its placement has no room.
_Avoid_: fallback, reposition

**Push**:
Shifting an overlay just enough to stay inside the viewport, without changing its placement.
_Avoid_: clamp, nudge

## Layout

**Density**:
How tightly the controls of a page region are packed: default or compact. It applies to a region and every control in it.
_Avoid_: size (for a region), compact mode

**Size**:
The sm, md or lg scale of one control, chosen on that control. A checkbox and a radio group also have xl, for emphasis.
_Avoid_: density (for one control)

**Breakpoint**:
A named viewport width (sm, md, lg, xl) at which a layout changes.
_Avoid_: screen size, media size
