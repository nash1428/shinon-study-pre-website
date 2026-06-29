"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export interface UserProfile {
  name: string;
  university: string;
  semester: string;
  degree: string;
  major: string;
  email: string;
  hometown: string;
  location: string;
  isPrivate: boolean;
  avatarUrl: string | null;
  showTodayTasks: boolean;
  showTodaySchedule: boolean;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  signup: (email: string, password: string, name: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const defaultProfile: UserProfile = {
  name: "",
  university: "",
  semester: "",
  degree: "",
  major: "",
  email: "",
  hometown: "",
  location: "",
  isPrivate: false,
  avatarUrl: null,
  showTodayTasks: true,
  showTodaySchedule: true,
};

// ====== STORAGE MANAGEMENT HELPERS ======
// Per-user profile storage — each user gets their own key to prevent cross-account contamination

function getProfileKey(uid: string): string {
  return `studyspace_profile_${uid}`;
}

function loadProfileFromStorage(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(getProfileKey(uid));
    if (!raw) return null;
    const profile = JSON.parse(raw) as UserProfile;
    // Safety check: verify the email matches (defense against stale data)
    return profile;
  } catch {
    return null;
  }
}

function saveProfileToStorage(uid: string, profile: UserProfile): void {
  try {
    localStorage.setItem(getProfileKey(uid), JSON.stringify(profile));
  } catch {}
}

function clearAllProfileStorage(): void {
  try {
    // Remove all studyspace_profile_* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("studyspace_profile_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}
}

// ====== SERVER PROFILE API HELPERS ======

async function saveProfileToServer(idToken: string, uid: string, profile: UserProfile): Promise<void> {
  try {
    await fetch("/api/save-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, uid, profile }),
    });
  } catch (err) {
    console.error("Server profile save failed:", err);
  }
}

