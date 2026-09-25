import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  EventEmitter,
  Injectable,
  Injector,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { ComponentType } from '@angular/cdk/portal';
import { AutoFocusTarget, DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { UiButton } from '@vplans/ui-kit/button';
import { UI_LABELS, resolveDirection } from '@vplans/ui-kit/core';
import { firstValueFrom } from 'rxjs';
import { UiDialogConfig, UiDialogContainer, UiDialogSize } from './dialog-container';
import { UiDialogActions, UiDialogContent, UiDialogHeader, UiDialogTitle } from './dialog-parts';

/** Options of `UiDialog.open()`. */
export interface UiDialogOptions<D = unknown> {
  /** Available in the dialog through `inject(UI_DIALOG_DATA)` (component) or `let-data` (template). */
  data?: D;
  /** Width: `sm` for confirmations, `md` for forms, `lg` for rich content. */
  size?: UiDialogSize;
  /** Use `alertdialog` for urgent messages that need a response. */
  role?: 'dialog' | 'alertdialog';
  /** Prevent closing with Escape and backdrop clicks. */
  disableClose?: boolean;
  /** Accessible name when the dialog has no `ui-dialog-title`. */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  /**
   * What gets focus on open. `first-field` (default): `[cdkFocusInitial]`, else the first form
   * field, else the first tabbable element. Other values are passed to CDK Dialog.
   */
  autoFocus?: 'first-field' | AutoFocusTarget | string | boolean;
  /** Element to focus on close. Defaults to the element focused before the dialog opened. */
  restoreFocus?: boolean | string | HTMLElement;
  /** Text direction of the dialog. Defaults to the direction around the focused element. */
  direction?: 'ltr' | 'rtl';
  injector?: Injector;
  viewContainerRef?: ViewContainerRef;
}

/** A fixed `Directionality`, the same shape CDK Dialog provides for `config.direction`. */
function fixedDirectionality(value: Direction): Partial<Directionality> {
  const change = new EventEmitter<Direction>();
  return { value, valueSignal: signal(value), change, ngOnDestroy: () => change.complete() };
}

/** Options of `UiDialog.confirm()`. */
export interface UiConfirmOptions {
  title: string;
  message?: string;
  /** Defaults to the `confirm` label. */
  confirmLabel?: string;
  /** Defaults to the `cancel` label. */
  cancelLabel?: string;
  /** `danger` styles the confirm button as destructive and focuses Cancel first. */
  tone?: 'primary' | 'danger';
}

interface UiConfirmData extends UiConfirmOptions {
  /** Id of the message, which describes the alert dialog. */
  messageId: string;
}

/** The ref returned by `UiDialog.open()` (the CDK `DialogRef`). */
export { DialogRef as UiDialogRef, DIALOG_DATA as UI_DIALOG_DATA };

@Component({
  selector: 'ui-confirm-dialog',
  imports: [UiDialogHeader, UiDialogTitle, UiDialogContent, UiDialogActions, UiButton],
  template: `
    <ui-dialog-header hideClose>
      <h2 ui-dialog-title>{{ data.title }}</h2>
    </ui-dialog-header>
    @if (data.message) {
      <ui-dialog-content [attr.id]="data.messageId">{{ data.message }}</ui-dialog-content>
    }
    <ui-dialog-actions>
      <button
        ui-button
        variant="secondary"
        [attr.cdkFocusInitial]="danger ? '' : null"
        (click)="ref.close(false)"
      >
        {{ data.cancelLabel || labels().cancel }}
      </button>
      <button
        ui-button
        [variant]="danger ? 'danger' : 'primary'"
        [attr.cdkFocusInitial]="danger ? null : ''"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel || labels().confirm }}
      </button>
    </ui-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class UiConfirmDialog {
  protected readonly data = inject<UiConfirmData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly labels = inject(UI_LABELS);
  protected readonly danger = this.data.tone === 'danger';
}

/**
 * Opens modal dialogs on top of CDK Dialog: focus is trapped inside, Escape and backdrop clicks
 * close the dialog, and focus returns to the trigger on close. The page behind is hidden from
 * screen readers.
 *
 * Build the content from `ui-dialog-header` + `[ui-dialog-title]`, `ui-dialog-content`
 * and `ui-dialog-actions`.
 *
 * @example
 * const ref = this.dialog.open<boolean>(DeletePlanDialog, { data: plan, size: 'sm' });
 * ref.closed.subscribe((deleted) => ...);
 *
 * @example
 * if (await this.dialog.confirm({ title: 'Delete the plan?', tone: 'danger', confirmLabel: 'Delete' })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class UiDialog {
  private readonly dialog = inject(Dialog);
  private readonly document = inject(DOCUMENT);
  private readonly ids = inject(_IdGenerator);

  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    options: UiDialogOptions<D> = {},
  ): DialogRef<R, C> {
    const autoFocus = options.autoFocus ?? 'first-field';
    const restoreToOpener = (options.restoreFocus ?? true) === true;
    // Resolved per dialog: the CDK Directionality misses runtime changes of `dir` on <html>.
    const direction =
      options.direction ??
      resolveDirection(this.document.activeElement ?? this.document.documentElement);
    const config: UiDialogConfig<D, DialogRef<R, C>> = {
      ...options,
      // With 'dialog' the CDK only focuses the container when the kit found nothing to focus.
      autoFocus: autoFocus === 'first-field' ? 'dialog' : autoFocus,
      focusFirstField: autoFocus === 'first-field',
      // The container returns focus to the opener itself (see `restoreToOpener`).
      restoreFocus: restoreToOpener ? false : options.restoreFocus,
      restoreToOpener,
      size: options.size ?? 'md',
      direction,
      // CDK provides `direction` to the content only when `injector` / `viewContainerRef` has
      // no Directionality, and the root one always exists.
      providers: [{ provide: Directionality, useValue: fixedDirectionality(direction) }],
      container: UiDialogContainer,
      ariaModal: true,
      panelClass: 'ui-dialog-pane',
      backdropClass: 'ui-dialog-backdrop',
    };
    return this.dialog.open<R, D, C>(content, config);
  }

  /** Asks a yes/no question. Resolves `true` when confirmed, `false` when cancelled or dismissed. */
  async confirm(options: UiConfirmOptions): Promise<boolean> {
    const messageId = this.ids.getId('ui-confirm-message-');
    const ref = this.open<boolean, UiConfirmData>(UiConfirmDialog, {
      data: { ...options, messageId },
      size: 'sm',
      role: 'alertdialog',
      // An alert dialog is described by its message (APG).
      ariaDescribedBy: options.message ? messageId : undefined,
    });
    return (await firstValueFrom(ref.closed)) === true;
  }

  /** Closes all open dialogs. */
  closeAll(): void {
    this.dialog.closeAll();
  }
}
