import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (must be first, before function imports)
initializeApp();

// Export Cloud Functions
export { onEmailReceived } from './email/onEmailReceived.js';
export { processDocument } from './ai/processDocument.js';
export { retryFailedProcessing } from './scheduled/retryFailedProcessing.js';
export { onTransactionStatusChanged } from './triggers/onTransactionApproved.js';
