import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
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
export class ProductAdminComponent implements OnInit {
  displayedColumns: string[] = ['select', 'product', 'category', 'stock', 'price', 'actions'];
  dataSource = new MatTableDataSource<ProductDTO>();
  selection = new SelectionModel<ProductDTO>(true, []);
  categories: Category[] = [];
  filterCategory: number | null = null;
  searchText = '';
  errorMessage: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.productService.getCategories().subscribe({
      next: (cats: Category[]) => this.categories = cats,
      error: (err: any) => {
        this.errorMessage = 'Can not loading categories.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
      }
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (products: ProductDTO[]) => {
        let filtered = products;
        if (this.filterCategory) {
          filtered = filtered.filter(p => p.categoryId === this.filterCategory);
        }
        if (this.searchText) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(this.searchText.toLowerCase()));
        }
        this.dataSource.data = filtered;
        this.dataSource.paginator = this.paginator;
        this.errorMessage = '';
      },
      error: (err: any) => {
        this.errorMessage = 'Can not loading products.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
      }
    });
  }

  applyFilter() {
    this.loadProducts();
  }

  filterByCategory(categoryId: number | null) {
    this.filterCategory = categoryId;
    this.loadProducts();
  }

  clearFilter() {
    this.filterCategory = null;
    this.searchText = '';
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
            // Show notification and update data source immediately after product creation
            this.snackBar.open('Product added successfully', 'Close', { duration: 3000 });
            this.dataSource.data = [created, ...this.dataSource.data];
            
            // Handle image upload silently in the background (if any)
            if (imageFile) {
              this.productService.uploadProductImage(created.id!, imageFile).subscribe({
                next: () => {
                  // Refresh to show the new image (silently)
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
            // Show notification and update data source immediately after product update
            this.snackBar.open('Update product successfully', 'Close', { duration: 3000 });
                this.dataSource.data = this.dataSource.data.map((p: ProductDTO) => 
                  p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
                );
            
            // Handle image upload silently in the background (if any)
            if (imageFile) {
              this.productService.uploadProductImage(updatedProduct.id!, imageFile).subscribe({
                next: () => {
                  // Refresh to show the new image (silently)
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
            this.snackBar.open('Error updating product', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteProduct(product: ProductDTO) {
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: {
        title: 'Delete product',
        message: 'Are you sure you want to delete this product?',
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
        title: 'Delete  product?',
        message: 'Delete the selected products?',
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
    const cat = this.categories.find((c: Category) => c.id === categoryId);
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
      const filename = product.images[0].imageUrl;
      return `${this.getBackendBaseUrl()}/api/products/${product.id}/images/${filename}`;
    }
    return 'assets/default-product.svg';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/default-product.svg';
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}
