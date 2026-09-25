import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, minDate, minLength, required } from '@angular/forms/signals';
import { UiAccordion, UiAccordionContent, UiAccordionItem } from '@vplans/ui-kit/accordion';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiDivider } from '@vplans/ui-kit/divider';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiMenu, UiMenuItem, UiMenuTrigger } from '@vplans/ui-kit/menu';
import { UiPagination } from '@vplans/ui-kit/pagination';
import { UiMultiSelect, UiOption } from '@vplans/ui-kit/select';
import { UiSkeleton } from '@vplans/ui-kit/skeleton';
import { UiSwitch } from '@vplans/ui-kit/switch';
import {
  UiSort,
  UiSortHeader,
  UiSortState,
  UiTable,
  UiTableMessage,
  UiTableSkeleton,
  uiSortData,
} from '@vplans/ui-kit/table';
import { UiToast } from '@vplans/ui-kit/toast';

interface Plan {
  id: number;
  name: string;
  owner: string;
  units: number;
  status: string;
  tone: UiBadgeTone;
}

const STATUSES: { status: string; tone: UiBadgeTone }[] = [
  { status: 'ממתין לאישור מתאם', tone: 'primary' },
  { status: 'ממתין לחתימה', tone: 'warning' },
  { status: 'לא הוגדר לו"ז', tone: 'neutral' },
];
const OWNERS = ['Dana Levi', 'Yossi Peretz', 'Noa Friedman', 'David Cohen'];

const PLANS: Plan[] = Array.from({ length: 36 }, (_, i) => ({
  id: i + 1,
  name: `Plan ${i + 1}`,
  owner: OWNERS[i % OWNERS.length],
  units: ((i * 7) % 23) + 1,
  ...STATUSES[i % STATUSES.length],
}));

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Phase 3 components wired together: table, pagination, menu, accordion, date picker. */
@Component({
  selector: 'app-phase-three',
  imports: [
    JsonPipe,
    FormField,
    UiAccordion,
    UiAccordionItem,
    UiAccordionContent,
    UiBadge,
    UiButton,
    UiIconButton,
    UiDatepicker,
    UiDivider,
    UiFormField,
    UiIcon,
    UiMenu,
    UiMenuItem,
    UiMenuTrigger,
    UiMultiSelect,
    UiOption,
    UiPagination,
    UiSkeleton,
    UiSwitch,
    UiTable,
    UiSort,
    UiSortHeader,
    UiTableMessage,
    UiTableSkeleton,
  ],
  templateUrl: './phase-three.html',
  styleUrl: './phase-three.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseThree {
  private readonly toast = inject(UiToast);

  protected readonly owners = OWNERS;
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly sort = signal<UiSortState | null>(null);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);

  protected readonly rows = computed(() =>
    this.empty() ? [] : uiSortData(PLANS, this.sort(), undefined, 'he'),
  );
  protected readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  protected readonly today = startOfToday();
  protected readonly model = signal<{ recipients: string[]; meeting: Date | null }>({
    recipients: [],
    meeting: null,
  });
  protected readonly schedule = form(this.model, (p) => {
    required(p.recipients);
    minLength(p.recipients, 1, { message: 'Choose at least one recipient' });
    required(p.meeting, { message: 'Choose a meeting date' });
    minDate(p.meeting, startOfToday(), { message: 'The meeting cannot be in the past' });
  });

  protected readonly workdays = (date: Date) => date.getDay() !== 5 && date.getDay() !== 6;

  protected reload(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1500);
  }

  protected act(action: string, plan: Plan): void {
    this.toast.info(`${action}: ${plan.name}`);
  }
}
