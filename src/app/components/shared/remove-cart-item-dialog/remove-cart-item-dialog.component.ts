import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-remove-cart-item-dialog',
  templateUrl: './remove-cart-item-dialog.component.html',
  styleUrls: ['./remove-cart-item-dialog.component.scss']
})
export class RemoveCartItemDialogComponent {
  constructor(public dialogRef: MatDialogRef<RemoveCartItemDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onRemove(): void {
    this.dialogRef.close(true);
  }
} 