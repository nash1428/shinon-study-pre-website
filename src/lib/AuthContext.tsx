"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
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

// In-memory cache
const profileCache = new Map<string, UserProfile>();

/**
 * Save profile to Firestore via server-side API route (uses user's ID token).
 * This bypasses client-side SDK issues and works with proper security rules.
 */
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

/**
 * Fetch profile from Firestore via server-side API route (uses user's ID token).
 */
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

  // Fetch profile in background — never blocks UI
  const fetchProfileInBackground = useCallback(async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;
    const fallback: Partial<UserProfile> = {
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || "",
    };

    // 1. Check in-memory cache (instant) — only for this user
    if (profileCache.has(uid)) {
      setProfile(profileCache.get(uid)!);
      return;
    }

    // 2. Check per-user localStorage key
    let localProfile: UserProfile | null = null;
    try {
      const backup = localStorage.getItem(`studyspace_profile_${uid}`);
      if (backup) {
        localProfile = JSON.parse(backup) as UserProfile;
        profileCache.set(uid, localProfile);
        setProfile(localProfile);
      }
    } catch {}

    // 3. If no per-user profile, try migrating from old shared key
    if (!localProfile) {
      try {
        const oldBackup = localStorage.getItem("studyspace_profile_backup");
        if (oldBackup) {
          const oldProfile = JSON.parse(oldBackup) as UserProfile;
          // Only use old data if the email matches the current user
          if (oldProfile.email === firebaseUser.email) {
            localProfile = oldProfile;
            profileCache.set(uid, localProfile);
            setProfile(localProfile);
            // Save to new per-user key
            localStorage.setItem(`studyspace_profile_${uid}`, JSON.stringify(localProfile));
            // Don't delete the old key yet — keep as backup
          }
        }
      } catch {}
    }

    // 4. If still no profile, set a temp one from auth data so UI renders immediately
    if (!localProfile) {
      const tempProfile = { ...defaultProfile, ...fallback } as UserProfile;
      setProfile(tempProfile);
    }

    // 5. Try fetching from Firestore via server API (uses ID token for auth)
    try {
      const idToken = await firebaseUser.getIdToken();
      const serverProfile = await fetchProfileFromServer(idToken, uid);
      if (serverProfile) {
        profileCache.set(uid, serverProfile);
        setProfile(serverProfile);
        try {
          localStorage.setItem(`studyspace_profile_${uid}`, JSON.stringify(serverProfile));
        } catch {}
      }
    } catch {
      // Server fetch failed — keep whatever we have from localStorage or temp
    }

    // 6. Also try Firestore via client SDK as a secondary fallback
    if (db) {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetched = docSnap.data() as UserProfile;
          profileCache.set(uid, fetched);
          setProfile(fetched);
          try {
            localStorage.setItem(`studyspace_profile_${uid}`, JSON.stringify(fetched));
          } catch {}
        }
      } catch {
        // Firestore client SDK failed (likely security rules) — keep existing profile
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Set persistence synchronously (fast)
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Set loading=false IMMEDIATELY — don't wait for anything else
        setLoading(false);
        // Fetch profile in background (non-blocking)
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

    // Clear any previous user's cached profile to prevent cross-account mixing
    profileCache.clear();
    setProfile(null);

    // This triggers onAuthStateChanged automatically
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Optimistically set user + loading=false so the redirect is instant
    setUser(cred.user);
    setLoading(false);
    fetchProfileInBackground(cred.user);

    return cred.user;
  }, [fetchProfileInBackground]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (cred.user) {
      // updateProfile — non-blocking (don't let it hang the UI)
      updateProfile(cred.user, { displayName: name }).catch(() => {});

      const newProfile: UserProfile = { ...defaultProfile, email, name };
      profileCache.set(cred.user.uid, newProfile);
      try {
        localStorage.setItem(`studyspace_profile_${cred.user.uid}`, JSON.stringify(newProfile));
      } catch {}

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

    // Optimistically set user + loading=false
    setUser(cred.user);
    setLoading(false);

    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) return;
    profileCache.clear();
    setUser(null);
    setProfile(null);
    setLoading(true);
    await signOut(auth);
  }, []);

  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    // Update local state immediately
    setProfile(updatedProfile);

    const currentUser = auth?.currentUser;

    // Always save to localStorage synchronously (per-user key)
    try {
      if (currentUser) {
        localStorage.setItem(`studyspace_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
      }
    } catch {}

    if (currentUser) {
      profileCache.set(currentUser.uid, updatedProfile);

      // Save to Firestore via server API (uses ID token for auth)
      try {
        const idToken = await currentUser.getIdToken();
        saveProfileToServer(idToken, currentUser.uid, updatedProfile);
      } catch {}

      // Also try client SDK as backup
      if (db) {
        setDoc(doc(db, "users", currentUser.uid), updatedProfile).catch(() => {});
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
