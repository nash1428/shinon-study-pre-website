"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
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

// Default profile used when a new user signs up
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

// Local storage fallback for when Firebase is not configured
const LOCAL_USER_KEY = "studyspace_local_user";
const LOCAL_PROFILE_KEY = "studyspace_local_profile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Fallback: check localStorage for a mock session
      const savedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
          } else {
            setProfile({ ...defaultProfile, email: parsed.email, name: parsed.displayName || "" });
          }
        } catch {
          // ignore parse errors
        }
      }
      setLoading(false);
      return;
    }

    // Real Firebase auth listener — persists across refreshes
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        // Fetch profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Create a default profile for new users
          const newProfile: UserProfile = {
            ...defaultProfile,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      // Mock login — store in localStorage
      const mockUser = {
        uid: `local-${Date.now()}`,
        email,
        displayName: email.split("@")[0],
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser as any);
      const newProfile = { ...defaultProfile, email, name: mockUser.displayName };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      return;
    }
    await signInWithEmailAndPassword(auth!, email, password);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured) {
      // Mock signup
      const mockUser = {
        uid: `local-${Date.now()}`,
        email,
        displayName: name,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser as any);
      const newProfile = { ...defaultProfile, email, name };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth!, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      // Create Firestore profile
      if (db) {
        const newProfile: UserProfile = {
          ...defaultProfile,
          email,
          name,
        };
        await setDoc(doc(db, "users", cred.user.uid), newProfile);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await signOut(auth!);
  }, []);

  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (!isFirebaseConfigured) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedProfile));
      return;
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
