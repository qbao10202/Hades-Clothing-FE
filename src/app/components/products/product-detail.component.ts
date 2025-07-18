import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductDTO } from '../../models';
import { ProductService } from '../../services/product.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  template: `
    <div class="container mx-auto px-4 py-8" *ngIf="product">
      <div class="flex flex-col md:flex-row gap-8">
        <div class="flex-1">
          <div class="main-image mb-4">
            <img [src]="getProductImageUrl(product)" [alt]="product.name" style="max-width: 100%; max-height: 400px; border-radius: 8px;" />
          </div>
          <div class="thumbnail-images flex gap-2" *ngIf="product.images.length > 1">
            <img *ngFor="let image of product.images" [src]="getImageUrl(image.imageUrl, product.id)" [alt]="product.name" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid #eee;" (click)="mainImage = image.imageUrl" />
          </div>
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-bold mb-2">{{ product.name }}</h1>
          <div class="text-lg mb-2">{{ product.price | currency:'VND':'symbol':'1.0-0' }}</div>
          <div class="mb-4" *ngIf="product.description">
            <p>{{ product.description }}</p>
          </div>
          <!-- Add more product details here -->
        </div>
      </div>
    </div>
    <div *ngIf="loading" class="text-center py-8">Loading...</div>
    <div *ngIf="error" class="text-center py-8 text-red-500">{{ error }}</div>
  `,
  styles: []
})
export class ProductDetailComponent implements OnInit {
  product: ProductDTO | null = null;
  mainImage: string | null = null;
  loading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private productService: ProductService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productService.getProduct(id).subscribe({
        next: (product) => {
          this.product = product;
          this.mainImage = product.images && product.images.length > 0 ? product.images[0].imageUrl : null;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Product not found.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid product ID.';
      this.loading = false;
    }
  }

  getProductImageUrl(product: ProductDTO): string {
    if (this.mainImage) {
      return this.getImageUrl(this.mainImage, product.id);
    }
    if (product.images && product.images.length > 0) {
      return this.getImageUrl(product.images[0].imageUrl, product.id);
    }
    return 'assets/placeholder.jpg';
  }

  getImageUrl(url: string, productId: number): string {
    return `${this.getBackendBaseUrl()}/api/products/${productId}/images/${url}`;
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
} 