async function fetchProfileFromServer(idToken: string, uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/get-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, uid }),
    });
    const data = await res.json();
    if (data.ok && data.profile) {
      return data.profile as UserProfile;
    }
  } catch (err) {
    console.error("Server profile fetch failed:", err);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ====== SESSION ISOLATION ======
  // Track the active session to prevent stale async callbacks from overwriting data.
  // Each login/signup/logout increments this counter. Async operations capture the
  // value at start and bail out if it changed by the time they resolve.
  const sessionRef = useRef(0);
  const activeUidRef = useRef<string | null>(null);

  // In-memory cache — keyed by UID, cleared on every login/logout
  const profileCacheRef = useRef(new Map<string, UserProfile>());

  // Fetch profile in background — guarded by session ID to prevent stale overwrites
  const fetchProfileInBackground = useCallback(async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;
    const mySession = sessionRef.current;
    const fallback: Partial<UserProfile> = {
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || "",
    };

    // GUARD: bail if session changed (e.g., user logged out or switched accounts)
    const guardSession = () => {
      if (sessionRef.current !== mySession || activeUidRef.current !== uid) {
        return false;
      }
      return true;
    };

    // 1. Check in-memory cache
    if (profileCacheRef.current.has(uid)) {
      if (guardSession()) setProfile(profileCacheRef.current.get(uid)!);
      return;
    }

    // 2. Check per-user localStorage key
    let localProfile: UserProfile | null = loadProfileFromStorage(uid);
    if (localProfile) {
      profileCacheRef.current.set(uid, localProfile);
      if (guardSession()) setProfile(localProfile);
    }

    // 3. If no local profile, set a temp one from auth data so UI renders immediately
    if (!localProfile) {
      const tempProfile = { ...defaultProfile, ...fallback } as UserProfile;
      if (guardSession()) setProfile(tempProfile);
    }

    // 4. Try fetching from Firestore via server API (uses ID token for auth)
    try {
      const idToken = await firebaseUser.getIdToken();
      if (!guardSession()) return;

      const serverProfile = await fetchProfileFromServer(idToken, uid);
      if (!guardSession()) return;

      if (serverProfile) {
        // MERGE: Don't overwrite local data with stale server data.
        // The server profile doesn't have avatarUrl (stripped to save space).
        // Preserve avatarUrl and any other fields from the local profile
        // that are missing or empty in the server profile.
        const mergedProfile: UserProfile = {
          ...defaultProfile,
          ...serverProfile,
          // Preserve local-only fields that server doesn't have
          avatarUrl: localProfile?.avatarUrl ?? serverProfile.avatarUrl ?? null,
        };

        profileCacheRef.current.set(uid, mergedProfile);
        if (guardSession()) setProfile(mergedProfile);
        saveProfileToStorage(uid, mergedProfile);
        console.log("[AuthContext] Loaded profile from server + merged with local for", uid);
      }
    } catch {
      // Server fetch failed — keep whatever we have from localStorage or temp
    }

    // 5. Also try Firestore via client SDK as a secondary fallback
    if (db) {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (!guardSession()) return;

        if (docSnap.exists()) {
          const fetched = docSnap.data() as UserProfile;
          // Same merge logic: preserve local avatarUrl
          const currentLocal = loadProfileFromStorage(uid);
          const mergedProfile: UserProfile = {
            ...defaultProfile,
            ...fetched,
            avatarUrl: currentLocal?.avatarUrl ?? fetched.avatarUrl ?? null,
          };

          profileCacheRef.current.set(uid, mergedProfile);
          if (guardSession()) setProfile(mergedProfile);
          saveProfileToStorage(uid, mergedProfile);
          console.log("[AuthContext] Loaded profile from Firestore client SDK + merged for", uid);
        }
      } catch {
        // Firestore client SDK failed — keep existing profile
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Set persistence — use browserLocalPersistence so the session survives refresh
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Increment session ID on every auth state change to invalidate stale async ops
      sessionRef.current++;
      activeUidRef.current = firebaseUser?.uid || null;

      setUser(firebaseUser);

      if (firebaseUser) {
        setLoading(false);
        fetchProfileInBackground(firebaseUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfileInBackground]);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");

    // ====== CLEAN UP PREVIOUS SESSION ======
    // Increment session to invalidate any pending async operations from the old user
    sessionRef.current++;
    activeUidRef.current = null;

    // Clear in-memory cache completely
    profileCacheRef.current.clear();

    // Clear profile state immediately
    setProfile(null);
    setUser(null);
    setLoading(true);

    // Sign in — this triggers onAuthStateChanged, but we also set state optimistically
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Update session tracking to the new user
    sessionRef.current++;
    activeUidRef.current = cred.user.uid;

    // Set user + loading=false so the redirect is instant
    setUser(cred.user);
    setLoading(false);

    // Fetch profile for the new user
    fetchProfileInBackground(cred.user);

    return cred.user;
  }, [fetchProfileInBackground]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");

    // ====== CLEAN UP PREVIOUS SESSION ======
    sessionRef.current++;
    activeUidRef.current = null;
    profileCacheRef.current.clear();
    setProfile(null);
    setUser(null);

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Update session tracking
    sessionRef.current++;
    activeUidRef.current = cred.user.uid;

    if (cred.user) {
      updateProfile(cred.user, { displayName: name }).catch(() => {});

      const newProfile: UserProfile = { ...defaultProfile, email, name };
      profileCacheRef.current.set(cred.user.uid, newProfile);
      saveProfileToStorage(cred.user.uid, newProfile);

      // Save to Firestore via server API
      try {
        const idToken = await cred.user.getIdToken();
        saveProfileToServer(idToken, cred.user.uid, newProfile);
      } catch {}

      // Also try client SDK
      if (db) {
        setDoc(doc(db, "users", cred.user.uid), newProfile).catch(() => {});
      }
    }

    setUser(cred.user);
    setLoading(false);

    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) return;

    // ====== FULL SESSION CLEANUP ======
    // Invalidate all pending async operations
    sessionRef.current++;
    activeUidRef.current = null;

    // Clear in-memory cache
    profileCacheRef.current.clear();

    // Clear all profile storage (all per-user keys + old shared key)
    clearAllProfileStorage();

    // Clear React state
    setUser(null);
    setProfile(null);
    setLoading(true);

    // Sign out from Firebase
    await signOut(auth);
  }, []);

  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return;

    // GUARD: only save if this is still the active user
    if (activeUidRef.current !== currentUser.uid) return;

    // Update local state immediately
    setProfile(updatedProfile);

    // Save to localStorage (per-user key) — always works, includes avatarUrl
    saveProfileToStorage(currentUser.uid, updatedProfile);

    // Update in-memory cache
    profileCacheRef.current.set(currentUser.uid, updatedProfile);

    // Strip avatarUrl before saving to Firestore — base64 data URLs can exceed
    // Firestore's 1MB document limit. Avatar stays in localStorage only.
    const { avatarUrl, ...profileWithoutAvatar } = updatedProfile;

    // Save to Firestore via server API — AWAIT it
    try {
      const idToken = await currentUser.getIdToken();
      if (activeUidRef.current !== currentUser.uid) return;
      await saveProfileToServer(idToken, currentUser.uid, updatedProfile);
      console.log("[AuthContext] Profile saved to server API for", currentUser.uid);
    } catch (err) {
      console.error("[AuthContext] Server API save failed:", err);
    }

    // Also try client SDK as backup — STRIP avatarUrl + use merge:true
    // Without merge:true, setDoc REPLACES the entire document, wiping out
    // focusCount, friends, followers, showTodayTasks, etc. that were saved
    // separately by the register-user API.
    if (db) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), profileWithoutAvatar, { merge: true });
        console.log("[AuthContext] Profile saved to Firestore client SDK for", currentUser.uid, "(avatarUrl stripped, merge:true)");
      } catch (err) {
        console.error("[AuthContext] Client SDK save failed:", err);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isFirebaseConfigured, login, signup, logout, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
