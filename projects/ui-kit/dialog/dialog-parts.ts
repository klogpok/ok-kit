import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconX } from '@vplans/ui-kit/icon';

/**
 * Dialog title. Apply to a heading; the dialog is labelled by it (`aria-labelledby`).
 *
 * @example <h2 ui-dialog-title>Delete the plan?</h2>
 */
@Component({
  selector: '[ui-dialog-title]',
  template: '<ng-content />',
  styleUrl: './dialog-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog-title', '[id]': 'id()' },
})
export class UiDialogTitle {
  readonly id = input(inject(_IdGenerator).getId('ui-dialog-title-'));

  constructor() {
    const container = inject(DialogRef, { optional: true })?.containerInstance;
    if (!(container instanceof CdkDialogContainer)) return;
    // Register after inputs are set, so a custom id is used.
    queueMicrotask(() => container._addAriaLabelledBy(this.id()));
    inject(DestroyRef).onDestroy(() => container._removeAriaLabelledBy(this.id()));
  }
}

/** Top row of a dialog: the title and a close button. */
@Component({
  selector: 'ui-dialog-header',
  imports: [UiIconButton, UiIcon],
  template: `
    <div class="ui-dialog-header__text"><ng-content /></div>
    @if (!hideClose()) {
      <button
        ui-icon-button
        variant="ghost"
        size="sm"
        class="ui-dialog-header__close"
        [label]="closeLabel() || labels().close"
        (click)="close()"
      >
        <ui-icon [icon]="closeIcon" />
      </button>
    }
  `,
  styleUrl: './dialog-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog-header' },
})
export class UiDialogHeader {
  private readonly dialogRef = inject(DialogRef, { optional: true });
  protected readonly labels = inject(UI_LABELS);
  protected readonly closeIcon = uiIconX;

  /** Hide the close button, e.g. when the user must pick one of the actions. */
  readonly hideClose = input(false, { transform: booleanAttribute });
  /** Accessible name of the close button. Defaults to the `close` label. */
  readonly closeLabel = input('');

  protected close(): void {
    this.dialogRef?.close();
  }
}

/** Scrollable body of a dialog. */
@Component({
  selector: 'ui-dialog-content',
  template: '<ng-content />',
  styleUrl: './dialog-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog-content' },
})
export class UiDialogContent {}

/** Action buttons at the bottom of a dialog, aligned to the end (the left side in RTL). */
@Component({
  selector: 'ui-dialog-actions',
  template: '<ng-content />',
  styleUrl: './dialog-parts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-dialog-actions',
    '[class.ui-dialog-actions--start]': 'align() === "start"',
  },
})
export class UiDialogActions {
  readonly align = input<'start' | 'end'>('end');
}

/**
 * Closes the enclosing dialog on click, with an optional result.
 *
 * @example <button ui-button variant="secondary" uiDialogClose>Cancel</button>
 * @example <button ui-button [uiDialogClose]="true">Delete</button>
 */
@Directive({
  selector: 'button[uiDialogClose]',
  host: { '(click)': 'close()' },
})
export class UiDialogClose {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  readonly result = input<unknown>(undefined, { alias: 'uiDialogClose' });

  protected close(): void {
    const result = this.result();
    // A bare `uiDialogClose` attribute arrives as ''.
    this.dialogRef?.close(result === '' ? undefined : result);
  }
}
