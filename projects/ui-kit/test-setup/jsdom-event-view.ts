/**
 * Lets the CDK test harnesses construct UI events under jsdom.
 *
 * The CDK passes `view: window` when it creates keyboard, mouse and pointer events. Under Vitest's
 * jsdom environment the global `window` is the Node global object, not jsdom's `Window`, so jsdom
 * rejects the init dictionary with "member view is not of type Window" and every harness
 * interaction throws. The real `Window` is reachable through the `jsdom` handle Vitest publishes,
 * so each event constructor is wrapped to substitute it.
 */

type EventConstructor = new (type: string, init?: Record<string, unknown>) => Event;

const realWindow = (globalThis as { jsdom?: { window?: Window } }).jsdom?.window;

if (realWindow) {
  const globals = globalThis as unknown as Record<string, EventConstructor | undefined>;
  for (const name of ['UIEvent', 'MouseEvent', 'PointerEvent', 'KeyboardEvent', 'FocusEvent']) {
    const original = globals[name];
    if (!original) continue;
    globals[name] = new Proxy(original, {
      construct: (target, [type, init]: [string, Record<string, unknown> | undefined]) =>
        Reflect.construct(target, [
          type,
          init && 'view' in init && init['view'] !== undefined && init['view'] !== null
            ? { ...init, view: realWindow }
            : init,
        ]),
    });
  }
}
