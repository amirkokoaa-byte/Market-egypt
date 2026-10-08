import React, { useState, useRef, useMemo } from 'react';
import {
  Globe,
  Phone,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Upload,
  Download,
  Plus,
  MapPin,
  Search,
  Camera,
  Check,
  X,
  Copy,
  Sparkles,
  PartyPopper,
  Share2,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SupermarketChain, Branch } from '../types';
import { parseExcelBranches, downloadExcelTemplate, exportBranchesToExcel } from '../utils/excel';

interface ChainProfileProps {
  chain: SupermarketChain;
  onUpdateChain: (id: string, updates: Partial<SupermarketChain>) => void;
  onDeleteChain: (id: string) => void;
  onAddBranch: (chainId: string, branch: Omit<Branch, 'id'>) => void;
  onBulkAddBranches: (chainId: string, branches: Branch[]) => void;
  onUpdateBranch: (chainId: string, branchId: string, updates: Partial<Branch>) => void;
  onDeleteBranch: (chainId: string, branchId: string) => void;
  onOpenEditChainModal: () => void;
  onOpenAddBranchModal: () => void;
  onOpenEditBranchModal: (branch: Branch) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ChainProfile: React.FC<ChainProfileProps> = ({
  chain,
  onUpdateChain,
  onDeleteChain,
  onAddBranch,
  onBulkAddBranches,
  onUpdateBranch,
  onDeleteBranch,
  onOpenEditChainModal,
  onOpenAddBranchModal,
  onOpenEditBranchModal,
  showToast,
}) => {
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isCopiedHotline, setIsCopiedHotline] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Check anniversary month
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isAnniversaryThisMonth = chain.anniversaryMonth === currentMonth;

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'],
    });
    showToast('success', `كل عام وسلسلة ${chain.name} بخير! 🎂🎉`, 'تم الاحتفال بعيد ميلاد السلسلة');
  };

  // Filtered branches for current chain
  const filteredBranches = useMemo(() => {
    const branches = chain.branches || [];
    return branches.filter((b) => {
      const matchSearch =
        !branchSearch.trim() ||
        b.name.toLowerCase().includes(branchSearch.toLowerCase().trim()) ||
        b.address.toLowerCase().includes(branchSearch.toLowerCase().trim()) ||
        (b.phone && b.phone.includes(branchSearch.trim())) ||
        (b.city && b.city.toLowerCase().includes(branchSearch.toLowerCase().trim()));

      const matchGov =
        selectedGovernorate === 'all' ||
        (b.city && b.city.trim() === selectedGovernorate.trim()) ||
        (!b.city && selectedGovernorate === 'أخرى');

      return matchSearch && matchGov;
    });
  }, [chain.branches, branchSearch, selectedGovernorate]);

  // List of unique governorates in this chain
  const governorates = useMemo(() => {
    const set = new Set<string>();
    chain.branches?.forEach((b) => {
      if (b.city) set.add(b.city.trim());
    });
    return Array.from(set);
  }, [chain.branches]);

  // Handle Logo change from file
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateChain(chain.id, { logo: reader.result });
          showToast('success', 'تم تحديث لوجو السلسلة بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Excel upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingExcel(true);
      const parsedBranches = await parseExcelBranches(file);
      if (parsedBranches.length === 0) {
        showToast('error', 'لم يتم العثور على أي فروع صالحة داخل الملف.');
        return;
      }
      onBulkAddBranches(chain.id, parsedBranches);
    } catch (err: any) {
      showToast('error', 'فشل قراءة ملف الإكسيل', err.message || 'تأكد من صيغة الملف .xlsx أو .xls');
    } finally {
      setIsUploadingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Inline edit field save
  const startEditing = (field: string, currentVal: string = '') => {
    setEditingField(field);
    setEditValue(currentVal);
  };

  const saveInlineEdit = () => {
    if (!editingField) return;
    if (editingField === 'hotline') {
      onUpdateChain(chain.id, { hotline: editValue.trim() });
    } else if (editingField === 'facebook') {
      onUpdateChain(chain.id, { facebookUrl: editValue.trim() });
    } else if (editingField === 'website') {
      onUpdateChain(chain.id, { websiteUrl: editValue.trim() });
    } else if (editingField === 'anniversary') {
      // Try extract month if possible
      let month = chain.anniversaryMonth;
      if (editValue.includes('أكتوبر') || editValue.includes('10')) month = 10;
      else if (editValue.includes('يناير') || editValue.includes('1')) month = 1;
      else if (editValue.includes('فبراير') || editValue.includes('2')) month = 2;
      else if (editValue.includes('مارس') || editValue.includes('3')) month = 3;
      else if (editValue.includes('أبريل') || editValue.includes('4')) month = 4;
      else if (editValue.includes('مايو') || editValue.includes('5')) month = 5;
      else if (editValue.includes('يونيو') || editValue.includes('6')) month = 6;
      else if (editValue.includes('يوليو') || editValue.includes('7')) month = 7;
      else if (editValue.includes('أغسطس') || editValue.includes('8')) month = 8;
      else if (editValue.includes('سبتمبر') || editValue.includes('9')) month = 9;
      else if (editValue.includes('نوفمبر') || editValue.includes('11')) month = 11;
      else if (editValue.includes('ديسمبر') || editValue.includes('12')) month = 12;

      onUpdateChain(chain.id, { anniversaryDate: editValue.trim(), anniversaryMonth: month });
    }
    setEditingField(null);
  };

  const copyHotline = () => {
    if (chain.hotline) {
      navigator.clipboard.writeText(chain.hotline);
      setIsCopiedHotline(true);
      showToast('info', `تم نسخ رقم الخط الساخن: ${chain.hotline}`);
      setTimeout(() => setIsCopiedHotline(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================= */}
      {/* A. BRAND IDENTITY BOX (مربع الهوية والروابط) */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Top Gradient Banner / Header */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 relative overflow-hidden">
          {chain.coverImage && (
            <img
              src={chain.coverImage}
              alt={chain.name}
              className="w-full h-full object-cover opacity-35 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

          {/* Top Quick Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              سلسلة معتمدة في مصر 🇪🇬
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEditChainModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600/50 backdrop-blur-md transition shadow"
                title="تعديل كافة بيانات السلسلة"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تعديل السلسلة</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف سلسلة "${chain.name}" وكافة فروعها؟`)) {
                    onDeleteChain(chain.id);
                  }
                }}
                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 backdrop-blur-md transition"
                title="حذف السلسلة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            {/* Visual Logo Box + Name */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">
              {/* Logo / Image Box */}
              <div className="relative group shrink-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-800 border-4 border-slate-900 shadow-2xl overflow-hidden flex items-center justify-center relative bg-gradient-to-b from-slate-800 to-slate-900">
                  {chain.logo ? (
                    <img
                      src={chain.logo}
                      alt={chain.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-3xl font-black text-emerald-400">
                      {chain.name.slice(0, 2)}
                    </span>
                  )}
                  {/* Upload Overlay */}
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-xs font-bold transition-opacity"
                    title="تغيير لوجو السلسلة"
                  >
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span>تغيير اللوجو</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 sm:mb-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {chain.name}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {chain.description || 'إحدى أكبر سلاسل السوبر ماركت وتجارة التجزئة في جمهورية مصر العربية.'}
                </p>
              </div>
            </div>

            {/* Total Branch Counter Badge on the side */}
            <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0 self-center md:self-end">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-tr from-emerald-950 via-slate-850 to-teal-950 border border-emerald-500/40 shadow-xl flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-300">إجمالي الفروع المسجلة</div>
                  <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1">
                    <span>{chain.branches?.length || 0}</span>
                    <span className="text-xs font-normal text-slate-400">فرع</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION LINKS & ANNIVERSARY BAR */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            {/* 1. Facebook Page Link */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex items-center justify-between group hover:border-blue-500/40 transition">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="truncate text-right">
                  <div className="text-[11px] text-slate-400">صفحة فيسبوك</div>
                  {editingField === 'facebook' ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="url"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 w-36"
                      />
                      <button onClick={saveInlineEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-1 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : chain.facebookUrl ? (
                    <a
                      href={chain.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                    >
                      <span>زيارة الصفحة</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">غير محدد</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startEditing('facebook', chain.facebookUrl || '')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="تعديل رابط الفيسبوك"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Official Website Link */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex items-center justify-between group hover:border-cyan-500/40 transition">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="truncate text-right">
                  <div className="text-[11px] text-slate-400">الموقع الإلكتروني</div>
                  {editingField === 'website' ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="url"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="https://..."
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 w-36"
                      />
                      <button onClick={saveInlineEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-1 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : chain.websiteUrl ? (
                    <a
                      href={chain.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate"
                    >
                      <span>الموقع الرسمي</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">غير محدد</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startEditing('website', chain.websiteUrl || '')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="تعديل الموقع الإلكتروني"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Interactive Hotline */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-950/80 border border-emerald-500/40 p-3 flex items-center justify-between group">
              <div className="flex items-center gap-2.5 truncate">
                <a
                  href={`tel:${chain.hotline}`}
                  className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition shadow-lg shadow-emerald-950/50 shrink-0"
                  title="اتصال فوري بالخط الساخن"
                >
                  <Phone className="w-4 h-4 fill-current" />
                </a>
                <div className="text-right">
                  <div className="text-[11px] text-emerald-300 font-semibold">الخط الساخن (Hotline)</div>
                  {editingField === 'hotline' ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="tel"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="16061"
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 w-24"
                      />
                      <button onClick={saveInlineEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-1 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <a
                      href={`tel:${chain.hotline}`}
                      className="text-sm font-extrabold text-white hover:text-emerald-400 tracking-wider font-mono flex items-center gap-1.5"
                    >
                      <span>{chain.hotline || 'لا يوجد'}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">📞 اتصال</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={copyHotline}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
                  title="نسخ الرقم"
                >
                  {isCopiedHotline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => startEditing('hotline', chain.hotline || '')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="تعديل الخط الساخن"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Chain Anniversary / Birthday Field (خانة عيد ميلاد السلسلة 🎂) */}
            <div
              className={`rounded-2xl border p-3 flex items-center justify-between transition ${
                isAnniversaryThisMonth
                  ? 'bg-gradient-to-r from-amber-950/70 to-slate-950 border-amber-500/50 shadow-md shadow-amber-950/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <button
                  onClick={triggerConfetti}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition active:scale-95 ${
                    isAnniversaryThisMonth
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="انقر للاحتفال بعيد ميلاد السلسلة!"
                >
                  {isAnniversaryThisMonth ? (
                    <PartyPopper className="w-4 h-4 text-amber-400 animate-bounce" />
                  ) : (
                    <Calendar className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <div className="text-right truncate">
                  <div className="text-[11px] flex items-center gap-1.5 font-bold">
                    <span className={isAnniversaryThisMonth ? 'text-amber-300' : 'text-slate-400'}>
                      عيد ميلاد السلسلة 🎂
                    </span>
                    {isAnniversaryThisMonth && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-black font-extrabold animate-pulse">
                        هذا الشهر!
                      </span>
                    )}
                  </div>

                  {editingField === 'anniversary' ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="15 أكتوبر"
                        className="text-xs px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 w-28"
                      />
                      <button onClick={saveInlineEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingField(null)} className="p-1 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-extrabold text-white truncate">
                      {chain.anniversaryDate || 'غير محدد'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isAnniversaryThisMonth && (
                  <button
                    onClick={triggerConfetti}
                    className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition"
                    title="فرقعة احتفال 🎊"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => startEditing('anniversary', chain.anniversaryDate || '')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="تعديل تاريخ عيد ميلاد السلسلة"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* B. BRANCHES MANAGEMENT & EXCEL ENGINE (إدارة الفروع والرفع من إكسيل) */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
        {/* Section Header & Main Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>فروع {chain.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {filteredBranches.length} من {chain.branches?.length || 0} فرع
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              استعراض وتعديل وإدارة الفروع بالترتيب التسلسلي مع إمكانية الرفع والتصدير المباشر لملفات Excel
            </p>
          </div>

          {/* Action Buttons: Add Manually, Upload Excel, Download Template, Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Branch Manually */}
            <button
              onClick={onOpenAddBranchModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع يدوياً</span>
            </button>

            {/* Excel Bulk Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-950/40 active:scale-95 transition disabled:opacity-50"
              title="رفع ملف إكسيل يحتوي على الفروع واستيرادها فورياً"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploadingExcel ? 'جاري المعالجة...' : 'رفع الفروع من ملف Excel 📊'}</span>
            </button>

            {/* Download Template */}
            <button
              onClick={downloadExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
              title="تنزيل قالب إكسيل جاهز يحتوي على الأعمدة المطلوبة"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>تحميل نموذج إكسيل فارغ</span>
            </button>

            {/* Export Current Chain Branches */}
            <button
              onClick={() => {
                if (!chain.branches || chain.branches.length === 0) {
                  showToast('error', 'لا توجد فروع لتصديرها.');
                  return;
                }
                exportBranchesToExcel(chain.branches, chain.name);
                showToast('success', `تم تصدير ${chain.branches.length} فرع إلى ملف Excel`);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
              title="تصدير كافة فروع هذه السلسلة لملف إكسيل"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير لـ Excel</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              placeholder="ابحث باسم الفرع، الشارع، أو رقم الهاتف..."
              className="w-full pr-10 pl-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
            {branchSearch && (
              <button
                onClick={() => setBranchSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Governorate Filter */}
          {governorates.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs text-slate-400 shrink-0">المحافظة:</span>
              <select
                value={selectedGovernorate}
                onChange={(e) => setSelectedGovernorate(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-950/70 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">كل المحافظات ({chain.branches?.length || 0})</option>
                {governorates.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Numbered Branches List */}
        {filteredBranches.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
            <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">لم يتم العثور على أي فروع</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكنك إضافة فرع يدوياً بالضغط على زر "إضافة فرع يدوياً" أو رفع مئات الفروع دفعة واحدة عبر زر "رفع الفروع من ملف Excel".
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={onOpenAddBranchModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
              >
                + إضافة أول فرع
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBranches.map((branch, index) => {
              // Calculate actual sequence number
              const sequenceNumber = (chain.branches || []).findIndex((b) => b.id === branch.id) + 1;

              return (
                <div
                  key={branch.id}
                  className="rounded-2xl bg-slate-950/50 hover:bg-slate-950/80 border border-slate-850 hover:border-emerald-500/40 p-4 transition-all duration-200 flex items-start gap-3.5 group shadow-sm hover:shadow-md"
                >
                  {/* Automatic Sequential Side Badge (#1, #2, #3...) */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 group-hover:from-emerald-950 group-hover:to-slate-850 border border-slate-700/60 group-hover:border-emerald-500/50 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner font-mono">
                    #{sequenceNumber}
                  </div>

                  {/* Branch Details */}
                  <div className="flex-1 min-w-0 text-right space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">
                        {branch.name}
                      </h4>

                      {branch.city && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
                          {branch.city}
                        </span>
                      )}
                    </div>

                    {/* Detailed Address */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{branch.address}</span>
                    </div>

                    {/* Meta info & Quick actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-850">
                      <div className="flex items-center gap-3">
                        {branch.phone && (
                          <a
                            href={`tel:${branch.phone}`}
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                            title="اتصال بهذا الفرع"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{branch.phone}</span>
                          </a>
                        )}

                        {branch.mapsUrl && (
                          <a
                            href={branch.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:underline"
                            title="فتح موقع الفرع على خرائط جوجل"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>الاتجاهات على الخريطة</span>
                          </a>
                        )}
                      </div>

                      {/* Edit / Delete per branch */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenEditBranchModal(branch)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="تعديل هذا الفرع"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`حذف فرع "${branch.name}"؟`)) {
                              onDeleteBranch(chain.id, branch.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="حذف هذا الفرع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
