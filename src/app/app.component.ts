import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent implements AfterViewInit {
  constructor(private router: Router) {}

  ngAfterViewInit() {
    // Removed forced redirect logic to allow staying on current URL after refresh
  }
} 