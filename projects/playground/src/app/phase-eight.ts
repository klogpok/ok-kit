import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { UiButton } from '@vplans/ui-kit/button';
import {
  UiDateRange,
  UiDateRangePicker,
  UiDateRangePreset,
  UiDatepicker,
} from '@vplans/ui-kit/datepicker';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import {
  UiButtonToggle,
  UiButtonToggleGroup,
  UiSegment,
  UiSegmented,
} from '@vplans/ui-kit/segmented';
import { UiRangeSlider, UiSlider, UiSliderMark, UiSliderRange } from '@vplans/ui-kit/slider';
import { UiStep, UiStepper, UiStepperNext, UiStepperPrevious } from '@vplans/ui-kit/stepper';
import { UiTimeInput, uiDateWithTime } from '@vplans/ui-kit/time';
import { uiAtLeastOne, uiRequired } from './validators';

interface UnitFilters {
  deal: 'rent' | 'sale';
  features: readonly string[];
  rooms: number;
  price: UiSliderRange;
  floors: UiSliderRange;
}

/** Midnight of the day `days` after `date`. */
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** A range that has a start needs an end too. */
const endOfRange = (control: AbstractControl): ValidationErrors | null => {
  const range = control.value as UiDateRange | null;
  return range && !range.end ? { end: 'Choose the end date' } : null;
};

/** Phase 8 components: complex widgets. */
@Component({
  selector: 'app-phase-eight',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiButton,
    UiButtonToggle,
    UiButtonToggleGroup,
    UiDatepicker,
    UiDateRangePicker,
    UiError,
    UiFormField,
    UiRangeSlider,
    UiSegment,
    UiSegmented,
    UiSlider,
    UiStep,
    UiStepper,
    UiStepperNext,
    UiStepperPrevious,
    UiTimeInput,
  ],
  templateUrl: './phase-eight.html',
  styleUrl: './phase-eight.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseEight {
  protected readonly filters = new FormGroup({
    deal: new FormControl<UnitFilters['deal']>('rent', { nonNullable: true }),
    features: new FormControl<readonly string[]>(['parking'], {
      nonNullable: true,
      validators: uiAtLeastOne,
    }),
    // The slider carries its own limits now, so the control only has to match them.
    rooms: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.min(1), Validators.max(6)],
    }),
    price: new FormControl<UiSliderRange>([4000, 9000], { nonNullable: true }),
    floors: new FormControl<UiSliderRange>([2, 8], { nonNullable: true }),
  });
  /** The filters as a signal, for the panel below them. */
  protected readonly model = toSignal(
    this.filters.valueChanges.pipe(map(() => this.filters.getRawValue())),
    { initialValue: this.filters.getRawValue() },
  );

  /** The last price range the user let go of, e.g. for a server request. */
  protected readonly committedPrice = signal<UiSliderRange | null>(null);

  protected readonly floorMarks: UiSliderMark[] = [1, 4, 8, 12].map((value) => ({
    value,
    label: String(value),
  }));

  protected readonly priceText = (value: number): string => `${value.toLocaleString('he-IL')} ₪`;

  // --- Inspection request: stepper, date range, date and time -------------------------------

  /** Midnight today: the first day of the permit and of the visit. */
  protected readonly today = addDays(new Date(), 0);
  protected readonly step = signal(0);
  protected readonly wizard = new FormGroup({
    permit: new FormGroup({
      period: new FormControl<UiDateRange | null>(null, [
        ...uiRequired('Choose the permit period'),
        endOfRange,
      ]),
    }),
    visit: new FormGroup({
      // `[min]="today"` already keeps earlier days out of the control, so `required` is enough.
      date: new FormControl<Date | null>(null, uiRequired('Choose a date')),
      time: new FormControl<string | null>(null, uiRequired('Choose a time')),
    }),
  });
  /** The wizard's value as a signal, for the summary step. */
  protected readonly request = toSignal(
    this.wizard.valueChanges.pipe(map(() => this.wizard.getRawValue())),
    { initialValue: this.wizard.getRawValue() },
  );

  protected readonly presets: UiDateRangePreset[] = [
    { label: 'Next 30 days', range: () => ({ start: this.today, end: addDays(this.today, 29) }) },
    { label: 'Next 90 days', range: () => ({ start: this.today, end: addDays(this.today, 89) }) },
    {
      label: 'Rest of the year',
      range: () => ({ start: this.today, end: new Date(this.today.getFullYear(), 11, 31) }),
    },
  ];

  /** The visit as one `Date`. */
  protected readonly visit = computed(() =>
    uiDateWithTime(this.request().visit.date ?? null, this.request().visit.time ?? null),
  );
}
