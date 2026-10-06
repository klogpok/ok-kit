import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';

/** Providers the Angular TestBed is initialized with. The playground runs zoneless, as the app does. */
const providers: (Provider | EnvironmentProviders)[] = [provideZonelessChangeDetection()];

export default providers;
