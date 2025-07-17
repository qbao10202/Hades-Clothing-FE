import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductListComponent } from './components/products/product-list.component';
import { ProductCatalogComponent } from './components/products/product-catalog.component';
import { ProductFormComponent } from './components/products/product-form.component';
import { ProductDetailComponent } from './components/products/product-detail.component';
import { OrderListComponent } from './components/orders/order-list.component';
import { OrderFormComponent } from './components/orders/order-form.component';
import { OrderDetailComponent } from './components/orders/order-detail.component';
import { OrderManagementComponent } from './components/orders/order-management.component';
import { CustomerListComponent } from './components/customers/customer-list.component';
import { CustomerFormComponent } from './components/customers/customer-form.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProductAdminComponent } from './components/products/product-admin.component';
import { CategoryAdminComponent } from './components/categories/category-admin.component';
import { UserAdminComponent } from './components/users/user-admin.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent }, // Public access
  { path: 'catalog', component: ProductCatalogComponent }, // Public access
  { path: 'products/:id', component: ProductDetailComponent }, // Public access
  
  // Protected routes
  
  // Product routes (public access for browsing)
  { path: 'products', component: ProductListComponent }, // Public access for product browsing
  
  // Cart and checkout routes
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  
  // User routes
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] },
  { path: 'orders/:id', component: OrderDetailComponent, canActivate: [AuthGuard] },
  
  // Admin routes with layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SELLER'] },
    children: [
      { path: 'products', component: ProductAdminComponent },
      { path: 'categories', component: CategoryAdminComponent },
      { path: 'users', component: UserAdminComponent },
      { path: 'orders', component: OrderManagementComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Legacy admin routes (redirect to new structure)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Catch all route
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }