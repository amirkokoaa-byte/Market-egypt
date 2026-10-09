import React, { useState, useEffect } from 'react';
import { SyncState } from '../hooks/useNetworkSync';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SyncStatusIndicatorProps {
  isOnline: boolean;
  syncState: SyncState;
  hasPendingWrites?: boolean;
  pendingCount?: number;
  onTriggerSync?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  isOnline,
  syncState,
  hasPendingWrites = false,
  pendingCount = 0,
  onTriggerSync,
}) => {
  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium shadow-xs"
          title="وضع أوفلاين محلي - يتم حفظ التعديلات محلياً"
        >
          <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>اوفلاين محلي</span>
          {pendingCount > 0 && (
            <span className="bg-rose-500 text-white rounded-full px-1.5 text-[10px]">
              {pendingCount}
            </span>
          )}
        </div>
      ) : syncState === 'syncing' ? (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium shadow-xs transition"
          title="جارٍ مزامنة التغييرات المحلية مع قاعدة بيانات Firebase السحابية..."
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
          <span className="hidden sm:inline">جارٍ المزامنة...</span>
          <span className="sm:hidden">مزامنة...</span>
        </div>
      ) : (
        <button
          onClick={onTriggerSync}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20 text-xs font-medium transition cursor-pointer"
          title="متصل بقاعدة البيانات السحابية Firebase. انقر للمزامنة الفورية."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden md:inline">متصل بالسحابة ☁️✅</span>
          <span className="md:hidden">متصل ⚡</span>
        </button>
      )}
    </div>
  );
};
