import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RemoveCartItemDialogComponent } from '../shared/remove-cart-item-dialog/remove-cart-item-dialog.component';

import { Cart, CartItem, User } from '../../models';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  template: `
    <div class="cart-page">
      <button class="floating-home-btn" mat-fab color="primary" routerLink="/home">
        <mat-icon>home</mat-icon>
      </button>
      <div class="container">
        <div class="cart-header">
          <h1>YOUR SHOPPING CART: <span class="cart-count">{{ cart.totalItems }}</span></h1>
        </div>
        <ng-container *ngIf="cart.items && cart.items.length > 0; else emptyCart">
          <div class="cart-content">
            <div class="cart-items">
              <div *ngFor="let item of cart.items" class="cart-item">
                <div class="item-image">
                  <img [src]="getProductImage(item)" [alt]="item.product?.name">
                </div>
                
                <div class="item-details">
                  <h3 class="item-name">{{ item.product?.name }}</h3>
                  <div *ngIf="item.size" class="item-size">Size: {{ item.size }}</div>
                  <p class="item-category">{{ item.product?.category?.name }}</p>
                  <div class="item-price">{{ formatCurrency(item.price) }}</div>
                </div>
                
                <div class="item-quantity">
                  <button class="quantity-btn" (click)="decreaseQuantity(item)" [disabled]="item.quantity <= 1">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button class="quantity-btn" (click)="increaseQuantity(item)">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
                
                <div class="item-actions">
                  <button class="action-btn" (click)="removeItem(item)">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button class="action-btn wishlist-btn" (click)="addToWishlist(item)">
                    <mat-icon>favorite_border</mat-icon>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="cart-summary">
              <div class="summary-card">
                <div class="summary-line">
                  <span>Subtotal:</span>
                  <span class="amount">{{ formatCurrency(cart.subtotal) }}</span>
                </div>
                <div class="summary-line">
                  <span>Delivery:</span>
                  <span class="amount">{{ cart.shippingAmount === 0 ? 'Free' : formatCurrency(cart.shippingAmount) }}</span>
                </div>
                <div class="discount-section">
                  <div class="discount-toggle" (click)="toggleDiscountCode()">
                    <span>Do you have a discount code?</span>
                    <mat-icon>{{ showDiscountCode ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </div>
              

                  <div class="discount-input" *ngIf="showDiscountCode" style="display: flex; gap: 10px; align-items: center;">
                    <input 
                      type="text"
                      [(ngModel)]="discountCode"
                      placeholder="Enter discount code"
                      style="padding: 10px; border: 2px solid #2c3e50; border-radius: 4px; background: white; color: black; width: 100%; outline: none;" 
                    />
                    <button 
                      (click)="applyDiscount()"
                      style="padding: 10px 20px; background: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer;"
                    >
                      Apply
                    </button>
                  </div>
     
                </div>
                <div class="summary-line total">
                  <span>TOTAL PRICE:</span>
                  <span class="total-amount">{{ formatCurrency(cart.totalAmount) }}</span>
                </div>
                
                <button class="checkout-btn" (click)="proceedToCheckout()">
                  Checkout
                </button>
                
                
                <div class="return-policy">
                  <p>You always have 30 days to decide whether you want to keep or return your order. The return policy varies depending on the country in which the purchase was made. Further information on returns can be found in our terms and conditions.</p>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-template #emptyCart>
          <div class="empty-cart">
            <mat-icon class="empty-icon">shopping_cart</mat-icon>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to see them here.</p>
            <button mat-raised-button color="primary" routerLink="/products">
              Browse Products
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .cart-page {
      min-height: 100vh;
      background-color: #f8f9fa;
      padding: 40px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .cart-header {
      margin-bottom: 40px;
      text-align: center;
    }

    .cart-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cart-count {
      color: #e74c3c;
      font-weight: 800;
    }

    .cart-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 40px;
      align-items: start;
    }

    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cart-item {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      display: grid;
      grid-template-columns: 120px 1fr auto auto;
      gap: 30px;
      align-items: center;
      position: relative;
    }

    .item-image {
      position: relative;
      overflow: hidden;
      border-radius: 15px;
    }

    .item-image img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 15px;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
      text-transform: uppercase;
    }

    .item-size {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-top: 4px;
    }

    .item-category {
      font-size: 1rem;
      color: #7f8c8d;
      margin: 0;
    }

    .item-price {
      font-size: 1.3rem;
      font-weight: 700;
      color: #27ae60;
      margin: 0;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: 15px;
      background: #f8f9fa;
      border-radius: 25px;
      padding: 10px 20px;
    }

    .quantity-btn {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .quantity-btn:hover:not(:disabled) {
      background: #007bff;
      border-color: #007bff;
      color: white;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity {
      font-size: 1.2rem;
      font-weight: 600;
      min-width: 40px;
      text-align: center;
    }

    .item-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .action-btn {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 15px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: #e74c3c;
      border-color: #e74c3c;
      color: white;
    }

    .wishlist-btn:hover {
      background: #e91e63;
      border-color: #e91e63;
    }

    .cart-summary {
      position: sticky;
      top: 20px;
    }

    .summary-card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding: 10px 0;
      font-size: 1.1rem;
    }

    .amount {
      font-weight: 600;
      color: #2c3e50;
    }

    .summary-line.total {
      border-top: 2px solid #e9ecef;
      padding-top: 20px;
      margin-top: 20px;
      font-size: 1.3rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .total-amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: #e74c3c;
    }

    .discount-section {
      margin: 20px 0;
      border: 1px solid #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .discount-toggle {
      padding: 15px;
      background: #f8f9fa;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .discount-toggle:hover {
      background: #e9ecef;
    }

    .discount-input {
      mat-form-field {
        width: 100%;

        .mat-form-field-outline {
          color: black;
          border-color: black !important;
        }

        .mat-form-field-outline-thick {
          color: black;
          border-color: black !important;
        }

        .mat-form-field-flex {
          background: white !important;
          color: black !important;
        }

        input.mat-input-element {
          background: white !important;
          color: black !important;

          &::placeholder {
            color: black !important;
            opacity: 1 !important;
          }
        }
      }
    }
    
    
    

    .checkout-btn {
      width: 100%;
      padding: 20px;
      font-size: 1.2rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #2c3e50;
      color: white;
      border: none;
      border-radius: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 20px 0;
      letter-spacing: 1px;
    }

    .checkout-btn:hover {
      background: #34495e;
      transform: translateY(-2px);
    }

    .payment-methods {
      text-align: center;
      margin: 20px 0;
    }

    .payment-methods span {
      display: block;
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-bottom: 10px;
      font-weight: 500;
    }

    .payment-icons {
      display: flex;
      justify-content: center;
      gap: 15px;
      align-items: center;
    }

    .payment-icons img {
      height: 30px;
      width: auto;
    }

    .return-policy {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #6c757d;
      line-height: 1.5;
    }

    .return-policy p {
      margin: 0;
    }

    .empty-cart {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .empty-icon {
      font-size: 5rem;
      color: #bdc3c7;
      margin-bottom: 30px;
    }

    .empty-cart h2 {
      font-size: 2rem;
      margin-bottom: 15px;
      color: #2c3e50;
      font-weight: 700;
    }

    .empty-cart p {
      color: #7f8c8d;
      margin-bottom: 40px;
      font-size: 1.1rem;
    }

    .floating-home-btn {
      position: fixed;
      top: 32px;
      left: 32px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-radius: 50%;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.2s, background 0.2s;
    }
    .floating-home-btn:hover {
      background: #1976d2;
      box-shadow: 0 8px 32px rgba(25, 118, 210, 0.18);
    }
    .floating-home-btn mat-icon {
      font-size: 28px;
      margin-left: -4px;
      margin-top: -4px;
    }

    @media (max-width: 1024px) {
      .cart-content {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .cart-item {
        grid-template-columns: 100px 1fr;
        gap: 20px;
        padding: 20px;
      }
      
      .item-quantity,
      .item-actions {
        grid-column: 1 / -1;
        justify-self: start;
        margin-top: 15px;
      }
    }

    @media (max-width: 768px) {
      .cart-header h1 {
        font-size: 2rem;
      }
      
      .cart-item {
        padding: 15px;
      }
      
      .item-name {
        font-size: 1.2rem;
      }
      
      .summary-card {
        padding: 20px;
      }
    }
  `]
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    taxAmount: 0,
    shippingAmount: 0,
    discountAmount: 0,
    totalAmount: 0
  };
  
  currentUser: User | null = null;
  showDiscountCode = false;
  discountCode = '';
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Subscribe to cart changes
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.updateCartItem(item.id, item.quantity + 1).subscribe({
      next: () => {
        this.snackBar.open('Quantity updated', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to update quantity', 'Close', { duration: 3000 });
      }
    });
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateCartItem(item.id, item.quantity - 1).subscribe({
        next: () => {
          this.snackBar.open('Quantity updated', 'Close', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to update quantity', 'Close', { duration: 3000 });
        }
      });
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    const dialogRef = this.dialog.open(RemoveCartItemDialogComponent, {
      width: '350px',
      autoFocus: false,
      panelClass: 'remove-cart-item-dialog-panel'
    });
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.cartService.removeFromCart(item.id).subscribe({
        next: () => {
          this.snackBar.open('Item removed from cart', 'Close', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to remove item', 'Close', { duration: 3000 });
        }
      });
    }
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => {
          this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to clear cart', 'Close', { duration: 3000 });
        }
      });
    }
  }

  proceedToCheckout(): void {
    if (!this.currentUser) {
      this.snackBar.open('Please login to proceed to checkout', 'Close', { duration: 3000 });
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  getProductImage(item: CartItem): string {
    if (item.product?.images && item.product.images.length > 0) {
      const imageUrl = item.product.images[0].imageUrl;
      if (imageUrl) {
        if (imageUrl.startsWith('/uploads')) {
          return `${this.getBackendBaseUrl()}${imageUrl}`;
        }
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        return `${this.getBackendBaseUrl()}/uploads/products/${item.product.id}/${imageUrl}`;
      }
    }
    return 'assets/default-product.svg';
  }

  formatCurrency(amount: number): string {
    return this.cartService.formatCurrency(amount);
  }

  toggleDiscountCode(): void {
    this.showDiscountCode = !this.showDiscountCode;
  }

  applyDiscount(): void {
    if (this.discountCode.trim()) {
      // Here you would call a service to apply the discount
      this.snackBar.open('Discount code applied successfully', 'Close', { duration: 3000 });
    }
  }

  getFreeShippingAmount(): number {
    return this.cartService.getAmountForFreeShipping();
  }

  addToWishlist(item: CartItem): void {
    // Logic to add the item to the user's wishlist
    this.snackBar.open('Added to wishlist', 'Close', { duration: 2000 });
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}