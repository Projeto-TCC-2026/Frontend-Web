import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/** Fallback used when there is no previous valid route (direct access, reload on /403). */
export const NAVIGATION_FALLBACK_URL = '/app/dashboard';

/**
 * Routes that must never be used as a "go back" target.
 *
 * Matched as path prefixes against `NavigationEnd.urlAfterRedirects`, so
 * query strings and child segments are covered too.
 */
const EXCLUDED_PREFIXES = ['/403', '/login'];

/**
 * Tracks the last successfully activated route so error screens can send the
 * user back to where they actually came from.
 *
 * Only `NavigationEnd` is recorded, which means routes rejected by a guard
 * never land here: `roleGuard` returns a `UrlTree` before activation, so the
 * blocked URL produces a `NavigationCancel` instead. Error/auth routes are
 * filtered out explicitly, covering reloads on /403 and 403s raised by the
 * HTTP error interceptor.
 *
 * Must be instantiated at app startup (see `AppComponent`), otherwise the
 * early navigations are missed and there is nothing to go back to.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {

  private readonly router = inject(Router);
  private lastValidUrl: string | null = null;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        if (!this.isExcluded(event.urlAfterRedirects)) {
          this.lastValidUrl = event.urlAfterRedirects;
        }
      });
  }

  /** Last activated route that is safe to return to, or `null` if there is none. */
  public getLastValidUrl(): string | null {
    return this.lastValidUrl;
  }

  /** Last valid route, or the fallback when no previous route was recorded. */
  public getBackUrl(): string {
    return this.lastValidUrl ?? NAVIGATION_FALLBACK_URL;
  }

  private isExcluded(url: string): boolean {
    return EXCLUDED_PREFIXES.some(
      prefix => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`)
    );
  }
}
