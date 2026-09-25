# ui-kit workspace

This Angular 22 workspace contains the `@vplans/ui-kit` design system.

| Project                | Path                   | Purpose                                                           |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- |
| `ui-kit`               | `projects/ui-kit`      | The library (`@vplans/ui-kit`, secondary entry per component)     |
| `playground`           | `projects/playground`  | Demo app consuming the library from source                        |
| Storybook              | `projects/ui-kit/.storybook` | Component docs, theme and RTL switcher, a11y checks         |

Requires Node 22.18+ and pnpm.

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm start            # playground at http://localhost:4200
pnpm test             # library unit tests (Vitest)
pnpm lint             # ESLint + Stylelint
pnpm build            # regenerate tokens and build dist/ui-kit
pnpm build-storybook  # static Storybook in dist/storybook/ui-kit
```

See [projects/ui-kit/README.md](projects/ui-kit/README.md) for usage, theming, tokens and contribution rules.
