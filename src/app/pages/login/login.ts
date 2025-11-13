import { Component, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButton') googleButton!: ElementRef;
  
  protected readonly title = signal('Single Sign-On');

  constructor(protected authService: AuthService) {}

  ngAfterViewInit(): void {
    // Initialize Google Sign-In
    this.authService.initializeGoogleSignIn(environment.googleClientId);
    
    // Wait a bit for Google script to load
    setTimeout(() => {
      if (this.googleButton) {
        this.authService.renderGoogleButton(this.googleButton.nativeElement);
      }
    }, 100);

    // Initialize Microsoft Sign-In
    this.authService.initializeMicrosoftSignIn(
      environment.microsoftClientId,
      environment.microsoftTenantId
    );
  }

  clearError(): void {
    this.authService.clearError();
  }

  signInWithMicrosoft(): void {
    this.authService.signInWithMicrosoft();
  }
}
