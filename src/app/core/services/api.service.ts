import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Query string values accepted by the API helper methods. */
export type QueryValue = string | number | boolean;
export type QueryParams = Record<string, QueryValue | ReadonlyArray<QueryValue> | null | undefined>;

/**
 * Single, typed entry point for talking to the backend API.
 *
 * Feature services should inject this instead of HttpClient directly, so that
 * base URL, param building and response typing stay consistent across the app.
 * Cross-cutting concerns (auth header, error handling) live in interceptors,
 * not here.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  public get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.buildParams(params) });
  }

  public post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? null);
  }

  public put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? null);
  }

  public patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body ?? null);
  }

  public delete<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.delete<T>(this.url(path), { params: this.buildParams(params) });
  }

  /** Joins the configured base URL with a request path, tolerating a leading slash. */
  private url(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          httpParams = httpParams.append(key, String(item));
        }
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
