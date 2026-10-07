import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

/** Check state of a node in a multiple-selection tree. */
export type UiTreeNodeCheckState = 'checked' | 'partial' | 'unchecked';

export interface UiTreeNodeHarnessFilters extends BaseHarnessFilters {
  /** The text of the node. */
  text?: string | RegExp;
  /** Depth of the node; 0 for the root nodes. */
  level?: number;
  expanded?: boolean;
  selected?: boolean;
  checkState?: UiTreeNodeCheckState;
  disabled?: boolean;
}

/** A visible node of `ui-tree`. Get it from `UiTreeHarness.getNodes()`. */
export class UiTreeNodeHarness extends UiHarness {
  static hostSelector = '.ui-tree__node';

  private readonly toggle = this.locatorFor('.ui-tree__toggle');

  static with<T extends UiTreeNodeHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTreeNodeHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'level',
        options.level,
        async (harness, level) => (await harness.getLevel()) === level,
      )
      .addOption(
        'expanded',
        options.expanded,
        async (harness, expanded) => (await harness.isExpanded()) === expanded,
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption(
        'checkState',
        options.checkState,
        async (harness, state) => (await harness.getCheckState()) === state,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  async getText(): Promise<string> {
    return (await (await this.locatorFor('.ui-tree__label')()).text()).trim();
  }

  /** Depth of the node; 0 for the root nodes. */
  async getLevel(): Promise<number> {
    return Number(await (await this.host()).getAttribute('aria-level')) - 1;
  }

  /** Whether the node is a branch, lazy branches included. */
  async isExpandable(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) !== null;
  }

  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  async expand(): Promise<void> {
    if (!(await this.isExpanded())) await (await this.toggle()).click();
  }

  async collapse(): Promise<void> {
    if (await this.isExpanded()) await (await this.toggle()).click();
  }

  /** Whether this is the selected node of a single-selection tree. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** The check state in a multiple-selection tree, `null` in any other tree. */
  async getCheckState(): Promise<UiTreeNodeCheckState | null> {
    const checked = await (await this.host()).getAttribute('aria-checked');
    if (checked === null) return null;
    return checked === 'true' ? 'checked' : checked === 'mixed' ? 'partial' : 'unchecked';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the children of a lazy branch are loading. */
  async isLoading(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-busy')) === 'true';
  }

  /** Whether the children of a lazy branch failed to load. */
  async hasLoadError(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-tree__error')()) !== null;
  }

  /** Loads the children of a lazy branch again after a failure. */
  async retry(): Promise<void> {
    await (await this.locatorFor('.ui-tree__retry')()).click();
  }

  /** Clicks the row: selects or checks the node, or toggles a branch of a tree without selection. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export interface UiTreeHarnessFilters extends BaseHarnessFilters {
  /** The tree label: the `aria-label`, or the label of `ui-form-field`. */
  label?: string | RegExp;
  disabled?: boolean;
}

/** Harness for `ui-tree`. */
export class UiTreeHarness extends UiHarness {
  static hostSelector = '.ui-tree';

  private readonly tree = this.locatorForOptional('[role="tree"]');

  static with<T extends UiTreeHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTreeHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** The label of the tree, also while it loads. */
  async getLabel(): Promise<string | null> {
    const element = (await this.tree()) ?? (await this.locatorForOptional('.ui-tree__loading')());
    if (!element) return (await this.host()).getAttribute('aria-label');
    return (await element.getAttribute('aria-label')) ?? this.labelledByText(element);
  }

  async getSelection(): Promise<'none' | 'single' | 'multiple'> {
    const tree = await this.tree();
    if ((await tree?.getAttribute('aria-multiselectable')) === 'true') return 'multiple';
    const selectable = await this.locatorForOptional('.ui-tree__node[aria-selected]')();
    return selectable ? 'single' : 'none';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.tree())?.getAttribute('aria-disabled')) === 'true';
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.tree())?.getAttribute('aria-invalid')) === 'true';
  }

  /** Whether skeleton rows stand in for the nodes. */
  async isLoading(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-tree__loading')()) !== null;
  }

  /** Whether the tree has no nodes and shows its empty text. */
  async isEmpty(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-tree__empty')()) !== null;
  }

  /** The visible nodes, in order: the children of collapsed branches are not rendered. */
  async getNodes(filters: UiTreeNodeHarnessFilters = {}): Promise<UiTreeNodeHarness[]> {
    return this.locatorForAll(UiTreeNodeHarness.with(filters))();
  }

  /** The first visible node that matches the filters. */
  async getNode(filters: UiTreeNodeHarnessFilters): Promise<UiTreeNodeHarness> {
    return this.locatorFor(UiTreeNodeHarness.with(filters))();
  }

  /**
   * Presses a key on the focused node, or where Tab lands, as the user does: an arrow, Home, End,
   * Enter, Space, `*` or letters to jump by text. The tree mirrors ←/→ in RTL.
   */
  async pressKey(key: TestKey | string): Promise<void> {
    const nodes = await this.locatorForAll('.ui-tree__node')();
    let focused: TestElement | undefined;
    for (const node of nodes) if (await node.isFocused()) focused = node;
    await (focused ?? (await this.focusTarget())).sendKeys(key);
  }

  /** The node that is the tab stop of the tree. */
  protected override async focusTarget(): Promise<TestElement> {
    return (await this.locatorForOptional('.ui-tree__node[tabindex="0"]')()) ?? this.host();
  }
}
