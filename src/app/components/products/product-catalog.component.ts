import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Product, ProductDTO, Category } from '../../models';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { AddToCartModalComponent } from '../shared/add-to-cart-modal.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-catalog',
  template: `
    <div class="product-catalog">
      <!-- Header with Categories, Price Filter, and Search -->
      <div class="catalog-header">
        <div class="container">
          <div class="header-content">
            <div class="brand-logo">
              <h1>HADES</h1>
            </div>
            <div class="header-actions">
              <button mat-icon-button (click)="goToCart()" class="cart-btn">
                <mat-icon [matBadge]="cartItemCount" matBadgeColor="warn" [matBadgeHidden]="cartItemCount === 0">shopping_cart</mat-icon>
              </button>
            </div>
          </div>
          <!-- Categories Navigation -->
          <div class="categories-nav">
            <button 
              class="home-btn"
              routerLink="/home">
              <mat-icon>home</mat-icon>
              Home
            </button>
            <button 
              class="category-btn"
              [class.active]="!selectedCategoryId"
              (click)="selectCategory(null)">
              All Products
            </button>
            <button 
              *ngFor="let category of categories"
              class="category-btn"
              [class.active]="selectedCategoryId === category.id"
              (click)="selectCategory(category.id)">
              {{ category.name }}
            </button>
          </div>
          
          <!-- Filters and Search -->
          <div class="filters-section">
            <!-- Sort Dropdown -->
            <div class="sort-filter">
              <mat-form-field appearance="outline" class="sort-input">
                <mat-label>Sort by</mat-label>
                <mat-select [formControl]="sortControl">
                  <mat-option *ngFor="let option of sortOptions" [value]="option.value">
                    {{ option.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
            <!-- Search Bar -->
            <div class="search-bar" style="display: flex; align-items: center; gap: 8px;">
              <mat-form-field appearance="outline" class="search-input">
                <mat-label>Search products...</mat-label>
                <input matInput [formControl]="searchControl" placeholder="Search by name, description...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="searchButtonClicked()" class="modern-search-btn">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Products Grid -->
      <div class="products-section">
        <div class="container">
          <div class="section-title" *ngIf="selectedCategoryId">
            <h2>{{ getCategoryName() }}</h2>
            <p>{{ filteredProducts.length }} products found</p>
          </div>
          
          <div class="products-grid" *ngIf="filteredProducts.length > 0; else noProducts">
            <div *ngFor="let product of filteredProducts" class="product-card">
              <div class="product-image">
                <img [src]="getProductImageUrl(product)" [alt]="product.name" />
                <div class="product-overlay">
                  <button class="quick-view-btn" (click)="quickViewProduct(product)">
                    <mat-icon>visibility</mat-icon>
                    Quick View
                  </button>
                </div>
              </div>
              
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-price">
                  <span class="current-price">{{ (product.salePrice || product.price) | number }} đ</span>
                  <span class="original-price" *ngIf="product.salePrice && product.salePrice < product.price">
                    {{ product.price | number }} đ
                  </span>
                </div>
                
                <div class="product-actions">
                  <button 
                    class="add-to-cart-btn"
                    (click)="openAddToCartModal(product)"
                    [disabled]="!isProductAvailable(product)">
                    <mat-icon>add_shopping_cart</mat-icon>
                    {{ isProductAvailable(product) ? 'Add to Cart' : 'Out of Stock' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noProducts>
            <div class="no-products">
              <mat-icon class="no-products-icon">inventory_2</mat-icon>
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button mat-raised-button color="primary" (click)="clearFilters()">
                Clear Filters
              </button>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-catalog {
      min-height: 100vh;
      background: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .catalog-header {
      background: white;
      border-bottom: 1px solid #e9ecef;
      padding: 20px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .brand-logo h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #333;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }

    .cart-btn {
      background: #007bff;
      color: white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .cart-btn:hover {
      background: #0056b3;
    }
    
    .categories-nav {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    
    .category-btn {
      padding: 8px 16px;
      border: 2px solid #e9ecef;
      background: white;
      cursor: pointer;
      border-radius: 25px;
      white-space: nowrap;
      transition: all 0.2s;
      font-weight: 500;
    }
    
    .category-btn:hover {
      border-color: #007bff;
      background: #f8f9fa;
    }
    
    .category-btn.active {
      border-color: #007bff;
      background: #007bff;
      color: white;
    }
    
    .filters-section {
      display: flex;
      gap: 20px;
      align-items: center;
      justify-content: space-between;
    }
    
    .home-btn {
      padding: 8px 16px;
      border: 2px solid #28a745;
      background: #28a745;
      color: white;
      cursor: pointer;
      border-radius: 25px;
      white-space: nowrap;
      transition: all 0.2s;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      margin-right: 8px;
    }
    
    .home-btn:hover {
      background: #218838;
      border-color: #218838;
    }
    
    .sort-filter {
      display: flex;
      align-items: center;
    }
    
    .sort-input {
      width: 200px;
    }
    
    .search-bar {
      flex: 1;
      max-width: 400px;
    }
    
    .search-input {
      width: 100%;
    }

    .modern-search-btn {
      padding: 8px 12px;
      border-radius: 8px;
      background: #007bff;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .modern-search-btn:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }
    
    .products-section {
      padding: 40px 0;
    }
    
    .section-title {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .section-title h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 8px 0;
    }
    
    .section-title p {
      color: #666;
      margin: 0;
    }
    
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 30px;
    }
    
    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .product-image {
      position: relative;
      overflow: hidden;
    }
    
    .product-image img {
      width: 100%;
      height: 250px;
      object-fit: cover;
      transition: transform 0.3s;
    }
    
    .product-card:hover .product-image img {
      transform: scale(1.05);
    }
    
    .product-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .product-card:hover .product-overlay {
      opacity: 1;
    }
    
    .quick-view-btn {
      padding: 10px 20px;
      background: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .quick-view-btn:hover {
      background: #f8f9fa;
      transform: scale(1.05);
    }
    
    .product-info {
      padding: 20px;
    }
    
    .product-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 10px 0;
      line-height: 1.3;
    }
    
    .product-price {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .current-price {
      font-size: 1.1rem;
      font-weight: 600;
      color: #28a745;
    }
    
    .original-price {
      font-size: 0.9rem;
      color: #6c757d;
      text-decoration: line-through;
    }
    
    .add-to-cart-btn {
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .add-to-cart-btn:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-2px);
    }
    
    .add-to-cart-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    
    .no-products {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .no-products-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 20px;
    }
    
    .no-products h3 {
      font-size: 1.5rem;
      margin: 0 0 10px 0;
    }
    
    .no-products p {
      margin: 0 0 20px 0;
    }
    
    @media (max-width: 768px) {
      .filters-section {
        flex-direction: column;
        gap: 15px;
      }
      
      .sort-filter {
        width: 100%;
      }
      
      .sort-input {
        width: 100%;
      }
      
      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
      }
      
      .categories-nav {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ProductCatalogComponent implements OnInit, OnDestroy {
  products: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  
  searchControl = new FormControl('');
  sortControl = new FormControl('default');
  
  sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' }
  ];
  
  cartItemCount = 0;
  currentUser: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    });
    this.loadCategories();
    this.loadProducts();
    this.setupFilters();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  private loadProducts(): void {
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
        this.applyFilters();
      });
  }
  private setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
    
    // Sort filter
    this.sortControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['category']) {
          this.selectedCategoryId = +params['category'];
        }
        this.applyFilters();
      });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    
    // Update URL
    const queryParams = categoryId ? { category: categoryId } : {};
    this.router.navigate([], { queryParams, replaceUrl: true });
    
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Category filter
    if (this.selectedCategoryId) {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategoryId);
    }

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort filter
    const sortValue = this.sortControl.value;
    if (sortValue === 'price-low-high') {
      filtered.sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        return priceA - priceB;
      });
    } else if (sortValue === 'price-high-low') {
      filtered.sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        return priceB - priceA;
      });
    }
    // 'default' sorting maintains original order

    this.filteredProducts = filtered;
  }

  getCategoryName(): string {
    const category = this.categories.find(c => c.id === this.selectedCategoryId);
    return category?.name || 'All Products';
  }

  getProductImageUrl(product: ProductDTO): string {
    if (product.images && product.images.length > 0) {
      let filename = product.images[0].imageUrl;
      // Remove any leading /uploads/ from filename
      if (filename.startsWith('/uploads/')) {
        filename = filename.substring('/uploads/'.length);
      }
      return `${this.getBackendBaseUrl()}/api/products/${product.id}/images/${filename}`;
    }
    return 'assets/placeholder.jpg';
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }

  isProductAvailable(product: ProductDTO): boolean {
    return (product.stockQuantity > 0 || product.stockQuantity == null) && product.isActive;
  }

  openAddToCartModal(product: ProductDTO): void {
    const dialogRef = this.dialog.open(AddToCartModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { product },
      panelClass: 'add-to-cart-modal-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Optionally refresh cart count or show success message
        console.log('Product added to cart successfully');
      }
    });
  }

  quickViewProduct(product: ProductDTO): void {
    this.dialog.open(AddToCartModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { product },
      panelClass: 'add-to-cart-modal-panel'
    });
  }

  clearFilters(): void {
    this.selectedCategoryId = null;
    this.searchControl.setValue('');
    this.sortControl.setValue('default');
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
    this.applyFilters();
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  searchButtonClicked(): void {
    // Triggers the same logic as typing in the search bar
    this.applyFilters();
  }
}
