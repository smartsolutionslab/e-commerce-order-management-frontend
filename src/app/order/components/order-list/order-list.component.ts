import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
        <div class="flex space-x-4">
          <!-- Status Filter -->
          <select 
            [(ngModel)]="selectedStatus" 
            (change)="onStatusChange()"
            class="border border-gray-300 rounded-md px-3 py-2">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <!-- Search -->
          <input
            type="text"
            placeholder="Search orders..."
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
            class="border border-gray-300 rounded-md px-3 py-2">
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let order of orders$ | async" 
                class="hover:bg-gray-50 cursor-pointer"
                (click)="viewOrder(order.id)">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{{ order.id.substring(0, 8) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.customerName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ order.totalAmount | currency:order.currency }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="getStatusClass(order.status)"
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ order.orderDate | date:'short' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  *ngIf="order.status === 'Confirmed'"
                  (click)="shipOrder($event, order.id)"
                  class="text-blue-600 hover:text-blue-900 mr-3">
                  Ship
                </button>
                <button 
                  *ngIf="order.status !== 'Cancelled' && order.status !== 'Delivered'"
                  (click)="cancelOrder($event, order.id)"
                  class="text-red-600 hover:text-red-900">
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to 
          {{ Math.min(currentPage * pageSize, totalCount) }} of 
          {{ totalCount }} results
        </div>
        <div class="flex space-x-2">
          <button 
            [disabled]="currentPage <= 1"
            (click)="previousPage()"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50">
            Previous
          </button>
          <button 
            [disabled]="currentPage >= totalPages"
            (click)="nextPage()"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  `
})
export class OrderListComponent implements OnInit {
  orders$: Observable<Order[]>;
  loading = false;
  searchTerm = '';
  selectedStatus = '';
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  Math = Math;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {
    this.orders$ = this.orderService.orders$;
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.loadOrders({
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      status: this.selectedStatus || undefined
    }).subscribe(() => {
      this.loading = false;
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  viewOrder(id: string): void {
    this.router.navigate(['/orders', id]);
  }

  shipOrder(event: Event, orderId: string): void {
    event.stopPropagation();
    if (confirm('Ship this order?')) {
      this.orderService.shipOrder(orderId).subscribe(() => {
        this.loadOrders();
      });
    }
  }

  cancelOrder(event: Event, orderId: string): void {
    event.stopPropagation();
    const reason = prompt('Cancellation reason:');
    if (reason) {
      this.orderService.cancelOrder(orderId, reason).subscribe(() => {
        this.loadOrders();
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }
}
