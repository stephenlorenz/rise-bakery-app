import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/storefront/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/storefront/menu/menu').then((m) => m.MenuComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/orders').then((m) => m.OrdersComponent),
  },
  {
    path: 'account/login',
    loadComponent: () =>
      import('./features/account/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'account/register',
    loadComponent: () =>
      import('./features/account/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/admin-products').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders').then((m) => m.AdminOrdersComponent),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./features/admin/schedule/admin-schedule').then((m) => m.AdminScheduleComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/admin/inventory/admin-inventory').then((m) => m.AdminInventoryComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
