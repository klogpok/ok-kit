import {
  EnvironmentProviders,
  Injectable,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';

/**
 * An SVG icon. The markup is inserted as-is, so it must come from a trusted source
 * (the kit's built-in icons or files in your repository) — never from user input.
 */
export interface UiIconDefinition {
  readonly name: string;
  readonly svg: string;
}

@Injectable({ providedIn: 'root' })
export class UiIconRegistry {
  private readonly icons = new Map<string, string>();

  register(icons: readonly UiIconDefinition[]): void {
    for (const icon of icons) this.icons.set(icon.name, icon.svg);
  }

  get(name: string): string | undefined {
    return this.icons.get(name);
  }

  has(name: string): boolean {
    return this.icons.has(name);
  }
}

/**
 * Registers icons so they can be referenced by name: `<ui-icon icon="check" />`.
 * Use in `bootstrapApplication` providers or in lazy route providers.
 */
export function provideUiIcons(icons: readonly UiIconDefinition[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => inject(UiIconRegistry).register(icons)),
  ]);
}
