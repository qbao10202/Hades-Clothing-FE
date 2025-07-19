import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductDTO, Category } from '../../models';

@Component({
  selector: 'app-product-form-modal',
  templateUrl: './product-form-modal.component.html',
  styleUrls: ['./product-form-modal.component.scss']
})
export class ProductFormModalComponent implements OnInit {
  productForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  imageFile?: File;
  categories: Category[] = [];
  parentCategories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product: ProductDTO | null, categories: Category[] }
  ) {
    this.categories = data.categories || [];
    this.parentCategories = data.categories || [];
    
    this.productForm = this.fb.group({
      productCode: [data.product?.productCode || '', Validators.required],
      name: [data.product?.name || '', Validators.required],
      slug: [data.product?.slug || '', Validators.required],
      description: [data.product?.description || ''],
      price: [data.product?.price || '', [Validators.min(0)]], // Removed required
      cost: [data.product?.cost || '', [Validators.min(0)]], // Removed required
      salePrice: [data.product?.salePrice || ''],
      categoryId: [data.product?.categoryId != null ? data.product.categoryId : (data.categories[0]?.id ?? 1)], // Removed required
      stockQuantity: [data.product?.stockQuantity || 100, [Validators.min(0)]], // Removed required
      minStockLevel: [data.product?.minStockLevel || 0],
      maxStockLevel: [data.product?.maxStockLevel || 1000],
      // weight and dimensions removed
      brand: [data.product?.brand || ''],
      color: [data.product?.color || ''],
      size: [data.product?.size || ''],
      material: [data.product?.material || ''],
      tags: [data.product?.tags || ''],
      isActive: [data.product?.isActive ?? true]
    });

    if (data.product?.images && data.product.images.length > 0) {
      this.imagePreview = data.product.images[0].imageUrl;
    }
  }

  ngOnInit(): void {
    // Generate slug from name
    this.productForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.data.product) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        this.productForm.get('slug')?.setValue(slug);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSave() {
    console.log('Save button clicked');
    console.log('Form valid:', this.productForm.valid);
    console.log('Form value:', this.productForm.value);
    
    const formValue = this.productForm.value;
    const product: ProductDTO = {
      id: this.data.product?.id ?? 0,
      productCode: formValue.productCode,
      name: formValue.name,
      slug: formValue.slug,
      description: formValue.description,
      price: formValue.price,
      cost: formValue.cost,
      salePrice: formValue.salePrice || null,
      categoryId: +formValue.categoryId,
      stockQuantity: formValue.stockQuantity,
      minStockLevel: formValue.minStockLevel||0,
      maxStockLevel: formValue.maxStockLevel||1000,
      brand: formValue.brand || null,
      color: formValue.color || null,
      size: formValue.size || null,
      material: formValue.material || null,
      tags: formValue.tags || null,
      isActive: formValue.isActive || true
    } as ProductDTO;
    
    console.log('Product to save:', product);
    this.dialogRef.close({ product, imageFile: this.imageFile });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
