import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut, User } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config';

const PROVISIONING_APP_NAME = 'farmer-account-provisioning';

function getProvisioningApp(): FirebaseApp {
  const existing = getApps().find((app) => app.name === PROVISIONING_APP_NAME);
  return existing || initializeApp(firebaseConfig, PROVISIONING_APP_NAME);
}

export function generateTemporaryPin(): string {
  const range = 900_000;
  const maxAccepted = Math.floor(0x1_0000_0000 / range) * range;
  const random = new Uint32Array(1);
  do {
    crypto.getRandomValues(random);
  } while (random[0] >= maxAccepted);
  return String(100_000 + (random[0] % range));
}

export function generateInternalAuthEmail(): string {
  return `farmer-${crypto.randomUUID()}@auth.smartprocure.invalid`;
}

// Spark-compatible provisioning: Firebase Authentication stores the PIN as a
// password verifier. The secondary Auth instance keeps the Assistant signed in.
export async function provisionFarmerAccount(email: string, pin: string): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase must be configured before creating a farmer login.');
  }
  const provisioningAuth = getAuth(getProvisioningApp());
  const credential = await createUserWithEmailAndPassword(provisioningAuth, email, pin);
  await signOut(provisioningAuth);
  return credential.user;
}

export async function removeProvisionedFarmerAccount(user: User): Promise<void> {
  try {
    await deleteUser(user);
  } finally {
    await signOut(getAuth(getProvisioningApp()));
  }
}
