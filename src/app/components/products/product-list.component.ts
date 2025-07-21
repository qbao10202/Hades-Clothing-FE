import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductDTO, Category } from '../../models';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Component as NgComponent, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddToCartModalComponent } from '../shared/add-to-cart-modal.component';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Product {
  id: number;
  productCode: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  cost: number;
  salePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  categoryId: number;
  category: Category;
  brand: string;
  color: string;
  size: string;
  material: string;
  tags: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: any[];
  reviews: any[];
}

function mapProductDTOToProduct(dto: any): Product {
  return {
    id: dto.id,
    productCode: dto.productCode,
    name: dto.name,
    slug: dto.slug,
    description: dto.description,
    shortDescription: dto.shortDescription,
    price: dto.price,
    cost: dto.cost,
    salePrice: dto.salePrice,
    stockQuantity: dto.stockQuantity,
    minStockLevel: dto.minStockLevel || 0,
    maxStockLevel: dto.maxStockLevel || 0,
    categoryId: dto.categoryId,
    category: dto.category,
    brand: dto.brand,
    color: dto.color,
    size: dto.size,
    material: dto.material,
    tags: Array.isArray(dto.tags) ? dto.tags.join(',') : (dto.tags || ''),
    isActive: dto.isActive,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
    images: dto.images || [],
    reviews: dto.reviews || [],
  };
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: ProductDTO[] = [];
  filteredProducts: ProductDTO[] = [];
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  searchQuery = '';
  sortBy = 'name';
  cartItemCount = 0;
  private sub: Subscription = new Subscription();

  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.sub.add(
      this.productService.getCategories().subscribe(categories => {
        this.categories = categories;
        this.route.queryParams.subscribe(params => {
          const categoryId = +params['category'];
          if (categoryId) {
            this.selectedCategory = this.categories.find(c => c.id === categoryId) || null;
            this.productService.getProductsByCategory(categoryId).subscribe(products => {
              this.products = products;
              this.filteredProducts = [...products];
              this.applyFilters();
              console.log('Products loaded:', products.map(p => ({ name: p.name, stockQuantity: p.stockQuantity, isActive: p.isActive })));
            });
          } else {
            this.selectedCategory = null;
            this.productService.getProducts().subscribe(products => {
              this.products = products;
              this.filteredProducts = [...products];
              this.applyFilters();
              console.log('All products loaded:', products.map(p => ({ name: p.name, stockQuantity: p.stockQuantity, isActive: p.isActive })));
            });
          }
        });
      })
    );
    // Subscribe to cart item count
    this.sub.add(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  addToCart(product: ProductDTO) {
    const mapped = mapProductDTOToProduct(product);
    if (!mapped.id) {
      this.snackBar.open('Cannot add to cart: Product ID is missing.', 'Close', { duration: 2500, panelClass: 'snackbar-error' });
      return;
    }
    this.cartService.addToCart(mapped, 1).subscribe({
      next: () => {
        this.snackBar.open(`${product.name} added to cart successfully!`, 'Close', {
          duration: 2500,
          panelClass: 'snackbar-success'
        });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 2500, panelClass: 'snackbar-error' });
      }
    });
  }

  isOutOfStock(product: ProductDTO): boolean {
    const stockQty = Number(product.stockQuantity) || 0;
    const isActive = product.isActive !== false; // Default to true if undefined
    const result = !isActive || stockQty <= 0;
    console.log(`Product ${product.name}: isActive=${product.isActive} (${typeof product.isActive}), stockQuantity=${product.stockQuantity} (${typeof product.stockQuantity}), parsed stockQty=${stockQty}, computed isActive=${isActive}, isOutOfStock=${result}`);
    return result;
  }

  getProductImageUrl(product: ProductDTO): string {
    if (product.images && product.images.length > 0) {
      const filename = product.images[0].imageUrl;
      return `${this.getBackendBaseUrl()}/api/products/${product.id}/images/${filename}`;
    }
    return 'assets/placeholder.jpg';
  }

  openImageModal(product: ProductDTO) {
    this.dialog.open(ProductImageModalComponent, {
      data: product,
      width: '600px'
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
    }

    this.filteredProducts = filtered;
  }

  shopAll() {
    this.selectedCategory = null;
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      this.filteredProducts = [...products];
      this.applyFilters();
    });
  }

  reloadProducts() {
    if (this.selectedCategory) {
      this.productService.getProductsByCategory(this.selectedCategory.id).subscribe(products => {
        this.products = products;
        this.filteredProducts = [...products];
        this.applyFilters();
      });
    } else {
      this.productService.getProducts().subscribe(products => {
        this.products = products;
        this.filteredProducts = [...products];
        this.applyFilters();
      });
    }
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}

