import React, { useState } from 'react';
import {
  Store,
  Search,
  ArrowUpDown,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Cake,
  FolderTree,
  ExternalLink,
  Sparkles,
  X,
  FileSpreadsheet,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { SupermarketChain, CustomSidebarSection, CustomSubButton } from '../types';

interface SidebarProps {
  chains: SupermarketChain[];
  filteredChains: SupermarketChain[];
  selectedChainId: string | null;
  onSelectChain: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortMode: 'alphabetical' | 'alphabetical_desc' | 'branches_count' | 'anniversary_near';
  onSortChange: (mode: 'alphabetical' | 'alphabetical_desc' | 'branches_count' | 'anniversary_near') => void;
  onOpenAddChainModal: () => void;
  customSections: CustomSidebarSection[];
  activeView: 'chains' | 'custom_section';
  selectedSectionId: string | null;
  onSelectCustomSection: (sectionId: string, subBtn?: CustomSubButton) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isAdmin?: boolean;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chains,
  filteredChains,
  selectedChainId,
  onSelectChain,
  searchQuery,
  onSearchChange,
  sortMode,
  onSortChange,
  onOpenAddChainModal,
  customSections,
  activeView,
  selectedSectionId,
  onSelectCustomSection,
  isMobileOpen,
  onCloseMobile,
  isAdmin = false,
  onShowToast,
}) => {
  const [isChainsTabExpanded, setIsChainsTabExpanded] = useState<boolean>(true);
  const [expandedCustomSectionId, setExpandedCustomSectionId] = useState<string | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);

  // Check if anniversary is this month (October)
  const currentMonth = new Date().getMonth() + 1;

  const sortOptions = [
    { id: 'branches_count', label: 'الأكثر فروعاً' },
    { id: 'alphabetical', label: 'أبجدي (أ - ي)' },
    { id: 'alphabetical_desc', label: 'أبجدي (ي - أ)' },
    { id: 'anniversary_near', label: 'أقرب عيد ميلاد 🎂' },
  ] as const;

  const currentSortLabel = sortOptions.find((s) => s.id === sortMode)?.label || 'الترتيب';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-[88vw] max-w-[390px] sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:w-88 xl:w-96 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-base">قائمة السلاسل والأقسام</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* PRIMARY SECTION: سلاسل السوبر ماركت */}
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800/80 overflow-hidden shadow-sm">
            {/* Main Primary Accordion Header */}
            <button
              onClick={() => setIsChainsTabExpanded(!isChainsTabExpanded)}
              className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-800/90 to-slate-900/90 hover:from-slate-800 hover:to-slate-850 transition text-right"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>سلاسل السوبر ماركت</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400">
                      {chains.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">السلاسل المصرية الرسمية</p>
                </div>
              </div>
              <div className="text-slate-400">
                {isChainsTabExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Nested Drawer / Sub-Menu Content */}
            {isChainsTabExpanded && (
              <div className="p-3 border-t border-slate-800/80 space-y-3 bg-slate-950/20">
                {/* 1. Instant Search Bar & 2. Sort Button & 3. Add Market Button */}
                <div className="space-y-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder="ابحث عن سلسلة أو عنوان فرع..."
                      className="w-full pr-9 pl-8 py-2 rounded-xl text-xs bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => onSearchChange('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions Row: Sort Button + Add Chain Button */}
                  <div className={isAdmin ? 'grid grid-cols-2 gap-2' : 'w-full'}>
                    {/* Sort Dropdown */}
                    <div className="relative w-full">
                      <button
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        className="w-full h-10 flex items-center justify-between px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/70 transition"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{currentSortLabel}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                      </button>

                      {isSortDropdownOpen && (
                        <div className="absolute top-full right-0 left-0 mt-1 z-30 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-1 space-y-1">
                          {sortOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                onSortChange(opt.id);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                                sortMode === opt.id
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {sortMode === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* "+ Add New Market" Button (للمسؤول فقط) */}
                    {isAdmin && (
                      <button
                        onClick={onOpenAddChainModal}
                        className="w-full h-10 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-950/40 transition whitespace-nowrap shrink-0"
                        title="إضافة سلسلة سوبر ماركت جديدة (صلاحية مسؤول)"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap font-bold">أضف ماركت +</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Pre-loaded & Dynamic Supermarket Chains List */}
                <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-0.5">
                  {filteredChains.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      لا توجد نتائج مطابقة لـ "{searchQuery}"
                    </div>
                  ) : (
                    filteredChains.map((chain) => {
                      const isSelected = activeView === 'chains' && selectedChainId === chain.id;
                      const isBirthdayThisMonth = chain.anniversaryMonth === currentMonth;

                      return (
                        <button
                          key={chain.id}
                          onClick={() => {
                            onSelectChain(chain.id);
                            onCloseMobile();
                          }}
                          className={`w-full text-right p-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 relative group border ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                              : 'bg-slate-900/60 hover:bg-slate-850/80 border-slate-800/80 hover:border-slate-700/80 text-slate-300 hover:text-white'
                          }`}
                        >
                          {/* Chain Logo Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-slate-700/60 shrink-0 relative flex items-center justify-center">
                            {chain.logo ? (
                              <img
                                src={chain.logo}
                                alt={chain.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if image fails
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className="text-xs font-extrabold text-emerald-400 absolute">
                              {chain.name.slice(0, 2)}
                            </span>
                          </div>

                          {/* Chain Meta */}
                          <div className="flex-1 min-w-0">
                            {/* Chain Name in Full Single Line */}
                            <h4
                              className={`text-xs sm:text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-snug ${
                                isSelected ? 'text-emerald-300 font-extrabold' : 'text-slate-100'
                              }`}
                              title={chain.name}
                            >
                              {chain.name}
                            </h4>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 shrink-0">
                                <MapPin className="w-3 h-3 text-cyan-400" />
                                <strong className="text-slate-300 font-bold">{chain.branches?.length || 0}</strong> فروع
                              </span>
                              {chain.hotline && (
                                <span className="flex items-center gap-1 text-slate-400 shrink-0">
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <span>{chain.hotline}</span>
                                </span>
                              )}
                              {isBirthdayThisMonth && (
                                <span
                                  className="shrink-0 text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1"
                                  title={`عيد ميلاد السلسلة هذا الشهر (${chain.anniversaryDate})`}
                                >
                                  🎂 شهر الميلاد
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selected Indicator Bar */}
                          {isSelected && (
                            <div className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-l" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC CUSTOM SECTIONS (إدارة أقسام القائمة الجانبية) */}
          {customSections.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  الأقسام الإضافية والمخصصة
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {customSections.length}
                </span>
              </div>

              {customSections.map((sec) => {
                const isExpanded = expandedCustomSectionId === sec.id;
                const isSectionSelected = activeView === 'custom_section' && selectedSectionId === sec.id;

                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isSectionSelected
                        ? 'bg-slate-900 border-teal-500/50 shadow-md'
                        : 'bg-slate-950/30 border-slate-800/80'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setExpandedCustomSectionId(isExpanded ? null : sec.id);
                        onSelectCustomSection(sec.id);
                      }}
                      className="w-full flex items-center justify-between p-3 text-right hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                          <FolderTree className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{sec.title}</h4>
                          {sec.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-1">{sec.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Sub-buttons list */}
                    {isExpanded && sec.buttons.length > 0 && (
                      <div className="p-2 border-t border-slate-800/60 space-y-1.5 bg-slate-900/40">
                        {sec.buttons.map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => {
                              onSelectCustomSection(sec.id, btn);
                              onCloseMobile();
                            }}
                            className="w-full text-right p-2 rounded-xl text-xs bg-slate-800/70 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/50 flex items-center justify-between group transition"
                          >
                            <span className="font-medium text-xs truncate">{btn.label}</span>
                            {btn.type === 'link' ? (
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OFFICIAL HOTLINES: CONSUMER PROTECTION & MINISTRY OF SUPPLY (حماية المستهلك والتموين) */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2 shrink-0">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>أرقام الشكاوى وحماية المستهلك</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* جهاز حماية المستهلك */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between gap-1 text-right">
              <span className="text-[10px] font-bold text-slate-300 truncate">حماية المستهلك</span>
              <div className="flex items-center justify-between pt-0.5">
                <a
                  href="tel:19588"
                  className="text-xs font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono tracking-wider"
                  title="اتصال مباشر بجهاز حماية المستهلك"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>19588</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('19588');
                    onShowToast?.('success', 'تم نسخ رقم حماية المستهلك: 19588 ⚖️');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="نسخ رقم حماية المستهلك"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* وزارة التموين والتجارة الداخلية */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between gap-1 text-right">
              <span className="text-[10px] font-bold text-slate-300 truncate">وزارة التموين</span>
              <div className="flex items-center justify-between pt-0.5">
                <a
                  href="tel:19959"
                  className="text-xs font-black text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono tracking-wider"
                  title="اتصال مباشر بوزارة التموين"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>19959</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('19959');
                    onShowToast?.('success', 'تم نسخ رقم وزارة التموين: 19959 🛒');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="نسخ رقم وزارة التموين"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-2.5 border-t border-slate-850 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            تحديث فوري ومحفوظ
          </span>
          <span className="font-mono text-[11px] text-slate-400">دليل السلاسل</span>
        </div>
      </aside>
    </>
  );
};
