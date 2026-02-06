// Application router configuration
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthGuard, LoginScreen } from '@/features/auth';
import App from './App';

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
        index: true,
        Component: App,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
