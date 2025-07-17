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
        this.errorMessage = 'Không thể tải danh mục sản phẩm.';
        this.snackBar.open(this.errorMessage, 'Đóng', { duration: 4000 });
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
        this.errorMessage = 'Không thể tải sản phẩm.';
        this.snackBar.open(this.errorMessage, 'Đóng', { duration: 4000 });
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
            if (imageFile) {
              this.productService.uploadProductImage(created.id!, imageFile).subscribe(() => {
                this.dataSource.data = [created, ...this.dataSource.data];
                this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 3000 });
              });
            } else {
              this.dataSource.data = [created, ...this.dataSource.data];
              this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 3000 });
            }
          },
          error: (err: any) => {
            this.snackBar.open('Lỗi khi thêm sản phẩm', 'Đóng', { duration: 3000 });
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
            if (imageFile) {
              this.productService.uploadProductImage(updatedProduct.id!, imageFile).subscribe(() => {
                this.loadProducts();
                this.snackBar.open('Update product successfully', 'Close', { duration: 3000 });
              });
            } else {
              this.loadProducts();
              this.snackBar.open('Update product successfully', 'Close', { duration: 3000 });
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
            this.snackBar.open('Đã xóa sản phẩm', 'Đóng', { duration: 3000 });
          },
          error: (err: any) => {
            this.snackBar.open('Lỗi khi xóa sản phẩm', 'Đóng', { duration: 4000 });
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
        title: 'Xác nhận xóa sản phẩm',
        message: 'Điều này sẽ xóa vĩnh viễn các sản phẩm đã chọn khỏi kho của bạn.',
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
          this.snackBar.open(`Đã xóa thành công ${selectedProducts.length} sản phẩm`, 'Đóng', { duration: 3000 });
        }).catch((error: any) => {
          this.snackBar.open('Lỗi khi xóa một số sản phẩm', 'Đóng', { duration: 4000 });
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
            if (imageFile) {
              this.productService.uploadProductImage(created.id!, imageFile).subscribe(() => {
                this.loadProducts();
                this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 3000 });
              });
            } else {
              this.loadProducts();
              this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 3000 });
            }
          },
          error: (err: any) => {
            this.snackBar.open('Lỗi khi thêm sản phẩm', 'Đóng', { duration: 3000 });
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
    // First check if there's a direct imageUrl property
    if (product.imageUrl) {
      // If it's already a full URL, return it
      if (product.imageUrl.startsWith('http')) {
        return product.imageUrl;
      }
      // If it starts with /uploads, prefix with backend host
      if (product.imageUrl.startsWith('/uploads')) {
        return `${this.getBackendBaseUrl()}${product.imageUrl}`;
      }
      // Otherwise, construct the full URL
      return `${this.getBackendBaseUrl()}/api/uploads/products/${product.id}/${product.imageUrl}`;
    }
    
    // If no direct imageUrl, check images array
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
      const imageUrl = primaryImage.imageUrl;
      
      // If imageUrl is already a full URL, return it
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      
      // If imageUrl starts with /uploads, prefix with backend host
      if (imageUrl.startsWith('/uploads')) {
        return `${this.getBackendBaseUrl()}${imageUrl}`;
      }
      
      // Otherwise, construct the full URL
      return `${this.getBackendBaseUrl()}/api/uploads/products/${product.id}/${imageUrl}`;
    }
    
    // Return default image if no image found
    return '/assets/default-product.svg';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/default-product.svg';
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
}