import { Component, computed, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiAvatar } from '@vplans/ui-kit/avatar';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiOption } from '@vplans/ui-kit/select';
import { UiAutocomplete } from './autocomplete';

const CITIES = ['חיפה', 'חדרה', 'חולון', 'אילת', 'עכו', 'אשדוד', 'באר שבע', 'ירושלים', 'תל אביב'];

interface Person {
  id: number;
  name: string;
  role: string;
}

const PEOPLE: Person[] = [
  { id: 1, name: 'דנה כהן', role: 'מתאמת' },
  { id: 2, name: 'יוסי לוי', role: 'בעלים' },
  { id: 3, name: 'מיכל אברהם', role: 'אדריכלית' },
  { id: 4, name: 'אבי מזרחי', role: 'מהנדס' },
];

/** Pick a person; the list is loaded "from a server" after each keystroke. */
@Component({
  selector: 'ui-story-people-autocomplete',
  imports: [UiAutocomplete, UiOption, UiFormField, UiAvatar],
  template: `
    <div style="max-inline-size:320px;min-block-size:18rem">
      <ui-form-field label="בעלים" hint="הקלידו שם לחיפוש">
        <ui-autocomplete
          [(value)]="owner"
          [displayWith]="nameOf"
          [compareWith]="byId"
          [filterOptions]="false"
          [loading]="loading()"
          (searchChange)="search($event)"
        >
          @for (person of results(); track person.id) {
            <ui-option [value]="person">
              <ui-avatar uiOptionIcon size="sm" [name]="person.name" decorative />
              {{ person.name }}
              <span uiOptionDescription>{{ person.role }}</span>
            </ui-option>
          }
        </ui-autocomplete>
      </ui-form-field>
      <p>{{ ownerName() }}</p>
    </div>
  `,
})
class PeopleAutocomplete {
  readonly owner = signal<Person | string | null>(PEOPLE[0]);
  readonly loading = signal(false);
  readonly query = signal('');
  readonly results = computed(() => PEOPLE.filter((p) => p.name.includes(this.query().trim())));
  readonly ownerName = computed(() => {
    const owner = this.owner();
    return owner && typeof owner === 'object' ? `נבחר: ${owner.name}` : 'לא נבחר';
  });
  readonly nameOf = (person: Person) => person.name;
  readonly byId = (a: Person, b: Person) => a.id === b.id;
  private timer: ReturnType<typeof setTimeout> | undefined;

  search(text: string): void {
    clearTimeout(this.timer);
    this.loading.set(true);
    this.timer = setTimeout(() => {
      this.query.set(text);
      this.loading.set(false);
    }, 400);
  }
}

const meta: Meta<UiAutocomplete> = {
  title: 'Forms/Autocomplete',
  component: UiAutocomplete,
  decorators: [moduleMetadata({ imports: [UiFormField, UiOption, PeopleAutocomplete] })],
};

export default meta;
type Story = StoryObj<UiAutocomplete>;

/** Free text with suggestions: the value is the text; a suggestion fills it in. */
export const Default: Story = {
  render: () => ({
    props: { cities: CITIES },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="עיר">
          <ui-autocomplete placeholder="הקלידו עיר">
            @for (city of cities; track city) {
              <ui-option [value]="city">{{ city }}</ui-option>
            }
          </ui-autocomplete>
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-form-field label="עיר">
  <ui-autocomplete [formField]="form.city" placeholder="הקלידו עיר">
    @for (city of cities; track city) {
      <ui-option [value]="city">{{ city }}</ui-option>
    }
  </ui-autocomplete>
</ui-form-field>`,
      },
    },
  },
};

/**
 * Pick one: with `displayWith` the value is the picked object, and typed text is only a
 * search. Server-side search with `filterOptions="false"`, `loading` and `(searchChange)`.
 */
export const PickOne: Story = {
  render: () => ({ template: `<ui-story-people-autocomplete dir="rtl" lang="he" />` }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:320px">
        <ui-form-field label="מושבת"><ui-autocomplete disabled value="חיפה" /></ui-form-field>
        <ui-form-field label="לקריאה בלבד"><ui-autocomplete readonly value="חיפה" /></ui-form-field>
        <ui-form-field label="שגוי"><ui-autocomplete invalid value="חיפה" /></ui-form-field>
        <ui-form-field label="טוען"><ui-autocomplete loading value="חי" /></ui-form-field>
        <ui-autocomplete size="sm" aria-label="קטן" value="קטן" />
        <ui-autocomplete size="lg" aria-label="גדול" value="גדול" />
      </div>`,
  }),
};
