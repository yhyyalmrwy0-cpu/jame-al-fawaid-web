import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, RefreshCw, Trophy, Sparkles, Copy, Check, PenLine, X } from 'lucide-react';
import { Benefit, AppSettings } from '../types';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  totalBenefits: number;
  benefits: Benefit[];
  onViewBenefit: (benefit: Benefit) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onUnlockControlPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalBenefits,
  benefits,
  onViewBenefit,
  showToast,
  settings,
  onUpdateSettings,
  onUnlockControlPanel,
}) => {
  const [randomBenefit, setRandomBenefit] = useState<Benefit | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(settings.programmerName);
  const [isDailyBenefitHidden, setIsDailyBenefitHidden] = useState(false);

  // Sync isDailyBenefitHidden with localStorage whenever randomBenefit changes
  useEffect(() => {
    if (randomBenefit) {
      const isHidden = localStorage.getItem(`abuosid_daily_benefit_hidden_${randomBenefit.id}`) === 'true';
      setIsDailyBenefitHidden(isHidden);
    } else {
      setIsDailyBenefitHidden(false);
    }
  }, [randomBenefit]);

  const handleHideDailyBenefit = (hidden: boolean) => {
    setIsDailyBenefitHidden(hidden);
    if (randomBenefit) {
      if (hidden) {
        localStorage.setItem(`abuosid_daily_benefit_hidden_${randomBenefit.id}`, 'true');
      } else {
        localStorage.removeItem(`abuosid_daily_benefit_hidden_${randomBenefit.id}`);
      }
    }
  };

  const [isHolding, setIsHolding] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = React.useRef<number>(0);

  // keep in sync with settings prop updates
  useEffect(() => {
    setEditedName(settings.programmerName);
  }, [settings.programmerName]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    holdStartTimeRef.current = Date.now();
    setIsHolding(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsHolding(false);
      timerRef.current = null;

      if (onUnlockControlPanel) {
        onUnlockControlPanel();
      }
    }, 5000);
  };

  const cancelHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (isHolding) {
      setIsHolding(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const saveName = () => {
    if (editedName.trim() === '') {
      showToast('لا يمكن أن يكون الاسم فارغاً!', 'warning');
      return;
    }
    onUpdateSettings({
      ...settings,
      programmerName: editedName.trim(),
    });
    setIsEditingName(false);
    showToast('تم تحديث اسم صاحب الفوائد بنجاح!', 'success');
  };

  const selectRandomBenefit = () => {
    if (benefits.length === 0) {
      setRandomBenefit(null);
      return;
    }

    try {
      // Get already shown benefit IDs
      const storedShown = localStorage.getItem('abuosid_shown_benefit_ids');
      let shownIds: string[] = [];
      if (storedShown) {
        shownIds = JSON.parse(storedShown);
      }

      // Filter benefits that haven't been shown yet
      let unshownBenefits = benefits.filter(b => !shownIds.includes(b.id));

      // If all have been shown (or something went wrong), reset the list
      if (unshownBenefits.length === 0) {
        shownIds = [];
        unshownBenefits = [...benefits];
        // Clear all stored hidden states when the cycle completes
        benefits.forEach(b => {
          try {
            localStorage.removeItem(`abuosid_daily_benefit_hidden_${b.id}`);
          } catch (e) {}
        });
      }

      // Pick a random benefit from the unshown ones
      const randomIndex = Math.floor(Math.random() * unshownBenefits.length);
      const chosenBenefit = unshownBenefits[randomIndex];

      if (chosenBenefit) {
        // Record this benefit as shown
        shownIds.push(chosenBenefit.id);
        localStorage.setItem('abuosid_shown_benefit_ids', JSON.stringify(shownIds));
        localStorage.setItem('abuosid_current_daily_benefit_id', chosenBenefit.id);
        
        // Save today's date
        const todayStr = new Date().toDateString();
        localStorage.setItem('abuosid_current_daily_benefit_date', todayStr);
        
        setRandomBenefit(chosenBenefit);
      }
    } catch (error) {
      console.error('Error selecting random benefit:', error);
      const randomIndex = Math.floor(Math.random() * benefits.length);
      const fallback = benefits[randomIndex] || null;
      setRandomBenefit(fallback);
      if (fallback) {
        localStorage.setItem('abuosid_current_daily_benefit_id', fallback.id);
      }
    }
  };

  // Select a random benefit on mount or when the benefits list changes
  useEffect(() => {
    if (benefits.length > 0) {
      const savedId = localStorage.getItem('abuosid_current_daily_benefit_id');
      const savedDate = localStorage.getItem('abuosid_current_daily_benefit_date');
      const todayStr = new Date().toDateString();
      
      const found = benefits.find(b => b.id === savedId);
      
      // If it exists AND it's still the same day, restore it!
      // Otherwise (different day, or no saved benefit, or benefit deleted), select a new one.
      if (found && savedDate === todayStr) {
        setRandomBenefit(found);
      } else {
        selectRandomBenefit();
      }
    } else {
      setRandomBenefit(null);
    }
  }, [benefits.length]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (randomBenefit) {
      const textToCopy = `الفائدة: ${randomBenefit.title}\n\n${randomBenefit.content}\n\nالمصدر: ${randomBenefit.source || 'غير محدد'}\nالتصنيف: ${randomBenefit.category}`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      showToast('تم نسخ الفائدة اليومية بنجاح!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner and Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-l from-brand-emerald-dark to-brand-emerald p-6 rounded-2xl text-white border border-brand-gold/20 custom-shadow">
        <div className="flex items-center gap-4 text-center sm:text-right">
          <div
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="cursor-pointer select-none active:scale-95 transition-transform"
            title="شعار التطبيق (اضغط مطولاً لخيارات المطور)"
          >
            <AppLogo className="w-14 h-14 shrink-0" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight text-brand-cream flex items-center gap-2 justify-center sm:justify-start">
              جامع الفوائد
              <span className="text-xs font-normal px-2.5 py-1 bg-brand-gold/30 border border-brand-gold-light/40 rounded-full text-brand-cream select-none">
                تطبيق تدوين علمي
              </span>
            </h1>
            
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                  <span className="text-xs text-zinc-300 font-sans">فوائد</span>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') {
                        setEditedName(settings.programmerName);
                        setIsEditingName(false);
                      }
                    }}
                    className="bg-transparent text-white border-b border-brand-gold/60 focus:outline-none text-sm px-1 py-0.5 w-32 text-center font-bold"
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    className="p-1 hover:bg-white/10 rounded text-emerald-300 transition-colors cursor-pointer"
                    title="حفظ الاسم الجديد"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditedName(settings.programmerName);
                      setIsEditingName(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-rose-300 transition-colors cursor-pointer"
                    title="إلغاء التعديل"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm sm:text-base text-zinc-200 font-sans leading-relaxed">
                  <span>فوائد</span>
                  <span className="font-extrabold text-brand-gold-light text-base sm:text-lg underline underline-offset-4 decoration-brand-gold/30">
                    {settings.programmerName}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-brand-gold-light rounded-lg transition-colors cursor-pointer"
                    title="تعديل هذا الاسم"
                    id="edit-username-button"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-300 mt-2.5 font-sans leading-relaxed select-none max-w-sm">
              تقييد الأوابد العلمية، والشوارد الحديثية، والمسائل الفقهية واللغوية
            </p>
          </div>
        </div>

        {/* Total Benefits Counter Badge - Islamic Star/Seal Design */}
        <div className="relative overflow-hidden flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-all duration-300 px-5 py-3.5 rounded-2xl border border-white/10 shrink-0 select-none shadow-lg group">
          {/* Inner ambient glow */}
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-brand-gold/10 rounded-full blur-xl group-hover:bg-brand-gold/20 transition-all duration-300" />
          
          <div className="text-right z-10">
            <p className="text-[10px] text-zinc-300 font-extrabold uppercase tracking-wider flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3 text-brand-gold-light animate-pulse shrink-0" />
              <span>الفوائد المقيدة</span>
            </p>
            <p className="text-xs text-brand-gold-light/95 font-bold mt-0.5 font-sans">
              خزانة الفوائد العامرة
            </p>
          </div>
          
          {/* 8-pointed Islamic Star Counter */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0 z-10">
            {/* Shadow effect */}
            <div className="absolute inset-0 bg-black/20 rotate-45 rounded-md blur-[1px]" />
            {/* Outer Gold Star */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold via-yellow-400 to-amber-600 rotate-45 rounded-lg shadow-md transition-transform duration-700 group-hover:rotate-90" />
            {/* Inner Dark Emerald Star */}
            <div className="absolute inset-0.5 bg-brand-emerald-dark rotate-45 rounded-md" />
            {/* Centered Number */}
            <span className="relative text-xl font-black font-sans text-brand-gold-light drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
              {totalBenefits}
            </span>
          </div>
        </div>
      </div>

      {/* Random Daily Benefit Segment */}
      <AnimatePresence mode="wait">
        {randomBenefit && (
          isDailyBenefitHidden ? (
            <motion.button
              key="show-daily-benefit-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                selectRandomBenefit();
                handleHideDailyBenefit(false);
              }}
              className="w-full bg-gradient-to-r from-brand-emerald-dark to-brand-emerald text-white hover:text-brand-cream font-extrabold py-4 px-6 rounded-2xl border border-brand-gold/25 flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-200 cursor-pointer font-sans"
            >
              <Sparkles className="w-5 h-5 text-brand-gold animate-pulse shrink-0" />
              <span className="text-sm sm:text-base tracking-wide">عرض فائدة اليوم 💡</span>
            </motion.button>
          ) : (
            <motion.div
              key={randomBenefit.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-brand-beige to-[#FBF9F3] border-r-4 border-brand-emerald border-y border-l border-brand-emerald/15 rounded-2xl p-6 custom-shadow-gold relative overflow-hidden cursor-pointer hover:border-brand-emerald/30 hover:shadow-lg transition-all duration-300 group"
              onClick={() => {
                onViewBenefit(randomBenefit);
                handleHideDailyBenefit(true);
              }}
            >
              {/* Elegant Background Islamic star and ornament */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-brand-gold/10 rounded-full blur-2xl group-hover:bg-brand-gold/15 transition-all duration-300" />
              <div className="absolute top-3 left-3 w-16 h-16 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none select-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-brand-emerald fill-current">
                  <path d="M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z" />
                </svg>
              </div>
              
              {/* Inset elegant thin border line to feel like a manuscript frame */}
              <div className="absolute inset-1.5 border border-brand-gold/10 rounded-xl pointer-events-none" />

              <div className="relative flex items-center justify-between mb-4 border-b border-brand-cream/70 pb-3 z-10">
                <div className="flex items-center gap-2.5 text-brand-emerald">
                  <div className="w-7 h-7 rounded-lg bg-brand-emerald/5 flex items-center justify-center border border-brand-emerald/10">
                    <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
                  </div>
                  <span className="text-sm font-black tracking-wide font-sans text-brand-emerald-dark">💡 فائدة اليوم</span>
                </div>
                
                <div className="flex items-center gap-1.5 relative z-20">
                  {/* Copy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(e);
                    }}
                    className="p-2 text-zinc-500 hover:text-brand-emerald hover:bg-brand-emerald/5 rounded-xl transition-all active:scale-90 cursor-pointer"
                    title="نسخ الفائدة"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectRandomBenefit();
                    }}
                    className="p-2 text-zinc-500 hover:text-brand-emerald hover:bg-brand-emerald/5 rounded-xl transition-all active:rotate-180 duration-500 active:scale-90 cursor-pointer"
                    title="تصفح فائدة أخرى"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative space-y-3.5 z-10">
                <h3 className="text-base sm:text-lg font-extrabold text-brand-emerald-dark leading-snug group-hover:text-brand-emerald transition-colors line-clamp-1">
                  {randomBenefit.title}
                </h3>
                
                {/* Refined frame for the quote block inside the daily benefit card */}
                <p className="text-sm sm:text-base text-zinc-800 leading-relaxed font-serif line-clamp-4 pr-3.5 border-r-2 border-brand-emerald/20 group-hover:border-brand-emerald/40 transition-colors">
                  {randomBenefit.content}
                </p>
                
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-3 border-t border-brand-cream/40">
                  <span className="px-3 py-1 bg-brand-emerald/5 text-brand-emerald font-bold rounded-lg border border-brand-emerald/10">
                    {randomBenefit.category}
                  </span>
                  {randomBenefit.source && (
                    <span className="text-zinc-500 font-sans">
                      المصدر: <span className="font-bold text-brand-emerald-dark">{randomBenefit.source}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
