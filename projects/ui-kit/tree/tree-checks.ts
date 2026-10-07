/**
 * Checkbox cascade of a multiple-selection tree (see docs/adr/0001). Internal.
 *
 * The value holds the key of every checked node. A node with loaded children takes its state from
 * them; a leaf, or a lazy branch whose children are not loaded yet, is checked when its key is in
 * the value. Keys that match no loaded node are kept as they are.
 */

export type UiTreeCheckState = 'checked' | 'partial' | 'unchecked';

/** What the cascade reads from the tree. */
export interface UiTreeCheckSource<T, K> {
  readonly roots: readonly T[];
  children(node: T): readonly T[];
  key(node: T): K;
  disabled(node: T): boolean;
}

/** The state of every loaded node, by key. */
export function checkStates<T, K>(
  tree: UiTreeCheckSource<T, K>,
  keys: ReadonlySet<K>,
): Map<K, UiTreeCheckState> {
  const states = new Map<K, UiTreeCheckState>();
  const visit = (node: T): UiTreeCheckState => {
    const children = tree.children(node);
    let state: UiTreeCheckState;
    if (children.length === 0) {
      state = keys.has(tree.key(node)) ? 'checked' : 'unchecked';
    } else {
      const own = children.map(visit);
      state = own.every((item) => item === 'checked')
        ? 'checked'
        : own.every((item) => item === 'unchecked')
          ? 'unchecked'
          : 'partial';
    }
    states.set(tree.key(node), state);
    return state;
  };
  tree.roots.forEach(visit);
  return states;
}

/**
 * The value after a click on `node`: checks every enabled node under it (itself included), or
 * unchecks them when all their leaves are checked already. Disabled nodes and everything under them
 * keep their state.
 */
export function toggleCheck<T, K>(tree: UiTreeCheckSource<T, K>, keys: readonly K[], node: T): K[] {
  const targets = enabledSubtree(tree, node);
  const leaves = targets.filter((item) => tree.children(item).length === 0);
  const checked = new Set(keys);
  const uncheck = leaves.every((item) => checked.has(tree.key(item)));
  for (const item of uncheck ? targets : leaves) {
    if (uncheck) checked.delete(tree.key(item));
    else checked.add(tree.key(item));
  }
  return inTreeOrder(tree, keys, settleBranches(tree, checked));
}

/**
 * Brings a value written from outside, or one that newly loaded children have outdated, in line
 * with the cascade: a branch key checks every enabled node under it, and a branch is in the value
 * exactly when it is checked.
 */
export function reconcileChecks<T, K>(tree: UiTreeCheckSource<T, K>, keys: readonly K[]): K[] {
  const checked = new Set(keys);
  const visit = (node: T): void => {
    const children = tree.children(node);
    if (children.length > 0 && checked.has(tree.key(node))) {
      for (const child of children) {
        for (const item of enabledSubtree(tree, child)) checked.add(tree.key(item));
      }
    }
    children.forEach(visit);
  };
  tree.roots.forEach(visit);
  return inTreeOrder(tree, keys, settleBranches(tree, checked));
}

export function sameKeys<K>(a: readonly K[], b: readonly K[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/** `node` and every node under it, skipping disabled nodes together with their subtrees. */
function enabledSubtree<T, K>(tree: UiTreeCheckSource<T, K>, node: T): T[] {
  if (tree.disabled(node)) return [];
  return [node, ...tree.children(node).flatMap((child) => enabledSubtree(tree, child))];
}

/** Puts each loaded branch in or out of the set, by the state its children give it. */
function settleBranches<T, K>(tree: UiTreeCheckSource<T, K>, checked: Set<K>): Set<K> {
  for (const [key, state] of checkStates(tree, checked)) {
    if (state === 'checked') checked.add(key);
    else checked.delete(key);
  }
  return checked;
}

/** The previous keys that remain, in their order, then the new ones in tree order. */
function inTreeOrder<T, K>(
  tree: UiTreeCheckSource<T, K>,
  previous: readonly K[],
  next: Set<K>,
): K[] {
  const kept = previous.filter((key) => next.has(key));
  const known = new Set(kept);
  const added: K[] = [];
  const visit = (node: T): void => {
    const key = tree.key(node);
    if (next.has(key) && !known.has(key)) added.push(key);
    tree.children(node).forEach(visit);
  };
  tree.roots.forEach(visit);
  return [...kept, ...added];
}
