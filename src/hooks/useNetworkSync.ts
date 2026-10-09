import { useState, useEffect, useCallback, useRef } from 'react';
import { waitForCloudSync, goOnline, goOffline } from '../lib/firebase';

export type SyncState = 'synced' | 'syncing' | 'offline';

export interface NetworkSyncStatus {
  isOnline: boolean;
  syncState: SyncState;
  hasPendingWrites: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  triggerManualSync: () => Promise<void>;
  notifyPendingWrite: () => void;
  clearPendingWrites: () => void;
}

export function useNetworkSync(
  onStatusChange?: (status: { isOnline: boolean; syncState: SyncState }) => void
): NetworkSyncStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<SyncState>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'
  );
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  const isSyncingRef = useRef<boolean>(false);

  const notifyPendingWrite = useCallback(() => {
    setHasPendingWrites(true);
    setPendingCount((prev) => prev + 1);
    if (!navigator.onLine) {
      setSyncState('offline');
    } else {
      setSyncState('syncing');
    }
  }, []);

  const clearPendingWrites = useCallback(() => {
    setHasPendingWrites(false);
    setPendingCount(0);
    if (navigator.onLine) {
      setSyncState('synced');
      setLastSyncTime(new Date());
    }
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setSyncState('syncing');
      await goOnline();

      // Wait for Firestore offline write queue to flush to backend
      const synced = await waitForCloudSync(6000);
      if (synced) {
        setHasPendingWrites(false);
        setPendingCount(0);
        setSyncState('synced');
        setLastSyncTime(new Date());
      } else {
        // Still online, pending writes may still be uploading
        setSyncState('synced');
      }
    } catch (e) {
      console.warn('Manual sync check caught exception:', e);
      setSyncState(navigator.onLine ? 'synced' : 'offline');
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('⚡ Network connection restored. Initializing background sync...');
      setIsOnline(true);
      setSyncState('syncing');
      onStatusChange?.({ isOnline: true, syncState: 'syncing' });

      try {
        await goOnline();
        const synced = await waitForCloudSync(8000);
        if (synced) {
          setHasPendingWrites(false);
          setPendingCount(0);
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.warn('Background sync on reconnect notice:', err);
      } finally {
        setSyncState('synced');
        onStatusChange?.({ isOnline: true, syncState: 'synced' });
      }
    };

    const handleOffline = () => {
      console.log('🔌 Network disconnected. Switching to local offline mode.');
      setIsOnline(false);
      setSyncState('offline');
      goOffline().catch(() => {});
      onStatusChange?.({ isOnline: false, syncState: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for Service Worker background sync triggers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
          triggerManualSync();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange, triggerManualSync]);

  return {
    isOnline,
    syncState,
    hasPendingWrites,
    lastSyncTime,
    pendingCount,
    triggerManualSync,
    notifyPendingWrite,
    clearPendingWrites,
  };
}
