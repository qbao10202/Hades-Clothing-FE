// User Models
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// Product Models
export interface Product {
  id: number;
  productCode: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  cost: number;
  salePrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  categoryId?: number;
  category?: Category;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  tags?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  reviews: ProductReview[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductReview {
  id: number;
  productId: number;
  userId: number;
  user?: User;
  orderId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  createdAt: Date;
}

// Category Models
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  products?: Product[];
}

// Customer Models
export interface Customer {
  id: number;
  customerCode: string;
  userId?: number;
  user?: User;
  companyName?: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS' | 'WHOLESALE';
  creditLimit: number;
  paymentTerms: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Models
export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer?: Customer;
  userId: number;
  user?: User;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress?: string;
  billingAddress?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  orderItems: OrderItem[];  // Alternative property name for backend compatibility
  payments: Payment[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
  createdAt: Date;
}

export type OrderStatus = 'CART' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

// Cart Models
export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  size?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
}

// Payment Models
export interface Payment {
  id: number;
  orderId: number;
  order?: Order;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayResponse?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYPAL' | 'MOMO' | 'ZALOPAY' | 'VNPAY';

// Notification Models
export interface Notification {
  id: number;
  userId: number;
  user?: User;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';

// Coupon Models
export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

// Wishlist Models
export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  product?: Product;
  createdAt: Date;
}

// API Response Models
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Search and Filter Models
export interface ProductSearchParams {
  page?: number;
  size?: number;
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  tags?: string[];
}

export interface OrderSearchParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
  customerId?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Authentication Models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  token?: string;
}

// Form Models
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Checkout Models
export interface CheckoutRequest {
  customerId: number;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Dashboard Models
export interface TopSellingProduct {
  product: Product;
  soldQuantity: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  newOrders: number;
  lowStockProducts: number;
  topSellingProducts: TopSellingProduct[];
  recentOrders: Order[];
  salesByMonth: SalesData[];
}

export interface SalesData {
  month: string;
  sales: number;
  orders: number;
}

// File Upload Models
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ProductDTO {
  id: number;
  productCode: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  cost: number;
  salePrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  categoryId?: number;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  tags?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDTO[];
  imageUrl?: string; // Add this for backend compatibility
}

export interface ProductImageDTO {
  id: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}