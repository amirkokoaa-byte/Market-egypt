import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Firestore,
} from 'firebase/firestore';
import { SupermarketChain, AppSettings } from '../types';

// Read configuration securely from environment variables (hidden keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sopar-market-dalel',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase safely (avoid multiple initializations)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);

// Firestore collection names
export const CHAINS_COLLECTION = 'supermarket_chains';
export const SETTINGS_COLLECTION = 'app_settings';

/**
 * 1. Listen for real-time updates on Supermarket Chains
 * Automatically updates when any user or admin adds, edits, or deletes a chain or branch!
 */
export function subscribeToChains(
  onUpdate: (chains: SupermarketChain[]) => void,
  onError?: (error: Error) => void
) {
  const chainsQuery = query(collection(db, CHAINS_COLLECTION));

  return onSnapshot(
    chainsQuery,
    (snapshot) => {
      const chains: SupermarketChain[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SupermarketChain;
        chains.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(chains);
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * 2. Send (save/update) a chain to Firestore
 */
export async function saveChainToFirestore(chain: SupermarketChain): Promise<void> {
  const chainDocRef = doc(db, CHAINS_COLLECTION, chain.id);
  await setDoc(chainDocRef, chain, { merge: true });
}

/**
 * 3. Delete a chain from Firestore
 */
export async function deleteChainFromFirestore(chainId: string): Promise<void> {
  const chainDocRef = doc(db, CHAINS_COLLECTION, chainId);
  await deleteDoc(chainDocRef);
}

/**
 * 4. Save bulk/all chains to Firestore
 */
export async function syncAllChainsToFirestore(chains: SupermarketChain[]): Promise<void> {
  const promises = chains.map((chain) => saveChainToFirestore(chain));
  await Promise.all(promises);
}

/**
 * 5. Listen for real-time updates on App Settings
 */
export function subscribeToSettings(
  onUpdate: (settings: AppSettings) => void,
  onError?: (error: Error) => void
) {
  const settingsDocRef = doc(db, SETTINGS_COLLECTION, 'global_config');

  return onSnapshot(
    settingsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AppSettings);
      }
    },
    (error) => {
      console.warn('Firestore settings subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * 6. Save App Settings to Firestore
 */
export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  const settingsDocRef = doc(db, SETTINGS_COLLECTION, 'global_config');
  await setDoc(settingsDocRef, settings, { merge: true });
}
