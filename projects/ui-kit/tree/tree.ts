import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, from, take } from 'rxjs';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkTree, CdkTreeNode, CdkTreeNodeDef, CdkTreeNodeToggle } from '@angular/cdk/tree';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
} from '@vplans/ui-kit/core';
import { UiButton } from '@vplans/ui-kit/button';
import { UiIcon, uiIconChevronDown } from '@vplans/ui-kit/icon';
import { UiSkeleton } from '@vplans/ui-kit/skeleton';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import {
  UiTreeCheckSource,
  UiTreeCheckState,
  checkStates,
  reconcileChecks,
  sameKeys,
  toggleCheck,
} from './tree-checks';
import { provideUiTreeKeyManager } from './tree-key-manager';

/** Key of a tree node: what the tree stores in its value and in `expanded`. */
export type UiTreeKey = string | number;

/**
 * `none`: nodes only expand. `single`: one selected node, the value is its key or `null`.
 * `multiple`: tri-state checkboxes, the value is the key of every checked node.
 */
export type UiTreeSelection = 'none' | 'single' | 'multiple';

/** Value of `ui-tree`: a key in single selection, a list of keys in multiple selection. */
export type UiTreeValue<K extends UiTreeKey> = K | readonly K[] | null;

/** Where a lazy branch stands while its children are not loaded. */
type UiTreeBranchLoad = 'loading' | 'error';

interface UiTreeNodeShape {
  readonly id?: unknown;
  readonly children?: unknown;
}

/** What a `uiTreeNode` template receives. */
export interface UiTreeNodeContext<T> {
  /** The node. */
  $implicit: T;
  /** Depth of the node; 0 for the root nodes. */
  level: number;
  expanded: boolean;
}

/**
 * Replaces the text of every node of the enclosing `ui-tree`, e.g. to add an icon or a badge. The
 * chevron, the indent and the checkbox stay. `uiTreeNodeOf` only types the template variable.
 *
 * @example
 * <ng-template uiTreeNode [uiTreeNodeOf]="units" let-unit>
 *   <ui-icon icon="folder" /> {{ unit.name }}
 * </ng-template>
 */
@Directive({ selector: 'ng-template[uiTreeNode]' })
export class UiTreeNodeDef<T> {
  readonly template = inject<TemplateRef<UiTreeNodeContext<T>>>(TemplateRef);
  /** The data of the tree; read only by the type checker of the template. */
  readonly uiTreeNodeOf = input<readonly T[]>();

  static ngTemplateContextGuard<T>(
    _def: UiTreeNodeDef<T>,
    context: unknown,
  ): context is UiTreeNodeContext<T> {
    return typeof context === 'object';
  }
}

/**
 * A tree view (APG) over nested data.
 *
 * @example <ui-tree [data]="units" [displayWith]="nameOf" aria-label="Units" />
 */
