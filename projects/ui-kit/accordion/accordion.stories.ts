import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiAccordion, UiAccordionContent, UiAccordionItem } from './accordion';

interface AccordionArgs {
  allowMultiple: boolean;
}

const meta: Meta<AccordionArgs> = {
  title: 'Layout/Accordion',
  component: UiAccordion,
  decorators: [moduleMetadata({ imports: [UiAccordionItem, UiAccordionContent, UiButton] })],
  argTypes: { allowMultiple: { control: 'boolean' } },
  args: { allowMultiple: false },
  render: (args) => ({
    props: args,
    template: `
      <ui-accordion [multi]="allowMultiple" style="max-inline-size:36rem">
        <ui-accordion-item label="Plan details" expanded>
          Owner, address and the coordinator responsible for the plan.
        </ui-accordion-item>
        <ui-accordion-item label="Documents">
          Uploaded drawings, permits and signed forms.
        </ui-accordion-item>
        <ui-accordion-item label="History">
          <ng-template uiAccordionContent>Every change made to the plan (created lazily).</ng-template>
        </ui-accordion-item>
      </ui-accordion>`,
  }),
};

export default meta;
type Story = StoryObj<AccordionArgs>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { allowMultiple: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:grid;gap:12px;max-inline-size:36rem">
        <div style="display:flex;gap:8px">
          <button ui-button variant="secondary" size="sm" (click)="acc.openAll()">Open all</button>
          <button ui-button variant="secondary" size="sm" (click)="acc.closeAll()">Close all</button>
        </div>
        <ui-accordion #acc="uiAccordion" [multi]="allowMultiple">
          <ui-accordion-item label="Step 1: Upload drawings">Upload the architect's drawings.</ui-accordion-item>
          <ui-accordion-item label="Step 2: Coordinator approval">The coordinator reviews the plan.</ui-accordion-item>
          <ui-accordion-item label="Step 3: Owner signature">The owner signs the plan.</ui-accordion-item>
        </ui-accordion>
      </div>`,
  }),
};

export const WithDisabledItem: Story = {
  render: () => ({
    template: `
      <ui-accordion style="max-inline-size:36rem">
        <ui-accordion-item label="Details">Plan details.</ui-accordion-item>
        <ui-accordion-item label="Billing (no access)" disabled>Billing.</ui-accordion-item>
        <ui-accordion-item label="History">History.</ui-accordion-item>
      </ui-accordion>`,
  }),
};

/** A single item works as a disclosure. */
export const StandaloneItem: Story = {
  render: () => ({
    template: `
      <ui-accordion-item label="Advanced settings" style="max-inline-size:36rem">
        Settings most users never change.
      </ui-accordion-item>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <ui-accordion dir="rtl" lang="he" style="max-inline-size:36rem">
        <ui-accordion-item label="פרטי התוכנית" expanded>בעלים, כתובת ומתאם אחראי.</ui-accordion-item>
        <ui-accordion-item label="מסמכים">שרטוטים, היתרים וטפסים חתומים.</ui-accordion-item>
        <ui-accordion-item label="היסטוריה">כל השינויים בתוכנית.</ui-accordion-item>
      </ui-accordion>`,
  }),
};
