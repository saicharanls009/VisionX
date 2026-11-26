import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseProjectId, isFirebaseConfigured } from './config';

export const OfficerAccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const firebaseAuth = auth;
    const firestore = db;
    if (!isFirebaseConfigured || !firebaseAuth || !firestore) return;
    let isActive = true;
    let authorizationRequest = 0;
    console.info('[Officer auth diagnostic] Firebase project loaded.', { projectId: firebaseProjectId });
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      const request = ++authorizationRequest;
      if (!nextUser) {
        setUser(null);
        setReady(true);
        return;
      }
      try {
        console.info('[Officer auth diagnostic] Auth state received.', {
          uid: nextUser.uid,
          email: nextUser.email,
        });
        const roleSnapshot = await getDoc(doc(firestore, 'users', nextUser.uid));
        const role = roleSnapshot.data()?.role;
        const isAuthorizedOfficer = roleSnapshot.exists() === true && roleSnapshot.data()?.role === 'officer';
        console.info('[Officer auth diagnostic] Officer role document read.', {
          path: `users/${nextUser.uid}`,
          exists: roleSnapshot.exists(),
          data: roleSnapshot.data(),
          isAuthorizedOfficer,
        });

        if (!isActive || request !== authorizationRequest || firebaseAuth.currentUser?.uid !== nextUser.uid) return;

        if (!isAuthorizedOfficer) {
          console.warn('Officer role record is missing or invalid.', {
            uid: nextUser.uid,
            documentExists: roleSnapshot.exists(),
            role,
          });
          await signOut(firebaseAuth);
          setError('This signed-in account does not have an officer role assignment.');
          setUser(null);
        } else {
          setUser(nextUser);
        }
      } catch (error) {
        if (!isActive || request !== authorizationRequest || firebaseAuth.currentUser?.uid !== nextUser.uid) return;

        const firestoreError = error as { code?: unknown; message?: unknown };
        console.error('[Officer auth diagnostic] Unable to read the officer role record.', {
          code: firestoreError.code,
          message: firestoreError.message,
        });
        setError('Unable to verify officer authorization. Check Firestore access and try again.');
        setUser(null);
      } finally {
        if (isActive && request === authorizationRequest) setReady(true);
      }
    });
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!auth) return;
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.info('[Officer auth diagnostic] Sign-in completed.', {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      });
    } catch {
      setError('Unable to sign in with those officer credentials.');
    }
  };

  if (!isFirebaseConfigured) return <>{children}</>;
  if (!ready) return <div className="min-h-screen bg-slate-100" />;
  if (user) return <>{children}</>;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form onSubmit={login} className="w-full max-w-sm bg-white border border-slate-200 shadow-lg rounded-md p-6 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Officer Access</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with an authorized procurement officer account.</p>
        </div>
        {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">{error}</p>}
        <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" type="email" placeholder="Officer email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="w-full bg-slate-900 text-white rounded py-2 text-sm font-semibold" type="submit">Sign In</button>
      </form>
    </main>
  );
};
