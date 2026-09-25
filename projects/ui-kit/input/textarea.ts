import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { UiTextControlBase } from './text-control-base';

/**
 * Styled native textarea with optional auto-resize.
 *
 * @example <textarea ui-textarea autosize [minRows]="3" [maxRows]="8" formControlName="notes"></textarea>
 */
@Component({
  selector: 'textarea[ui-textarea]',
  template: '',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiTextarea) }],
  hostDirectives: [
    {
      directive: CdkTextareaAutosize,
      inputs: ['cdkAutosizeMinRows: minRows', 'cdkAutosizeMaxRows: maxRows'],
    },
  ],
  host: {
    class: 'ui-input ui-textarea',
    '[class.ui-textarea--autosize]': 'autosize()',
  },
})
export class UiTextarea extends UiTextControlBase {
  private readonly autosizer = inject(CdkTextareaAutosize, { self: true });

  /** Grow with content between `minRows` and `maxRows`. */
  readonly autosize = input(false, { transform: booleanAttribute });

  constructor() {
    super();
    effect(() => {
      this.autosizer.enabled = this.autosize();
    });
  }
}
