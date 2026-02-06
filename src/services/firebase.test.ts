import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules before importing the service
const mockApp = { name: '[DEFAULT]' };
const mockAuth = { app: mockApp, name: 'auth' };
const mockDb = { app: mockApp, type: 'firestore' };
const mockStorage = { app: mockApp, type: 'storage' };

const mockInitializeApp = vi.fn(() => mockApp);
const mockGetAuth = vi.fn(() => mockAuth);
const mockGetFirestore = vi.fn(() => mockDb);
const mockGetStorage = vi.fn(() => mockStorage);

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
}));

vi.mock('firebase/storage', () => ({
  getStorage: mockGetStorage,
}));

describe('Firebase Service', () => {
  beforeEach(() => {
    vi.resetModules();
    mockInitializeApp.mockClear();
    mockGetAuth.mockClear();
    mockGetFirestore.mockClear();
    mockGetStorage.mockClear();
  });

  it('exports the initialized Firebase app', async () => {
    const { app } = await import('./firebase');
    expect(app).toBe(mockApp);
  });

  it('exports the Firebase Auth instance', async () => {
    const { auth } = await import('./firebase');
    expect(auth).toBe(mockAuth);
  });

  it('exports the Firestore instance', async () => {
    const { db } = await import('./firebase');
    expect(db).toBe(mockDb);
  });

  it('exports the Storage instance', async () => {
    const { storage } = await import('./firebase');
    expect(storage).toBe(mockStorage);
  });

  it('initializes Firebase app with initializeApp', async () => {
    await import('./firebase');
    expect(mockInitializeApp).toHaveBeenCalledOnce();
  });

  it('initializes Auth, Firestore, and Storage from the app', async () => {
    await import('./firebase');
    expect(mockGetAuth).toHaveBeenCalledOnce();
    expect(mockGetFirestore).toHaveBeenCalledOnce();
    expect(mockGetStorage).toHaveBeenCalledOnce();
  });
});
