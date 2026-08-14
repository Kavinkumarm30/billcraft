import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process redirect result if applicable
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect auth error:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            setDbUser(data);
          } else {
            console.error('Failed to fetch user data, status:', res.status);
            const text = await res.text().catch(() => '');
            console.error('Error details:', text);
            if (res.status === 403) {
              await signOut(auth);
              setUser(null);
              setDbUser(null);
              console.error("Your access has been revoked by the administrator.");
            } else {
              await signOut(auth);
              setUser(null);
              setDbUser(null);
              console.error("Server error occurred while authenticating. Please try again.");
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          await signOut(auth).catch(console.error);
          setUser(null);
          setDbUser(null);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error("Login popup failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Unauthorized domain in Firebase Auth. Please add current URL (e.g. localhost) to Firebase Console -> Authentication -> Settings -> Authorized Domains.');
      }
      if (error.code === 'auth/popup-blocked') {
        // Fallback to redirect if popup blocked
        console.warn("Popup blocked, falling back to redirect...");
        await signInWithRedirect(auth, googleAuthProvider);
        return;
      }
      throw error;
    }
  };

  const loginWithRedirect = async () => {
    try {
      await signInWithRedirect(auth, googleAuthProvider);
    } catch (error: any) {
      console.error("Login redirect failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, login, loginWithRedirect, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
