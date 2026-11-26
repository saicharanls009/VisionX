import React, { createContext, useContext, useState, useEffect } from 'react';
import { OperatorSession } from '../types';
import { store } from '../firebase/unifiedStore';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

type AssistantProfile = {
  role?: string;
  serviceCenterId?: string;
  serviceCenterName?: string;
  displayName?: string;
};

interface AuthContextType {
  session: OperatorSession | null;
  login: (centerId: string, username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const SESSION_STORAGE_KEY = 'sih_operator_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<OperatorSession | null>(() => {
    if (isFirebaseConfigured) return null;

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Demo-only session for the local, no-Firebase mode.
    return {
      isAuthenticated: true,
      centerId: 'OC-001',
      centerName: 'Village Service Center - Rajkot',
      operatorUsername: 'rajkot_operator_1',
      operatorName: 'Rajkot Center Operator',
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isFirebaseConfigured) return;

    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!isFirebaseConfigured || !firebaseAuth) return;

    return onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setSession(null);
        return;
      }

      try {
        if (!db) {
          throw new Error('Firestore is unavailable.');
        }
        const roleSnapshot = await getDoc(doc(db, 'users', user.uid));
        const profile = roleSnapshot.data() as AssistantProfile | undefined;
        if (profile?.role !== 'assistant' || !profile.serviceCenterId) {
          setSession(null);
          await signOut(firebaseAuth);
          return;
        }

        setSession({
          isAuthenticated: true,
          centerId: profile.serviceCenterId,
          centerName: profile.serviceCenterName || profile.serviceCenterId,
          operatorUsername: user.email || user.uid,
          operatorName: profile.displayName || user.email || user.uid,
        });
      } catch {
        setSession(null);
      }
    });
  }, []);

  const login = async (
    centerId: string,
    username: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanCenterId = centerId.trim().toUpperCase();
      const cleanUsername = username.trim();

      if (!cleanCenterId) return { success: false, error: 'Center ID is required.' };
      if (!cleanUsername) return { success: false, error: isFirebaseConfigured ? 'Operator email is required.' : 'Operator username is required.' };
      if (!pass || pass.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

      if (isFirebaseConfigured) {
        if (!auth) return { success: false, error: 'Authentication service is unavailable. Check Firebase configuration.' };
        if (!cleanUsername.includes('@')) return { success: false, error: 'Enter the authorized operator email address.' };
        await signInWithEmailAndPassword(auth, cleanUsername, pass);
        if (!db || !auth.currentUser) {
          return { success: false, error: 'Authentication service is unavailable. Check Firebase configuration.' };
        }
        const profileSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const profile = profileSnapshot.data() as AssistantProfile | undefined;
        if (profile?.role !== 'assistant' || profile.serviceCenterId !== cleanCenterId) {
          await signOut(auth);
          return { success: false, error: 'This account is not authorized for the selected assistance center.' };
        }

        setSession({
          isAuthenticated: true,
          centerId: profile.serviceCenterId,
          centerName: profile.serviceCenterName || profile.serviceCenterId,
          operatorUsername: cleanUsername,
          operatorName: profile.displayName || cleanUsername,
        });
        return { success: true };
      }

      // Demo mode retains its local service-center lookup.
      const center = await store.getServiceCenter(cleanCenterId);
      if (!center) return { success: false, error: `Center ID "${cleanCenterId}" is not registered in the demo data.` };
      if (!center.isActive) return { success: false, error: `Center ${cleanCenterId} has been deactivated.` };

      const newSession: OperatorSession = {
        isAuthenticated: true,
        centerId: center.id,
        centerName: center.name,
        operatorUsername: cleanUsername,
        operatorName: center.operatorName || cleanUsername,
      };

      setSession(newSession);
      return { success: true };
    } catch (err: any) {
      const message = err?.code === 'auth/invalid-credential' || err?.code === 'auth/invalid-login-credentials'
        ? 'Incorrect email or password.'
        : err.message || 'Login failed. Please verify credentials.';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (isFirebaseConfigured && auth) void signOut(auth);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
