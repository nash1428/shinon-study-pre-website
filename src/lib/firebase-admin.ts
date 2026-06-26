import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;
let adminInitialized = false;

const FIREBASE_PROJECT_ID = "study-space-aeb52";

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

    // Try Application Default Credentials with explicit project ID
    // On bld, ADC is available but project ID detection fails, so we set it explicitly
    const app: App = getApps().length === 0
      ? initializeApp({ projectId: FIREBASE_PROJECT_ID })
      : getApps()[0];
    adminDb = getFirestore(app);
    console.log("[firebase-admin] Initialized with default credentials + project ID:", FIREBASE_PROJECT_ID);
  } catch (err) {
    console.warn("[firebase-admin] Initialization failed:", err);
  }
}

initAdmin();

export { adminDb };
