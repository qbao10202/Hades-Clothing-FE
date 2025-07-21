import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSelectChange } from '@angular/material/select';

import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderStatus, Customer, User, Product, OrderItem } from '../../models';
import { environment } from '../../../environments/environment';

interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class OrderManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['orderId', 'created', 'customerName', 'total', 'status', 'edit', 'actions'];
  dataSource = new MatTableDataSource<Order>([]);
  expandedOrder: Order | null = null;

  searchControl = new FormControl('');
  filters = {
    fromDate: null as Date | null,
    toDate: null as Date | null,
    status: ''
  };

  stats = {
    totalOrders: 0,
    newOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalSales: 0
  };

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Add available status options
  statusOptions = [
    { value: 'CART' as OrderStatus, label: 'CART' },
    { value: 'PENDING' as OrderStatus, label: 'PENDING' },
    { value: 'CONFIRMED' as OrderStatus, label: 'CONFIRMED' },
    { value: 'PROCESSING' as OrderStatus, label: 'PROCESSING' },
    { value: 'SHIPPED' as OrderStatus, label: 'SHIPPED' },
    { value: 'DELIVERED' as OrderStatus, label: 'DELIVERED' },
    { value: 'CANCELLED' as OrderStatus, label: 'CANCELLED' },
    { value: 'REFUNDED' as OrderStatus, label: 'REFUNDED' }
  ];

  // Get allowed status transitions based on current status
  getAllowedStatusOptions(currentStatus: OrderStatus) {
    const allowedTransitions: { [key in OrderStatus]: OrderStatus[] } = {
      'CART': ['PENDING'],
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': ['REFUNDED'],
      'CANCELLED': [],
      'REFUNDED': []
    };

    const allowedStatuses = allowedTransitions[currentStatus] || [];
    
    // Include current status to show it in the dropdown
    if (!allowedStatuses.includes(currentStatus)) {
      allowedStatuses.unshift(currentStatus);
    }

    return this.statusOptions.filter(option => allowedStatuses.includes(option.value));
  }

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();

    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadOrders();
      });
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.currentPage = 0;
        this.loadOrders();
      });
    }
  }

  loadOrders(): void {
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sort?.active || 'orderDate',
      sortDir: this.sort?.direction || 'desc',
      status: this.filters.status || undefined,
      startDate: this.filters.fromDate ? this.formatDate(this.filters.fromDate) : undefined,
      endDate: this.filters.toDate ? this.formatDate(this.filters.toDate) : undefined,
      search: this.searchControl.value || undefined
    };

    console.log('Loading orders with params:', params);

    this.orderService.getAllOrders(params).subscribe({
      next: (response) => {
        console.log('Raw orders response:', response);
        
        if (!response) {
          console.error('Response is null or undefined');
          this.handleError('No response from server');
          return;
        }

        let orders: Order[] = [];
        
        if (Array.isArray(response)) {
          console.log('Response is an array');
          orders = response;
        } else if (response.content && Array.isArray(response.content)) {
          console.log('Response is paginated');
          orders = response.content;
          this.totalItems = response.totalElements || orders.length;
        } else {
          console.error('Unexpected response format:', response);
          this.handleError('Invalid response format');
          return;
        }

        // Filter out CART status orders and orders with orderNumber starting with CART
        const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED'];
        let filteredOrders = orders.filter(order => {
          if (!order.orderNumber) return false;
          const isValid = order.status !== ('CART' as OrderStatus) && !order.orderNumber.startsWith('CART');
          return isValid;
        });
        // Apply status filter if set
        if (this.filters.status) {
          filteredOrders = filteredOrders.filter(o => o.status === this.filters.status);
        }
        // Sort by logical status order
        filteredOrders.sort((a, b) => {
          const aIdx = statusOrder.indexOf(a.status);
          const bIdx = statusOrder.indexOf(b.status);
          return aIdx - bIdx;
        });

        console.log('Filtered orders:', filteredOrders);

        if (filteredOrders.length === 0) {
          console.log('No orders after filtering');
        }

        this.dataSource.data = filteredOrders;
        
        // (REMOVED: Do not update this.stats here, only in loadStats)
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.handleError(error);
      }
    });
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    // If date is a string (from input type='date'), convert to Date
    if (typeof date === 'string') {
      // 'YYYY-MM-DD' from input type='date' → Date
      return new Date(date).toISOString();
    }
    return date.toISOString();
  }

  loadStats(): void {
    this.orderService.getOrderStatistics(this.filters.fromDate, this.filters.toDate).subscribe({
      next: (stats) => {
        const statusCounts = stats.statusCounts || {};
        this.stats = {
          totalOrders: stats.totalOrders || 0,
          newOrders: statusCounts['PENDING'] || 0,
          cancelledOrders: statusCounts['CANCELLED'] || 0,
          completedOrders: (statusCounts['DELIVERED'] || 0) + (statusCounts['REFUNDED'] || 0) + (statusCounts['CANCELLED'] || 0),
          totalSales: stats.totalSales || 0
        };
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadOrders();
    this.loadStats();
  }

  clearFilters(): void {
    this.filters = {
      fromDate: null,
      toDate: null,
      status: ''
    };
    this.searchControl.setValue('');
    this.currentPage = 0;
    this.loadOrders();
    this.loadStats();
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      case 'REFUNDED': return 'status-refunded';
      default: return 'status-unknown';
    }
  }

  getDiscount(item: any): number {
    if (item.discountAmount && item.unitPrice) {
      return Math.round((item.discountAmount / (item.unitPrice * item.quantity)) * 100);
    }
    return 0;
  }

  updateOrderStatus(order: Order): void {
    // TODO: Implement status update dialog
    console.log('Update status for order:', order);
  }

  printOrder(order: Order): void {
    // TODO: Implement print functionality
    console.log('Print order:', order);
  }

  getCustomerName(order: Order): string {
    return order.customer?.contactPerson || 'N/A';
  }

  getCustomerType(order: Order): string {
    return order.customer?.customerType || 'N/A';
  }

  getCustomerAvatar(order: Order): string {
    return 'assets/default-avatar.png';
  }

  public getPaymentMethod(order: Order): string {
    return order.paymentStatus || 'Unknown';
  }

  onStatusChange(event: MatSelectChange, order: Order): void {
    const newStatus = event.value as OrderStatus;
    
    // Check if the transition is allowed before making the API call
    const allowedStatuses = this.getAllowedStatusOptions(order.status).map(option => option.value);
    if (!allowedStatuses.includes(newStatus)) {
      this.snackBar.open('Invalid status transition', 'Close', { duration: 3000 });
      event.source.value = order.status; // Revert the selection
      return;
    }

    console.log(`Updating order ${order.id} status from ${order.status} to ${newStatus}`);

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => {
        const index = this.dataSource.data.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedOrder;
          this.dataSource._updateChangeSubscription(); // Force refresh
          // Fix: reassign expandedOrder to the updated object from dataSource
          if (this.expandedOrder && this.expandedOrder.id === updatedOrder.id) {
            this.expandedOrder = this.dataSource.data[index];
          }
          this.snackBar.open(`Order status updated to ${newStatus}`, 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
        // Refresh statistics after status update
        this.loadStats();
      },
      error: (error) => {
        console.error('Error updating order status:', error);
        
        // Extract error message from backend response
        let errorMessage = 'Failed to update order status';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.snackBar.open(errorMessage, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        
        // Revert the selection
        event.source.value = order.status;
      }
    });
  }

  private handleError(error: any): void {
    const message = error.error?.message || error.message || 'An error occurred';
    console.error('Error:', message);
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.dataSource.data = [];
    this.totalItems = 0;
    this.stats = {
      totalOrders: 0,
      newOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSales: 0
    };
  }

  onDateChange() {
    this.currentPage = 0;
    this.loadOrders();
    this.loadStats();
  }

  getProductImageUrl(item: any): string {
    if (item.product && item.product.images && item.product.images.length > 0) {
      const filename = item.product.images[0].imageUrl;
      return `${this.getBackendBaseUrl()}/api/products/${item.product.id}/images/${filename}`;
    }
    return 'assets/default-product.png';
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}
