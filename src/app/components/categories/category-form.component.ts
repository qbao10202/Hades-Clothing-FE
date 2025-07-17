import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Category } from '../../models';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: []
})
export class CategoryFormComponent implements OnInit {
  form: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  imageFile?: File;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category: Category | null }
  ) {
    this.form = this.fb.group({
      name: [data.category?.name || '', Validators.required],
      slug: [data.category?.slug || '', Validators.required],
      description: [data.category?.description || ''],
      isActive: [data.category?.isActive ?? true],
      sortOrder: [data.category?.sortOrder ?? 0],
    });
    if (data.category?.imageUrl) {
      this.imagePreview = data.category.imageUrl;
    }
  }

  ngOnInit() {}

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
      const category: Category = {
        id: this.data.category?.id ?? 0,
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        isActive: formValue.isActive,
        sortOrder: formValue.sortOrder,
        imageUrl: this.data.category?.imageUrl ?? '',
        parentId: this.data.category?.parentId ?? undefined,
        createdAt: this.data.category?.createdAt ?? new Date(),
      };
      this.dialogRef.close({ category, imageFile: this.imageFile });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 