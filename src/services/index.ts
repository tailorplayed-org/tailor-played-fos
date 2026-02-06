// Services barrel export
export { app, auth, db, storage } from './firebase';
export { db as firestoreDb } from './firestore';
export { storage as firebaseStorage } from './storage';
export {
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
} from './auth';
