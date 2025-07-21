import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product, ProductDTO } from '../../models';
import { CartService } from '../../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

export interface AddToCartDialogData {
  product: Product | ProductDTO;
}

@Component({
  selector: 'app-add-to-cart-modal',
  template: `
    <div class="add-to-cart-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>{{ product.name }}</h2>
        <button mat-icon-button (click)="closeModal()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="product-image">
          <img [src]="getProductImageUrl()" [alt]="product.name" />
        </div>
        
        <div class="product-details">
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-price">{{ getProductPrice() | currency:'VND':'symbol':'1.0-0' }}</p>
            <p class="product-description" *ngIf="product.description">{{ product.description }}</p>
          </div>
          
          <div class="product-options">
            <!-- Size Selection -->
            <div class="size-selection" *ngIf="availableSizes.length > 0">
              <label class="option-label">Size:</label>
              <div class="size-buttons">
                <button 
                  *ngFor="let size of availableSizes" 
                  class="size-btn"
                  [class.selected]="selectedSize === size"
                  (click)="selectSize(size)">
                  {{ size }}
                </button>
              </div>
            </div>
            
            <!-- Quantity Selection -->
            <div class="quantity-selection">
              <label class="option-label">Quantity:</label>
              <div class="quantity-controls">
                <button 
                  class="qty-btn" 
                  (click)="decreaseQuantity()" 
                  [disabled]="quantity <= 1">
                  -
                </button>
                <input 
                  type="number" 
                  class="qty-input" 
                  [(ngModel)]="quantity" 
                  min="1" 
                  max="99"
                  (change)="validateQuantity()" />
                <button 
                  class="qty-btn" 
                  (click)="increaseQuantity()" 
                  [disabled]="quantity >= maxQuantity">
                  +
                </button>
              </div>
            </div>
            
            <!-- Total Price -->
            <div class="total-price">
              <span class="total-label">Total:</span>
              <span class="total-amount">{{ getTotalPrice() | currency:'VND':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button 
          mat-raised-button 
          color="primary" 
          class="add-to-cart-btn"
          (click)="addToCart()"
          [disabled]="isLoading || !isValidSelection()">
          <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
          <span *ngIf="!isLoading">Add to Cart</span>
        </button>
        <button mat-button class="cancel-btn" (click)="closeModal()">
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .add-to-cart-modal {
      width: 100%;
      max-width: 600px;
      min-height: 400px;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .close-btn {
      margin-left: auto;
    }
    
    .modal-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 24px;
    }
    
    .product-image {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .product-image img {
      width: 100%;
      max-width: 250px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .product-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .product-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }
    
    .product-price {
      font-size: 1.3rem;
      font-weight: 600;
      color: #ff6b35;
      margin: 0 0 12px 0;
    }
    
    .product-description {
      color: #666;
      line-height: 1.5;
      margin: 0;
    }
    
    .product-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .option-label {
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
      display: block;
    }
    
    .size-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .size-btn {
      padding: 8px 16px;
      border: 2px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      font-weight: 500;
    }
    
    .size-btn:hover {
      border-color: #ff6b35;
    }
    
    .size-btn.selected {
      border-color: #ff6b35;
      background: #ff6b35;
      color: white;
    }
    
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .qty-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .qty-btn:hover:not(:disabled) {
      border-color: #ff6b35;
      background: #ff6b35;
      color: white;
    }
    
    .qty-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .qty-input {
      width: 60px;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
    }
    
    .total-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    .total-label {
      font-weight: 500;
      color: #333;
    }
    
    .total-amount {
      font-size: 1.2rem;
      font-weight: 600;
      color: #ff6b35;
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
    
    .add-to-cart-btn {
      min-width: 120px;
    }
    
    @media (max-width: 768px) {
      .modal-content {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .product-image img {
        max-width: 200px;
      }
    }
  `]
})
export class AddToCartModalComponent implements OnInit {
  product: Product | ProductDTO;
  quantity: number = 1;
  selectedSize: string = '';
  availableSizes: string[] = ['S', 'M', 'L', 'XL'];
  maxQuantity: number = 99;
  isLoading: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddToCartDialogData,
    private dialogRef: MatDialogRef<AddToCartModalComponent>,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {
    this.product = data.product;
  }

  ngOnInit(): void {
    // Set default size if available
    if (this.availableSizes.length > 0) {
      this.selectedSize = this.availableSizes[0];
    }
    
    // Set max quantity based on stock
    const stock = this.product.stockQuantity || 0;
    if (stock > 0) {
      this.maxQuantity = Math.min(stock, 99); // Cap at 99 for UI purposes
    } else {
      this.maxQuantity = 1; // Allow at least 1 for virtual products or if stock is null
    }
  }

  getProductImageUrl(): string {
    if (this.product.images && this.product.images.length > 0) {
      const imageUrl = this.product.images[0].imageUrl;
      return `${this.getBackendBaseUrl()}/api/products/${this.product.id}/images/${imageUrl}`;
    }
    return 'assets/placeholder.jpg';
  }

  getBackendBaseUrl(): string {
    // Remove trailing /api if present
    return environment.apiUrl.replace(/\/api$/, '');
  }

  getProductPrice(): number {
    return this.product.salePrice || this.product.price;
  }

  getTotalPrice(): number {
    return this.getProductPrice() * this.quantity;
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  increaseQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  validateQuantity(): void {
    if (this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.maxQuantity) {
      this.quantity = this.maxQuantity;
    }
  }

  isValidSelection(): boolean {
    return this.quantity > 0 && this.quantity <= this.maxQuantity;
  }

  addToCart(): void {
    if (!this.isValidSelection()) {
      return;
    }

    this.isLoading = true;
    
    // Add size information to product if selected
    const productWithVariant = {
      ...this.product,
      selectedSize: this.selectedSize
    };

    this.cartService.addToCart(productWithVariant as any, this.quantity).subscribe({
      next: (cart) => {
        this.isLoading = false;
        this.snackBar.open(`${this.product.name} added to cart!`, 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
        this.dialogRef.close({ success: true, cart });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error adding to cart:', error);
        this.snackBar.open('Failed to add item to cart. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
    });
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}
