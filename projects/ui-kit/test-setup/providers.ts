import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';

/**
 * Providers the Angular TestBed is initialized with.
 *
 * The library renders without Zone.js, so the tests have to say so: unlike Angular 22, Angular 20
 * still defaults to zone-based change detection.
 */
const providers: (Provider | EnvironmentProviders)[] = [provideZonelessChangeDetection()];

export default providers;
