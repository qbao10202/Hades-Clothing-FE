import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  sidebarOpen = true;
  dashboardStats: DashboardStats | null = null;
  
  // Navigation items
  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin', roles: ['ADMIN'] },
    { label: 'Quản lý sản phẩm', icon: 'inventory', route: '/admin/products', roles: ['ADMIN', 'SALES'] },
    { label: 'Quản lý danh mục', icon: 'category', route: '/admin/categories', roles: ['ADMIN'] },
    { label: 'Quản lý đơn hàng', icon: 'shopping_cart', route: '/admin/orders', roles: ['ADMIN', 'SALES'] },
    { label: 'Quản lý khách hàng', icon: 'people', route: '/admin/customers', roles: ['ADMIN', 'SALES'] },
    { label: 'Quản lý người dùng', icon: 'admin_panel_settings', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Báo cáo', icon: 'analytics', route: '/admin/reports', roles: ['ADMIN'] }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.dashboardService.getDashboardStats().subscribe(stats => {
      this.dashboardStats = stats;
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  hasAccess(item: any): boolean {
    if (!this.user || !this.user.roles) return false;
    return item.roles.some((role: string) => 
      this.user!.roles.some(userRole => userRole.name === role)
    );
  }

  getFilteredNavItems() {
    return this.navItems.filter(item => this.hasAccess(item));
  }
} 