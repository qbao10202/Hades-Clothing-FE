import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DeleteConfirmationData {
  title: string;
  message: string;
  itemName?: string;
}

@Component({
  selector: 'app-delete-confirmation',
  template: `
    <div class="delete-confirmation-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
        <div *ngIf="data.itemName" class="item-name">
          <strong>{{ data.itemName }}</strong>
        </div>
        <p class="warning-text">This action cannot be undone.</p>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          Cancel
        </button>
        <button mat-raised-button color="warn" (click)="onDelete()" class="delete-btn">
          Delete
        </button>
      </div>
    </div>
  `,
  styles: [`
    .delete-confirmation-dialog {
      max-width: 400px;
      text-align: center;
      background: #232323;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 32px 24px 24px 24px;
    }
    
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .warning-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff5722;
      margin-bottom: 16px;
    }
    
    h2[mat-dialog-title] {
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    
    .dialog-content {
      margin-bottom: 20px;
      color: #e0e0e0;
    }
    
    .item-name {
      background: #fff;
      color: #232323;
      padding: 12px 0;
      border-radius: 8px;
      margin: 16px 0 10px 0;
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .warning-text {
      color: #ff9800;
      font-size: 15px;
      font-style: italic;
      margin-top: 10px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }
    
    .cancel-btn {
      color: #b0b0b0;
      background: #333;
      border-radius: 6px;
      font-weight: 500;
      padding: 8px 22px;
      font-size: 1rem;
      transition: background 0.2s;
    }
    
    .cancel-btn:hover {
      background: #444;
    }
    
    .delete-btn {
      background: #f44336;
      color: white;
      border-radius: 6px;
      font-weight: 600;
      padding: 8px 22px;
      font-size: 1rem;
      box-shadow: 0 2px 8px rgba(244,67,54,0.08);
      transition: background 0.2s;
    }
    
    .delete-btn:hover {
      background: #d32f2f;
    }
  `]
})
export class DeleteConfirmationComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDelete(): void {
    this.dialogRef.close(true);
  }
}
