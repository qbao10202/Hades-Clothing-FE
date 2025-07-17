import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Category } from '../../models';
import { CategoryService } from '../../services/category.service';
import { CategoryFormModalComponent } from './category-form-modal.component';
import { DeleteConfirmationComponent } from '../shared/delete-confirmation.component';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-category-admin',
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss']
})
export class CategoryAdminComponent implements OnInit, AfterViewInit {
  categories: Category[] = [];
  dataSource = new MatTableDataSource<Category>();
  selection = new SelectionModel<Category>(true, []);
  loading = false;
  displayedColumns: string[] = ['select', 'image', 'name', 'createdAt', 'actions'];
  searchControl = new FormControl('');

  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    
    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadCategories();
      });
  }

  ngAfterViewInit() {
  }

  loadCategories(): void {
    this.loading = true;
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sort?.active || 'name',
      sortDir: this.sort?.direction || 'asc',
      search: this.searchControl.value || undefined
    };

    this.categoryService.getCategoriesWithPagination(params).subscribe({
      next: (response) => {
        if (response.content && Array.isArray(response.content)) {
          this.categories = response.content;
          this.totalItems = response.totalElements || response.content.length;
        } else {
          this.categories = response;
          this.totalItems = response.length;
        }
        this.dataSource.data = this.categories;
        this.loading = false;
        // If current page is not the first and no items, go back one page
        if (this.currentPage > 0 && this.categories.length === 0) {
          this.currentPage--;
          this.loadCategories();
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
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
    this.loadCategories();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadCategories();
  }

  applyFilter(): void {
    const filterValue = this.searchControl.value?.trim().toLowerCase() || '';
    this.dataSource.filter = filterValue;
  }

  addCategory(): void {
    const dialogRef = this.dialog.open(CategoryFormModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { 
        category: null, 
        parentCategories: this.categories 
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        let { categoryData, imageFile } = result;
        if (imageFile) {
          // We need to create the category first to get the ID
          this.categoryService.createCategory(categoryData).subscribe({
            next: async (newCategory) => {
              try {
                await this.categoryService.uploadCategoryImage(newCategory.id, imageFile).toPromise();
                // Fetch updated category to get imageUrl
                const updatedCategory = await this.categoryService.getCategory(newCategory.id).toPromise();
                if (updatedCategory && updatedCategory.imageUrl) {
                  categoryData.imageUrl = updatedCategory.imageUrl;
                }
                // Update the category with the imageUrl
                this.categoryService.updateCategory(newCategory.id, categoryData).subscribe({
                  next: () => {
                    this.loadCategories();
                    this.snackBar.open('Category added successfully!', 'Close', { duration: 3000 });
                  },
                  error: (error) => {
                    console.error('Error updating category with image:', error);
                    this.snackBar.open('Error updating category with image', 'Close', { duration: 3000 });
                  }
                });
              } catch (error) {
                console.error('Error uploading image:', error);
                this.loadCategories();
                this.snackBar.open('Category added (image not changed)', 'Close', { duration: 3000 });
              }
            },
            error: (error) => {
              console.error('Error creating category:', error);
              this.snackBar.open('Error creating category', 'Close', { duration: 3000 });
            }
          });
        } else {
          this.categoryService.createCategory(categoryData).subscribe({
            next: () => {
              this.loadCategories();
              this.snackBar.open('Category added successfully!', 'Close', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error creating category:', error);
              this.snackBar.open('Error creating category', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  editCategory(category: Category): void {
    const dialogRef = this.dialog.open(CategoryFormModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { 
        category: category, 
        parentCategories: this.categories.filter(c => c.id !== category.id) 
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        let { categoryData, imageFile } = result;
        // Preserve imageUrl if not changed
        if (!imageFile && category.imageUrl) {
          categoryData.imageUrl = category.imageUrl;
        }
        if (imageFile) {
          // First upload the image, get the new imageUrl
          try {
            const uploadResp: any = await this.categoryService.uploadCategoryImage(category.id, imageFile).toPromise();
            // The backend does not return the new imageUrl, so fetch the updated category
            const updatedCategory = await this.categoryService.getCategory(category.id).toPromise();
            if (updatedCategory && updatedCategory.imageUrl) {
              categoryData.imageUrl = updatedCategory.imageUrl;
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            this.snackBar.open('Error uploading image', 'Close', { duration: 3000 });
          }
        }
        this.categoryService.updateCategory(category.id, categoryData).subscribe({
          next: () => {
            this.loadCategories();
            this.snackBar.open('Category updated successfully!', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.snackBar.open('Error updating category', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete this category?`,
        itemName: category.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.dataSource.data = this.categories;
            this.snackBar.open('Category deleted successfully!', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.snackBar.open('Error deleting category', 'Close', { duration: 3000 });
          }
        });
      }
    });
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
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  // Bulk actions
  bulkDelete(): void {
    const selectedCategories = this.selection.selected;
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: { 
        title: 'Delete Categories', 
        message: `Are you sure you want to delete ${selectedCategories.length} categories?` 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const deletePromises = selectedCategories.map(category => 
          this.categoryService.deleteCategory(category.id).toPromise()
        );
        
        Promise.all(deletePromises).then(() => {
          this.loadCategories();
          this.selection.clear();
          this.snackBar.open('Categories deleted successfully!', 'Close', { duration: 3000 });
        }).catch(error => {
          console.error('Error deleting categories:', error);
          this.snackBar.open('Error deleting categories', 'Close', { duration: 3000 });
        });
      }
    });
  }

  bulkActivate(): void {
    const selectedCategories = this.selection.selected;
    const updatePromises = selectedCategories.map(category => 
      this.categoryService.updateCategory(category.id, { ...category, isActive: true }).toPromise()
    );
    
    Promise.all(updatePromises).then(() => {
      this.loadCategories();
      this.selection.clear();
      this.snackBar.open('Categories activated successfully!', 'Close', { duration: 3000 });
    }).catch(error => {
      console.error('Error activating categories:', error);
      this.snackBar.open('Error activating categories', 'Close', { duration: 3000 });
    });
  }

  bulkDeactivate(): void {
    const selectedCategories = this.selection.selected;
    const updatePromises = selectedCategories.map(category => 
      this.categoryService.updateCategory(category.id, { ...category, isActive: false }).toPromise()
    );
    
    Promise.all(updatePromises).then(() => {
      this.loadCategories();
      this.selection.clear();
      this.snackBar.open('Categories deactivated successfully!', 'Close', { duration: 3000 });
    }).catch(error => {
      console.error('Error deactivating categories:', error);
      this.snackBar.open('Error deactivating categories', 'Close', { duration: 3000 });
    });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads')) return `${this.getBackendBaseUrl()}${imageUrl}`;
    return `${this.getBackendBaseUrl()}/uploads/categories/${imageUrl}`;
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }
} 