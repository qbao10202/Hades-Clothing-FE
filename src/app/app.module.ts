import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

// NgRx Modules
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// Third-party Modules
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxPaginationModule } from 'ngx-pagination';

// App Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductListComponent } from './components/products/product-list.component';
import { ProductFormComponent } from './components/products/product-form.component';
import { ProductFormModalComponent } from './components/products/product-form-modal.component';
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
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ProductAdminComponent } from './components/products/product-admin.component';
import { CategoryAdminComponent } from './components/categories/category-admin.component';
import { UserAdminComponent } from './components/users/user-admin.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { CategoryFormComponent } from './components/categories/category-form.component';
import { ProductImageModalComponent } from './components/products/product-list.component';
import { ConfirmDialogComponent } from './components/categories/confirm-dialog.component';
import { AddToCartModalComponent } from './components/shared/add-to-cart-modal.component';
import { ProductCatalogComponent } from './components/products/product-catalog.component';
import { DeleteConfirmationComponent } from './components/shared/delete-confirmation.component';
import { RemoveCartItemDialogComponent } from './components/shared/remove-cart-item-dialog/remove-cart-item-dialog.component';

// App Services
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { CustomerService } from './services/customer.service';
import { CartService } from './services/cart.service';

// App Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// App Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';

// App Routing
import { CategoryFormModalComponent } from './components/categories/category-form-modal.component';
import { AppRoutingModule } from './app-routing.module';

// Environment
import { environment } from '../environments/environment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ProductListComponent,
    ProductFormComponent,
    ProductFormModalComponent,
    ProductDetailComponent,
    OrderListComponent,
    OrderFormComponent,
    OrderDetailComponent,
    OrderManagementComponent,
    CustomerListComponent,
    CustomerFormComponent,
    CartComponent,
    CheckoutComponent,
    ProfileComponent,
    NavbarComponent,
    SidebarComponent,
    ProductAdminComponent,
    CategoryAdminComponent,
    UserAdminComponent,
    AdminLayoutComponent,
    CategoryFormComponent,
    CategoryFormModalComponent,
    ProductImageModalComponent,
    ConfirmDialogComponent,
    AddToCartModalComponent,
    ProductCatalogComponent,
    DeleteConfirmationComponent,
    RemoveCartItemDialogComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,

    // Angular Material
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatSortModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatOptionModule,
    MatBadgeModule,

    // NgRx
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),

    // Third-party
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true
    }),
    NgxSpinnerModule,
    NgxPaginationModule
  ],
  providers: [
    AuthService,
    ProductService,
    OrderService,
    CustomerService,
    CartService,
    AuthGuard,
    RoleGuard,
    CurrencyPipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }