import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { 
  BookOpen, 
  Printer, 
  SlidersHorizontal, 
  HelpCircle, 
  Camera, 
  ChevronLeft,
  Bookmark,
  ShieldCheck
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  activeTab: 'home' | 'add' | 'queries' | 'settings' | 'print';
  onSelectTab: (tab: 'home' | 'add' | 'queries' | 'settings' | 'print') => void;
  totalBenefits?: number;
  totalQueries?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  activeTab,
  onSelectTab,
  totalBenefits = 0,
  totalQueries = 0,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle touch gesture from screen right edge to open drawer
  useEffect(() => {
    if (isOpen || !onOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Only trigger if touch starts near the right edge of screen (within 32px)
        if (touch.clientX >= window.innerWidth - 32) {
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        } else {
          touchStartRef.current = null;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Swiping left from right edge (deltaX < -40) with low vertical movement
      if (deltaX < -40 && deltaY < 60) {
        onOpen();
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onOpen]);

  const navItems = [
    {
      id: 'home' as const,
      title: 'الفوائد والملاحظات',
      subtitle: 'تصفح وقيد جميع الفوائد والفرائد',
      icon: BookOpen,
      badge: totalBenefits > 0 ? `${totalBenefits}` : undefined,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      activeColor: 'bg-brand-emerald-dark text-white border-brand-emerald-dark',
    },
    {
      id: 'add' as const,
      title: 'التصوير بالذكاء الاصطناعي',
      subtitle: 'استخراج وتلخيص من الكتب والصور',
      icon: Camera,
      badge: 'جديد AI',
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
      activeColor: 'bg-gradient-to-r from-amber-600 to-brand-gold text-white border-amber-600',
    },
    {
      id: 'queries' as const,
      title: 'المسائل والاستشكالات',
      subtitle: 'توثيق وبحث الإشكالات العلمية العالقة',
      icon: HelpCircle,
      badge: totalQueries > 0 ? `${totalQueries}` : undefined,
      color: 'text-sky-700 bg-sky-50 border-sky-200/80',
      activeColor: 'bg-sky-800 text-white border-sky-800',
    },
    {
      id: 'print' as const,
      title: 'طباعة PDF والتصدير',
      subtitle: 'طباعة الفوائد وتصدير الكتيبات',
      icon: Printer,
      badge: undefined,
      color: 'text-purple-700 bg-purple-50 border-purple-200/80',
      activeColor: 'bg-purple-800 text-white border-purple-800',
    },
    {
      id: 'settings' as const,
      title: 'الإعدادات والتحكم',
      subtitle: 'النسخ الاحتياطي والمظهر والتحكم',
      icon: SlidersHorizontal,
      badge: undefined,
      color: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      activeColor: 'bg-zinc-800 text-white border-zinc-800',
    },
  ];

  const handleDragEnd = (_: any, info: PanInfo) => {
    // In RTL, dragging rightwards means positive X offset (info.offset.x > 60) or velocity.x > 200
    if (info.offset.x > 60 || info.velocity.x > 200) {
      onClose();
    }
  };

  return (
    <>
      {/* Subtle touch trigger area on the right edge when drawer is closed */}
      {!isOpen && onOpen && (
        <div
          onClick={onOpen}
          className="fixed top-0 bottom-0 right-0 w-3.5 z-30 cursor-pointer touch-none hover:bg-brand-gold/10 transition-colors"
          title="اسحب لفتح القائمة"
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans text-rightDir select-none" dir="rtl">
            {/* Backdrop Overlay - Clicking outside closes the drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer transition-opacity"
            />

            {/* Sliding Drawer Container with Spring Elastic Animation & Drag Gesture */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 26,
                mass: 0.75,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.7 }}
              onDragEnd={handleDragEnd}
              className="fixed top-0 bottom-0 right-0 z-50 w-[68vw] max-w-[295px] bg-gradient-to-b from-[#FDFBF7] via-white to-[#F5F2ED] shadow-2xl flex flex-col justify-between border-l border-brand-gold/30 rounded-l-3xl overflow-hidden touch-pan-y"
            >
              {/* Visual Drag Handle Pill Bar (Indicates swipability) */}
              <div className="absolute top-1/2 left-1.5 -translate-y-1/2 w-1 h-12 bg-zinc-300/60 rounded-full z-10 pointer-events-none" />

              {/* Header section with App Title - NO X CLOSE BUTTON */}
              <div className="bg-gradient-to-l from-brand-emerald-dark via-brand-emerald to-emerald-900 px-4 py-5 text-white border-b border-brand-gold/25 relative shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-2xl border border-white/15 shadow-inner shrink-0">
                    <AppLogo className="w-8 h-8 shrink-0" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-base font-black text-brand-cream flex items-center gap-1.5 leading-tight">
                      <span>جامع الفوائد</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-gold/30 border border-brand-gold/40 rounded-full text-brand-cream">
                        v3.5
                      </span>
                    </h2>
                    <p className="text-[10px] text-brand-cream/80 font-sans font-medium leading-tight">
                      التدوين والتوثيق العلمي الأصيل
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation items section */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scroll">
                <div className="px-1 pb-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                    روابط التنقل السريع
                  </span>
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 text-right transition-all cursor-pointer border ${
                        isActive
                          ? `${item.activeColor} shadow-md ring-1 ring-brand-gold/30`
                          : 'bg-white hover:bg-zinc-50/80 text-zinc-800 border-zinc-200/80 hover:border-brand-emerald/30 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-lg border transition-colors shrink-0 ${
                            isActive
                              ? 'bg-white/15 border-white/20 text-white'
                              : `${item.color}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="space-y-0.5 min-w-0 text-right">
                          <span className={`text-xs font-black block font-sans truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                            {item.title}
                          </span>
                          <span className={`text-[10px] block truncate leading-tight ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border whitespace-nowrap ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-brand-emerald-dark/10 text-brand-emerald-dark border-brand-emerald/20'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronLeft
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? 'text-brand-gold-light' : 'text-zinc-400'
                          }`}
                        />
                      </div>
                    </motion.button>
                  );
                })}

                {/* Quick Info / App Badge Card */}
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-900/5 to-brand-emerald/10 border border-brand-emerald/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-emerald-dark font-black text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>عمل محلي وبدون إنترنت</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed font-sans">
                    يتم حفظ جميع فوائدك وملاحظاتك محلياً بشكل آمن وفوري.
                  </p>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-3 bg-brand-cream/80 border-t border-zinc-200/80 text-center space-y-0.5 shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-700">
                  <Bookmark className="w-3 h-3 text-brand-gold" />
                  <span>تطبيق جامع الفوائد v3.5</span>
                </div>
                <p className="text-[9px] text-zinc-500 font-sans">
                  جميع الحقوق محفوظة © {new Date().getFullYear()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

