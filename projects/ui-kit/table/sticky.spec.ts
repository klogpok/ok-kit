import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSticky, UiTableContainer } from './sticky';
import { UiTable } from './table';

/** Collects ResizeObserver callbacks so a test can report a resize. */
class FakeResizeObserver {
  static readonly callbacks = new Set<() => void>();
  constructor(private readonly callback: () => void) {
    FakeResizeObserver.callbacks.add(callback);
  }
  observe(): void {
    // Nothing to do: tests call resize().
  }
  unobserve(): void {
    // Nothing to do.
  }
  disconnect(): void {
    FakeResizeObserver.callbacks.delete(this.callback);
  }
}

const resize = () => {
  for (const callback of FakeResizeObserver.callbacks) callback();
};

@Component({
  imports: [UiTable, UiSticky, UiTableContainer],
  template: `
    <ui-table-container [label]="label()">
      <table ui-table>
        @if (caption()) {
          <caption>
            Plans
          </caption>
        }
        <thead>
          <tr>
            <th uiSticky data-width="40">Select</th>
            <th uiSticky="" data-width="120">Name</th>
            <th data-width="300">Owner</th>
            <th uiSticky="end" data-width="60">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td uiSticky>x</td>
            <td uiSticky>Plan 1</td>
            <td>Dana</td>
            <td uiSticky="end">…</td>
          </tr>
        </tbody>
      </table>
    </ui-table-container>
    <table>
      <tr>
        <td uiSticky id="plain">Outside ui-table</td>
      </tr>
    </table>
  `,
})
class Host {
  readonly label = signal('');
  readonly caption = signal(true);
}

describe('UiSticky and UiTableContainer', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const container = () => root().querySelector<HTMLElement>('ui-table-container')!;
  const scroller = () => root().querySelector<HTMLElement>('.ui-table-container__scroller')!;
  const cell = (row: 'thead' | 'tbody', i: number) =>
    root().querySelector('table')!.querySelector(`${row} tr`)!.children[i] as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const scroll = async (metrics: { scrollWidth: number; clientWidth: number; left: number }) => {
    const element = scroller();
    Object.defineProperty(element, 'scrollWidth', {
      configurable: true,
      value: metrics.scrollWidth,
    });
    Object.defineProperty(element, 'clientWidth', {
      configurable: true,
      value: metrics.clientWidth,
    });
    Object.defineProperty(element, 'scrollLeft', { configurable: true, value: metrics.left });
    element.dispatchEvent(new Event('scroll'));
    await settle();
  };

  beforeEach(async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.spyOn(HTMLTableCellElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLTableCellElement,
    ) {
      const row = this.closest('table')?.tHead?.rows[0];
      const width = Number(row?.cells[this.cellIndex]?.dataset['width'] ?? 0);
      return { width } as DOMRect;
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
    resize();
    await settle();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sticks columns next to each other on both sides', () => {
    expect(cell('thead', 0).classList).toContain('ui-sticky--start');
    expect(cell('thead', 0).style.insetInlineStart).toBe('0px');
    expect(cell('thead', 1).style.insetInlineStart).toBe('40px');
    expect(cell('tbody', 1).style.insetInlineStart).toBe('40px');
    expect(cell('thead', 2).classList).not.toContain('ui-sticky');
    expect(cell('thead', 3).classList).toContain('ui-sticky--end');
    expect(cell('tbody', 3).style.insetInlineEnd).toBe('0px');
    expect(container().style.getPropertyValue('--_sticky-start')).toBe('160px');
    expect(container().style.getPropertyValue('--_sticky-end')).toBe('60px');
  });

  it('does not stick outside a ui-table', () => {
    const plain = root().querySelector<HTMLElement>('#plain')!;
    expect(plain.classList).toContain('ui-sticky--start');
    expect(plain.style.insetInlineStart).toBe('0px');
  });

  it('is a plain box while the table fits', async () => {
    await scroll({ scrollWidth: 400, clientWidth: 400, left: 0 });
    expect(scroller().hasAttribute('tabindex')).toBe(false);
    expect(scroller().hasAttribute('role')).toBe(false);
    expect(container().classList).not.toContain('ui-table-container--scroll-end');
  });

  it('becomes a focusable region named by the caption while the table overflows', async () => {
    await scroll({ scrollWidth: 800, clientWidth: 400, left: 0 });
    expect(scroller().getAttribute('tabindex')).toBe('0');
    expect(scroller().getAttribute('role')).toBe('region');
    const caption = root().querySelector('caption')!;
    expect(caption.id).toBeTruthy();
    expect(scroller().getAttribute('aria-labelledby')).toBe(caption.id);
    expect(scroller().hasAttribute('aria-label')).toBe(false);
  });

  it('shows the shadow of each side with hidden content', async () => {
    await scroll({ scrollWidth: 800, clientWidth: 400, left: 0 });
    expect(container().classList).toContain('ui-table-container--scroll-end');
    expect(container().classList).not.toContain('ui-table-container--scroll-start');

    await scroll({ scrollWidth: 800, clientWidth: 400, left: 200 });
    expect(container().classList).toContain('ui-table-container--scroll-start');
    expect(container().classList).toContain('ui-table-container--scroll-end');

    // RTL scrolls to negative positions.
    await scroll({ scrollWidth: 800, clientWidth: 400, left: -400 });
    expect(container().classList).toContain('ui-table-container--scroll-start');
    expect(container().classList).not.toContain('ui-table-container--scroll-end');
  });

  it('takes a label, else falls back to the scrollableTable label', async () => {
    host.label.set('Plans of tower B');
    await settle();
    await scroll({ scrollWidth: 800, clientWidth: 400, left: 0 });
    expect(scroller().getAttribute('aria-label')).toBe('Plans of tower B');
    expect(scroller().hasAttribute('aria-labelledby')).toBe(false);

    host.label.set('');
    host.caption.set(false);
    await settle();
    await scroll({ scrollWidth: 800, clientWidth: 400, left: 0 });
    expect(scroller().getAttribute('aria-label')).toBe('טבלה');
  });
});
