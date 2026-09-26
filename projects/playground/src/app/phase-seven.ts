import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, max, min, minLength, required, submit } from '@angular/forms/signals';
import { UiAutocomplete } from '@vplans/ui-kit/autocomplete';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiButton } from '@vplans/ui-kit/button';
import { UiChipInput, UiChipSet, UiFilterChip } from '@vplans/ui-kit/chip';
import { UiFileUpload } from '@vplans/ui-kit/file-upload';
import { UiFormField, UiPrefix, UiSuffix } from '@vplans/ui-kit/form-field';
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

interface Person {
  id: number;
  name: string;
}

interface WorkOrder {
  city: string;
  owner: Person | string | null;
  units: number | null;
  price: number | null;
  tags: readonly string[];
  trades: readonly string[];
  files: readonly File[];
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
    FormField,
    UiAutocomplete,
    UiBadge,
    UiButton,
    UiChipInput,
    UiChipSet,
    UiFilterChip,
    UiFileUpload,
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

  protected readonly model = signal<WorkOrder>({
    city: '',
    owner: null,
    units: 12,
    price: null,
    tags: ['north'],
    trades: [],
    files: [],
  });
  protected readonly order = form(this.model, (p) => {
    required(p.city, { message: 'Enter a city' });
    required(p.owner, { message: 'Pick an owner' });
    required(p.units, { message: 'Enter the units' });
    min(p.units, 1);
    max(p.units, 200);
    min(p.price, 0);
    minLength(p.trades, 1, { message: 'Choose a trade' });
    minLength(p.files, 1, { message: 'Attach a plan' });
  });
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
    await submit(this.order, async () => {
      await this.upload(this.model().files);
      this.toast.success('The work order was saved');
    });
  }

  /** Simulates an upload so the progress bars move. */
  private async upload(files: readonly File[]): Promise<void> {
    for (let percent = 0; percent <= 100; percent += 25) {
      this.uploads.set(new Map(files.map((file) => [file, percent])));
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}
