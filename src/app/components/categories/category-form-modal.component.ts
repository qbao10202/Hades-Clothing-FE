import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryAdminComponent } from './category-admin.component';

@Component({
  selector: 'app-category-form-modal',
  templateUrl: './category-form-modal.component.html',
  styleUrls: ['./category-form-modal.component.scss']
})
export class CategoryFormModalComponent implements OnInit {
  categoryForm: FormGroup;
  activeTab = 'general';
  isEdit = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  parentCategories: Category[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    public dialogRef: MatDialogRef<CategoryFormModalComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { category?: Category }
  ) {
    this.isEdit = !!data?.category;
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadParentCategories();
    if (this.isEdit && this.data.category) {
      this.populateForm(this.data.category);
    }
  }

  private loadParentCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.parentCategories = categories;
      },
      error: (error) => {
        console.error('Error loading parent categories:', error);
      }
    });
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      parentCategory: [''],
      categoryName: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['active'],
      sortOrder: [0, [Validators.min(0)]],
      image: ['']
    });
  }

  private populateForm(category: Category): void {
    this.categoryForm.patchValue({
      parentCategory: category.parentId || '',
      categoryName: category.name || '',
      description: category.description || '',
      status: category.isActive ? 'active' : 'inactive',
      sortOrder: category.sortOrder || 0,
      image: category.imageUrl || ''
    });

    if (category.imageUrl) {
      this.imagePreview = this.getCategoryImageUrl(category);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      this.selectedImage = null;
      this.imagePreview = null;
    }
  }

  // Alias for onImageChange to maintain compatibility with both event handlers
  onFileSelected(event: Event): void {
    this.onImageChange(event);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.categoryForm.patchValue({ image: '' });
  }

  onSave(): void {
    console.log('onSave called');
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const categoryData: Partial<Category> = {
        name: formValue.categoryName,
        description: formValue.description || '',
        slug: formValue.categoryName ? formValue.categoryName.toLowerCase().replace(/\s+/g, '-') : '',
        sortOrder: formValue.sortOrder,
        isActive: formValue.status === 'active',
        parentId: formValue.parentCategory ? parseInt(formValue.parentCategory) : undefined
      };
      if (this.isEdit && this.data.category?.id) {
        this.updateCategory(categoryData);
      } else {
        this.createCategory(categoryData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }
private createCategory(categoryData: Partial<Category>): void {
    this.categoryService.createCategoryWithImage(categoryData, this.selectedImage || undefined).subscribe({
      next: (response) => {
          this.snackBar.open('Category added successfully!', 'Close', {
        duration: 3000
      });
        this.dialogRef.close(response);
        window.location.reload();
      },
      error: (error) => {
             this.snackBar.open('Failed to create category', 'Close', {
        duration: 3000
      });
        console.error('Error creating category:', error);
      }
    });
  }

  private updateCategory(categoryData: Partial<Category>): void {
    if (this.data.category?.id) {
      this.categoryService.updateCategoryWithImage(this.data.category.id, categoryData, this.selectedImage || undefined).subscribe({
        next: (response) => {
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error updating category:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getCategoryImageUrl(category: Category): string {
    if (!category || !category.id) {
      return 'assets/default-product.svg';
    }
    return `${this.getBackendBaseUrl()}/api/categories/${category.id}/image`;
  }

  getBackendBaseUrl(): string {
    return environment.apiUrl.replace(/\/api$/, '');
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be at least ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  get modalTitle(): string {
    return this.isEdit ? 'Edit Category' : 'Add Category';
  }

  get breadcrumbLabel(): string {
    return this.isEdit ? 'Edit' : 'Add';
  }
}
