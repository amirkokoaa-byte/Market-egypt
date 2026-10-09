import React, { useState, useEffect } from 'react';
import { SyncState } from '../hooks/useNetworkSync';
import { Wifi, WifiOff, Cloud, RefreshCw, CheckCircle2, HardDrive } from 'lucide-react';

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
  // Show a celebratory "Back Online: Synced" banner when transitioning from offline/syncing to synced
  const [showSyncedBanner, setShowSyncedBanner] = useState<boolean>(false);
  const [prevOnline, setPrevOnline] = useState<boolean>(isOnline);

  useEffect(() => {
    if (!prevOnline && isOnline) {
      // Just reconnected
      setShowSyncedBanner(true);
      const timer = setTimeout(() => {
        setShowSyncedBanner(false);
      }, 5500);
      return () => clearTimeout(timer);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  return (
    <>
      {/* 1. Header/Toolbar Pill Indicator */}
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold shadow-xs transition animate-pulse"
            title="تعمل الآن بدون إنترنت. يتم حفظ جميع البيانات والتعديلات في المتصفح محلياً فوراً وستتم المزامنة تلقائياً عند عودة الاتصال."
          >
            <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">وضع بدون اتصال: يتم الحفظ محلياً</span>
            <span className="sm:hidden">أوفلاين (محلي)</span>
            <span className="flex items-center gap-1 text-[11px] bg-rose-950/80 px-1.5 py-0.5 rounded-full text-rose-200">
              ☁️❌
            </span>
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
            <span className="hidden sm:inline">جارٍ المزامنة مع السحابة...</span>
            <span className="sm:hidden">مزامنة...</span>
            <span className="text-[11px]">🔄</span>
          </div>
        ) : (
          <button
            onClick={onTriggerSync}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20 text-xs font-medium transition cursor-pointer"
            title="متصل بقاعدة البيانات السحابية Firebase لحظياً. اضغط للتحديث اليدوي."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">متصل بالسحابة ☁️✅</span>
            <span className="md:hidden">متصل ⚡</span>
          </button>
        )}
      </div>

      {/* 2. Floating Notification Banner when Status Changes */}
      {!isOnline && (
        <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-50 rounded-xl bg-slate-900/95 border border-rose-500/40 p-3.5 shadow-2xl backdrop-blur-md text-slate-100 flex items-start gap-3 transition">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span>وضع بدون اتصال: حفظ محلي ☁️❌</span>
              </h4>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">IndexedDB</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              انقطع اتصال الإنترنت. يمكنك الاستمرار في إضافة وتعديل الفروع والسلاسل بدون أي توقف؛ تُحفظ بياناتك محلياً وستُرفع تلقائياً للسحابة فور استعادة الاتصال.
            </p>
          </div>
        </div>
      )}

      {showSyncedBanner && isOnline && (
        <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-50 rounded-xl bg-slate-900/95 border border-emerald-500/40 p-3.5 shadow-2xl backdrop-blur-md text-slate-100 flex items-start gap-3 animate-fade-in transition">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>Back Online: Synced to Firebase ☁️✅</span>
            </h4>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              تمت استعادة الاتصال بالإنترنت بنجاح! تمت مزامنة جميع البيانات والعمليات المحلية تلقائياً مع السحابة.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
