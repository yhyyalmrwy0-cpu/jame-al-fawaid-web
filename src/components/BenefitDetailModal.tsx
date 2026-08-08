import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Eye, Share2, Copy, Check, BookOpen, Calendar, ArrowDownRight, Sparkles } from 'lucide-react';
import { Benefit } from '../types';
import { formatToHijriAndGregorian } from '../utils';

interface BenefitDetailModalProps {
  benefit: Benefit | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenShareCard: (benefit: Benefit) => void;
  onJumpToList: (benefit: Benefit) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export const BenefitDetailModal: React.FC<BenefitDetailModalProps> = ({
  benefit,
  onClose,
  onToggleFavorite,
  onOpenShareCard,
  onJumpToList,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!benefit) return null;

  const handleCopy = () => {
    let programmerName = 'طالب العلم';
    try {
      const saved = localStorage.getItem('abuosid_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.programmerName) programmerName = parsed.programmerName;
      }
    } catch (e) {
      console.error(e);
    }

    const formattedDate = formatToHijriAndGregorian(benefit.date);

    const fullText = `*${benefit.title}*\n\n${benefit.content}\n\n📚 المصدر: ${benefit.source || 'غير محدد'}\n🏷️ التصنيف: ${benefit.category}\n📅 التاريخ: ${formattedDate}\n\nـــــــــــــــــــــــــــــــــ\nتطبيق جامع الفوائد - تقييد العلم وإشاعته\nإعداد: ${programmerName}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast('تم نسخ نص الفائدة بنجاح إلى الحافظة! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans text-right">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-emerald/20 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-emerald/10 via-brand-cream/30 to-brand-gold/10 border-b border-brand-emerald/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-emerald text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
              </span>
              <div>
                <span className="text-xs font-black text-brand-emerald-dark bg-brand-emerald/10 px-2.5 py-0.5 rounded-md">
                  عرض فائدة في إطار منبثق 💡
                </span>
                <span className="block text-[11px] text-zinc-500 font-medium mt-0.5">
                  {benefit.category}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-zinc-800 font-sans leading-snug border-r-4 border-brand-gold pr-3">
              {benefit.title}
            </h2>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-200/80">
              <div className="flex items-center gap-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5 text-brand-emerald" />
                <span>{formatToHijriAndGregorian(benefit.date)}</span>
              </div>

              {benefit.source && (
                <div className="flex items-center gap-1.5 font-sans border-r border-zinc-200 pr-3">
                  <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                  <span>المصدر: <strong className="text-zinc-700">{benefit.source}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-sans border-r border-zinc-200 pr-3 mr-auto">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                <span>{benefit.views} قراءة</span>
              </div>
            </div>

            {/* Main Full Text Box */}
            <div className="p-4 sm:p-5 bg-brand-beige/30 rounded-2xl border border-brand-cream/40 text-[15px] sm:text-base text-zinc-800 benefit-text font-normal leading-loose whitespace-pre-line select-none max-h-96 overflow-y-auto shadow-inner">
              {benefit.content}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-white text-zinc-700 hover:text-brand-emerald border border-zinc-200 hover:border-brand-emerald/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              {/* Toggle Favorite */}
              <button
                type="button"
                onClick={() => onToggleFavorite(benefit.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                  benefit.isFavorite
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-rose-500 hover:border-rose-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${benefit.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{benefit.isFavorite ? 'في المفضلة' : 'أضف للمفضلة'}</span>
              </button>

              {/* Share Card button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareCard(benefit);
                }}
                className="px-3.5 py-2 bg-white text-zinc-700 hover:text-brand-gold-dark border border-zinc-200 hover:border-brand-gold/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-brand-gold" />
                <span>بطاقة إهداء</span>
              </button>
            </div>

            {/* Jump to position in feed button */}
            <button
              type="button"
              onClick={() => onJumpToList(benefit)}
              className="px-4 py-2 bg-brand-emerald text-white hover:bg-brand-emerald-dark rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <span>الذهاب إليها في القائمة الرئيسيّة</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
