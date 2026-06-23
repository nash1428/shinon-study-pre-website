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
};

// In-memory cache
const profileCache = new Map<string, UserProfile>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile in background — never blocks UI
  const fetchProfileInBackground = useCallback(async (uid: string, fallback: Partial<UserProfile>) => {
    // 1. Check in-memory cache (instant)
    if (profileCache.has(uid)) {
      setProfile(profileCache.get(uid)!);
      return;
    }

    // 2. Check localStorage backup (fast, offline-capable)
    let localProfile: UserProfile | null = null;
    try {
      const backup = localStorage.getItem("studyspace_profile_backup");
      if (backup) {
        localProfile = JSON.parse(backup) as UserProfile;
        profileCache.set(uid, localProfile);
        setProfile(localProfile);
      }
    } catch {}

    // 3. If no local profile, set a temp one from auth data so UI renders immediately
    if (!localProfile) {
      const tempProfile = { ...defaultProfile, ...fallback } as UserProfile;
      setProfile(tempProfile);
    }

    // 4. Fetch from Firestore in background (non-blocking)
    if (!db) return;

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fetched = docSnap.data() as UserProfile;
        profileCache.set(uid, fetched);
        setProfile(fetched);
        try {
          localStorage.setItem("studyspace_profile_backup", JSON.stringify(fetched));
        } catch {}
      } else {
        const newProfile = { ...defaultProfile, ...fallback } as UserProfile;
        await setDoc(docRef, newProfile);
        profileCache.set(uid, newProfile);
        setProfile(newProfile);
        try {
          localStorage.setItem("studyspace_profile_backup", JSON.stringify(newProfile));
        } catch {}
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
      // Keep whatever we have from localStorage or temp — app still works
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
        fetchProfileInBackground(firebaseUser.uid, {
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "",
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchProfileInBackground]);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");
    // This triggers onAuthStateChanged automatically
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Optimistically set user + loading=false so the redirect is instant
    setUser(cred.user);
    setLoading(false);
    fetchProfileInBackground(cred.user.uid, {
      email: cred.user.email || "",
      name: cred.user.displayName || "",
    });

    return cred.user;
  }, [fetchProfileInBackground]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      if (db) {
        const newProfile: UserProfile = { ...defaultProfile, email, name };
        await setDoc(doc(db, "users", cred.user.uid), newProfile);
        profileCache.set(cred.user.uid, newProfile);
        try {
          localStorage.setItem("studyspace_profile_backup", JSON.stringify(newProfile));
        } catch {}
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

    // Always save to localStorage synchronously (instant, reliable)
    try {
      localStorage.setItem("studyspace_profile_backup", JSON.stringify(updatedProfile));
    } catch {}

    if (currentUser) {
      profileCache.set(currentUser.uid, updatedProfile);

      // Fire Firestore write in background — DON'T await
      // (avoids hanging on blocked Firestore security rules)
      if (db) {
        setDoc(doc(db, "users", currentUser.uid), updatedProfile).catch((err) => {
          console.error("Firestore save failed (localStorage backup used):", err);
        });
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
