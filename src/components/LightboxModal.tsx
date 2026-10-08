import React, { useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Upload, Download, Sparkles } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onUpdateImage: (newUrl: string) => void;
  isAdmin?: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onUpdateImage,
  isAdmin = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in p-4 select-none"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-emerald-300 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            معاينة صورة الغلاف بدقة عالية
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg"
                title="استبدال صورة الغلاف (صلاحية المشرف)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تغيير الصورة</span>
              </button>
            </>
          )}

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="إعادة ضبط القياس"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href={imageUrl}
            download="supermarket-cover.jpg"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="تنزيل الصورة"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white transition mr-2"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="max-w-5xl max-h-[85vh] overflow-hidden flex items-center justify-center p-2 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full Preview"
          style={{ transform: `scale(${zoomLevel})` }}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
          onClick={handleZoomIn}
        />
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 text-center text-xs text-slate-400 pointer-events-none">
        انقر على الصورة للتكبير أو في أي مكان خارجها للإغلاق
      </div>
    </div>
  );
};
