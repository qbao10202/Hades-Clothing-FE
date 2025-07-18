import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models';
import { map } from 'rxjs/operators';

function toUtcISOString(date: Date | string): string {
  let d = date;
  if (typeof d === 'string') d = new Date(d);
  return d.toISOString(); // Always UTC
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/admin/orders`;
  private cartApiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  placeOrder(orderData: any): Observable<Order> {
    return this.http.post<Order>(`${this.cartApiUrl}/checkout`, orderData);
  }

  // For users to get their own orders
  getUserOrders(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/user/orders?page=${page}&size=${size}`);
  }

  // For users to get a specific order
  getUserOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/user/orders/${id}`);
  }

  // Cancel order (only if pending)
  cancelOrder(id: number): Observable<Order> {
    return this.http.put<Order>(`${environment.apiUrl}/user/orders/${id}/cancel`, {});
  }

  // Admin/Seller methods
  getAllOrders(params: any = {}): Observable<any> {
    const defaultParams = {
      page: 0,
      size: 10,
      sortBy: 'orderDate',
      sortDir: 'desc',
      ...params
    };

    // Map searchControl/query to 'search' for backend compatibility
    if (defaultParams.searchControl) {
      defaultParams.search = defaultParams.searchControl;
      delete defaultParams.searchControl;
    }
    if (defaultParams.query) {
      defaultParams.search = defaultParams.query;
      delete defaultParams.query;
    }

    // Fix: Map customerName to customer.contactPerson for backend compatibility
    if (defaultParams.sortBy === 'customerName') {
      defaultParams.sortBy = 'customer.contactPerson';
    }

    // Format startDate and endDate for Spring compatibility
    if (defaultParams.startDate) {
      defaultParams.startDate = toUtcISOString(defaultParams.startDate);
    }
    if (defaultParams.endDate) {
      defaultParams.endDate = toUtcISOString(defaultParams.endDate);
    }

    // Filter out undefined values
    const filteredParams = Object.entries(defaultParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryParams = new URLSearchParams(filteredParams as any).toString();
    console.log('Requesting orders with URL:', `${this.apiUrl}?${queryParams}`);
    
    return this.http.get<any>(`${this.apiUrl}?${queryParams}`).pipe(
      map(response => {
        console.log('Raw API response:', response);
        // If response is an array, wrap it in a paginated format
        if (Array.isArray(response)) {
          return {
            content: response,
            totalElements: response.length,
            number: defaultParams.page,
            size: defaultParams.size,
            totalPages: Math.ceil(response.length / defaultParams.size)
          };
        }
        // If response is already paginated, return as is
        return response;
      })
    );
  }

  getOrderStatistics(startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): Observable<any> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', toUtcISOString(startDate));
    }
    if (endDate) {
      params.append('endDate', toUtcISOString(endDate));
    }
    
    return this.http.get<any>(`${this.apiUrl}/statistics?${params.toString()}`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    // Use the endpoint that returns a full OrderResponseDTO
    return this.http.put<any>(`${this.apiUrl}/${id}/status?status=${status}`, null).pipe(
      map((response: any) => {
        // If the response is a DTO, map it to the Order model
        if (response && response.orderItems) {
          return {
            ...response,
            orderItems: response.orderItems,
            customerName: response.customerName,
            customerEmail: response.customerEmail,
            customerPhone: response.customerPhone,
            shippingAddress: response.shippingAddress,
            shippingMethod: response.shippingMethod,
            shippingStatus: response.shippingStatus,
            paymentStatus: response.paymentStatus,
            subtotal: response.subtotal,
            taxAmount: response.taxAmount,
            shippingAmount: response.shippingAmount,
            discountAmount: response.discountAmount,
            totalAmount: response.totalAmount,
            currency: response.currency,
            trackingNumber: response.trackingNumber,
            notes: response.notes,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt
          };
        }
        return response;
      })
    );
  }

  updatePaymentStatus(id: number, paymentStatus: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}/payment-status?paymentStatus=${paymentStatus}`, {});
  }

  updateShippingStatus(id: number, shippingStatus: string, trackingNumber?: string): Observable<Order> {
    const params = trackingNumber ? `?shippingStatus=${shippingStatus}&trackingNumber=${trackingNumber}` : `?shippingStatus=${shippingStatus}`;
    return this.http.put<Order>(`${this.apiUrl}/${id}/shipping-status${params}`, {});
  }

  searchOrders(query: string, page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search?query=${query}&page=${page}&size=${size}`);
  }

  addOrderNotes(id: number, notes: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}/notes`, { notes });
  }
}