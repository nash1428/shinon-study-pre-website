import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;
let adminInitialized = false;

function initAdmin() {
  if (adminInitialized) return;
  adminInitialized = true;

  try {
    // Try to initialize with service account env var (if provided)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      const app: App = getApps().length === 0
        ? initializeApp({ credential: cert(serviceAccount) })
        : getApps()[0];
      adminDb = getFirestore(app);
      console.log("[firebase-admin] Initialized with service account");
      return;
    }

    // Try Application Default Credentials (works on Google Cloud / bld)
    const app: App = getApps().length === 0 ? initializeApp() : getApps()[0];
    adminDb = getFirestore(app);
    console.log("[firebase-admin] Initialized with default credentials");
  } catch (err) {
    console.warn("[firebase-admin] Initialization failed:", err);
  }
}

initAdmin();

export { adminDb };
