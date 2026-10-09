import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Firestore,
  waitForPendingWrites,
  enableNetwork,
  disableNetwork,
  SnapshotMetadata,
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

// Initialize Firebase App safely (singleton)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Initialize Firestore with multi-tab IndexedDB Offline Persistence.
 * This guarantees:
 * 1. Immediate offline availability of all cached documents.
 * 2. Uninterrupted reads & writes even with zero internet.
 * 3. Automatic queuing of offline mutations with background sync on reconnect.
 * 4. Multi-tab synchronization without browser tab locks.
 */
function initFirestoreWithPersistence(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err: any) {
    console.warn('Firestore offline persistence initialization notice:', err?.message || err);
    return getFirestore(app);
  }
}

export const db: Firestore = initFirestoreWithPersistence();

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
 * 1. Listen for real-time updates on Supermarket Chains with offline awareness
 * Invokes onUpdate with chain data, and provides snapshot metadata:
 * - fromCache: true if data is served from local IndexedDB cache
 * - hasPendingWrites: true if there are local offline mutations waiting to sync to the cloud
 */
export function subscribeToChains(
  onUpdate: (chains: SupermarketChain[], metadata?: SnapshotMetadata) => void,
  onError?: (error: any) => void
) {
  const chainsQuery = query(collection(db, CHAINS_COLLECTION));

  return onSnapshot(
    chainsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      const chains: SupermarketChain[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SupermarketChain;
        chains.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(chains, snapshot.metadata);
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * 2. Send (save/update) a chain to Firestore.
 * When offline, this resolves immediately after writing to local IndexedDB,
 * and Firestore queues it for background sync as soon as network returns.
 */
export async function saveChainToFirestore(chain: SupermarketChain): Promise<void> {
  const chainDocRef = doc(db, CHAINS_COLLECTION, chain.id);
  const cleanData = sanitizeForFirestore(chain);
  await setDoc(chainDocRef, cleanData, { merge: true });
}

/**
 * 3. Delete a chain from Firestore (offline-capable).
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
 * 5. Listen for real-time updates on App Settings with metadata
 */
export function subscribeToSettings(
  onUpdate: (settings: AppSettings, metadata?: SnapshotMetadata) => void,
  onError?: (error: any) => void
) {
  const settingsDocRef = doc(db, SETTINGS_COLLECTION, 'global_config');

  return onSnapshot(
    settingsDocRef,
    { includeMetadataChanges: true },
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AppSettings, docSnap.metadata);
      }
    },
    (error) => {
      console.warn('Firestore settings subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * 6. Save App Settings to Firestore (offline-capable)
 */
export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  const settingsDocRef = doc(db, SETTINGS_COLLECTION, 'global_config');
  const cleanData = sanitizeForFirestore(settings);
  await setDoc(settingsDocRef, cleanData, { merge: true });
}

/**
 * 7. Wait for all pending offline writes to be committed to the Firestore cloud.
 * Resolves as soon as the local queue has drained and confirmed on server.
 */
export async function waitForCloudSync(timeoutMs: number = 8000): Promise<boolean> {
  try {
    const syncPromise = waitForPendingWrites(db);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), timeoutMs)
    );
    await Promise.race([syncPromise, timeoutPromise]);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 8. Network management utilities (reconnect / disconnect)
 */
export async function goOnline(): Promise<void> {
  try {
    await enableNetwork(db);
  } catch (err) {
    console.warn('Firestore enableNetwork notice:', err);
  }
}

export async function goOffline(): Promise<void> {
  try {
    await disableNetwork(db);
  } catch (err) {
    console.warn('Firestore disableNetwork notice:', err);
  }
}
