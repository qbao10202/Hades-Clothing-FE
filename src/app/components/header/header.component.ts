import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { User, CartItem } from '../../models';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  // User state
  isLoggedIn = false;
  user: User | null = null;
  showUserMenu = false;

  // Cart state
  showCart = false;
  cartItems: CartItem[] = [];
  cartItemCount = 0;
  cartTotal = 0;

  // Search state
  searchQuery = '';
  private searchSubject = new Subject<string>();

  // Mobile menu state
  showMobileMenu = false;

  // Language state
  currentLang = 'en';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) {
    // Setup search debouncing
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  ngOnInit(): void {
    // Subscribe to auth state
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: User | null) => {
        this.user = user;
        this.isLoggedIn = !!user;
      });

    // Subscribe to cart state
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cart) => {
        this.cartItems = cart.items;
        this.cartItemCount = cart.totalItems;
        this.cartTotal = cart.totalAmount;
      });

    // Get current language from localStorage or default
    this.currentLang = localStorage.getItem('language') || 'en';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Search functionality
  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): void {
    if (query.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: query } });
    }
  }

  // Language functionality
  setLanguage(lang: string): void {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    // TODO: Implement translation service
    // this.translateService.use(lang);
  }

  // Cart functionality
  toggleCart(): void {
    // Navigate to cart page instead of showing dropdown
    this.router.navigate(['/cart']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  closeCart(): void {
    this.showCart = false;
    document.body.style.overflow = '';
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity > 0) {
      this.cartService.updateCartItem(item.id, newQuantity).subscribe();
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item.id);
  }

  viewCart(): void {
    this.closeCart();
    this.router.navigate(['/cart']);
  }

  checkout(): void {
    this.closeCart();
    this.router.navigate(['/checkout']);
  }

  // User menu functionality
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.router.navigate(['/home']);
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  // Mobile menu functionality
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  // Close dropdowns when clicking outside
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close user menu if clicking outside
    if (!target.closest('.user-btn') && !target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
  }

  isAdmin(): boolean {
    return !!(this.user && this.user.roles && this.user.roles.some(r => r.name === 'ADMIN'));
  }
} 