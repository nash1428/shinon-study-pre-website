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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
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

// In-memory cache so profile fetches don't block rendering
const profileCache = new Map<string, UserProfile>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Firestore in the background (non-blocking)
  const fetchProfileInBackground = useCallback(async (uid: string, fallback: Partial<UserProfile>) => {
    // Return cached profile immediately if available
    if (profileCache.has(uid)) {
      setProfile(profileCache.get(uid)!);
      return;
    }

    // Set a temporary profile from the auth user so UI renders instantly
    const tempProfile = { ...defaultProfile, ...fallback } as UserProfile;
    setProfile(tempProfile);

    if (!db) return;

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const fetched = docSnap.data() as UserProfile;
        profileCache.set(uid, fetched);
        setProfile(fetched);
      } else {
        // Create default profile for new users
        const newProfile = { ...defaultProfile, ...fallback } as UserProfile;
        await setDoc(docRef, newProfile);
        profileCache.set(uid, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      // If Firestore fails, keep the temp profile — app still works
      console.error("Profile fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Ensure session persists locally for fast restore
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Set loading=false immediately — don't wait for Firestore
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
    if (!isFirebaseConfigured || !auth) return;
    // signInWithEmailAndPassword triggers onAuthStateChanged automatically
    // which will set the user and fetch the profile
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) return;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      // Create Firestore profile immediately (non-blocking for the UI)
      if (db) {
        const newProfile: UserProfile = { ...defaultProfile, email, name };
        await setDoc(doc(db, "users", cred.user.uid), newProfile);
        profileCache.set(cred.user.uid, newProfile);
      }
    }
    // onAuthStateChanged will fire and set loading=false
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) return;
    profileCache.clear();
    await signOut(auth);
  }, []);

  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (user) {
      profileCache.set(user.uid, updatedProfile);
    }
    if (user && db) {
      await setDoc(doc(db, "users", user.uid), updatedProfile);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isFirebaseConfigured, login, signup, logout, saveProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
