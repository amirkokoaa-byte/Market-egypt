import React, { useState } from 'react';
import { CustomSidebarSection, CustomSubButton } from '../types';
import { FolderTree, ExternalLink, Sparkles, Plus, ArrowRight, Info, Check, X } from 'lucide-react';

interface CustomSectionViewProps {
  section: CustomSidebarSection;
  onBackToChains: () => void;
  onAddSubButton: (sectionId: string, button: Omit<CustomSubButton, 'id'>) => void;
  onOpenSettings: () => void;
}

export const CustomSectionView: React.FC<CustomSectionViewProps> = ({
  section,
  onBackToChains,
  onAddSubButton,
  onOpenSettings,
}) => {
  const [selectedButton, setSelectedButton] = useState<CustomSubButton | null>(
    section.buttons[0] || null
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <FolderTree className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  قسم مخصص في القائمة الجانبية
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">{section.title}</h2>
              {section.description && (
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">{section.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onBackToChains}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لدليل السلاسل</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition"
            >
              إدارة الأزرار
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Buttons / Sub-Categories Grid */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-md shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>التصنيفات والأزرار الفرعية في هذا القسم</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-teal-400">
              {section.buttons.length}
            </span>
          </h3>
        </div>

        {section.buttons.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            لا توجد أزرار فرعية مضافة في هذا القسم حتى الآن. يمكنك إضافتها من زر "إدارة الأزرار" أعلاه.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.buttons.map((btn) => {
              const isSelected = selectedButton?.id === btn.id;

              return (
                <div
                  key={btn.id}
                  onClick={() => setSelectedButton(btn)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-right ${
                    isSelected
                      ? 'bg-slate-850 border-teal-500/60 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white">{btn.label}</h4>
                    {btn.type === 'link' ? (
                      <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                  </div>

                  {btn.content && (
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {btn.content}
                    </p>
                  )}

                  {btn.type === 'link' && btn.content && (
                    <a
                      href={btn.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <span>زيارة الرابط المباشر</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Button Details Card */}
        {selectedButton && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-teal-500/30 text-right space-y-2 mt-4">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
              <Info className="w-4 h-4" />
              <span>تفاصيل: {selectedButton.label}</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedButton.content || 'لا توجد ملاحظات إضافية لهذا الزر.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
