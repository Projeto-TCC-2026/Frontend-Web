import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserProfile, UserRole } from '../models/entities/user.model';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../models/dtos/auth.dto';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user'
} as const;

const ALLOWED_WEB_ROLES: UserRole[] = ['ADMIN', 'DOCTOR'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  /**
   * Login via POST /auth/login.
   * Rejects PATIENT role (web is for ADMIN and DOCTOR only).
   * After successful login, fetches full profile via GET /auth/me.
   */
  public login(credentials: LoginRequest): Observable<UserProfile> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (!ALLOWED_WEB_ROLES.includes(response.role)) {
          throw new Error('Acesso restrito ao aplicativo mobile');
        }
        this.storeTokens(response.accessToken, response.refreshToken);
      }),
      switchMap(() => this.fetchProfile()),
      catchError(error => {
        this.clearStorage();
        if (error instanceof Error) {
          return throwError(() => error);
        }
        return throwError(() => new Error('Credenciais inválidas'));
      })
    );
  }

  /**
   * Fetches the authenticated user's profile from GET /auth/me.
   * Used on login and on app initialization (page reload).
   */
  public fetchProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/auth/me').pipe(
      tap(user => {
        this.storeUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  /**
   * Refreshes the access token using the stored refresh token.
   * Called by the interceptor on 401 responses.
   */
  public refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        this.storeTokens(response.accessToken, response.refreshToken);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logs out the user: revokes refresh token on backend, clears local storage, redirects to login.
   */
  public logout(): void {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      this.api.post<void>('/auth/logout', { refreshToken }).subscribe({
        error: () => {} // Fire and forget - clear storage regardless
      });
    }

    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Initializes auth state on app startup.
   * If tokens exist in storage, fetches the profile to validate them.
   */
  public initialize(): Observable<UserProfile | null> {
    if (!this.getAccessToken()) {
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.fetchProfile().pipe(
      catchError(() => {
        this.clearStorage();
        this.currentUserSubject.next(null);
        return new Observable<UserProfile | null>(subscriber => {
          subscriber.next(null);
          subscriber.complete();
        });
      })
    );
  }

  // --- Accessors ---

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  public getRole(): UserRole | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  public hasRole(role: UserRole): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  // --- Private helpers ---

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  private storeUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  private getStoredUser(): UserProfile | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}
