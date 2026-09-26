import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, max, min } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRangeSlider, UiSlider, UiSliderMark, UiSliderRange } from '@vplans/ui-kit/slider';

interface UnitFilters {
  rooms: number;
  price: UiSliderRange;
  floors: UiSliderRange;
}

/** Phase 8 components: complex widgets. */
@Component({
  selector: 'app-phase-eight',
  imports: [JsonPipe, FormField, UiFormField, UiSlider, UiRangeSlider],
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
}
