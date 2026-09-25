import { ElementRef, Injectable, Provider, inject } from '@angular/core';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { resolveDirection } from './direction';

/**
 * `Directionality` whose `value` is read from the closest `dir` attribute of the host element
 * at call time. The CDK service reads `dir` once at startup, so CDK primitives that read
 * `Directionality.value` (menu arrow keys and positions, overlays) would stay LTR after a runtime
 * switch to RTL.
 *
 * Provide it at element level with `provideUiLiveDirectionality()`. `change` and `valueSignal`
 * are not updated; read `value`.
 */
@Injectable()
export class UiLiveDirectionality extends Directionality {
  private readonly host = inject<ElementRef<Element>>(ElementRef).nativeElement;

  override get value(): Direction {
    return resolveDirection(this.host);
  }
}

/** Provides `UiLiveDirectionality` as `Directionality` for a component or directive. */
export function provideUiLiveDirectionality(): Provider[] {
  return [UiLiveDirectionality, { provide: Directionality, useExisting: UiLiveDirectionality }];
}
