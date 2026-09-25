import { resolveDirection } from './direction';

describe('resolveDirection', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('reads the closest dir attribute, in any case', () => {
    root.innerHTML = '<div dir="RTL"><span id="probe"></span></div>';
    expect(resolveDirection(root.querySelector('#probe')!)).toBe('rtl');
  });

  it('defaults to ltr without a dir attribute', () => {
    root.innerHTML = '<span id="probe"></span>';
    expect(resolveDirection(root.querySelector('#probe')!)).toBe('ltr');
  });

  it('skips dir="auto" and invalid values and uses the direction around them', () => {
    root.innerHTML = `
      <div dir="rtl">
        <div dir="bogus"><input id="probe" dir="auto" /></div>
      </div>
    `;
    expect(resolveDirection(root.querySelector('#probe')!)).toBe('rtl');
  });
});
