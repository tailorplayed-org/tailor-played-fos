import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (must be first, before function imports)
initializeApp();

// Export Cloud Functions
export { onEmailReceived } from './email/onEmailReceived.js';
