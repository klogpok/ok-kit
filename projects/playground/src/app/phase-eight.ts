import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, max, min, minDate, required, validate } from '@angular/forms/signals';
import { UiButton } from '@vplans/ui-kit/button';
import {
  UiDateRange,
  UiDateRangePicker,
  UiDateRangePreset,
  UiDatepicker,
} from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRangeSlider, UiSlider, UiSliderMark, UiSliderRange } from '@vplans/ui-kit/slider';
import { UiStep, UiStepper, UiStepperNext, UiStepperPrevious } from '@vplans/ui-kit/stepper';
import { UiTimeInput, uiDateWithTime } from '@vplans/ui-kit/time';

interface UnitFilters {
  rooms: number;
  price: UiSliderRange;
  floors: UiSliderRange;
}

interface InspectionRequest {
  permit: { period: UiDateRange | null };
  visit: { date: Date | null; time: string | null };
}

/** Midnight of the day `days` after `date`. */
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Phase 8 components: complex widgets. */
@Component({
  selector: 'app-phase-eight',
  imports: [
    JsonPipe,
    FormField,
    UiButton,
    UiDatepicker,
    UiDateRangePicker,
    UiFormField,
    UiRangeSlider,
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
    rooms: 3,
    price: [4000, 9000],
    floors: [2, 8],
  });
  protected readonly filters = form(this.model, (p) => {
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
  protected readonly request = signal<InspectionRequest>({
    permit: { period: null },
    visit: { date: null, time: null },
  });
  protected readonly wizard = form(this.request, (p) => {
    required(p.permit.period, { message: 'Choose the permit period' });
    validate(p.permit.period, ({ value }) =>
      value() && !value()?.end ? { kind: 'end', message: 'Choose the end date' } : undefined,
    );
    required(p.visit.date, { message: 'Choose a date' });
    minDate(p.visit.date, this.today);
    required(p.visit.time, { message: 'Choose a time' });
  });

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
    uiDateWithTime(this.request().visit.date, this.request().visit.time),
  );
}
