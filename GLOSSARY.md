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

## Layout

**Density**:
How tightly the controls of a page region are packed: default or compact. It applies to a region and every control in it.
_Avoid_: size (for a region), compact mode

**Size**:
The sm, md or lg scale of one control, chosen on that control.
_Avoid_: density (for one control)

**Breakpoint**:
A named viewport width (sm, md, lg, xl) at which a layout changes.
_Avoid_: screen size, media size
