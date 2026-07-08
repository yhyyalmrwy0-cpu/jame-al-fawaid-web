import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Eye, Share2, Edit, Trash, Copy, Check, ChevronDown, ChevronUp, BookOpen, Calendar, Tag, Sparkles } from 'lucide-react';
import { Benefit } from '../types';
import { formatToHijriAndGregorian, getArabicSearchRegex } from '../utils';

interface BenefitCardProps {
  benefit: Benefit;
  onView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (benefit: Benefit) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  onOpenShareCard: (benefit: Benefit) => void;
  forceExpanded?: boolean;
  searchQuery?: string;
}

// Helper to highlight matching text in yellow
function highlightText(text: string, query: string | undefined): React.ReactNode {
  if (!text) return '';
  if (!query || !query.trim()) return text;

  const regex = getArabicSearchRegex(query);
  if (!regex) return text;

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        // Reset the regex index before testing because of the global 'g' flag
        regex.lastIndex = 0;
        const isMatch = regex.test(part);
        
        if (isMatch) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-yellow-950 font-bold px-0.5 rounded-sm"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

export const BenefitCard: React.FC<BenefitCardProps> = ({
  benefit,
  onView,
  onToggleFavorite,
  onEdit,
  onDelete,
  showToast,
  onOpenShareCard,
  forceExpanded,
  searchQuery,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  React.useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  const handleCardClick = () => {
    if (!isExpanded) {
      onView(benefit.id); // Register a view in state
    }
    setIsExpanded(!isExpanded);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let programmerName = 'طالب العلم';
    try {
      const saved = localStorage.getItem('abuosid_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.programmerName) {
          programmerName = parsed.programmerName;
        }
      }
    } catch (err) {
      console.error('Error loading settings for sharing:', err);
    }

    const textToShare = `📖 من فوائد: ${programmerName}\n\n📌 العنوان: ${benefit.title}\nالتصنيف: ${benefit.category}\nالمصدر: ${benefit.source || 'غير محدد'}\nالتاريخ: ${formatToHijriAndGregorian(benefit.date)}\n\nالنص:\n"${benefit.content}"\n\nتم النشر بواسطة تطبيق جامع الفوائد 📚\nhttps://jame-al-fawaid-kc2u.vercel.app`;
    
    navigator.clipboard.writeText(textToShare);
    setCopied(true);
    showToast('تم نسخ الفائدة بالكامل لمشاركتها مع من تحب!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    let programmerName = 'طالب العلم';
    try {
      const saved = localStorage.getItem('abuosid_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.programmerName) {
          programmerName = parsed.programmerName;
        }
      }
    } catch (err) {
      console.error('Error loading settings for sharing:', err);
    }

    const textToShare = `📖 من فوائد: ${programmerName}\n\n📌 العنوان: ${benefit.title}\nالتصنيف: ${benefit.category}\n\n"${benefit.content}"\n\nتم النشر بواسطة تطبيق جامع الفوائد 📚\nhttps://jame-al-fawaid-kc2u.vercel.app`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: benefit.title,
          text: textToShare,
        });
        showToast('تمت المشاركة بنجاح!', 'success');
      } catch (err) {
        // Fallback if dismissed or failed
        handleCopy(e);
      }
    } else {
      handleCopy(e);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(benefit.id);
    showToast('تم حذف الفائدة العلمية بنجاح.', 'info');
    setShowDeleteModal(false);
  };

  return (
    <>
      <motion.div
        layout
        id={`benefit-card-${benefit.id}`}
        className={`bg-white rounded-2xl border border-zinc-200 cursor-pointer transition-all duration-300 custom-shadow hover:border-brand-cream text-right relative ${
          isExpanded ? 'border-brand-gold/40 ring-1 ring-brand-gold/15 !overflow-visible' : 'overflow-hidden'
        }`}
        onClick={handleCardClick}
      >
        {/* Card Header area */}
        <div className="p-5 space-y-3">
          {/* Top row metadata badges and icons */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-brand-cream/40 text-brand-emerald font-bold rounded-lg flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                {highlightText(benefit.category, searchQuery)}
              </span>
              
              {benefit.source && (
                <span className={`text-zinc-500 font-sans font-medium ${
                  isExpanded ? 'break-words' : 'truncate max-w-[150px] sm:max-w-xs'
                }`}>
                  المصدر: {highlightText(benefit.source, searchQuery)}
                </span>
              )}
            </div>

            {/* Quick Action Favorites Heart */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(benefit.id);
                  showToast(benefit.isFavorite ? 'تمت الإزالة من المفضلة.' : 'تمت الإضافة للمفضلة!', 'success');
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-all text-zinc-400 hover:text-red-500"
              >
                <Heart
                  className={`w-4 h-4 transition-all ${
                    benefit.isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Title and views counter */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-base sm:text-lg font-bold text-brand-emerald-dark font-sans leading-snug">
              {highlightText(benefit.title, searchQuery)}
            </h3>
            
            <div className="flex items-center gap-1.5 text-zinc-400 font-sans text-xs pt-1 shrink-0">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>{benefit.views}</span>
            </div>
          </div>

          {/* Summarized preview text if collapsed */}
          {!isExpanded && (
            <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed font-serif pt-1">
              {highlightText(benefit.content, searchQuery)}
            </p>
          )}

          {/* Expanded full body content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="!overflow-visible pt-2 border-t border-brand-cream/20 mt-3"
                style={{ overflow: 'visible' }}
              >
                <p className="text-base text-zinc-800 font-serif leading-loose whitespace-pre-line bg-brand-beige/40 p-4 rounded-xl border border-brand-cream/30 select-text">
                  {highlightText(benefit.content, searchQuery)}
                </p>

                {/* Date & Metadata footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2 text-xs border-t border-zinc-100 text-zinc-500">
                  <div className="flex items-center gap-1.5 font-sans">
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    <span>تاريخ التدوين: {highlightText(formatToHijriAndGregorian(benefit.date), searchQuery)}</span>
                  </div>

                  {/* Operational Toolbar */}
                  <div className="flex items-center gap-1.5">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 font-sans flex items-center gap-1.5 transition-all text-xs border border-zinc-200"
                      title="نسخ النص"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-brand-emerald" />
                          <span>نسخ سريع</span>
                        </>
                      )}
                    </button>

                    {/* Unified Dropdown Share Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareMenu(!showShareMenu);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-sans flex items-center gap-1 transition-all text-xs border cursor-pointer select-none ${
                          showShareMenu 
                            ? 'bg-brand-cream/60 border-brand-gold/60 text-brand-emerald-dark ring-2 ring-brand-gold/10' 
                            : 'hover:bg-zinc-100 text-zinc-650 border-zinc-200'
                        }`}
                        title="خيارات نشر ومشاركة الفائدة"
                      >
                        <Share2 className="w-3.5 h-3.5 text-brand-emerald" />
                        <span>مشاركة</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showShareMenu ? 'rotate-180 text-brand-gold' : 'text-zinc-400'}`} />
                      </button>

                      {/* Share Dropdown Choices Popover */}
                      <AnimatePresence>
                        {showShareMenu && (
                          <>
                            {/* Backdrop transparent layer to dismiss easily */}
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowShareMenu(false);
                              }} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute top-full mt-2 right-0 w-60 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50 text-right space-y-1.5 font-sans origin-top-right"
                            >
                              <span className="text-[10px] text-zinc-400 font-bold block px-2.5 pt-1 pb-1.5 border-b border-zinc-50 uppercase tracking-wider">
                                خيارات النشر والمشاركة:
                              </span>
                              
                              {/* Option 1: Normal text share */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowShareMenu(false);
                                  handleShare(e);
                                }}
                                className="w-full text-right px-2.5 py-2 hover:bg-zinc-50 rounded-lg text-zinc-700 font-medium text-xs flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <Share2 className="w-3.5 h-3.5 text-brand-emerald animate-pulse" />
                                  <span>مشاركة نصية عادية</span>
                                </span>
                                <span className="text-[9px] text-zinc-400 font-bold bg-zinc-100 px-1.5 py-0.5 rounded">مجاني</span>
                              </button>

                              {/* Option 2: Designing a picture card */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowShareMenu(false);
                                  onOpenShareCard(benefit);
                                }}
                                className="w-full text-right px-2.5 py-2 hover:bg-brand-cream/30 text-brand-emerald-dark font-medium text-xs flex items-center justify-between rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                                  <span className="font-bold">تصميم بطاقة مصورة</span>
                                </span>
                                <span className="text-[9px] text-brand-gold-dark font-black bg-brand-gold/15 px-1.5 py-0.5 rounded">ذهبي 👑</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(benefit);
                      }}
                      className="px-3 py-1.5 rounded-lg hover:bg-brand-cream/30 text-brand-emerald hover:text-brand-emerald-dark font-sans flex items-center gap-1 transition-all text-xs border border-brand-cream/60"
                      title="تعديل الفائدة"
                    >
                      <Edit className="w-3.5 h-3.5 text-brand-gold" />
                      <span>تعديل</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600 font-sans flex items-center gap-1 transition-all text-xs border border-red-100"
                      title="حذف الفائدة"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Expand visual indicator bar */}
          <div className="flex justify-center pt-2 text-zinc-400 hover:text-brand-emerald transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Popup */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-right font-sans border border-brand-cream/60 custom-shadow"
            >
              <h4 className="text-base font-bold text-zinc-800 mb-2">تأكيد حذف الفائدة العلمية</h4>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                هل أنت متأكد من رغبتك في حذف الفائدة بعنوان: "{benefit.title}"؟ سيتم حذف هذه المسألة نهائياً ولا يمكن استرجاعها.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                >
                  نعم، احذف الفائدة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
