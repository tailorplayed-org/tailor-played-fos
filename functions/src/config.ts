import { defineSecret, defineString } from 'firebase-functions/params';

// Gmail OAuth credentials — stored as Firebase secrets
export const gmailClientId = defineSecret('GMAIL_CLIENT_ID');
export const gmailClientSecret = defineSecret('GMAIL_CLIENT_SECRET');
export const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN');

// Email config — used by Gmail watch renewal (Story 4.5)
export const gmailUserEmail = defineString('GMAIL_USER_EMAIL', {
  default: 'orders@tailorplayed.com',
});

// Paperless accountant email address — used by Gmail filter forwarding (Story 4.2)
// Actual forwarding handled by Gmail filters — this parameter is for documentation/reference
export const paperlessEmail = defineString('PAPERLESS_EMAIL', {
  default: '',
});

// Gemini AI config — used by processDocument Cloud Function (Story 4.3)
export const geminiApiKey = defineSecret('GEMINI_API_KEY');
