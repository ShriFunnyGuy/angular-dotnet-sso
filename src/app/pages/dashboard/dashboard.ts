import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  constructor(protected authService: AuthService, private router: Router) {
    // Redirect to login if not authenticated
    if (!this.authService.user()) {
      this.router.navigate(['/login']);
    }
  }

  signOut(): void {
    this.authService.signOut();
  }
}
