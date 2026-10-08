import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Navigation, Building2 } from 'lucide-react';
import { Branch } from '../types';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Branch, 'id'>) => void;
  initialBranch?: Branch | null;
  chainName: string;
}

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'كفر الشيخ',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'جنوب سيناء',
  'شمال سيناء',
  'مطروح',
  'الوادي الجديد',
];

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBranch,
  chainName,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('القاهرة');
  const [phone, setPhone] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  useEffect(() => {
    if (initialBranch) {
      setName(initialBranch.name || '');
      setAddress(initialBranch.address || '');
      setCity(initialBranch.city || 'القاهرة');
      setPhone(initialBranch.phone || '');
      setMapsUrl(initialBranch.mapsUrl || '');
    } else {
      setName('');
      setAddress('');
      setCity('القاهرة');
      setPhone('');
      setMapsUrl('');
    }
  }, [initialBranch, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    onSave({
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
      mapsUrl: mapsUrl.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد يدوياً'}
              </h3>
              <p className="text-xs text-slate-400">تابع لسلسلة: {chainName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-right">
          {/* Branch Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم الفرع <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: فرع التجمع الخامس - الداون تاون"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Governorate Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              المحافظة / المدينة
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              العنوان بالتفصيل <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="اسم الشارع، معالم قريبة، داخل مول أو مبنى..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Phone & Maps URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تليفون الفرع (اختياري)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="02xxxxxxx أو 16061"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رابط خرائط جوجل (اختياري)
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 transition active:scale-95"
            >
              {initialBranch ? 'حفظ تعديل الفرع' : 'إضافة الفرع الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
