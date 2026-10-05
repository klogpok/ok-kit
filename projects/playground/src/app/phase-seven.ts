import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { UiAutocomplete } from '@vplans/ui-kit/autocomplete';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiButton } from '@vplans/ui-kit/button';
import { UiChipInput, UiChipSet, UiFilterChip } from '@vplans/ui-kit/chip';
import { UiFileUpload } from '@vplans/ui-kit/file-upload';
import { UiError, UiFormField, UiPrefix, UiSuffix } from '@vplans/ui-kit/form-field';
import { UiNumberInput } from '@vplans/ui-kit/number-input';
import { UiMultiSelect, UiOption } from '@vplans/ui-kit/select';
import {
  UiExpandableRow,
  UiRowDetail,
  UiRowToggle,
  UiSort,
  UiSortHeader,
  UiSortState,
  UiSticky,
  UiTable,
  UiTableContainer,
  UiTableSelectAll,
  UiTableSelectRow,
  UiTableSelection,
  uiSortData,
} from '@vplans/ui-kit/table';
import { UiToast } from '@vplans/ui-kit/toast';
import { uiAtLeastOne, uiRequired } from './validators';

interface Person {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  floor: number;
  area: number;
  owner: string;
  status: { text: string; tone: UiBadgeTone };
}

const PEOPLE: Person[] = [
  { id: 1, name: 'Dana Levi' },
  { id: 2, name: 'Yossi Peretz' },
  { id: 3, name: 'Noa Friedman' },
  { id: 4, name: 'David Cohen' },
];

const STATUSES = [
  { text: 'ממתין לאישור מתאם', tone: 'primary' },
  { text: 'ממתין לחתימה', tone: 'warning' },
  { text: 'לא הוגדר לו"ז', tone: 'neutral' },
] as const;

const UNITS: Unit[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Unit ${i + 1}`,
  floor: (i % 6) + 1,
  area: 60 + ((i * 17) % 55),
  owner: PEOPLE[i % PEOPLE.length].name,
  status: STATUSES[i % STATUSES.length],
}));

/** Phase 7 components: data tables and the new form controls. */
@Component({
  selector: 'app-phase-seven',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiAutocomplete,
    UiBadge,
    UiButton,
    UiChipInput,
    UiChipSet,
    UiFilterChip,
    UiFileUpload,
    UiError,
    UiFormField,
    UiPrefix,
    UiSuffix,
    UiNumberInput,
    UiMultiSelect,
    UiOption,
    UiTable,
    UiTableContainer,
    UiSticky,
    UiSort,
    UiSortHeader,
    UiTableSelection,
    UiTableSelectAll,
    UiTableSelectRow,
    UiExpandableRow,
    UiRowToggle,
    UiRowDetail,
  ],
  templateUrl: './phase-seven.html',
  styleUrls: ['./phase-three.scss', './phase-seven.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseSeven {
  private readonly toast = inject(UiToast);

  protected readonly people = PEOPLE;
  protected readonly cities = ['Haifa', 'Hadera', 'Holon', 'Eilat', 'Acre', 'Ashdod'];
  protected readonly trades = ['Electric', 'Plumbing', 'Paint', 'Tiles', 'Drywall', 'HVAC'];

  protected readonly order = new FormGroup({
    city: new FormControl('', { nonNullable: true, validators: Validators.required }),
    owner: new FormControl<Person | string | null>(null, Validators.required),
    // The limits are on the controls themselves; the validators keep the form honest.
    units: new FormControl<number | null>(12, [
      ...uiRequired('Enter the units'),
      Validators.min(1),
      Validators.max(200),
    ]),
    price: new FormControl<number | null>(null, Validators.min(0)),
    tags: new FormControl<readonly string[]>(['north'], { nonNullable: true }),
    trades: new FormControl<readonly string[]>([], {
      nonNullable: true,
      validators: uiAtLeastOne,
    }),
    files: new FormControl<readonly File[]>([], { nonNullable: true, validators: uiAtLeastOne }),
  });
  /** The form's value as a signal, for the panel below it. */
  protected readonly model = toSignal(
    this.order.valueChanges.pipe(map(() => this.order.getRawValue())),
    { initialValue: this.order.getRawValue() },
  );

  protected readonly uploads = signal<ReadonlyMap<File, number>>(new Map());
  protected readonly nameOf = (person: Person) => person.name;
  protected readonly byId = (a: Person, b: Person) => a.id === b.id;

  protected readonly sort = signal<UiSortState | null>(null);
  protected readonly selected = signal<readonly Unit[]>([]);
  protected readonly onlyWaiting = signal(false);
  protected readonly rows = computed(() => {
    const units = this.onlyWaiting() ? UNITS.filter((u) => u.status.tone !== 'neutral') : UNITS;
    return uiSortData(units, this.sort());
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    // The messages show only on a touched field, so an empty submit has to touch them all.
    if (this.order.invalid) {
      this.order.markAllAsTouched();
      return;
    }
    await this.upload(this.order.getRawValue().files);
    this.toast.success('The work order was saved');
  }

  /** Simulates an upload so the progress bars move. */
  private async upload(files: readonly File[]): Promise<void> {
    for (let percent = 0; percent <= 100; percent += 25) {
      this.uploads.set(new Map(files.map((file) => [file, percent])));
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}
