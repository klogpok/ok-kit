# The value of a multiple-selection tree is every checked key

In multiple selection `ui-tree` holds the key of every checked node: branches and their descendants alike. It never holds a partially checked node. We chose this over "leaves only" and "topmost checked only" because both break with lazy branches. With leaves only, nothing can be stored for a checked branch whose children are not loaded yet. With topmost only, the server would have to expand the hierarchy itself.

Two consequences follow, and they are deliberate:

- **Keys of unloaded or unknown nodes stay in the value.** The tree does not drop a key just because no loaded node has it, so a value prefilled from a URL or the server survives until its branch loads. Partial states are computed from the loaded nodes only.
- **Children loaded under a checked branch are added to the value without marking the control dirty.** Expanding a branch is not a user edit, but the value must stay "every checked key". So the tree writes the control's value itself, outside the `ControlValueAccessor` `onChange` path, which would mark it dirty.

## Considered Options

- Leaves only, with branch states derived from them. Rejected: it cannot represent a checked lazy branch.
- Topmost checked keys only. Rejected: it pushes hierarchy expansion to every consumer.
- Do not touch the value when children load. Rejected: the value would then depend on which branches the user happened to expand.
