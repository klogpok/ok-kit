import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { AbstractControl } from '@angular/forms';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconCheck } from '@vplans/ui-kit/icon';

/** The form of a step: a Reactive Forms control, e.g. a `FormGroup`. */
export type UiStepControl = AbstractControl;

export type UiStepperOrientation = 'horizontal' | 'vertical';

/** Emitted by `ui-stepper` when the current step changes. */
export interface UiStepperSelectionChange {
  previousIndex: number;
  selectedIndex: number;
}

/**
 * A step of `ui-stepper`. Its content is rendered only while the step is current; components
 * inside keep their state.
 *
 * - `control`: the form of the step. The step is valid while the form is valid; it is done once
 *   the user leaves it valid, and shows an error once the user leaves it (or tries to) invalid.
 * - `completed` and `error` set the state yourself, e.g. after a server check. A string `error`
 *   is shown under the label.
 * - `optional` steps can be skipped in a linear stepper.
 *
 * @example
 * <ui-step label="Address" [control]="form.address">...</ui-step>
 */
@Component({
  selector: 'ui-step',
  template: `<ng-template #content><ng-content /></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStep {
  readonly label = input.required<string>();
  readonly control = input<UiStepControl | null>(null);
  /** Can be skipped in a linear stepper; "Optional" is shown under the label. */
  readonly optional = input(false, { transform: booleanAttribute });
  /** Done (`true`) or not (`false`) whatever the form says. `null` follows the form. */
  readonly completed = input<boolean | null>(null);
  /** Shows the error state; a string is shown under the label. */
  readonly error = input<string | boolean | null>(null);

  /** @internal */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');

  /** The user left the step, or tried to. @internal */
  readonly interacted = signal(false);

  /** Bumped on every event of a Reactive Forms control, which is not a signal. */
  private readonly controlEvents = signal(0);

  /** The form of the step is valid (or the step has none). @internal */
  readonly valid = computed(() => {
    const control = this.control();
    if (!control) return true;
    this.controlEvents();
    return control.valid || control.disabled;
  });

  /** Done: set with `completed`, or left with a valid form. @internal */
  readonly done = computed(() => this.completed() ?? (this.interacted() && this.valid()));

  /** Error: set with `error`, or left with an invalid form. @internal */
  readonly hasError = computed(() => {
    const error = this.error();
    return (error !== null && error !== false) || (this.interacted() && !this.valid());
  });

  /** Text of a string `error`. @internal */
  readonly errorText = computed(() => {
    const error = this.error();
    return typeof error === 'string' ? error : '';
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      if (!control) return;
      const subscription = control.events.subscribe(() => this.controlEvents.update((n) => n + 1));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  /** Shows the errors of the step's form, e.g. after a blocked Next. @internal */
  markTouched(): void {
    this.control()?.markAllAsTouched();
  }
}

/**
 * Leads the user through steps. The steps are a numbered list of buttons; the current one has
 * `aria-current="step"`, done steps show a check and steps with errors a "!" (their state is also
 * part of the button name). The content of the current step is a region named by its button.
 *
 * - `linear`: a step can be reached only when the steps before it are valid (optional steps can
 *   be skipped). Going to a later step from an invalid one marks its form touched, so the fields
 *   show their errors, and the step shows the error state.
 * - `orientation="vertical"` puts the content of the current step under its button.
 * - Put `button[uiStepperNext]` / `button[uiStepperPrevious]` in the steps, or call `next()`,
 *   `previous()`, `select()` and `reset()`.
 *
 * The steps follow the text direction: they run from right to left in RTL.
 *
 * @example
 * <ui-stepper linear [(selectedIndex)]="step">
 *   <ui-step label="Details" [control]="form.details">
 *     ... <button ui-button uiStepperNext>Next</button>
 *   </ui-step>
 *   <ui-step label="Documents" optional>...</ui-step>
 *   <ui-step label="Review">...</ui-step>
 * </ui-stepper>
 */
@Component({
  selector: 'ui-stepper',
  imports: [NgTemplateOutlet, UiIcon],
  template: `
    <ol class="ui-stepper__steps" [attr.aria-label]="ariaLabel() || labels().steps">
      @for (step of steps(); track step; let i = $index, last = $last) {
        <li
          class="ui-stepper__step"
          [class.ui-stepper__step--current]="i === current()"
          [class.ui-stepper__step--done]="step.done()"
          [class.ui-stepper__step--error]="step.hasError()"
        >
          <button
            type="button"
            class="ui-stepper__header"
            [id]="headerId(i)"
            [disabled]="!canSelect(i)"
            [attr.aria-current]="i === current() ? 'step' : null"
            (click)="select(i)"
          >
            <span class="ui-stepper__marker" aria-hidden="true">
              @if (step.hasError()) {
                !
              } @else if (step.done() && i !== current()) {
                <ui-icon [icon]="checkIcon" />
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span class="ui-stepper__text">
              <span class="ui-stepper__label">{{ step.label() }}</span>
              <!-- A space keeps the label and the note apart in the button name. -->
              @if (step.errorText()) {
                &ngsp;<span class="ui-stepper__note ui-stepper__note--error">{{
                  step.errorText()
                }}</span>
              } @else if (step.optional()) {
                &ngsp;<span class="ui-stepper__note">{{ labels().optional }}</span>
              }
              @if (stateText(step, i); as state) {
                <span class="ui-visually-hidden">, {{ state }}</span>
              }
            </span>
          </button>
          @if (vertical()) {
            <div class="ui-stepper__body" [class.ui-stepper__body--last]="last">
              @if (i === current()) {
                <div role="region" class="ui-stepper__content" [attr.aria-labelledby]="headerId(i)">
                  <ng-container [ngTemplateOutlet]="step.content()" />
                </div>
              }
            </div>
          } @else if (!last) {
            <span class="ui-stepper__connector" aria-hidden="true"></span>
          }
        </li>
      }
    </ol>
    @if (!vertical() && selectedStep(); as step) {
      <div role="region" class="ui-stepper__content" [attr.aria-labelledby]="headerId(current())">
        <ng-container [ngTemplateOutlet]="step.content()" />
      </div>
    }
  `,
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-stepper',
    '[class]': '"ui-stepper--" + orientation()',
    '[attr.aria-label]': 'null',
  },
})
export class UiStepper {
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly baseId = inject(_IdGenerator).getId('ui-stepper-');

  /** Index of the current step. Two-way bindable. */
  readonly selectedIndex = model(0);
  /** A step can be reached only when the steps before it are valid or optional. */
  readonly linear = input(false, { transform: booleanAttribute });
  readonly orientation = input<UiStepperOrientation>('horizontal');
  /** Name of the list of steps. Defaults to the `steps` label. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  /** Emits when the user or a method changes the current step. */
  readonly selectionChange = output<UiStepperSelectionChange>();

  protected readonly steps = contentChildren(UiStep);
  protected readonly checkIcon = uiIconCheck;
  protected readonly vertical = computed(() => this.orientation() === 'vertical');

  /** `selectedIndex` kept inside the steps. */
  protected readonly current = computed(() => {
    const count = this.steps().length;
    const index = Math.floor(this.selectedIndex());
    return count ? Math.min(Math.max(index, 0), count - 1) : 0;
  });

  protected readonly selectedStep = computed(() => this.steps().at(this.current()) ?? null);

  /** Moves to the next step, if it can be reached. */
  next(): void {
    this.select(this.current() + 1);
  }

  /** Moves to the previous step. */
  previous(): void {
    this.select(this.current() - 1);
  }

  /**
   * Moves to a step. In a linear stepper, a step after an invalid one cannot be reached: the
   * blocking steps show their errors instead.
   */
  select(index: number): void {
    const steps = this.steps();
    const previousIndex = this.current();
    if (index === previousIndex || index < 0 || index >= steps.length) return;
    steps[previousIndex].interacted.set(true);
    if (!this.canSelect(index)) {
      for (const step of steps.slice(0, index)) {
        if (!this.passable(step)) {
          step.interacted.set(true);
          step.markTouched();
        }
      }
      return;
    }
    const hadFocus = this.host.contains(this.document.activeElement);
    this.selectedIndex.set(index);
    this.selectionChange.emit({ previousIndex, selectedIndex: index });
    // A Next button inside the old step is gone with it: keep focus in the stepper.
    if (hadFocus) {
      afterNextRender(
        {
          write: () => {
            const active = this.document.activeElement;
            if (!active || active === this.document.body) this.focusHeader(index);
          },
        },
        { injector: this.injector },
      );
    }
  }

  /** Back to the first step; the steps forget that they were visited. Forms are not reset. */
  reset(): void {
    for (const step of this.steps()) step.interacted.set(false);
    const previousIndex = this.current();
    this.selectedIndex.set(0);
    if (previousIndex !== 0) this.selectionChange.emit({ previousIndex, selectedIndex: 0 });
  }

  /** Whether the step can be reached now. */
  protected canSelect(index: number): boolean {
    if (!this.linear() || index <= this.current()) return true;
    return this.steps()
      .slice(0, index)
      .every((step) => this.passable(step));
  }

  /** A step that does not stop a linear stepper: optional, done, or current and valid. */
  private passable(step: UiStep): boolean {
    if (step.optional()) return true;
    const completed = step.completed();
    if (completed !== null) return completed;
    const visited = step.interacted() || step === this.selectedStep();
    return visited && step.valid();
  }

  /** State read after the label: "completed" or "has errors". */
  protected stateText(step: UiStep, index: number): string {
    if (step.hasError()) return this.labels().stepError;
    return step.done() && index !== this.current() ? this.labels().stepCompleted : '';
  }

  protected headerId(index: number): string {
    return `${this.baseId}-step-${index}`;
  }

  private focusHeader(index: number): void {
    this.host.querySelector<HTMLElement>(`#${this.headerId(index)}`)?.focus();
  }
}

/**
 * Moves its `ui-stepper` to the next step on click.
 *
 * @example <button ui-button uiStepperNext>Next</button>
 */
@Directive({
  selector: 'button[uiStepperNext]',
  host: { '(click)': 'stepper.next()' },
})
export class UiStepperNext {
  protected readonly stepper = inject(UiStepper);
}

/**
 * Moves its `ui-stepper` to the previous step on click.
 *
 * @example <button ui-button variant="secondary" uiStepperPrevious>Back</button>
 */
@Directive({
  selector: 'button[uiStepperPrevious]',
  host: { '(click)': 'stepper.previous()' },
})
export class UiStepperPrevious {
  protected readonly stepper = inject(UiStepper);
}
