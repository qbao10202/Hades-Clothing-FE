import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, loginRequest)
      .pipe(map(response => {
        // Store token and user info
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        return response;
      }));
  }

  register(registerRequest: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, registerRequest)
      .pipe(map(response => {
        // Store token and user info if auto-login is enabled
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
        return response;
      }));
  }

  logout(): Observable<any> {
    // Call server logout endpoint
    return this.http.post(`${this.apiUrl}/auth/logout`, {})
      .pipe(map(() => {
        // Remove stored user from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        return true;
      }));
  }

  // Simple logout without server call (for cases where server is not available)
  logoutLocal(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.roles.some(r => r.name === role) : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    return user ? user.roles.some(r => roles.includes(r.name)) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isSeller(): boolean {
    return this.hasRole('SELLER');
  }

  isUser(): boolean {
    return this.hasRole('USER');
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  getCurrentUserName(): string {
    const user = this.currentUserValue;
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}