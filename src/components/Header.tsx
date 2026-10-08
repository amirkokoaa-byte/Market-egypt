import React from 'react';
import { Settings, Store, MapPin, Menu, Download, Sparkles, RefreshCw } from 'lucide-react';
import { downloadExcelTemplate } from '../utils/excel';

interface HeaderProps {
  websiteName: string;
  totalChains: number;
  totalBranches: number;
  onOpenSettings: () => void;
  onToggleMobileSidebar: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  websiteName,
  totalChains,
  totalBranches,
  onOpenSettings,
  onToggleMobileSidebar,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Right Section: Mobile Toggle & Logo/Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Store className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{websiteName}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    مصر 🇪🇬
                  </span>
                </h1>
                <p className="text-xs text-slate-400 hidden md:block">
                  الدليل الرقمي المتكامل لسلاسل ومنافذ الهايبر والسوبر ماركت المصرية
                </p>
              </div>
            </div>
          </div>

          {/* Left Section: Stats & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Quick Stats Badges */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">السلاسل:</span>
                <span className="text-sm font-extrabold text-emerald-400">{totalChains}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">إجمالي الفروع:</span>
                <span className="text-sm font-extrabold text-cyan-400">{totalBranches}</span>
              </div>
            </div>

            {/* Download Template shortcut */}
            <button
              onClick={downloadExcelTemplate}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 hover:border-emerald-500 transition shadow-sm"
              title="تحميل نموذج ملف إكسيل فارغ لإضافة الفروع"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نموذج Excel</span>
            </button>

            {/* Settings Button (زر الإعدادات ⚙️) */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-700/40 active:scale-95 transition-all duration-200"
              title="فتح نافذة الإعدادات وتخصيص الموقع"
            >
              <Settings className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
              <span>الإعدادات</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
