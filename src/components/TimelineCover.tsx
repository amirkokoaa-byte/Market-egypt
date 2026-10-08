import React, { useRef } from 'react';
import { Maximize2, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';

interface TimelineCoverProps {
  coverUrl: string;
  websiteName: string;
  onOpenLightbox: (url: string) => void;
  onUpdateCover: (newUrl: string) => void;
}

export const TimelineCover: React.FC<TimelineCoverProps> = ({
  coverUrl,
  websiteName,
  onOpenLightbox,
  onUpdateCover,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 group">
      {/* Aspect Ratio Box */}
      <div
        onClick={() => onOpenLightbox(coverUrl)}
        className="w-full aspect-[21/7] min-h-[180px] sm:min-h-[220px] md:min-h-[260px] bg-slate-900 relative cursor-pointer overflow-hidden transition-all duration-300"
        title="انقر لعرض صورة الغلاف بالحجم الكامل (Lightbox)"
      >
        <img
          src={coverUrl}
          alt="Timeline Cover"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Gradient overlays for readability and luxury feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-teal-950/20" />

        {/* Top Badges & Lightbox indicator */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            غلاف الموقع التفاعلي
          </span>

          <div className="flex items-center gap-2">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-xl">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              عرض بالحجم الكامل (تكبير)
            </span>
          </div>
        </div>

        {/* Bottom Banner Content */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pointer-events-none">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-md tracking-tight">
              {websiteName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 max-w-xl drop-shadow line-clamp-1 sm:line-clamp-none">
              أضخم قاعدة بيانات ومتابعة لسلاسل وأفرع السوبر ماركت والهايبر ماركت في جمهورية مصر العربية
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Bar: Replace Cover Image */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/85 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 hover:border-emerald-500 transition-all shadow-xl active:scale-95"
          title="رفع وتغيير صورة الغلاف من جهازك"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>تغيير الغلاف</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox(coverUrl);
          }}
          className="p-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-white/20 transition shadow-xl"
          title="معاينة في Lightbox"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
