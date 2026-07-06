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
    const holdDuration = Date.now() - holdStartTimeRef.current;

    if (isHolding) {
      setIsHolding(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;

      // If duration is less than 500ms, perform a regular click to edit the name
      if (holdDuration < 500) {
        setIsEditingName(true);
      }
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
    if (benefits.length > 0) {
      const randomIndex = Math.floor(Math.random() * benefits.length);
      setRandomBenefit(benefits[randomIndex]);
    } else {
      setRandomBenefit(null);
    }
  };

  // Select a random benefit on mount or when the benefits list changes from empty to populated
  useEffect(() => {
    selectRandomBenefit();
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
          <AppLogo className="w-14 h-14 shrink-0" />
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
                    onMouseDown={startHold}
                    onMouseUp={cancelHold}
                    onMouseLeave={cancelHold}
                    onTouchStart={startHold}
                    onTouchEnd={cancelHold}
                    className="p-1.5 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-brand-gold-light rounded-lg transition-colors cursor-pointer"
                    title="تعديل هذا الاسم"
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
          <motion.div
            key={randomBenefit.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-brand-beige border-r-4 border-r-brand-gold border border-brand-cream/40 rounded-2xl p-5 custom-shadow-gold relative overflow-hidden cursor-pointer hover:border-brand-gold/60 transition-all group"
            onClick={() => onViewBenefit(randomBenefit)}
          >
            {/* Background design elements */}
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-brand-cream/20 rounded-full blur-2xl" />
            
            <div className="flex items-center justify-between mb-3 border-b border-brand-cream/55 pb-2.5">
              <div className="flex items-center gap-2 text-brand-emerald">
                <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
                <span className="text-sm font-bold tracking-wide">💡 فائدة اليوم العشوائية</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-zinc-500 hover:text-brand-emerald hover:bg-brand-cream/50 rounded-lg transition-all"
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
                  className="p-1.5 text-zinc-500 hover:text-brand-emerald hover:bg-brand-cream/50 rounded-lg transition-all"
                  title="فائدة عشوائية أخرى"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-brand-emerald-dark leading-snug group-hover:text-brand-emerald transition-colors line-clamp-1">
                {randomBenefit.title}
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed font-serif line-clamp-3">
                {randomBenefit.content}
              </p>
              
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2">
                <span className="px-2.5 py-1 bg-brand-cream text-brand-emerald font-semibold rounded-lg">
                  {randomBenefit.category}
                </span>
                {randomBenefit.source && (
                  <span className="text-zinc-500 font-sans">
                    المصدر: <span className="font-medium text-brand-emerald">{randomBenefit.source}</span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
