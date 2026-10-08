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

// Read configuration securely from environment variables (hidden keys) with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCgUMscIOWTrkoTulOLjlEBAZYA-zAfyvs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sopar-market-dalel.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sopar-market-dalel',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sopar-market-dalel.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '690631416497',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:690631416497:web:24ff9662f1a21946d8a090',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-QELXK33M9Z',
};

// Initialize Firebase safely (avoid multiple initializations)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);

// Firestore collection names
export const CHAINS_COLLECTION = 'supermarket_chains';
export const SETTINGS_COLLECTION = 'app_settings';

/**
 * Removes undefined fields from objects before sending to Firestore,
 * preventing "Unsupported field value: undefined" errors.
 */
function sanitizeForFirestore<T>(data: T): any {
  return JSON.parse(JSON.stringify(data));
}

/**
 * 1. Listen for real-time updates on Supermarket Chains
 * Automatically updates when any user or admin adds, edits, or deletes a chain or branch!
 */
export function subscribeToChains(
  onUpdate: (chains: SupermarketChain[]) => void,
  onError?: (error: any) => void
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
 * 2. Send (save/update) a chain to Firestore with sanitized data
 */
export async function saveChainToFirestore(chain: SupermarketChain): Promise<void> {
  const chainDocRef = doc(db, CHAINS_COLLECTION, chain.id);
  const cleanData = sanitizeForFirestore(chain);
  await setDoc(chainDocRef, cleanData, { merge: true });
}

/**
 * 3. Delete a chain from Firestore
 */
export async function deleteChainFromFirestore(chainId: string): Promise<void> {
  const chainDocRef = doc(db, CHAINS_COLLECTION, chainId);
  await deleteDoc(chainDocRef);
}

/**
 * 4. Save bulk/all chains to Firestore with error handling per chain
 */
export async function syncAllChainsToFirestore(
  chains: SupermarketChain[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const chain of chains) {
    try {
      await saveChainToFirestore(chain);
      success++;
    } catch (err) {
      console.error(`Failed to save chain ${chain.name} to Firestore:`, err);
      failed++;
    }
  }
  return { success, failed };
}

/**
 * 5. Listen for real-time updates on App Settings
 */
export function subscribeToSettings(
  onUpdate: (settings: AppSettings) => void,
  onError?: (error: any) => void
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
  const cleanData = sanitizeForFirestore(settings);
  await setDoc(settingsDocRef, cleanData, { merge: true });
}
