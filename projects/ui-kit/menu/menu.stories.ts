import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiDivider } from '@vplans/ui-kit/divider';
import { UiIcon } from '@vplans/ui-kit/icon';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItem,
  UiMenuItemCheckbox,
  UiMenuItemRadio,
  UiMenuTrigger,
} from './menu';

const meta: Meta<UiMenu> = {
  title: 'Navigation/Menu',
  component: UiMenu,
  decorators: [
    moduleMetadata({
      imports: [
        UiMenuTrigger,
        UiMenuItem,
        UiMenuGroup,
        UiMenuItemCheckbox,
        UiMenuItemRadio,
        UiButton,
        UiIconButton,
        UiIcon,
        UiDivider,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<UiMenu>;

// The arg keeps the last action in the docs snippet; props outside args make it incomplete.
export const Default: StoryObj<{ last: string }> = {
  args: { last: '' },
  render: (args) => ({
    props: args,
    template: `
      <div style="min-block-size:18rem">
        <button ui-button variant="secondary" [uiMenuTriggerFor]="menu">
          Actions <ui-icon icon="chevron-down" />
        </button>
        <p>Last action: {{ last || 'none' }}</p>
        <ng-template #menu>
          <ui-menu>
            <button ui-menu-item (triggered)="last = 'edit'"><ui-icon icon="edit" /> Edit</button>
            <button ui-menu-item (triggered)="last = 'duplicate'">Duplicate</button>
            <button ui-menu-item disabled>Export (no access)</button>
            <ui-divider />
            <button ui-menu-item danger (triggered)="last = 'delete'"><ui-icon icon="trash" /> Delete</button>
          </ui-menu>
        </ng-template>
      </div>`,
  }),
};

export const Submenu: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:18rem">
        <button ui-button variant="secondary" [uiMenuTriggerFor]="menu">Plan</button>
        <ng-template #menu>
          <ui-menu>
            <button ui-menu-item>Open</button>
            <button ui-menu-item [uiMenuTriggerFor]="send">Send to</button>
            <button ui-menu-item [uiMenuTriggerFor]="status">Change status</button>
          </ui-menu>
        </ng-template>
        <ng-template #send>
          <ui-menu>
            <button ui-menu-item>Coordinator</button>
            <button ui-menu-item>Owner</button>
          </ui-menu>
        </ng-template>
        <ng-template #status>
          <ui-menu>
            <button ui-menu-item>Pending approval</button>
            <button ui-menu-item>Pending signature</button>
          </ui-menu>
        </ng-template>
      </div>`,
  }),
};

/** Row actions: an icon button with an accessible name opens the menu. */
export const IconTrigger: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:14rem">
        <button ui-icon-button variant="ghost" label="More actions" [uiMenuTriggerFor]="menu">
          <ui-icon icon="more-horizontal" />
        </button>
        <ng-template #menu>
          <ui-menu>
            <button ui-menu-item>Rename</button>
            <button ui-menu-item>Move</button>
            <button ui-menu-item danger>Delete</button>
          </ui-menu>
        </ng-template>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="min-block-size:14rem">
        <button ui-button variant="secondary" [uiMenuTriggerFor]="menu">פעולות</button>
        <ng-template #menu>
          <ui-menu>
            <button ui-menu-item><ui-icon icon="edit" /> עריכה</button>
            <button ui-menu-item [uiMenuTriggerFor]="send">שליחה אל</button>
            <ui-divider />
            <button ui-menu-item danger><ui-icon icon="trash" /> מחיקה</button>
          </ui-menu>
        </ng-template>
        <ng-template #send>
          <ui-menu>
            <button ui-menu-item>מתאם</button>
            <button ui-menu-item>בעלים</button>
          </ui-menu>
        </ng-template>
      </div>`,
  }),
};

/** Link items, a labelled group of radio items and a checkbox item. */
export const SelectableItems: StoryObj<{ sort: string; archived: boolean }> = {
  args: { sort: 'name', archived: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="min-block-size:20rem">
        <button ui-button variant="secondary" uiMenuPosition="bottom-end" [uiMenuTriggerFor]="menu">
          View <ui-icon icon="chevron-down" />
        </button>
        <p>Sort: {{ sort }}, archived: {{ archived ? 'shown' : 'hidden' }}</p>
        <ng-template #menu>
          <ui-menu>
            <ui-menu-group label="Sort by">
              <button ui-menu-item-radio [checked]="sort === 'name'" (triggered)="sort = 'name'">Name</button>
              <button ui-menu-item-radio [checked]="sort === 'date'" (triggered)="sort = 'date'">Last update</button>
            </ui-menu-group>
            <ui-divider />
            <button ui-menu-item-checkbox [checked]="archived" (triggered)="archived = !archived">Show archived</button>
            <ui-divider />
            <a ui-menu-item href="#history"><ui-icon icon="clock" /> History</a>
            <a ui-menu-item href="#help" disabled>Help (no access)</a>
          </ui-menu>
        </ng-template>
      </div>`,
  }),
};
