import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';

import { Order, User } from '../../models';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-list',
  template: `
    <div class="orders-page">
      <div class="container">
        <div class="page-header">
          <h1>My Orders</h1>
          <button mat-raised-button routerLink="/products" color="primary">
            <mat-icon>add_shopping_cart</mat-icon>
            Continue Shopping
          </button>
        </div>

        <div *ngIf="orders.length > 0; else noOrders" class="orders-content">
          <div *ngFor="let order of orders" class="order-card">
            <mat-card>
              <mat-card-header>
                <div class="order-header">
                  <div class="order-info">
                    <h3>Order #{{ order.orderNumber }}</h3>
                    <p class="order-date">Placed on {{ order.orderDate | date:'medium' }}</p>
                  </div>
                  <div class="order-status">
                    <mat-chip [color]="getStatusColor(order.status)" selected>
                      {{ order.status }}
                    </mat-chip>
                  </div>
                </div>
              </mat-card-header>
              
              <mat-card-content>
                <div class="order-details">
                  <div class="order-items">
                    <h4>Items ({{ order.orderItems.length || 0 }})</h4>
                    <div *ngFor="let item of order.orderItems.slice(0, 3)" class="order-item">
                      <img [src]="getProductImage(item)" [alt]="item.productName" class="item-image">
                      <div class="item-details">
                        <span class="item-name">{{ item.productName }}</span>
                        <span class="item-quantity">Qty: {{ item.quantity }}</span>
                      </div>
                      <div class="item-price">
                        {{ item.totalPrice | currency:'VND':'symbol':'1.0-0' }}
                      </div>
                    </div>
                    <p *ngIf="(order.orderItems.length || 0) > 3" class="more-items">
                      +{{ (order.orderItems.length || 0) - 3 }} more items
                    </p>
                  </div>
                  
                  <div class="order-summary">
                    <div class="summary-row">
                      <span>Subtotal:</span>
                      <span>{{ order.subtotal | currency:'VND':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-row">
                      <span>Shipping:</span>
                      <span>{{ order.shippingAmount | currency:'VND':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-row">
                      <span>Tax:</span>
                      <span>{{ order.taxAmount | currency:'VND':'symbol':'1.0-0' }}</span>
                    </div>
                    <div class="summary-row total">
                      <span>Total:</span>
                      <span>{{ order.totalAmount | currency:'VND':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button [routerLink]="['/orders', order.id]">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-button *ngIf="order.status === 'PENDING'" (click)="cancelOrder(order)" color="warn">
                  <mat-icon>cancel</mat-icon>
                  Cancel Order
                </button>
                <button mat-button *ngIf="order.status === 'DELIVERED'" (click)="reorderItems(order)">
                  <mat-icon>repeat</mat-icon>
                  Reorder
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
          
          <!-- Pagination -->
          <mat-paginator 
            *ngIf="totalOrders > pageSize"
            [length]="totalOrders"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </div>

        <ng-template #noOrders>
          <div class="no-orders">
            <mat-icon class="no-orders-icon">receipt_long</mat-icon>
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <button mat-raised-button color="primary" routerLink="/products">
              Start Shopping
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px 0;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .orders-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .order-card {
      width: 100%;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .order-info h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .order-date {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 0.9rem;
    }

    .order-details {
      display: grid;
      grid-template-columns: 1fr 250px;
      gap: 30px;
    }

    .order-items h4 {
      margin: 0 0 15px 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .item-image {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .item-quantity {
      font-size: 0.8rem;
      color: #666;
    }

    .item-price {
      font-weight: 600;
      color: #333;
    }

    .more-items {
      margin: 10px 0 0 0;
      font-size: 0.9rem;
      color: #666;
      font-style: italic;
    }

    .order-summary {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .summary-row.total {
      border-top: 2px solid #ddd;
      padding-top: 10px;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .no-orders {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .no-orders-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 20px;
    }

    .no-orders h2 {
      font-size: 1.5rem;
      margin-bottom: 10px;
      color: #333;
    }

    .no-orders p {
      color: #666;
      margin-bottom: 30px;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .order-details {
        grid-template-columns: 1fr;
      }
      
      .order-header {
        flex-direction: column;
        align-items: start;
        gap: 10px;
      }
    }
  `]
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  totalOrders = 0;
  pageSize = 10;
  currentPage = 0;
  loading = false;
  currentUser: User | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loading = true;
    
    this.orderService.getUserOrders(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.orders = response.content || response;
          this.totalOrders = response.totalElements || response.length || 0;
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  cancelOrder(order: Order): void {
    if (confirm(`Are you sure you want to cancel order #${order.orderNumber}?`)) {
      this.orderService.cancelOrder(order.id).subscribe({
        next: () => {
          this.snackBar.open('Order cancelled successfully', 'Close', { duration: 3000 });
          this.loadOrders();
        },
        error: () => {
          this.snackBar.open('Failed to cancel order', 'Close', { duration: 3000 });
        }
      });
    }
  }

  reorderItems(order: Order): void {
    // TODO: Implement reorder functionality
    this.snackBar.open('Reorder functionality will be implemented', 'Close', { duration: 3000 });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'accent';
      case 'CONFIRMED': return 'primary';
      case 'PROCESSING': return 'primary';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'primary';
      case 'CANCELLED': return 'warn';
      case 'REFUNDED': return 'warn';
      default: return '';
    }
  }

  getProductImage(item: any): string {
    return item.product?.images?.[0]?.imageUrl || 'assets/placeholder.jpg';
  }
}