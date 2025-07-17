import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Category, User, Cart } from '../../models';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface CategoryCard extends Category {
  productCount: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  cartItemCount = 0;
  categories: CategoryCard[] = [];
  loading = true;
  newsletterEmail = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();
    this.loadCategoriesAndCounts();
    this.loadCartItemCount();
    
    // Subscribe to user changes
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAdmin = this.authService.isAdmin();
        if (user) {
          this.loadCartItemCount();
        } else {
          this.cartItemCount = 0;
        }
      });

    // Subscribe to cart changes
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToCatalog(): void {
    this.router.navigate(['/products']);
  }

  viewCategory(category: CategoryCard): void {
    this.router.navigate(['/products'], { queryParams: { category: category.id } });
  }

  loadCategoriesAndCounts(): void {
    this.loading = true;
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(cat => ({ ...cat, productCount: 0 }));
        
        // For each category, fetch product count
        let pendingCounts = this.categories.length;
        
        this.categories.forEach(cat => {
          this.productService.getProductsByCategory(cat.id).subscribe({
            next: (products) => {
              cat.productCount = products.length;
              pendingCounts--;
              if (pendingCounts === 0) {
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error loading products for category:', cat.name, error);
              pendingCounts--;
              if (pendingCounts === 0) {
                this.loading = false;
              }
            }
          });
        });
        
        if (this.categories.length === 0) {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      }
    });
  }

  loadCartItemCount(): void {
    if (this.currentUser) {
      this.cartService.cart$.subscribe({
        next: (cart: Cart) => {
          this.cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        },
        error: (error: any) => {
          console.error('Error loading cart:', error);
          this.cartItemCount = 0;
        }
      });
    }
  }

  getCategoryImageUrl(category: Category): string {
    if (category.imageUrl) {
      if (category.imageUrl.startsWith('/uploads')) {
        return `${this.getBackendBaseUrl()}${category.imageUrl}`;
      }
      if (category.imageUrl.startsWith('http')) {
        return category.imageUrl;
      }
      return `${this.getBackendBaseUrl()}/uploads/categories/${category.id}/${category.imageUrl}`;
    }
    return 'assets/default-product.svg';
  }

  onImageError(event: any): void {
    if (event.target) {
      event.target.src = 'assets/default-product.svg';
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.snackBar.open('Logged out successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.logoutLocal();
        this.snackBar.open('Logged out successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
      }
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/products']);
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}