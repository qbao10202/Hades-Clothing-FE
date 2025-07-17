import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Order, OrderStatus, PaymentStatus } from '../../models';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-admin',
  templateUrl: './order-admin.component.html',
  styleUrls: ['./order-admin.component.scss']
})
export class OrderAdminComponent implements OnInit {
  displayedColumns: string[] = ['orderNumber', 'customer', 'orderDate', 'status', 'paymentStatus', 'totalAmount', 'actions'];
  dataSource = new MatTableDataSource<Order>();
  orders: Order[] = [];
  searchText = '';
  filterStatus: string = '';
  filterPaymentStatus: string = '';
  loading = false;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadOrders() {
    this.loading = true;
    // Mock data for now - replace with actual service call
    this.orders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        customerId: 1,
        customer: {
          id: 1,
          customerCode: 'CUST-001',
          email: 'customer1@example.com',
          customerType: 'INDIVIDUAL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        userId: 1,
        orderDate: new Date('2024-01-15'),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        subtotal: 1500000,
        taxAmount: 150000,
        shippingAmount: 50000,
        discountAmount: 0,
        totalAmount: 1700000,
        currency: 'VND',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        payments: []
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        customerId: 2,
        customer: {
          id: 2,
          customerCode: 'CUST-002',
          email: 'customer2@example.com',
          customerType: 'INDIVIDUAL',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        userId: 1,
        orderDate: new Date('2024-01-16'),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        shippingStatus: 'SHIPPED',
        subtotal: 2500000,
        taxAmount: 250000,
        shippingAmount: 50000,
        discountAmount: 100000,
        totalAmount: 2700000,
        currency: 'VND',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        payments: []
      }
    ];
    
    this.applyFilters();
    this.loading = false;
  }

  applyFilters() {
    let filtered = this.orders;

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(search) ||
        order.customer?.email.toLowerCase().includes(search)
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(order => order.status === this.filterStatus);
    }

    if (this.filterPaymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === this.filterPaymentStatus);
    }

    this.dataSource.data = filtered;
  }

  clearFilters() {
    this.searchText = '';
    this.filterStatus = '';
    this.filterPaymentStatus = '';
    this.applyFilters();
  }

  viewOrder(order: Order) {
    this.router.navigate(['/admin/orders', order.id]);
  }

  updateOrderStatus(order: Order, newStatus: OrderStatus) {
    if (confirm(`Are you sure you want to update order ${order.orderNumber} status to ${newStatus}?`)) {
      // TODO: Implement status update
      order.status = newStatus;
      this.snackBar.open(`Order status updated to ${newStatus}`, 'Close', { duration: 3000 });
    }
  }

  updatePaymentStatus(order: Order, newStatus: PaymentStatus) {
    if (confirm(`Are you sure you want to update payment status to ${newStatus}?`)) {
      // TODO: Implement payment status update
      order.paymentStatus = newStatus;
      this.snackBar.open(`Payment status updated to ${newStatus}`, 'Close', { duration: 3000 });
    }
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'PROCESSING': return 'status-processing';
      case 'SHIPPED': return 'status-shipped';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      case 'REFUNDED': return 'status-refunded';
      default: return 'status-pending';
    }
  }

  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case 'PENDING': return 'payment-pending';
      case 'PAID': return 'payment-paid';
      case 'FAILED': return 'payment-failed';
      case 'REFUNDED': return 'payment-refunded';
      case 'PARTIALLY_REFUNDED': return 'payment-partial';
      default: return 'payment-pending';
    }
  }

  getStatusText(status: OrderStatus): string {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đã gửi hàng';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'CANCELLED': return 'Đã hủy';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return 'Chờ xử lý';
    }
  }

  getPaymentStatusText(status: PaymentStatus): string {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'FAILED': return 'Thanh toán thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      case 'PARTIALLY_REFUNDED': return 'Hoàn tiền một phần';
      default: return 'Chờ thanh toán';
    }
  }

  backToHome() {
    this.router.navigate(['/home']);
  }
} 