import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiTable } from './table';
import { UiTableViewport } from './viewport';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** The viewport renders its window in an animation frame. */
async function frame(fixture: ComponentFixture<unknown>): Promise<void> {
  await settle(fixture);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(fixture);
}

interface Unit {
  id: number;
  name: string;
}

@Component({
  imports: [
    UiTable,
    UiTableViewport,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
  template: `
    <cdk-virtual-scroll-viewport
      uiTableViewport
      itemSize="40"
      style="block-size: 400px"
      [aria-label]="label()"
    >
      <table ui-table stickyHeader>
        @if (caption()) {
          <caption>
            Units
          </caption>
        }
        <thead>
          <tr>
            <th scope="col">Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr *cdkVirtualFor="let unit of units(); trackBy: trackId">
            <td>{{ unit.name }}</td>
          </tr>
        </tbody>
        @if (total()) {
          <tbody>
            <tr class="total">
              <td>Total</td>
            </tr>
          </tbody>
        }
      </table>
    </cdk-virtual-scroll-viewport>
  `,
})
class Host {
  readonly units = signal<Unit[]>(
    Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: `Unit ${i + 1}` })),
  );
  readonly caption = signal(true);
  readonly label = signal('');
  readonly total = signal(false);
  readonly trackId = (_: number, unit: Unit) => unit.id;
}

describe('UiTableViewport', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;
  const viewport = () => root.querySelector<HTMLElement>('cdk-virtual-scroll-viewport')!;
  const table = () => root.querySelector('table')!;
  const bodyRows = () => [...table().tBodies[0].rows];

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await frame(fixture);
  });

  afterEach(() => root.remove());

  it('renders only a window of the rows', () => {
    expect(bodyRows().length).toBeGreaterThan(0);
    expect(bodyRows().length).toBeLessThan(100);
  });

  it('tells assistive technologies the row count and the position of each rendered row', () => {
    // The header row counts.
    expect(table().getAttribute('aria-rowcount')).toBe('1001');
    expect(table().tHead!.rows[0].getAttribute('aria-rowindex')).toBe('1');
    expect(bodyRows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(
      bodyRows().map((_, i) => String(i + 2)),
    );
  });

  it('updates the row count when the data changes', async () => {
    fixture.componentInstance.units.set([{ id: 1, name: 'Unit 1' }]);
    await frame(fixture);
    expect(table().getAttribute('aria-rowcount')).toBe('2');
    expect(bodyRows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2']);
  });

  it('numbers only the rows of the virtual list', async () => {
    fixture.componentInstance.total.set(true);
    await frame(fixture);
    const total = root.querySelector('tr.total')!;
    expect(total.hasAttribute('aria-rowindex')).toBe(false);
    expect(bodyRows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(
      bodyRows().map((_, i) => String(i + 2)),
    );
  });

  it('is a region named by the table caption', () => {
    const caption = table().querySelector('caption')!;
    expect(viewport().getAttribute('role')).toBe('region');
    expect(viewport().getAttribute('aria-labelledby')).toBe(caption.id);
    expect(viewport().hasAttribute('aria-label')).toBe(false);
    expect(viewport().classList).toContain('ui-table-viewport');
  });

  it('prefers its own aria-label, and falls back to a generic name', async () => {
    fixture.componentInstance.label.set('Units of tower A');
    await frame(fixture);
    expect(viewport().getAttribute('aria-label')).toBe('Units of tower A');
    expect(viewport().hasAttribute('aria-labelledby')).toBe(false);

    fixture.componentInstance.label.set('');
    fixture.componentInstance.caption.set(false);
    await frame(fixture);
    expect(viewport().getAttribute('aria-label')).toBe(UI_LABELS_EN.scrollableTable);
    expect(viewport().hasAttribute('aria-labelledby')).toBe(false);
  });

  it('is a tab stop, so keyboard users can scroll it', () => {
    expect(viewport().getAttribute('tabindex')).toBe('0');
  });
});
