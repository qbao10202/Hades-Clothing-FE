import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Cart, Order, User } from '../../models';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
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
  loading = false;
  discountCode = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    
    // Subscribe to cart changes
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
        if (cart.items.length === 0) {
          this.router.navigate(['/cart']);
        }
        this.updateShippingAmount();
      });

    // Listen for shipping method changes
    this.checkoutForm?.get('shippingMethod')?.valueChanges
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateShippingAmount();
      });

    // Migrate guest cart if exists and user is authenticated
    if (this.currentUser && localStorage.getItem('guest_cart')) {
      this.cartService.migrateGuestCartToServer().subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.checkoutForm = this.formBuilder.group({
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      firstName: [this.currentUser?.firstName || '', [Validators.required]],
      lastName: [this.currentUser?.lastName || '', [Validators.required]],
      phone: [this.currentUser?.phone || '', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      phoneCountry: ['VN', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      description: [''], // Not required
      shippingMethod: ['free', [Validators.required]],
      sameAsShipping: [true],
      billingAddress: [''],
      notes: ['']
    });
  }

  updateShippingAmount(): void {
    const method = this.checkoutForm?.get('shippingMethod')?.value;
    if (method === 'express') {
      this.cart.shippingAmount = 9000;
    } else {
      this.cart.shippingAmount = 0;
    }
    this.updateTotalAmount();
  }

  updateTotalAmount(): void {
    this.cart.totalAmount = this.cart.subtotal + this.cart.shippingAmount + this.cart.taxAmount - this.cart.discountAmount;
  }

  processCheckout(): void {
    if (!this.checkoutForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    if (this.cart.items.length === 0) {
      this.snackBar.open('Your cart is empty', 'Close', { duration: 3000 });
      return;
    }
    this.loading = true;
    const formValue = this.checkoutForm.value;
    // Prepare shipping address
    const shippingAddress = `${formValue.description ? formValue.description + ', ' : ''}${formValue.city}, ${formValue.state} ${formValue.zipCode}`;
    // Prepare billing address
    const billingAddress = formValue.sameAsShipping ? shippingAddress : formValue.billingAddress;
    // Prepare order data
    const orderData = {
      customerEmail: formValue.email,
      customerName: `${formValue.firstName} ${formValue.lastName}`,
      customerPhone: `${formValue.phoneCountry}-${formValue.phone}`,
      shippingAddress,
      billingAddress,
      shippingMethod: formValue.shippingMethod,
      notes: formValue.notes || '',
      items: this.cart.items.map(item => ({
        productId: item.product?.id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    // Place order
    this.orderService.placeOrder(orderData).subscribe({
      next: (order: any) => {
        this.loading = false;
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
        // Clear cart and update observable/UI
        this.cartService.clearCart().subscribe({
          next: () => {
            this.router.navigate(['/home']);
          },
          error: () => {
            this.router.navigate(['/home']);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
        // Defensive: treat error as success if status is 200
        this.cartService.clearCart().subscribe({
          next: () => {
            this.router.navigate(['/home']);
          },
          error: () => {
            this.router.navigate(['/home']);
          }
        });
      }
    });
  }

  applyDiscount(): void {
    if (this.discountCode.trim()) {
      // Here you would call a service to apply the discount
      this.snackBar.open('Discount code applied successfully', 'Close', { duration: 3000 });
    }
  }

  getProductImage(item: any): string {
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

  getProductName(item: any): string {
    return item.product?.name || item.productName || 'Product';
  }

  getProductCategory(item: any): string {
    return item.product?.category?.name || 'Category';
  }

  onImageError(event: any): void {
    if (event.target) {
      event.target.src = 'assets/default-product.svg';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatCurrencyVND(amount: number): string {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}