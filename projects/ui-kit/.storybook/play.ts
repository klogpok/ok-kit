// Helpers for play functions. The CDK key managers read the legacy `keyCode`, which `userEvent`
// leaves at 0, and the `waitFor` of `storybook/test` logs every failed attempt as a console error,
// which `pnpm test-storybook` reports.

const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
  PageDown: 34,
  PageUp: 33,
  ' ': 32,
};

/** Dispatches a keydown on the focused element, with the `keyCode` the CDK key managers read. */
export function press(key: string): void {
  const target = document.activeElement ?? document.body;
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      keyCode: KEY_CODES[key] ?? 0,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Resolves once `condition` holds, checked every frame; fails with `message` after `timeout` ms. */
export async function until(
  condition: () => boolean,
  message: string,
  timeout = 3000,
): Promise<void> {
  const end = performance.now() + timeout;
  while (!condition()) {
    if (performance.now() > end) throw new Error(message);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
