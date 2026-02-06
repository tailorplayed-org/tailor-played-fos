// Firebase Auth service layer
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

// Whitelist of authorized UIDs (Gal + Ben)
// IMPORTANT: Replace with actual UIDs in .env.local via VITE_WHITELISTED_UIDS
const WHITELISTED_UIDS: string[] = import.meta.env.VITE_WHITELISTED_UIDS
  ? (import.meta.env.VITE_WHITELISTED_UIDS as string).split(',').map((s) => s.trim())
  : ['REPLACE_WITH_GAL_UID', 'REPLACE_WITH_BEN_UID'];

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  if (!WHITELISTED_UIDS.includes(result.user.uid)) {
    // Unauthorized user — sign out immediately
    await firebaseSignOut(auth);
    console.error('Rejected auth attempt:', result.user.email, result.user.uid);
    throw new Error('Access restricted to authorized users');
  }
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(
  callback: (user: User | null) => void,
): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser && !WHITELISTED_UIDS.includes(firebaseUser.uid)) {
      // Non-whitelisted user session restored — sign out silently
      console.warn(
        'Non-whitelisted session detected, signing out:',
        firebaseUser.email,
      );
      firebaseSignOut(auth).catch(console.error);
      callback(null);
      return;
    }
    callback(firebaseUser);
  });
}
