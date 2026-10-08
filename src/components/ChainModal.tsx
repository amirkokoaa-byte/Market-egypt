import React, { useState, useEffect, useRef } from 'react';
import { X, Store, Image, Globe, Phone, Calendar, Upload, Camera, FileText } from 'lucide-react';
import { SupermarketChain } from '../types';

interface ChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<SupermarketChain, 'id' | 'branches'>) => void;
  initialChain?: SupermarketChain | null;
}

export const ChainModal: React.FC<ChainModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialChain,
}) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [hotline, setHotline] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialChain) {
      setName(initialChain.name || '');
      setLogo(initialChain.logo || '');
      setCoverImage(initialChain.coverImage || '');
      setFacebookUrl(initialChain.facebookUrl || '');
      setWebsiteUrl(initialChain.websiteUrl || '');
      setHotline(initialChain.hotline || '');
      setAnniversaryDate(initialChain.anniversaryDate || '');
      setDescription(initialChain.description || '');
      setFoundedYear(initialChain.foundedYear || '');
    } else {
      setName('');
      setLogo('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80');
      setCoverImage('');
      setFacebookUrl('');
      setWebsiteUrl('');
      setHotline('');
      setAnniversaryDate('');
      setDescription('');
      setFoundedYear('');
    }
  }, [initialChain, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Detect month
    let month: number | undefined = undefined;
    const lower = anniversaryDate.toLowerCase();
    if (lower.includes('يناير') || lower.includes('1/')) month = 1;
    else if (lower.includes('فبراير') || lower.includes('2/')) month = 2;
    else if (lower.includes('مارس') || lower.includes('3/')) month = 3;
    else if (lower.includes('أبريل') || lower.includes('4/')) month = 4;
    else if (lower.includes('مايو') || lower.includes('5/')) month = 5;
    else if (lower.includes('يونيو') || lower.includes('6/')) month = 6;
    else if (lower.includes('يوليو') || lower.includes('7/')) month = 7;
    else if (lower.includes('أغسطس') || lower.includes('8/')) month = 8;
    else if (lower.includes('سبتمبر') || lower.includes('9/')) month = 9;
    else if (lower.includes('أكتوبر') || lower.includes('10/')) month = 10;
    else if (lower.includes('نوفمبر') || lower.includes('11/')) month = 11;
    else if (lower.includes('ديسمبر') || lower.includes('12/')) month = 12;

    onSave({
      name: name.trim(),
      logo: logo.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      coverImage: coverImage.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      hotline: hotline.trim(),
      anniversaryDate: anniversaryDate.trim() || 'غير محدد',
      anniversaryMonth: month,
      description: description.trim() || undefined,
      foundedYear: foundedYear.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialChain ? 'تعديل بيانات السلسلة' : 'إضافة سلسلة سوبر ماركت جديدة'}
              </h3>
              <p className="text-xs text-slate-400">أدخل الهوية البصرية ومعلومات التواصل الرسمية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-right">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم سلسلة السوبر ماركت <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: هايبر وان، زهران ماركت..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Logo Upload / URL */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              لوجو أو صورة السلسلة
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                {logo ? (
                  <img src={logo} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="رابط صورة اللوجو (URL)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLogo)}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رفع صورة من جهازك</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contact & Social Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hotline */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الخط الساخن (Hotline)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder="مثال: 16061 أو 19554"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Anniversary / Birthday */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عيد ميلاد السلسلة (Anniversary) 🎂
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  type="text"
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  placeholder="مثال: 15 أكتوبر أو 22 ديسمبر"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Facebook URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رابط بيدج الفيسبوك
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رابط الموقع الإلكتروني
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              نبذة مختصرة عن السلسلة
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف للخدمات وتاريخ التأسيس وفروع الهايبر ماركت..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              {initialChain ? 'حفظ التعديلات' : 'إضافة السلسلة إلى الدليل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
