import { Component, EventEmitter, Input, Output, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductDTO, Category } from '../../models';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: []
})
export class ProductFormComponent implements OnInit {
  @Output() save = new EventEmitter<{ product: ProductDTO, imageFile?: File }>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  imageFile?: File;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { product: ProductDTO | null, categories: Category[] }
  ) {
    this.categories = data.categories;
    this.form = this.fb.group({
      productCode: [data.product?.productCode || '', Validators.required],
      name: [data.product?.name || '', Validators.required],
      slug: [data.product?.slug || '', Validators.required],
      description: [data.product?.description || ''],
      price: [data.product?.price || '', [Validators.required, Validators.min(0)]],
      cost: [data.product?.cost || '', [Validators.required, Validators.min(0)]],
      categoryId: [data.product?.categoryId != null ? data.product.categoryId : (data.categories[0]?.id ?? 1), Validators.required],
      stockQuantity: [data.product?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
      isActive: [data.product?.isActive ?? true],
      minStockLevel: [data.product?.minStockLevel ?? 0],
      maxStockLevel: [data.product?.maxStockLevel ?? 0],
    });
    if (data.product?.images && data.product.images.length > 0) {
      this.imagePreview = data.product.images[0].imageUrl;
    }
  }

  ngOnInit(): void {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  submit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const product: ProductDTO = {
        id: this.data.product?.id ?? 0,
        productCode: formValue.productCode,
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        price: formValue.price,
        cost: formValue.cost,
        categoryId: +formValue.categoryId,
        stockQuantity: formValue.stockQuantity,
        isActive: formValue.isActive,
        minStockLevel: formValue.minStockLevel,
        maxStockLevel: formValue.maxStockLevel
      } as ProductDTO;
      this.save.emit({ product, imageFile: this.imageFile });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
} 