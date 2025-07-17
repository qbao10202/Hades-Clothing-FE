import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <h3 class="sidebar-title">Admin Panel</h3>
        <nav>
          <a mat-list-item routerLink="/admin/products" routerLinkActive="active">Quản lý Sản phẩm</a>
          <a mat-list-item routerLink="/admin/categories" routerLinkActive="active">Quản lý Danh mục</a>
          <a mat-list-item routerLink="/admin/users" routerLinkActive="active">Quản lý Người dùng</a>
        </nav>
      </mat-sidenav>
      <mat-sidenav-content>
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 240px; background: #18181b; color: #fff; padding: 24px 0; }
    .sidebar-title { margin: 0 0 24px 24px; font-size: 1.3rem; }
    nav a { display: block; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-bottom: 8px; transition: background 0.2s; }
    nav a.active, nav a:hover { background: #27272a; }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}
} 