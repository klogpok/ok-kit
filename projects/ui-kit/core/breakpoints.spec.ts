import { UI_BREAKPOINTS } from './public-api';

describe('UI_BREAKPOINTS', () => {
  it('gives a min-width media query per named breakpoint', () => {
    expect(UI_BREAKPOINTS).toEqual({
      sm: '(min-width: 40rem)',
      md: '(min-width: 52rem)',
      lg: '(min-width: 64rem)',
      xl: '(min-width: 80rem)',
    });
  });
});
