import React from 'react';
import { Settings, Store, MapPin, Menu, Shield, Lock } from 'lucide-react';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { PWAInstallButton } from './PWAInstallButton';
import { SyncState } from '../hooks/useNetworkSync';

interface HeaderProps {
  websiteName: string;
  totalChains: number;
  totalBranches: number;
  onOpenSettings: () => void;
  onToggleMobileSidebar: () => void;
  onResetData: () => void;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  isOnline?: boolean;
  syncState?: SyncState;
  hasPendingWrites?: boolean;
  pendingCount?: number;
  onTriggerSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  websiteName,
  totalChains,
  totalBranches,
  onOpenSettings,
  onToggleMobileSidebar,
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  isOnline = true,
  syncState = 'synced',
  hasPendingWrites = false,
  pendingCount = 0,
  onTriggerSync,
}) => {
  // Ensure "في مصر" is stripped from title on all screen sizes
  const cleanTitle = websiteName.replace(/\s*في مصر\s*$/, '').trim() || 'دليل سلاسل السوبر ماركت';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Right Section: Mobile Toggle & Logo/Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition shrink-0"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 shrink-0">
                <Store className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-xl font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {cleanTitle}
                </h1>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  الدليل الرقمي المتكامل لسلاسل ومنافذ الهايبر والسوبر ماركت
                </p>
              </div>
            </div>
          </div>

          {/* Left Section: Network Sync Status, Install Button, Stats & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real-Time Cloud Sync & Offline State Indicator */}
            <SyncStatusIndicator
              isOnline={isOnline}
              syncState={syncState}
              hasPendingWrites={hasPendingWrites}
              pendingCount={pendingCount}
              onTriggerSync={onTriggerSync}
            />

            {/* PWA In-App Install Prompt */}
            <PWAInstallButton />

            {/* Quick Stats Badges */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-750 text-slate-200">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">السلاسل:</span>
                <span className="text-sm font-extrabold text-emerald-400">{totalChains}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-750 text-slate-200">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">إجمالي الفروع:</span>
                <span className="text-sm font-extrabold text-cyan-400">{totalBranches}</span>
              </div>
            </div>

            {/* Admin Status / Login Toggle */}
            {isAdmin ? (
              <button
                onClick={onLogoutAdmin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 transition shadow-sm"
                title="أنت في وضع المسؤول - انقر لتسجيل خروج المسؤول"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="whitespace-nowrap">المسؤول 🛡️</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 text-xs font-semibold transition"
                title="تسجيل دخول كمسؤول لإدارة الفروع وتعديل السلاسل"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="whitespace-nowrap hidden sm:inline">دخول مسؤول</span>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-700/40 active:scale-95 transition-all duration-200"
              title="فتح نافذة الإعدادات وتخصيص الموقع"
            >
              <Settings className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
