import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase config — these keys are public by design.
// Security is enforced via Firebase Security Rules, not by hiding keys.
const firebaseConfig = {
  apiKey: "AIzaSyALUuuY7LAsJBoAZ5ZkG4IDMpiTxLQCQwo",
  authDomain: "study-space-aeb52.firebaseapp.com",
  projectId: "study-space-aeb52",
  storageBucket: "study-space-aeb52.firebasestorage.app",
  messagingSenderId: "687334363975",
  appId: "1:687334363975:web:14ff583b0a5a99f962b262",
};

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export const isFirebaseConfigured = true;
export { app, auth, db };
