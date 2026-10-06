// Refuses to start a second Storybook dev server. Every dev server writes the preview to the same
// `node_modules/.cache/storybook/<version>/<hash>/public` and serves it from there, so two of them
// overwrite each other's bundles on every rebuild (see DECISIONS, "Storybook hot module
// replacement is back"). The builder takes the next free port without asking under `--ci` and
// does not forward Storybook's `exactPort`, so the check lives here.
//
// Usage:
//   pnpm storybook   (runs this script, then the dev server)
const FIRST_PORT = 6006;
const LAST_PORT = 6030;

async function isStorybook(port) {
  try {
    const response = await fetch(`http://localhost:${port}/index.json`, {
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return typeof body === 'object' && body !== null && 'entries' in body;
  } catch {
    return false;
  }
}

const ports = Array.from({ length: LAST_PORT - FIRST_PORT + 1 }, (_, i) => FIRST_PORT + i);
const running = (await Promise.all(ports.map(async (port) => [port, await isStorybook(port)])))
  .filter(([, found]) => found)
  .map(([port]) => port);

if (running.length > 0) {
  console.error(
    `A Storybook dev server is already running on port ${running.join(', ')}. Use it, or stop it ` +
      'before starting another: two dev servers overwrite each other in the shared cache.',
  );
  process.exit(1);
}