@Component({
  selector: 'ui-tree',
  imports: [
    CdkTree,
    CdkTreeNode,
    CdkTreeNodeDef,
    CdkTreeNodeToggle,
    NgTemplateOutlet,
    UiButton,
    UiIcon,
    UiSkeleton,
    UiSpinner,
  ],
  template: `
    @if (loading()) {
      <div
        class="ui-tree__loading"
        role="status"
        aria-busy="true"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabel() ? null : labelledBy()"
      >
        <ui-skeleton width="60%" />
        <ui-skeleton width="45%" />
        <ui-skeleton width="70%" />
      </div>
    } @else if (data().length === 0) {
      <div class="ui-tree__empty">
        <ng-content select="[uiTreeEmpty]">{{ labels().noItems }}</ng-content>
      </div>
    } @else {
      <cdk-tree
        class="ui-tree__tree"
        [dataSource]="renderData()"
        [childrenAccessor]="childrenOf"
        [expansionKey]="keyOf"
        [attr.id]="id()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabel() ? null : labelledBy()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-multiselectable]="selection() === 'multiple' ? 'true' : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
      >
        <cdk-tree-node
          *cdkTreeNodeDef="let node"
          class="ui-tree__node"
          [class.ui-tree__node--selected]="isSelected(node)"
          [class.ui-tree__node--disabled]="isNodeDisabled(node)"
          [style.--_level]="levelOf(node)"
          [isExpandable]="isExpandable(node)"
          [cdkTreeNodeTypeaheadLabel]="displayWith()(node)"
          [attr.aria-selected]="selection() === 'single' ? isSelected(node) : null"
          [attr.aria-checked]="selection() === 'multiple' ? ariaChecked(node) : null"
          [attr.aria-disabled]="isNodeDisabled(node) ? 'true' : null"
          [attr.aria-busy]="loadState(node) === 'loading' ? 'true' : null"
          (expandedChange)="onExpandedChange(node, $event)"
          (activation)="activate(node)"
          (click)="activate(node)"
        >
          <span class="ui-tree__toggle" cdkTreeNodeToggle aria-hidden="true">
            @if (loadState(node) === 'loading') {
              <ui-spinner size="sm" decorative />
            } @else if (isExpandable(node)) {
              <ui-icon class="ui-tree__chevron" [icon]="chevron" />
            }
          </span>
          @if (selection() === 'multiple') {
            <span class="ui-tree__checkbox" [attr.data-state]="checkState(node)" aria-hidden="true">
              <svg class="ui-tree__mark" viewBox="0 0 16 16" focusable="false">
                @if (checkState(node) === 'partial') {
                  <path d="M4 8h8" />
                } @else {
                  <path d="M3.5 8.5l3 3 6-7" />
                }
              </svg>
            </span>
          }
          <span class="ui-tree__label">
            @if (nodeDef(); as def) {
              <ng-container
                [ngTemplateOutlet]="def.template"
                [ngTemplateOutletContext]="{
                  $implicit: node,
                  level: levelOf(node),
                  expanded: expanded().includes(keyOf(node)),
                }"
              />
            } @else {
              {{ displayWith()(node) }}
            }
          </span>
          @if (loadState(node) === 'error') {
            <span class="ui-tree__error">{{ labels().loadFailed }}</span>
            <button
              ui-button
              type="button"
              variant="ghost"
              size="sm"
              class="ui-tree__retry"
              (click)="retry(node, $event)"
            >
              {{ labels().retry }}
            </button>
          }
        </cdk-tree-node>
      </cdk-tree>
    }
  `,
  styleUrl: './tree.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiTree) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTree), multi: true },
    provideUiTreeKeyManager(),
  ],
  host: {
    class: 'ui-tree',
    '[class.ui-tree--disabled]': 'isDisabled()',
    '[class.ui-tree--invalid]': 'showError()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiTree<T = UiTreeNodeShape, K extends UiTreeKey = UiTreeKey>
  extends UiFormControlBase<UiTreeValue<K>>
  implements UiFormFieldControl
{
  // Absent while loading or empty; the expansion lives in `expanded` and comes back with it.
  private readonly cdkTree = viewChild<CdkTree<T, K>>(CdkTree);
  protected readonly nodeDef = contentChild<UiTreeNodeDef<T>>(UiTreeNodeDef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly labels = inject(UI_LABELS);
  protected readonly chevron = uiIconChevronDown;

  readonly data = input<readonly T[]>([]);
  /** Children of a node; nested data, `node.children` by default. */
  readonly childrenWith = input<(node: T) => readonly T[] | null | undefined>(
    (node) => (node as UiTreeNodeShape).children as T[] | undefined,
  );
  /** Stable key of a node, `node.id` by default. */
  readonly keyWith = input<(node: T) => K>((node) => (node as UiTreeNodeShape).id as K);
  /** Text of a node. */
  readonly displayWith = input<(node: T) => string>((node) => String(node));
  /** A disabled node can be focused but not selected or checked. */
  readonly disabledWith = input<(node: T) => boolean>(() => false);
  /**
   * Whether a node has children that `loadChildren` loads on its first expand. Only read for nodes
   * whose `childrenWith` gives nothing.
   */
  readonly hasChildrenWith = input<(node: T) => boolean>(() => false);
  /**
   * Loads the children of a lazy branch on its first expand. The first emitted list is kept; a
   * failure shows a retry button in the node.
   */
  readonly loadChildren = input<
    ((node: T) => Observable<readonly T[]> | Promise<readonly T[]>) | null
  >(null);
  readonly selection = input<UiTreeSelection>('none');
  /** Shows skeleton rows instead of the nodes, e.g. while the data loads. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly value = model<UiTreeValue<K>>(null);
  /** Keys of the expanded branches. Keys of nodes that are not loaded yet are kept. */
  readonly expanded = model<readonly K[]>([]);
  /** Id of the element with the `tree` role. */
  readonly id = input(inject(_IdGenerator).getId('ui-tree-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => this.id());
  protected readonly labelledBy = computed(
    () => this.ariaLabelledby() || (this.formField?.labelledBy() ?? null),
  );

  /** Children that `loadChildren` returned, by the key of their branch. */
  private readonly loaded = signal<ReadonlyMap<K, readonly T[]>>(new Map());
  /** Lazy branches that are loading or failed to load, by key. */
  private readonly branchLoads = signal<ReadonlyMap<K, UiTreeBranchLoad>>(new Map());

  protected readonly keyOf = (node: T): K => this.keyWith()(node);
  protected readonly childrenOf = (node: T): T[] => [
    ...(this.childrenWith()(node) ?? this.loaded().get(this.keyOf(node)) ?? []),
  ];

  /** A fresh array for CDK, which re-flattens the nodes when its data source or children change. */
  protected readonly renderData = computed(() => {
    this.loaded();
    return [...this.data()];
  });

  /** Every node that is known now, in tree order. */
  private readonly nodes = computed(() => [...this.levels().keys()]);
  /** The depth of every known node, in tree order. */
  private readonly levels = computed(() => {
    const levels = new Map<T, number>();
    const visit = (nodes: readonly T[], level: number): void => {
      for (const node of nodes) {
        levels.set(node, level);
        visit(this.childrenOf(node), level + 1);
      }
    };
    visit(this.data(), 0);
    return levels;
  });

  /** Keys of a multiple-selection value; anything else reads as none. */
  private readonly checkedKeys = computed<readonly K[]>(() => {
    const value = this.value();
    return Array.isArray(value) ? (value as readonly K[]) : [];
  });
  private readonly checkSource = computed<UiTreeCheckSource<T, K>>(() => ({
    roots: this.data(),
    children: this.childrenOf,
    key: this.keyOf,
    disabled: this.disabledWith(),
  }));
  private readonly checkStates = computed(() =>
    checkStates(this.checkSource(), new Set(this.checkedKeys())),
  );

  constructor() {
    super();
    // A value written from outside, or outdated by newly loaded children, follows the cascade.
    // That is not a user edit, so the control does not become dirty (docs/adr/0001).
    effect(() => {
      if (this.selection() !== 'multiple') return;
      const keys = this.checkedKeys();
      const next = reconcileChecks(this.checkSource(), keys);
      if (sameKeys(keys, next)) return;
      untracked(() => {
        this.value.set(next);
        this.controlState.writeDerivedValue(next);
      });
    });
    // An expanded lazy branch loads its children; collapsing a failed one lets it load again.
    effect(() => {
      const expanded = new Set(this.expanded());
      const pending = this.nodes().filter(
        (node) => expanded.has(this.keyOf(node)) && this.isLazy(node),
      );
      const failed = [...this.branchLoads()].filter(
        ([key, state]) => state === 'error' && !expanded.has(key),
      );
      untracked(() => {
        if (failed.length > 0) {
          const loading = new Map(this.branchLoads());
          for (const [key] of failed) loading.delete(key);
          this.branchLoads.set(loading);
        }
        for (const node of pending) {
          if (!this.branchLoads().has(this.keyOf(node))) this.load(node);
        }
      });
    });
    // `expanded` is the source of truth; CDK keeps its own expansion model, which renders. CDK
    // creates that model once its content is checked, so this runs after render.
    afterRenderEffect(() => {
      const tree = this.cdkTree();
      if (!tree) return;
      const expanded = new Set(this.expanded());
      for (const node of this.nodes()) {
        const wanted = expanded.has(this.keyOf(node));
        if (wanted === tree.isExpanded(node)) continue;
        if (wanted) tree.expand(node);
        else tree.collapse(node);
      }
    });
  }

  writeValue(value: UiTreeValue<K> | undefined): void {
    this.value.set(value ?? null);
  }

  /** Focuses the node that is the tab stop of the tree. */
  focus(options?: FocusOptions): void {
    this.host.querySelector<HTMLElement>('.ui-tree__node[tabindex="0"]')?.focus(options);
  }

  /** Expands every branch whose children are loaded; lazy branches are not loaded. */
  expandAll(): void {
    const keys = this.expanded();
    const branches = this.nodes()
      .filter((node) => this.childrenOf(node).length > 0)
      .map(this.keyOf)
      .filter((key) => !keys.includes(key));
    this.expanded.set([...keys, ...branches]);
  }

  collapseAll(): void {
    this.expanded.set([]);
  }

  protected isExpandable(node: T): boolean {
    return this.childrenOf(node).length > 0 || this.isLazy(node);
  }

  protected loadState(node: T): UiTreeBranchLoad | null {
    return this.branchLoads().get(this.keyOf(node)) ?? null;
  }

  protected retry(node: T, event: Event): void {
    event.stopPropagation();
    this.load(node);
  }

  /** A branch whose children `loadChildren` has not delivered yet. */
  private isLazy(node: T): boolean {
    return (
      this.loadChildren() !== null &&
      this.childrenWith()(node) == null &&
      !this.loaded().has(this.keyOf(node)) &&
      this.hasChildrenWith()(node)
    );
  }

  private load(node: T): void {
    const loadChildren = this.loadChildren();
    if (!loadChildren) return;
    const key = this.keyOf(node);
    this.setBranchLoad(key, 'loading');
    from(loadChildren(node))
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (children) => {
          this.loaded.update((loaded) => new Map(loaded).set(key, children));
          this.setBranchLoad(key, null);
        },
        error: () => {
          this.setBranchLoad(key, 'error');
        },
      });
  }

  private setBranchLoad(key: K, state: UiTreeBranchLoad | null): void {
    this.branchLoads.update((loading) => {
      const next = new Map(loading);
      if (state) next.set(key, state);
      else next.delete(key);
      return next;
    });
  }

  protected levelOf(node: T): number {
    return this.levels().get(node) ?? 0;
  }

  protected isNodeDisabled(node: T): boolean {
    return this.disabledWith()(node);
  }

  protected isSelected(node: T): boolean {
    return this.selection() === 'single' && this.value() === this.keyOf(node);
  }

  protected checkState(node: T): UiTreeCheckState {
    return this.checkStates().get(this.keyOf(node)) ?? 'unchecked';
  }

  protected ariaChecked(node: T): 'true' | 'false' | 'mixed' {
    const state = this.checkState(node);
    return state === 'checked' ? 'true' : state === 'partial' ? 'mixed' : 'false';
  }

  /**
   * A click on the row, or Enter / Space: selects or checks the node; without selection it
   * toggles a branch.
   */
  protected activate(node: T): void {
    const selection = this.selection();
    if (selection === 'none') {
      if (this.isExpandable(node)) this.cdkTree()?.toggle(node);
      return;
    }
    if (this.readonly() || this.isDisabled() || this.isNodeDisabled(node)) return;
    if (selection === 'multiple') {
      const keys = toggleCheck(this.checkSource(), this.checkedKeys(), node);
      this.value.set(keys);
      this.notifyChange(keys);
      return;
    }
    const key = this.keyOf(node);
    if (this.value() === key) return;
    this.value.set(key);
    this.notifyChange(key);
  }

  protected onExpandedChange(node: T, expanded: boolean): void {
    const key = this.keyOf(node);
    const keys = this.expanded();
    if (keys.includes(key) === expanded) return;
    this.expanded.set(expanded ? [...keys, key] : keys.filter((item) => item !== key));
  }

  /** Touched once focus leaves the tree; the arrow keys move focus between its nodes. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.notifyTouched();
  }
}