@NgComponent({
  selector: 'app-product-image-modal',
  template: `
    <div class="quickview-modal">
      <div class="quickview-header">
        <h2>{{ data.name }}</h2>
        <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
      </div>
      <div class="quickview-body">
        <div class="quickview-image-col">
          <img [src]="getImageUrl(data.images[0]?.imageUrl)" [alt]="data.name" class="quickview-image" />
        </div>
        <div class="quickview-details-col">
          <div class="quickview-title">{{ data.name }}</div>
          <div class="quickview-price">{{ data.salePrice || data.price | currency:'VND':'symbol':'1.0-0' }}
            <span *ngIf="data.salePrice && data.salePrice < data.price" class="quickview-original-price">{{ data.price | currency:'VND':'symbol':'1.0-0' }}</span>
          </div>
          <div class="quickview-description">{{ data.description }}</div>
          <div class="quickview-size">
            <label>Size:</label>
            <div class="size-btn-group">
              <button *ngFor="let size of sizes" (click)="selectedSize = size" [class.selected]="selectedSize === size" class="size-btn">{{ size }}</button>
            </div>
          </div>
          <div class="quickview-quantity">
            <label>Quantity:</label>
            <div class="quantity-group">
              <button (click)="decrementQty()" class="qty-btn">-</button>
              <input type="number" min="1" [(ngModel)]="quantity" class="qty-input" />
              <button (click)="incrementQty()" class="qty-btn">+</button>
            </div>
          </div>
          <button mat-raised-button color="primary" (click)="addToCart()" class="add-to-cart-modal-btn">Add to Cart</button>
        </div>
 
  `,
  styles: [`
    .quickview-modal {
      max-width: 800px;
      width: 100%;
      background: #fff;
      border-radius: 18px;
      padding: 32px 32px 24px 32px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .quickview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .close-btn {
      color: #888;
    }
    .quickview-body {
      display: flex;
      gap: 32px;
      align-items: flex-start;
    }
    .quickview-image-col {
      flex: 0 0 260px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .quickview-image {
      width: 240px;
      height: 240px;
      object-fit: cover;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      background: #f8f8f8;
    }
    .quickview-details-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .quickview-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .quickview-price {
      font-size: 1.3rem;
      font-weight: 600;
      color: #28a745;
      margin-bottom: 4px;
    }
    .quickview-original-price {
      font-size: 1rem;
      color: #888;
      text-decoration: line-through;
      margin-left: 10px;
    }
    .quickview-description {
      color: #444;
      font-size: 1rem;
      margin-bottom: 8px;
    }
    .quickview-size label {
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
    }
    .size-btn-group {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }
    .size-btn {
      padding: 7px 18px;
      border-radius: 6px;
      border: 1.5px solid #bbb;
      background: #f8f8f8;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s;
    }
    .size-btn.selected, .size-btn:hover {
      background: #007bff;
      color: #fff;
      border-color: #007bff;
    }
    .quickview-quantity label {
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
    }
    .quantity-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
    .qty-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1.5px solid #bbb;
      background: #f8f8f8;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.18s;
    }
    .qty-btn:hover {
      background: #007bff;
      color: #fff;
      border-color: #007bff;
    }
    .qty-input {
      width: 48px;
      text-align: center;
      font-size: 1.1rem;
      border-radius: 6px;
      border: 1.5px solid #bbb;
      padding: 4px 0;
      background: #fff;
    }
    .add-to-cart-modal-btn {
      margin-top: 18px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      padding: 12px 0;
    }
    .quickview-extra-info {
      margin-top: 18px;
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
      color: #555;
      font-size: 0.98rem;
    }
    @media (max-width: 900px) {
      .quickview-modal { max-width: 98vw; padding: 18px; }
      .quickview-body { flex-direction: column; gap: 18px; }
      .quickview-image-col { justify-content: flex-start; }
      .quickview-image { width: 180px; height: 180px; }
    }
  `]
})
export class ProductImageModalComponent {
  quantity = 1;
  selectedSize: string | null = null;
  sizes: string[] = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private cartService: CartService, private snackBar: MatSnackBar) {
    this.sizes = data.sizes || ['S', 'M', 'L', 'XL'];
  }
  getImageUrl(url: string): string {
    if (url && this.data && this.data.id) {
      return `${this.getBackendBaseUrl()}/api/products/${this.data.id}/images/${url}`;
    }
    return 'assets/placeholder.jpg';
  }
  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
  incrementQty() { this.quantity++; }
  decrementQty() { if (this.quantity > 1) this.quantity--; }
  addToCart() {
    if (!this.selectedSize) {
      this.snackBar.open('Please select a size', 'Close', { duration: 2000, panelClass: 'snackbar-error' });
      return;
    }
    const mapped = mapProductDTOToProduct(this.data);
    if (!mapped.id) {
      this.snackBar.open('Cannot add to cart: Product ID is missing.', 'Close', { duration: 2000, panelClass: 'snackbar-error' });
      return;
    }
    this.cartService.addToCart({ ...mapped, size: this.selectedSize }, this.quantity).subscribe({
      next: () => {
        this.snackBar.open(`${this.data.name} added to cart!`, 'Close', { duration: 2000, panelClass: 'snackbar-success' });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 2000, panelClass: 'snackbar-error' });
      }
    });
  }
}