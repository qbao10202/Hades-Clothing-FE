import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Cart, CartItem, Product } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject = new BehaviorSubject<Cart>(this.getEmptyCart());
  public cart$ = this.cartSubject.asObservable();
  public cartItems$ = this.cart$.pipe(map(cart => cart.items || []));
  private localStorageKey = 'guest_cart';

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  // Check if user is logged in (simple token check)
  private isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Load cart from API or localStorage
  private loadCart(): void {
    if (this.isLoggedIn()) {
      this.http.get<Cart>(this.apiUrl).pipe(
        catchError(() => of(this.getEmptyCart()))
      ).subscribe(cart => {
        this.cartSubject.next(cart);
      });
    } else {
      const cart = this.getCartFromLocalStorage();
      this.cartSubject.next(cart);
    }
  }

  // Get current cart value
  getCart(): Cart {
    return this.cartSubject.value;
  }

  // Add item to cart
  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    if (this.isLoggedIn()) {
      const payload = {
        productId: product.id,
        quantity: quantity,
        price: product.salePrice || product.price
      };
      return this.http.post<Cart>(`${this.apiUrl}/items`, payload).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          this.showSuccessMessage(`Added ${product.name} to cart`);
        }),
        catchError(error => {
          console.error('Cart service error:', error);
          this.showErrorMessage('Failed to add item to cart');
          throw error;
        })
      );
    } else {
      // Guest cart logic
      let cart = this.getCartFromLocalStorage();
      const existing = cart.items.find(item => item.productId === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({
          id: Date.now(),
          userId: 0,
          productId: product.id,
          product: product,
          quantity: quantity,
          price: product.salePrice || product.price,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      cart = this.calculateTotals(cart.items);
      this.saveCartToLocalStorage(cart);
      this.cartSubject.next(cart);
      this.showSuccessMessage(`Added ${product.name} to cart`);
      return of(cart);
    }
  }

  // Update cart item quantity
  updateCartItem(itemId: number, quantity: number): Observable<Cart> {
    if (this.isLoggedIn()) {
      const item = this.getCart().items.find(i => i.id === itemId);
      const price = item ? item.price : undefined;
      console.log('Calling updateCartItem with:', { itemId, quantity, price, productId: item?.productId });
      return this.http.put<any>(`${this.apiUrl}/items/${itemId}`, { quantity, price, productId: item?.productId }).pipe(
        map(response => {
          console.log('CartResponseDTO from backend:', response);
          const cart: Cart = {
            items: response?.items || [],
            totalItems: response?.totalItems || 0,
            subtotal: response?.subtotal || 0,
            taxAmount: response?.taxAmount || 0,
            shippingAmount: response?.shippingAmount || 0,
            discountAmount: response?.discountAmount || 0,
            totalAmount: response?.totalAmount || 0
          };
          this.cartSubject.next(cart);
          this.showSuccessMessage('Cart updated successfully');
          return cart;
        }),
        catchError(error => {
          console.log('Error or unexpected response in updateCartItem:', error);
          this.showErrorMessage('Failed to update cart');
          throw error;
        })
      );
    } else {
      let cart = this.getCartFromLocalStorage();
      const item = cart.items.find(i => i.id === itemId);
      if (item) {
        item.quantity = quantity;
        item.updatedAt = new Date();
      }
      cart = this.calculateTotals(cart.items);
      this.saveCartToLocalStorage(cart);
      this.cartSubject.next(cart);
      this.showSuccessMessage('Cart updated successfully');
      return of(cart);
    }
  }

  // Remove item from cart
  removeFromCart(itemId: number): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          this.showSuccessMessage('Item removed from cart');
          this.loadCart(); // Ensure cart is reloaded from backend
        }),
        catchError(error => {
          this.showErrorMessage('Failed to remove item from cart');
          throw error;
        })
      );
    } else {
      let cart = this.getCartFromLocalStorage();
      cart.items = cart.items.filter(i => i.id !== itemId);
      cart = this.calculateTotals(cart.items);
      this.saveCartToLocalStorage(cart);
      this.cartSubject.next(cart);
      this.showSuccessMessage('Item removed from cart');
      return of(cart);
    }
  }

  // Clear cart
  clearCart(): Observable<Cart> {
    if (this.isLoggedIn()) {
      return this.http.delete<Cart>(this.apiUrl).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          this.showSuccessMessage('Cart cleared successfully');
        }),
        catchError(error => {
          this.showErrorMessage('Failed to clear cart');
          throw error;
        })
      );
    } else {
      const cart = this.getEmptyCart();
      this.saveCartToLocalStorage(cart);
      this.cartSubject.next(cart);
      this.showSuccessMessage('Cart cleared successfully');
      return of(cart);
    }
  }

  // Migrate guest cart to server cart (on login/checkout)
  migrateGuestCartToServer(): Observable<Cart> {
    const guestCart = this.getCartFromLocalStorage();
    if (guestCart.items.length === 0) return of(this.getEmptyCart());
    // For each item, add to server cart
    return this.http.post<Cart>(`${this.apiUrl}/migrate`, { items: guestCart.items }).pipe(
      tap(cart => {
        this.clearGuestCart();
        this.cartSubject.next(cart);
      })
    );
  }

  // LocalStorage helpers
  private getCartFromLocalStorage(): Cart {
    const cart = localStorage.getItem(this.localStorageKey);
    return cart ? JSON.parse(cart) : this.getEmptyCart();
  }

  private saveCartToLocalStorage(cart: Cart): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(cart));
  }

  private clearGuestCart(): void {
    localStorage.removeItem(this.localStorageKey);
  }

  // Get cart item count
  getCartItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart.totalItems)
    );
  }

  // Check if product is in cart
  isProductInCart(productId: number): boolean {
    const cart = this.getCart();
    return cart.items.some(item => item.productId === productId);
  }

  // Get cart item by product ID
  getCartItemByProductId(productId: number): CartItem | undefined {
    const cart = this.getCart();
    return cart.items.find(item => item.productId === productId);
  }

  // Calculate cart totals
  private calculateTotals(items: CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.1; // 10% tax
    const shippingAmount = subtotal > 1000000 ? 0 : 50000; // Free shipping over 1M VND
    const discountAmount = 0; // Will be calculated with coupons
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount
    };
  }

  // Apply coupon
  applyCoupon(couponCode: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/coupon`, { couponCode }).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
        this.showSuccessMessage('Coupon applied successfully');
      }),
      catchError(error => {
        this.showErrorMessage('Invalid coupon code');
        throw error;
      })
    );
  }

  // Remove coupon
  removeCoupon(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/coupon`).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
        this.showSuccessMessage('Coupon removed');
      }),
      catchError(error => {
        this.showErrorMessage('Failed to remove coupon');
        throw error;
      })
    );
  }

  // Get empty cart
  private getEmptyCart(): Cart {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalAmount: 0
    };
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Show success message
  private showSuccessMessage(message: string): void {
    // This will be replaced with toast service
    console.log('Success:', message);
  }

  // Show error message
  private showErrorMessage(message: string): void {
    // This will be replaced with toast service
    console.error('Error:', message);
  }

  // Check if cart is empty
  isCartEmpty(): boolean {
    return this.getCart().totalItems === 0;
  }

  // Get cart total
  getCartTotal(): number {
    return this.getCart().totalAmount;
  }

  // Get cart subtotal
  getCartSubtotal(): number {
    return this.getCart().subtotal;
  }

  // Get shipping amount
  getShippingAmount(): number {
    return this.getCart().shippingAmount;
  }

  // Get tax amount
  getTaxAmount(): number {
    return this.getCart().taxAmount;
  }

  // Get discount amount
  getDiscountAmount(): number {
    return this.getCart().discountAmount;
  }

  // Check if free shipping applies
  isFreeShipping(): boolean {
    return this.getCart().shippingAmount === 0;
  }

  // Get amount needed for free shipping
  getAmountForFreeShipping(): number {
    const subtotal = this.getCart().subtotal;
    const freeShippingThreshold = 1000000; // 1M VND
    return Math.max(0, freeShippingThreshold - subtotal);
  }
}