import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User, Role } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-admin',
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {
  displayedColumns: string[] = ['id', 'username', 'email', 'fullName', 'roles', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>();
  users: User[] = [];
  roles: Role[] = [];
  searchText = '';
  filterRole: string = '';
  filterStatus: string = '';
  loading = false;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadUsers() {
    this.loading = true;
    // Mock data for now - replace with actual service call
    this.users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@hades.vn',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ id: 1, name: 'ADMIN', description: 'Administrator' }]
      },
      {
        id: 2,
        username: 'sales1',
        email: 'sales1@hades.vn',
        firstName: 'Sales',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ id: 2, name: 'SALES', description: 'Sales Staff' }]
      },
      {
        id: 3,
        username: 'customer1',
        email: 'customer1@example.com',
        firstName: 'Customer',
        lastName: 'User',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [{ id: 3, name: 'CUSTOMER', description: 'Customer' }]
      }
    ];
    
    this.applyFilters();
    this.loading = false;
  }

  loadRoles() {
    this.roles = [
      { id: 1, name: 'ADMIN', description: 'Administrator' },
      { id: 2, name: 'SALES', description: 'Sales Staff' },
      { id: 3, name: 'CUSTOMER', description: 'Customer' }
    ];
  }

  applyFilters() {
    let filtered = this.users;

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search)
      );
    }

    if (this.filterRole) {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.name === this.filterRole)
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(user => {
        if (this.filterStatus === 'active') return user.isActive;
        if (this.filterStatus === 'inactive') return !user.isActive;
        return true;
      });
    }

    this.dataSource.data = filtered;
  }

  clearFilters() {
    this.searchText = '';
    this.filterRole = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  addUser() {
    // TODO: Implement add user dialog
    this.snackBar.open('Add user functionality will be implemented', 'Close', { duration: 3000 });
  }

  editUser(user: User) {
    // TODO: Implement edit user dialog
    this.snackBar.open(`Edit user ${user.username} functionality will be implemented`, 'Close', { duration: 3000 });
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
      // TODO: Implement delete user
      this.snackBar.open(`Delete user ${user.username} functionality will be implemented`, 'Close', { duration: 3000 });
    }
  }

  toggleUserStatus(user: User) {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} user ${user.username}?`)) {
      // TODO: Implement toggle status
      user.isActive = newStatus;
      this.snackBar.open(`User ${user.username} ${action}d successfully`, 'Close', { duration: 3000 });
    }
  }

  getRoleNames(roles: Role[]): string {
    return roles.map(role => role.name).join(', ');
  }

  getStatusBadgeClass(user: User): string {
    return user.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(user: User): string {
    return user.isActive ? 'Active' : 'Inactive';
  }

  backToHome() {
    this.router.navigate(['/home']);
  }
} 