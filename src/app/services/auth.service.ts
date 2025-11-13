import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BasicUserDetails } from '../models/classe/interface/basic-user-details';
import { OAuthTypeEnum } from '../models/oAuthTypeEnum.enum';
import { environment } from '../../environments/environment';
import { PublicClientApplication, InteractionType, PopupRequest, AccountInfo } from '@azure/msal-browser';

declare const google: any;

export interface AuthError {
  message: string;
  type: 'google_error' | 'microsoft_error' | 'decode_error' | 'initialization_error';
}

export type AuthState = 'idle' | 'loading' | 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<BasicUserDetails | null>(null);
  readonly user = this.userSignal.asReadonly();
  
  private authTypeSignal = signal<OAuthTypeEnum | null>(null);
  readonly authType = this.authTypeSignal.asReadonly();

  private errorSignal = signal<AuthError | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private authStateSignal = signal<AuthState>('idle');
  readonly authState = this.authStateSignal.asReadonly();

  private isGoogleLoadedSignal = signal<boolean>(false);
  readonly isGoogleLoaded = this.isGoogleLoadedSignal.asReadonly();

  private isMicrosoftLoadedSignal = signal<boolean>(false);
  readonly isMicrosoftLoaded = this.isMicrosoftLoadedSignal.asReadonly();

  private router = inject(Router);
  private http = inject(HttpClient);
  private redirectUrl: string = '/dashboard'; // Default redirect after login
  private msalInstance: PublicClientApplication | null = null;

  constructor() {}

  initializeGoogleSignIn(clientId: string): void {
    try {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: this.handleGoogleSignIn.bind(this)
        });
        this.isGoogleLoadedSignal.set(true);
        this.errorSignal.set(null);
      } else {
        this.errorSignal.set({
          message: 'Google Sign-In library failed to load. Please check your internet connection and refresh the page.',
          type: 'initialization_error'
        });
      }
    } catch (error) {
      this.errorSignal.set({
        message: 'Failed to initialize Google Sign-In. Please try again later.',
        type: 'initialization_error'
      });
    }
  }

  renderGoogleButton(buttonElement: HTMLElement): void {
    try {
      if (typeof google !== 'undefined' && buttonElement) {
        google.accounts.id.renderButton(
          buttonElement,
          { 
            theme: 'outline',
            size: 'large',
            width: 250,
            text: 'signin_with'
          }
        );
      }
    } catch (error) {
      this.errorSignal.set({
        message: 'Failed to render Google Sign-In button.',
        type: 'google_error'
      });
    }
  }

  private handleGoogleError(error: any): void {
    console.error('Google Sign-In Error:', error);
    this.authStateSignal.set('error');
    this.errorSignal.set({
      message: error?.message || 'An error occurred during sign-in. Please try again.',
      type: 'google_error'
    });
  }

  private handleGoogleSignIn(response: any): void {
    try {
      this.authStateSignal.set('loading');
      this.errorSignal.set(null);

      if (!response?.credential) {
        throw new Error('Invalid response from Google Sign-In');
      }

      // Send token to backend for validation
      this.verifyTokenWithBackend(response.credential);
      
    } catch (error) {
      console.error('Sign-in processing error:', error);
      this.authStateSignal.set('error');
      this.errorSignal.set({
        message: error instanceof Error ? error.message : 'Failed to process sign-in response',
        type: 'decode_error'
      });
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
    }
  }

  private async verifyTokenWithBackend(idToken: string): Promise<void> {
    try {
      // Call .NET backend to verify token
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

        console.log('Login successful (verified by backend):', userDetails.email);

        // Navigate to dashboard after successful login
        setTimeout(() => {
          this.router.navigate([this.redirectUrl]);
        }, 1500); // Small delay to show success message
      } else {
        throw new Error('Backend token verification failed');
      }
    } catch (error) {
      console.error('Backend verification error:', error);
      this.authStateSignal.set('error');
      this.errorSignal.set({
        message: 'Failed to verify authentication with server',
        type: 'decode_error'
      });
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
    }
  }

  signOut(): void {
    try {
      if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
      }
      
      // Call backend logout
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        next: () => console.log('Backend logout successful'),
        error: (err) => console.error('Backend logout error:', err)
      });
      
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
      this.authStateSignal.set('idle');
      this.errorSignal.set(null);
      console.log('User signed out successfully');
      
      // Navigate back to login page
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  // Microsoft Authentication Methods
  async initializeMicrosoftSignIn(clientId: string, tenantId: string = 'common'): Promise<void> {
    try {
      if (!clientId || clientId === 'YOUR_MICROSOFT_CLIENT_ID') {
        this.errorSignal.set({
          message: 'Microsoft Client ID not configured. Please set it in environment.ts',
          type: 'initialization_error'
        });
        return;
      }

      const msalConfig = {
        auth: {
          clientId: clientId,
          authority: `https://login.microsoftonline.com/${tenantId}`,
          redirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: 'sessionStorage',
          storeAuthStateInCookie: false,
        }
      };

      this.msalInstance = new PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();
      this.isMicrosoftLoadedSignal.set(true);
      
      console.log('Microsoft MSAL initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Microsoft MSAL:', error);
      this.errorSignal.set({
        message: 'Failed to initialize Microsoft Sign-In. Please try again later.',
        type: 'initialization_error'
      });
    }
  }

  async signInWithMicrosoft(): Promise<void> {
    try {
      if (!this.msalInstance) {
        this.errorSignal.set({
          message: 'Microsoft Sign-In not initialized',
          type: 'initialization_error'
        });
        return;
      }

      this.authStateSignal.set('loading');
      this.errorSignal.set(null);

      const loginRequest: PopupRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account'
      };

      const result = await this.msalInstance.loginPopup(loginRequest);
      
      if (result.idToken) {
        await this.handleMicrosoftSignIn(result.idToken);
      } else {
        throw new Error('No ID token received from Microsoft');
      }

    } catch (error: any) {
      this.handleMicrosoftError(error);
    }
  }

  private async handleMicrosoftSignIn(idToken: string): Promise<void> {
    this.verifyMicrosoftTokenWithBackend(idToken);
  }

  private async verifyMicrosoftTokenWithBackend(idToken: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ valid: boolean; user: any }>(
          `${environment.apiUrl}/auth/verify-microsoft-token`,
          { idToken }
        )
      );

      if (response.valid && response.user) {
        const userDetails: BasicUserDetails = {
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          avatar: response.user.avatar || '',
          emailVerified: response.user.emailVerified
        };

        this.userSignal.set(userDetails);
        this.authTypeSignal.set(OAuthTypeEnum.MICROSOFT);
        this.authStateSignal.set('success');

        console.log('Microsoft login successful (verified by backend):', userDetails.email);

        setTimeout(() => {
          this.router.navigate([this.redirectUrl]);
        }, 1500);
      } else {
        throw new Error('Backend token verification failed');
      }
    } catch (error) {
      console.error('Microsoft backend verification error:', error);
      this.authStateSignal.set('error');
      this.errorSignal.set({
        message: 'Failed to verify Microsoft authentication with server',
        type: 'decode_error'
      });
      this.userSignal.set(null);
      this.authTypeSignal.set(null);
    }
  }

  private handleMicrosoftError(error: any): void {
    console.error('Microsoft Sign-In Error:', error);
    
    // Handle user cancellation
    if (error.errorCode === 'user_cancelled' || error.message?.includes('user closed')) {
      this.authStateSignal.set('idle');
      return;
    }

    this.authStateSignal.set('error');
    this.errorSignal.set({
      message: error?.errorMessage || error?.message || 'An error occurred during Microsoft sign-in. Please try again.',
      type: 'microsoft_error'
    });
  }
}
