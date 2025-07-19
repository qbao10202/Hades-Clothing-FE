import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { ProductDTO, Category } from '../../models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductFormModalComponent } from './product-form-modal.component';
import { DeleteConfirmationComponent } from '../shared/delete-confirmation.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-admin',
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.scss']
})
export class ProductAdminComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'product', 'category', 'stock', 'price', 'actions'];
  dataSource = new MatTableDataSource<ProductDTO>();
  selection = new SelectionModel<ProductDTO>(true, []);
  categories: Category[] = [];
  filterCategory: number | null = null;
  searchControl = new FormControl('');
  errorMessage: string = '';

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCategories();
    
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadProducts();
      });
  }

  ngAfterViewInit() {
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (cats: Category[]) => {
        this.categories = cats;
        console.log('Loaded categories:', this.categories);
        (window as any).categories = cats; // Make categories available in browser console
        this.loadProducts(); // Load products only after categories are loaded
      },
      error: (err: any) => {
        this.errorMessage = 'Can not loading categories.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
      }
    });
  }

  loadProducts() {
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sort?.active || 'name',
      sortDir: this.sort?.direction || 'asc',
      search: this.searchControl.value || undefined
    };

    this.productService.getProductsWithPagination(params).subscribe({
      next: (response: any) => {
        let products: ProductDTO[] = [];
        
        if (response.content && Array.isArray(response.content)) {
          products = response.content;
          this.totalItems = response.totalElements || response.content.length;
        } else {
          products = response;
          this.totalItems = response.length;
        }
        console.log('Loaded products:', products);

        // Apply category filter if set
        if (this.filterCategory) {
          products = products.filter(p => p.categoryId == this.filterCategory);
        }

        this.dataSource.data = products;
        this.errorMessage = '';
        // If current page is not the first and no items, go back one page
        if (this.currentPage > 0 && products.length === 0) {
          this.currentPage--;
          this.loadProducts();
        }
      },
      error: (err: any) => {
        this.errorMessage = 'Can not loading products.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    // If pageSize changes, reset to first page
    if (event.pageSize !== this.pageSize) {
      this.currentPage = 0;
    } else {
      this.currentPage = event.pageIndex;
    }
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  applyFilter() {
    this.currentPage = 0;
    this.loadProducts();
  }

  filterByCategory(categoryId: number | null) {
    this.filterCategory = categoryId;
    this.currentPage = 0;
    this.loadProducts();
  }

  clearFilter() {
    this.filterCategory = null;
    this.searchControl.setValue('');
    this.currentPage = 0;
    this.loadProducts();
  }

  addProduct() {
    const dialogRef = this.dialog.open(ProductFormModalComponent, {
      width: '800px',
      data: { product: null, categories: this.categories },
      autoFocus: false,
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const { product, imageFile } = result;
        this.productService.createProduct(product).subscribe({
          next: (created: ProductDTO) => {
            // Show notification and refresh immediately after product creation
            this.snackBar.open('Add product successfully', 'Close', { duration: 3000 });
            this.loadProducts();
            
            // Handle image upload silently in the background (if any)
            if (imageFile) {
              this.productService.uploadProductImage(created.id!, imageFile).subscribe({
                next: () => {
                  // Refresh again after image upload to show the new image (silently)
                  this.loadProducts();
                },
                error: (err: any) => {
                  console.error('Error uploading image:', err);
                  // Only show error notification if image upload fails
                  this.snackBar.open('Product created but image upload failed', 'Close', { duration: 3000 });
                }
              });
            }
          },
          error: (err: any) => {
            this.snackBar.open('Error adding product', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  editProduct(product: ProductDTO) {
    const dialogRef = this.dialog.open(ProductFormModalComponent, {
      width: '800px',
      data: { product, categories: this.categories },
      autoFocus: false,
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const { product: updated, imageFile } = result;
        this.productService.updateProduct(product.id!, updated).subscribe({
          next: (updatedProduct: ProductDTO) => {
            // Show notification and refresh immediately after product update
            this.snackBar.open('Update product successfully', 'Close', { duration: 3000 });
            this.loadProducts();
            
            // Handle image upload silently in the background (if any)
            if (imageFile) {
              this.productService.uploadProductImage(updatedProduct.id!, imageFile).subscribe({
                next: () => {
                  // Refresh again after image upload to show the new image (silently)
                this.loadProducts();
                },
                error: (err: any) => {
                  console.error('Error uploading image:', err);
                  // Only show error notification if image upload fails
                  this.snackBar.open('Product updated but image upload failed', 'Close', { duration: 3000 });
                }
              });
            }
          },
          error: (err: any) => {
            this.snackBar.open('Error when update product', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteProduct(product: ProductDTO) {
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: {
        title: 'Delete product?',
        message: 'Are you confirm to delete this product?',
        itemName: product.name
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.productService.deleteProduct(product.id!).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter((p: ProductDTO) => p.id !== product.id);
            this.snackBar.open('Deleted product!', 'Close', { duration: 3000 });
          },
          error: (err: any) => {
            this.snackBar.open('Error deleting product', 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  deleteSelectedProducts() {
    const selectedProducts = this.selection.selected;
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: {
        title: 'Confirm delete selected products?',
        message: 'This will permanently delete the selected products from your inventory.',
        itemName: selectedProducts.map((p: ProductDTO) => p.name).join(', ')
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // Xóa từng sản phẩm một
        const deletePromises = selectedProducts.map((product: ProductDTO) => 
          this.productService.deleteProduct(product.id!).toPromise()
        );

        Promise.all(deletePromises).then(() => {
          this.dataSource.data = this.dataSource.data.filter((p: ProductDTO) => 
            !selectedProducts.some((selected: ProductDTO) => selected.id === p.id)
          );
          this.selection.clear();
          this.snackBar.open(`Deleted ${selectedProducts.length} products successfully`, 'Close', { duration: 3000 });
        }).catch((error: any) => {
          this.snackBar.open('Error deleting some products', 'Close', { duration: 4000 });
        });
      }
    });
  }

  openAddProductDialog() {
    const dialogRef = this.dialog.open(ProductFormModalComponent, {
      width: '800px',
      data: { product: null, categories: this.categories },
      autoFocus: false,
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const { product, imageFile } = result;
        this.productService.createProduct(product).subscribe({
          next: (created: ProductDTO) => {
            // Show notification and refresh immediately after product creation
            this.snackBar.open('Add product successfully', 'Close', { duration: 3000 });
            this.loadProducts();
            
            // Handle image upload silently in the background (if any)
            if (imageFile) {
              this.productService.uploadProductImage(created.id!, imageFile).subscribe({
                next: () => {
                  // Refresh again after image upload to show the new image (silently)
                this.loadProducts();
                },
                error: (err: any) => {
                  console.error('Error uploading image:', err);
                  // Only show error notification if image upload fails
                  this.snackBar.open('Product created but image upload failed', 'Close', { duration: 3000 });
                }
              });
            }
          },
          error: (err: any) => {
            this.snackBar.open('Error adding product', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  getCategoryName(categoryId: number): string {
    // Support both paginated and flat array responses
    const cats = Array.isArray((this.categories as any).content)
      ? (this.categories as any).content
      : this.categories;
    if (!categoryId || !Array.isArray(cats)) return '';
    const cat = cats.find((c: Category) => c.id == categoryId);
    return cat ? cat.name : '';
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach((row: ProductDTO) => this.selection.select(row));
  }

  // Image URL helper
  getProductImageUrl(product: ProductDTO): string {
    if (product.images && product.images.length > 0) {
      let filename = product.images[0].imageUrl;
      // Remove any leading /uploads/ from filename
      if (filename.startsWith('/uploads/')) {
        filename = filename.substring('/uploads/'.length);
      }
      return `${this.getBackendBaseUrl()}/api/products/${product.id}/images/${filename}`;
    }
    return 'assets/default-product.svg';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-product.svg';
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}