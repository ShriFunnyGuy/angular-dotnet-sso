import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BasicUserDetails } from '../models/classe/interface/basic-user-details';
import { OAuthTypeEnum } from '../models/oAuthTypeEnum.enum';
import { environment } from '../../environments/environment';

export interface AuthError {
  message: string;
  type: 'google_error' | 'decode_error' | 'initialization_error' | 'backend_error';
}

export type AuthState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Backend-integrated Authentication Service
 * Uses secure Authorization Code Flow with backend API
 */
@Injectable({
  providedIn: 'root'
})
export class AuthBackendService {
  private userSignal = signal<BasicUserDetails | null>(null);
  readonly user = this.userSignal.asReadonly();
  
  private authTypeSignal = signal<OAuthTypeEnum | null>(null);
  readonly authType = this.authTypeSignal.asReadonly();

  private errorSignal = signal<AuthError | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private authStateSignal = signal<AuthState>('idle');
  readonly authState = this.authStateSignal.asReadonly();

  private http = inject(HttpClient);
  private router = inject(Router);
  private redirectUrl: string = '/dashboard';

  constructor() {}

  /**
   * Initiates Google OAuth flow through backend
   * User will be redirected to Google's consent screen
   */
  async initiateGoogleLogin(): Promise<void> {
    try {
      this.authStateSignal.set('loading');
      this.errorSignal.set(null);

      // Call backend to get authorization URL
      const response = await firstValueFrom(
        this.http.get<{ authUrl: string }>(`${environment.apiUrl}/auth/google`)
      );

      // Redirect user to Google's authorization page
      window.location.href = response.authUrl;

    } catch (error) {
      console.error('Failed to initiate login:', error);
      this.authStateSignal.set('error');
      this.errorSignal.set({
        message: 'Failed to connect to authentication server',
        type: 'backend_error'
      });
    }
  }

  /**
   * Alternative: Verify token from frontend Google Identity Services
   * This allows you to keep using the current Google button
   * but validate tokens through your secure backend
   */
  async verifyGoogleToken(idToken: string): Promise<void> {
    try {
      this.authStateSignal.set('loading');
      this.errorSignal.set(null);

      const response = await firstValueFrom(
        this.http.post<{ valid: boolean; user: any }>(
          `${environment.apiUrl}/auth/verify-google-token`,
          { idToken }
        )
      );

      if (response.valid && response.user) {
        const userDetails: BasicUserDetails = {
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          avatar: response.user.avatar,
          emailVerified: response.user.emailVerified
        };

        this.userSignal.set(userDetails);
        this.authTypeSignal.set(OAuthTypeEnum.GOOGLE);
        this.authStateSignal.set('success');

        console.log('Token verified by backend:', userDetails.email);

        // Navigate to dashboard after successful login
        setTimeout(() => {
          this.router.navigate([this.redirectUrl]);
        }, 1500);
      } else {
        throw new Error('Token verification failed');
      }

    } catch (error) {
      console.error('Token verification error:', error);
      this.authStateSignal.set('error');
      this.errorSignal.set({
        message: 'Failed to verify authentication with server',
        type: 'backend_error'
      });
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
    }
  }

  /**
   * Sign out user through backend
   */
  async signOut(): Promise<void> {
    try {
      // Call backend logout endpoint
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {})
      );

      this.userSignal.set(null);
      this.authTypeSignal.set(null);
      this.authStateSignal.set('idle');
      this.errorSignal.set(null);
      
      console.log('User signed out successfully');
      this.router.navigate(['/login']);

    } catch (error) {
      console.error('Sign-out error:', error);
      // Even if backend fails, clear local state
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
      this.authStateSignal.set('idle');
      this.router.navigate(['/login']);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }
}
