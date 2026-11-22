import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'accounts',
    loadComponent: () => import('./accounts/accounts.page').then((m) => m.AccountsPage),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.page').then((m) => m.UsersPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];