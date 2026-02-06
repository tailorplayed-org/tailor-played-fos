// Application router configuration
// Routes will be added as features are implemented
import { createBrowserRouter } from 'react-router';
import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
  },
]);
