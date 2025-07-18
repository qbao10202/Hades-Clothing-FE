import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all`);
  }

  getCategoriesWithPagination(params: any = {}): Observable<any> {
    const defaultParams = {
      page: 0,
      size: 10,
      sortBy: 'name',
      sortDir: 'asc',
      ...params
    };

    // Filter out undefined values
    const filteredParams = Object.entries(defaultParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return this.http.get<any>(this.apiUrl, { params: filteredParams });
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadCategoryImage(categoryId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${categoryId}/image`, formData);
  }

  createCategoryWithImage(category: Partial<Category>, file?: File): Observable<Category> {
    const formData = new FormData();
    formData.append('category', JSON.stringify(category));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<Category>(`${this.apiUrl}/multipart`, formData);
  }

  updateCategoryWithImage(id: number, category: Partial<Category>, file?: File): Observable<Category> {
    const formData = new FormData();
    formData.append('category', JSON.stringify(category));
    if (file) {
      formData.append('file', file);
    }
    return this.http.put<Category>(`${this.apiUrl}/${id}/multipart`, formData);
  }
} 