import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product, Category, ProductSearchParams, PaginatedResponse, ApiResponse, ProductDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private categoriesUrl = `${environment.apiUrl}/categories`;
  
  private categoriesSubject = new BehaviorSubject<Category[]>([]);

  public categories$ = this.categoriesSubject.asObservable();

  private demoCategories: Category[] = [
    { id: 1, name: 'Tops', slug: 'tops', isActive: true, sortOrder: 1, createdAt: new Date(), imageUrl: 'https://hades.vn/images/products/1.jpg' },
    { id: 2, name: 'Bottoms', slug: 'bottoms', isActive: true, sortOrder: 2, createdAt: new Date(), imageUrl: 'https://hades.vn/images/products/2.jpg' },
    { id: 3, name: 'Outerwears', slug: 'outerwears', isActive: true, sortOrder: 3, createdAt: new Date(), imageUrl: 'https://hades.vn/images/products/3.jpg' },
    { id: 4, name: 'Accessories', slug: 'accessories', isActive: true, sortOrder: 4, createdAt: new Date(), imageUrl: 'https://hades.vn/images/products/4.jpg' }
  ];
  private demoProducts: Product[] = [
    { id: 1, productCode: 'HADES-001', name: 'HADES SPLICE POLO - BROWN', slug: 'hades-splice-polo-brown', price: 520000, cost: 400000, stockQuantity: 10, minStockLevel: 1, maxStockLevel: 100, isActive: true, createdAt: new Date(), updatedAt: new Date(), images: [{ id: 1, productId: 1, imageUrl: 'https://hades.vn/images/products/1.jpg', sortOrder: 1, isPrimary: true }], reviews: [], categoryId: 1 },
    { id: 2, productCode: 'HADES-002', name: 'HADES CHAMPION TANK TOP - BLACK', slug: 'hades-champion-tank-top-black', price: 420000, cost: 300000, stockQuantity: 15, minStockLevel: 1, maxStockLevel: 100, isActive: true, createdAt: new Date(), updatedAt: new Date(), images: [{ id: 2, productId: 2, imageUrl: 'https://hades.vn/images/products/2.jpg', sortOrder: 1, isPrimary: true }], reviews: [], categoryId: 1 },
    { id: 3, productCode: 'HADES-003', name: 'HADES COZY STRIPE POLO SWEATER - RED', slug: 'hades-cozy-stripe-polo-sweater-red', price: 1150000, cost: 900000, stockQuantity: 5, minStockLevel: 1, maxStockLevel: 100, isActive: true, createdAt: new Date(), updatedAt: new Date(), images: [{ id: 3, productId: 3, imageUrl: 'https://hades.vn/images/products/3.jpg', sortOrder: 1, isPrimary: true }], reviews: [], categoryId: 3 }
  ];

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  // Get all products
  getProducts(): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.apiUrl}/all`);
  }

  // Get products with pagination
  getProductsWithPagination(params: any = {}): Observable<any> {
    const defaultParams = {
      page: 0,
      size: 10,
      sortBy: 'name',
      sortDir: 'asc',
      ...params
    };

    // Filter out undefined values
    const filteredParams = Object.entries(defaultParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return this.http.get<any>(this.apiUrl, { params: filteredParams });
  }

  // Get product by ID
  getProduct(id: number): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.apiUrl}/${id}`);
  }

  // Get product by slug
  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/slug/${slug}`);
  }

  // Get products by category
  getProductsByCategory(categoryId: number): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  // Get related products
  getRelatedProducts(productId: number, limit: number = 4): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/${productId}/related?limit=${limit}`);
  }

  // Get top selling products
  getTopSellingProducts(limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/top-selling?limit=${limit}`);
  }

  // Get new arrivals
  getNewArrivals(limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/new-arrivals?limit=${limit}`);
  }

  // Get products on sale
  getProductsOnSale(limit: number = 10): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/on-sale?limit=${limit}`);
  }

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.categoriesUrl}/all`);
  }

  // Load categories
  private loadCategories(): void {
    this.getCategories().subscribe(categories => {
      this.categoriesSubject.next(categories);
    });
  }

  // Get category by ID
  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.categoriesUrl}/${id}`);
  }

  // Get category by slug
  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.categoriesUrl}/slug/${slug}`);
  }

  // Get main categories (no parent)
  getMainCategories(): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => categories.filter(cat => !cat.parentId))
    );
  }

  // Get subcategories
  getSubcategories(parentId: number): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => categories.filter(cat => cat.parentId === parentId))
    );
  }

  // Get brands
  getBrands(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/brands`);
  }

  // Get price range
  getPriceRange(): Observable<{ min: number; max: number }> {
    return this.http.get<{ min: number; max: number }>(`${this.apiUrl}/price-range`);
  }

  // Create product (Admin only)
  createProduct(product: Partial<ProductDTO>): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(this.apiUrl, product);
  }

  // Update product (Admin only)
  updateProduct(id: number, product: Partial<ProductDTO>): Observable<ProductDTO> {
    return this.http.put<ProductDTO>(`${this.apiUrl}/${id}`, product);
  }

  // Delete product (Admin only)
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Upload product image
  uploadProductImage(productId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${productId}/images`, formData);
  }

  // Delete product image
  deleteProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}/images/${imageId}`);
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Get product price (with sale price consideration)
  getProductPrice(product: Product): number {
    return product.salePrice || product.price;
  }

  // Check if product is on sale
  isProductOnSale(product: Product): boolean {
    return !!product.salePrice && product.salePrice < product.price;
  }

  // Calculate discount percentage
  getDiscountPercentage(product: Product): number {
    if (!this.isProductOnSale(product)) return 0;
    return Math.round(((product.price - product.salePrice!) / product.price) * 100);
  }

  // Check if product is in stock
  isProductInStock(product: Product): boolean {
    return (product.stockQuantity || 0) > 0;
  }

  // Check if product is low in stock
  isProductLowStock(product: Product): boolean {
    const stock = product.stockQuantity || 0;
    const minLevel = product.minStockLevel || 10;
    return stock > 0 && stock <= minLevel;
  }

  // Get stock status text
  getStockStatus(product: Product): string {
    const stock = product.stockQuantity || 0;
    if (stock <= 0) return 'Out of Stock';
    if (stock <= (product.minStockLevel || 10)) return 'Low Stock';
    return 'In Stock';
  }

  // Get stock status color
  getStockStatusColor(product: Product): string {
    if (!this.isProductInStock(product)) return 'text-red-600';
    if (this.isProductLowStock(product)) return 'text-orange-600';
    return 'text-green-600';
  }

  // Get primary image URL
  getPrimaryImageUrl(product: Product): string {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      if (primaryImage) return primaryImage.imageUrl;
      return product.images[0].imageUrl;
    }
    return '/assets/images/placeholder-product.jpg';
  }

  // Get all image URLs
  getImageUrls(product: Product): string[] {
    if (product.images && product.images.length > 0) {
      return product.images.map(img => img.imageUrl);
    }
    return ['/assets/images/placeholder-product.jpg'];
  }

  // Get average rating
  getAverageRating(product: Product): number {
    if (!product.reviews || product.reviews.length === 0) return 0;
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / product.reviews.length) * 10) / 10;
  }

  // Get review count
  getReviewCount(product: Product): number {
    return product.reviews?.length || 0;
  }

  // Get approved reviews
  getApprovedReviews(product: Product) {
    return product.reviews?.filter(review => review.isApproved) || [];
  }

  // Generate product URL
  generateProductUrl(product: Product): string {
    return `/products/${product.slug}`;
  }

  // Generate category URL
  generateCategoryUrl(category: Category): string {
    return `/categories/${category.slug}`;
  }

  // Cache product data
  private cacheProduct(product: Product): void {
    // Implementation for caching product data
    localStorage.setItem(`product_${product.id}`, JSON.stringify(product));
  }

  // Get cached product
  getCachedProduct(id: number): Product | null {
    const cached = localStorage.getItem(`product_${id}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Clear product cache
  clearProductCache(id?: number): void {
    if (id) {
      localStorage.removeItem(`product_${id}`);
    } else {
      // Clear all product cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('product_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
} 