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
import { FormField, form, max, min, minLength } from '@angular/forms/signals';
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
  return range && !range.end ? { end: true } : null;
};

/** Phase 8 components: complex widgets. */
@Component({
  selector: 'app-phase-eight',
  imports: [
    JsonPipe,
    FormField,
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
  protected readonly model = signal<UnitFilters>({
    deal: 'rent',
    features: ['parking'],
    rooms: 3,
    price: [4000, 9000],
    floors: [2, 8],
  });
  protected readonly filters = form(this.model, (p) => {
    minLength(p.features, 1, { message: 'Choose at least one feature' });
    min(p.rooms, 1);
    max(p.rooms, 6);
  });

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
      period: new FormControl<UiDateRange | null>(null, [Validators.required, endOfRange]),
    }),
    visit: new FormGroup({
      // `[min]="today"` already keeps earlier days out of the control, so `required` is enough.
      date: new FormControl<Date | null>(null, Validators.required),
      time: new FormControl<string | null>(null, Validators.required),
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
