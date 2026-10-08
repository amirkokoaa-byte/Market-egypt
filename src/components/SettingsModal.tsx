import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Type,
  Image,
  FolderTree,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Camera,
  Check,
  ExternalLink,
  Sparkles,
  Link2,
  FileText,
  LogOut,
  UserCheck,
  Cloud,
} from 'lucide-react';
import { AppSettings, CustomSidebarSection, CustomSubButton } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onAddCustomSection: (title: string, description?: string, icon?: string) => void;
  onDeleteCustomSection: (sectionId: string) => void;
  onAddCustomSubButton: (sectionId: string, button: Omit<CustomSubButton, 'id'>) => void;
  onDeleteCustomSubButton: (sectionId: string, buttonId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
  onResetDefaults: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  onSyncAllToFirebase?: () => void;
}

const PRESET_COVERS = [
  {
    name: 'سوبر ماركت عصري راقي',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'ممرات التسوق والهايبر',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'المنتجات الطازجة والفواكه',
    url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'عربات التسوق والأقسام',
    url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1920&q=80',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onAddCustomSection,
  onDeleteCustomSection,
  onAddCustomSubButton,
  onDeleteCustomSubButton,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  onLogout,
  isAdmin = false,
  onSyncAllToFirebase,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cover' | 'sidebar' | 'backup'>('general');
  const [tempWebsiteName, setTempWebsiteName] = useState(settings.websiteName);
  const [tempCoverUrl, setTempCoverUrl] = useState(settings.timelineCoverUrl);

  // New Section inputs
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  // New Sub-button inputs
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [subBtnLabel, setSubBtnLabel] = useState('');
  const [subBtnType, setSubBtnType] = useState<'note' | 'link' | 'custom'>('note');
  const [subBtnContent, setSubBtnContent] = useState('');

  const coverFileRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveGeneral = () => {
    if (tempWebsiteName.trim()) {
      onUpdateSettings({ websiteName: tempWebsiteName.trim() });
    }
  };

  const handleSaveCover = (url: string) => {
    setTempCoverUrl(url);
    onUpdateSettings({ timelineCoverUrl: url });
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleSaveCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    onAddCustomSection(newSectionTitle.trim(), newSectionDesc.trim() || undefined);
    setNewSectionTitle('');
    setNewSectionDesc('');
  };

  const handleCreateSubButton = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSectionId || !subBtnLabel.trim()) return;
    onAddCustomSubButton(targetSectionId, {
      label: subBtnLabel.trim(),
      type: subBtnType,
      content: subBtnContent.trim() || undefined,
    });
    setSubBtnLabel('');
    setSubBtnContent('');
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImportBackup(reader.result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">إعدادات وتخصيص المنصة</h3>
              <p className="text-xs text-slate-400">تعديل الاسم، غلاف التايم لاين، وإدارة أقسام القائمة الجانبية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>اسم المنصة</span>
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cover'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>غلاف التايم لاين</span>
          </button>

          <button
            onClick={() => setActiveTab('sidebar')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sidebar'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>إدارة أقسام القائمة الجانبية</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>النسخ الاحتياطي والضبط</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-right space-y-6">
          {/* TAB 1: GENERAL (Change Website Name) */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اسم الموقع / المنصة الرئيسي
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempWebsiteName}
                    onChange={(e) => setTempWebsiteName(e.target.value)}
                    placeholder="دليل سلاسل السوبر ماركت في مصر"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveGeneral}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
                  >
                    حفظ الاسم
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  يتم تحديث الاسم فورياً في الشريط العلوي والغلاف ومحركات البحث.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  معاينة فورية للاسم:
                </span>
                <div className="text-lg font-black text-white">{tempWebsiteName || settings.websiteName}</div>
              </div>

              {/* Account & Session: Logout Button */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" />
                    <span>جلسة الإدارة والحساب</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    تسجيل الخروج الآمن وإنهاء جلسة العمل الحالية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                      onLogout?.();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: COVER (Upload/Update Timeline Cover) */}
          {activeTab === 'cover' && (
            <div className="space-y-6">
              {!isAdmin && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>تعديل واستبدال صورة غلاف التايم لاين متاح لحساب المشرف فقط (Admin).</span>
                </div>
              )}

              {/* Current Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  معاينة غلاف التايم لاين الحالي
                </label>
                <div className="w-full aspect-[21/7] max-h-56 rounded-2xl overflow-hidden border border-slate-750 bg-slate-950 relative">
                  <img src={tempCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Upload or Custom URL - Admin Only */}
              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>رفع صورة من جهازك (ملف)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      يدعم جميع صيغ الصور (JPG, PNG, WebP) ويتم حفظها محلياً
                    </p>
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverFileUpload}
                    />
                    <button
                      onClick={() => coverFileRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>اختيار ملف ورفعه</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Image className="w-4 h-4 text-cyan-400" />
                      <span>إدخال رابط صورة خارجي (URL)</span>
                    </h4>
                    <input
                      type="url"
                      value={tempCoverUrl}
                      onChange={(e) => setTempCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleSaveCover(tempCoverUrl)}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                    >
                      تطبيق الرابط
                    </button>
                  </div>
                </div>
              )}

              {/* Presets - Admin Only */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    أو اختر من النماذج الجاهزة عالية الدقة:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_COVERS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSaveCover(preset.url)}
                        className="group text-right rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500 transition relative"
                      >
                        <div className="h-20 bg-slate-950 overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>
                        <div className="p-2 bg-slate-900 text-[11px] font-semibold text-slate-300 truncate">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SIDEBAR (Manage Custom Sidebar Sections & Buttons) */}
          {activeTab === 'sidebar' && (
            <div className="space-y-6">
              {/* 1. Add New Section Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>إضافة قسم رئيسي جديد للقائمة الجانبية</span>
                </h4>
                <form onSubmit={handleCreateSection} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="عنوان القسم الجديد (مثال: عروض كبرى، مناطق التوصيل)"
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      value={newSectionDesc}
                      onChange={(e) => setNewSectionDesc(e.target.value)}
                      placeholder="وصف مختصر للقسم (اختياري)"
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                  >
                    + إنشاء القسم الآن
                  </button>
                </form>
              </div>

              {/* 2. Add Sub-Button inside an existing section */}
              {settings.customSections.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>إضافة زر فرعي / تصنيف داخل قسم موجود</span>
                  </h4>
                  <form onSubmit={handleCreateSubButton} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">اختر القسم المستهدف</label>
                        <select
                          required
                          value={targetSectionId || settings.customSections[0]?.id}
                          onChange={(e) => setTargetSectionId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        >
                          {settings.customSections.map((sec) => (
                            <option key={sec.id} value={sec.id}>
                              {sec.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">عنوان الزر الفرعي</label>
                        <input
                          type="text"
                          required
                          value={subBtnLabel}
                          onChange={(e) => setSubBtnLabel(e.target.value)}
                          placeholder="مثال: خصومات الجمعة البيضاء"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">نوع المحتوى</label>
                        <select
                          value={subBtnType}
                          onChange={(e) => setSubBtnType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        >
                          <option value="note">ملاحظة / معلومة تفاعلية</option>
                          <option value="link">رابط ويب خارجي</option>
                          <option value="custom">مخصص</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={subBtnContent}
                        onChange={(e) => setSubBtnContent(e.target.value)}
                        placeholder={
                          subBtnType === 'link'
                            ? 'أدخل الرابط مثل: https://example.com'
                            : 'أدخل نص الملاحظة أو التفاصيل'
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
                    >
                      + إضافة الزر الفرعي
                    </button>
                  </form>
                </div>
              )}

              {/* 3. Existing Custom Sections & Sub-Buttons List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">الأقسام الحالية المُدارة:</h4>
                {settings.customSections.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد أقسام مخصصة حالياً.</p>
                ) : (
                  settings.customSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-sm text-white">{sec.title}</h5>
                          {sec.description && (
                            <p className="text-xs text-slate-400">{sec.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteCustomSection(sec.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 transition"
                          title="حذف هذا القسم بالكامل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sub buttons inside this section */}
                      {sec.buttons.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-850">
                          <span className="text-[11px] text-slate-400 font-semibold">الأزرار الفرعية:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sec.buttons.map((btn) => (
                              <div
                                key={btn.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                              >
                                <span className="font-medium text-slate-200 truncate">{btn.label}</span>
                                <button
                                  onClick={() => onDeleteCustomSubButton(sec.id, btn.id)}
                                  className="text-slate-500 hover:text-rose-400 mr-2 p-1"
                                  title="حذف الزر"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-xl">
              {/* Cloud Sync (Firebase) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">نشر ومزامنة سحابية (Firebase Cloud Sync)</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    رفع وتحديث كافة السلاسل والفروع في قاعدة بيانات Firebase السحابية لكي تظهر لجميع الزوار والمستخدمين لحظياً وبدون تحديث.
                  </p>
                </div>
                {onSyncAllToFirebase && (
                  <button
                    type="button"
                    onClick={onSyncAllToFirebase}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition active:scale-95 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>نشر لجميع المستخدمين ☁️</span>
                  </button>
                )}
              </div>

              {/* Export JSON */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">تصدير نسخة احتياطية كاملة (JSON)</h4>
                  <p className="text-[11px] text-slate-400">
                    تحميل كافة السلاسل والفروع والإعدادات كملف JSON محفوظ
                  </p>
                </div>
                <button
                  onClick={onExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل النسخة</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">استعادة نسخة احتياطية من ملف (JSON)</h4>
                  <p className="text-[11px] text-slate-400">
                    استيراد ملف قاعدة البيانات واسترجاع كافة البيانات السابقة
                  </p>
                </div>
                <div>
                  <input
                    ref={backupFileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleBackupFileUpload}
                  />
                  <button
                    onClick={() => backupFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
                  >
                    <Upload className="w-4 h-4" />
                    <span>اختيار ملف</span>
                  </button>
                </div>
              </div>

              {/* Reset Default */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300">إعادة ضبط المصنع (Reset Defaults)</h4>
                  <p className="text-[11px] text-slate-400">
                    استرجاع الـ 13 سلسلة الأصلية الافتراضية مع فروعها المعتمدة
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة الافتراضية الأصلية؟')) {
                      onResetDefaults();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة ضبط</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                onLogout?.();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800/60 text-xs font-bold transition active:scale-95 shadow"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل خروج</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
