// Application router configuration
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthGuard, LoginScreen } from '@/features/auth';
import { PageShell } from '@/components/Layout';
import { DashboardPage } from '@/features/dashboard';
import { WorkOrdersPage, WorkOrderDetailPage } from '@/features/work-orders';
import { InventoryPage } from '@/features/inventory';
import { OverheadPage } from '@/features/overhead';
import { ReviewPage } from '@/features/review';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginScreen,
  },
  {
    path: '/',
    Component: AuthGuard,
    children: [
      {
        Component: PageShell,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'work-orders', Component: WorkOrdersPage },
          { path: 'work-orders/:id', Component: WorkOrderDetailPage },
          { path: 'inventory', Component: InventoryPage },
          { path: 'overhead', Component: OverheadPage },
          { path: 'review', Component: ReviewPage },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
