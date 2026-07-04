import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Mic, MicOff, BookOpen, Tag, Calendar, Sparkles, RefreshCw, Layers, Camera, Loader2, Image } from 'lucide-react';
import { Benefit, CATEGORIES, CategoryType } from '../types';
import { PremiumPromoModal } from './PremiumPromoModal';
import { getApiUrl } from '../utils/api';

interface BenefitFormProps {
  onSave: (benefit: Omit<Benefit, 'id' | 'views' | 'isFavorite' | 'createdAt'>) => void;
  initialBenefit?: Benefit | null;
  onCancel?: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export const BenefitForm: React.FC<BenefitFormProps> = ({
  onSave,
  initialBenefit,
  onCancel,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<CategoryType>('العقيدة');
  const [date, setDate] = useState('');
  const [saveAndContinue, setSaveAndContinue] = useState(false);

  // Voice recognition states
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningContent, setIsListeningContent] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Smart Manuscript/Book Reader (OCR) State & Function
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isOcrMenuOpen, setIsOcrMenuOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [ocrUses, setOcrUses] = useState(() => {
    try {
      const stored = localStorage.getItem('abuosid_ocr_free_uses_count');
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  const handleOpenOcrMenu = () => {
    const isActivated = localStorage.getItem('abuosid_app_activated') === 'true';
    if (!isActivated && ocrUses >= 7) {
      setIsPremiumModalOpen(true);
      showToast('لقد استنفدت المحاولات المجانية الـ 7 لميزة القارئ الذكي (OCR). الرجاء الترقية لتفعيل الميزة غير المحدودة! 🌟', 'warning');
      return;
    }
    setIsOcrMenuOpen(true);
  };

  const handleSelectSource = (type: 'camera' | 'gallery') => {
    setIsOcrMenuOpen(false);

    // Re-verify limit
    const isActivated = localStorage.getItem('abuosid_app_activated') === 'true';
    if (!isActivated && ocrUses >= 7) {
      setIsPremiumModalOpen(true);
      showToast('لقد استنفدت المحاولات المجانية الـ 7 لميزة القارئ الذكي (OCR). الرجاء الترقية لتفعيل الميزة غير المحدودة! 🌟', 'warning');
      return;
    }

    if (type === 'camera') {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleImageOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isActivated = localStorage.getItem('abuosid_app_activated') === 'true';
    if (!isActivated) {
      if (ocrUses >= 7) {
        setIsPremiumModalOpen(true);
        showToast('لقد استنفدت المحاولات المجانية الـ 7 لميزة القارئ الذكي (OCR).', 'warning');
        e.target.value = '';
        return;
      }
      // Increment and save
      const newCount = ocrUses + 1;
      setOcrUses(newCount);
      localStorage.setItem('abuosid_ocr_free_uses_count', String(newCount));
      showToast(`استخدام مجاني: تم استهلاك محاولة (${newCount}/7) متبقي لديك ${7 - newCount} محاولات 🎁`, 'info');
    }

    setIsOcrLoading(true);
    showToast('جاري معالجة الصورة وقراءة النص بالذكاء الاصطناعي... ⏳', 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const response = await fetch(getApiUrl('/api/gemini/ocr'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64String,
              mimeType: file.type
            }),
          });

          const data = await response.json();
          if (response.ok && data.success) {
            const extractedText = data.text;
            if (extractedText && extractedText.trim()) {
              setContent((prev) => prev ? `${prev}\n\n${extractedText}` : extractedText);
              showToast('تم استخراج النص وتفريغه تلقائياً بنجاح! ✨📖', 'success');
            } else {
              showToast('لم نتمكن من العثور على نص واضح في الصورة. يرجى التأكد من جودة الصورة والمحاولة مجدداً.', 'warning');
            }
          } else {
            showToast(data.message || 'فشل استخراج النص من الصورة.', 'warning');
          }
        } catch (error) {
          console.error('[القارئ الذكي] خطأ أثناء الاتصال بالخادم:', error);
          showToast('حدث خطأ أثناء الاتصال بالخادم لمسح الصورة.', 'warning');
        } finally {
          setIsOcrLoading(false);
          e.target.value = '';
        }
      };
      reader.onerror = () => {
        showToast('فشل قراءة ملف الصورة محلياً.', 'warning');
        setIsOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[القارئ الذكي] خطأ غير متوقع:', err);
      showToast('حدث خطأ غير متوقع أثناء تحميل الصورة.', 'warning');
      setIsOcrLoading(false);
    }
  };

  // Initialize form with values (useful if editing)
  useEffect(() => {
    if (initialBenefit) {
      setTitle(initialBenefit.title);
      setContent(initialBenefit.content);
      setSource(initialBenefit.source);
      setCategory(initialBenefit.category as CategoryType);
      setDate(initialBenefit.date);
    } else {
      // Default to today's date
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(formattedDate);
    }
  }, [initialBenefit]);

  // Set up Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'ar-SA'; // Set Arabic language recognition
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setRecognition(rec);
    }
  }, []);

  const startVoiceInput = (target: 'title' | 'content') => {
    if (!recognition) {
      showToast('الإدخال الصوتي غير مدعوم في هذا المتصفح. يرجى استخدام متصفح Chrome أو Safari.', 'warning');
      return;
    }

    // Stop current listening if active
    if (isListeningTitle || isListeningContent) {
      recognition.stop();
      setIsListeningTitle(false);
      setIsListeningContent(false);
      return;
    }

    if (target === 'title') {
      setIsListeningTitle(true);
    } else {
      setIsListeningContent(true);
    }

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      if (target === 'title') {
        setTitle((prev) => (prev ? `${prev} ${speechToText}` : speechToText));
        showToast('تم إدخال العنوان صوتياً!', 'success');
      } else {
        setContent((prev) => (prev ? `${prev} ${speechToText}` : speechToText));
        showToast('تم إدخال النص صوتياً!', 'success');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      showToast(`خطأ في التعرف على الصوت: ${event.error}`, 'warning');
      setIsListeningTitle(false);
      setIsListeningContent(false);
    };

    recognition.onend = () => {
      setIsListeningTitle(false);
      setIsListeningContent(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('يرجى كتابة عنوان الفائدة أولاً!', 'warning');
      return;
    }
    if (!content.trim()) {
      showToast('يرجى كتابة نص الفائدة قبل الحفظ!', 'warning');
      return;
    }

    // Save the benefit
    onSave({
      title: title.trim(),
      content: content.trim(),
      source: source.trim(),
      category,
      date: date || new Date().toISOString().split('T')[0],
    });

    // Reset if "Save and Continue" is active, otherwise rely on parent redirection
    if (saveAndContinue && !initialBenefit) {
      setTitle('');
      setContent('');
      setSource('');
      // Keep category and date for fast repetitive entry
      showToast('تم حفظ الفائدة! تم تفريغ الحقول لتدوين الفائدة التالية مباشرة.', 'success');
    } else {
      showToast(initialBenefit ? 'تم تعديل الفائدة بنجاح!' : 'تم حفظ الفائدة بنجاح!', 'success');
      if (onCancel) onCancel();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-cream/60 p-6 custom-shadow-gold">
      <div className="flex items-center justify-between border-b border-brand-cream/40 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald-dark flex items-center justify-center">
            <Layers className="w-5 h-5 text-brand-gold-light" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-emerald-dark font-sans">
              {initialBenefit ? 'تعديل الفائدة العلمية' : 'تدوين فائدة علمية جديدة'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              دون فوائدك، فرائدك، وقيد معلوماتك من بطون المجلدات والكتب
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-semibold px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-all"
          >
            إلغاء التعديل
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 font-sans text-right">
        {/* Title Field with Voice Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-zinc-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              عنوان الفائدة العلمية *
            </span>
            <span className="text-xs text-zinc-400 font-normal">اختصر مضمون الفائدة في سطر</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أهمية تقييد العلم بالكتابة عند السلف"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={() => startVoiceInput('title')}
              className={`absolute left-3 p-2 rounded-lg transition-all flex items-center justify-center ${
                isListeningTitle
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
              }`}
              title="إدخال بالعنوان صوتياً"
            >
              {isListeningTitle ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Field with Voice Input & Smart OCR Camera */}
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              نص الفائدة العلمية بالتفصيل *
            </label>
            
            {/* Elegant Single OCR Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenOcrMenu}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-emerald-dark to-brand-emerald text-white hover:opacity-90 text-[11px] font-bold rounded-xl transition-all shadow-md cursor-pointer select-none ${isOcrLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isOcrLoading}
              >
                {isOcrLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-brand-gold-light" />
                )}
                <span>استيراد بالذكاء الاصطناعي (OCR) 📸</span>
              </button>
              
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageOcr}
                className="hidden"
                disabled={isOcrLoading}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageOcr}
                className="hidden"
                disabled={isOcrLoading}
              />
            </div>
          </div>
          
          {isOcrLoading && (
            <div className="p-3 bg-brand-gold/5 border border-brand-gold/15 rounded-xl flex items-center justify-center gap-2 text-[11px] text-brand-emerald-dark font-bold animate-pulse">
              <Loader2 className="w-4.5 h-4.5 text-brand-gold animate-spin" />
              <span>جاري استخراج وقراءة النص بالذكاء الاصطناعي (Gemini OCR)... الرجاء الانتظار قليلاً 🔮</span>
            </div>
          )}

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="قيد الفائدة العلمية هنا بسرد كثيف وغني..."
              rows={6}
              className="w-full pr-4 pl-12 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-serif text-base text-zinc-800 bg-zinc-50/50 leading-relaxed"
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={() => startVoiceInput('content')}
              className={`absolute left-3 bottom-3 p-2 rounded-lg transition-all flex items-center justify-center ${
                isListeningContent
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
              }`}
              title="إدخال بالنص صوتياً"
            >
              {isListeningContent ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dual Grid Fields: Category & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Select */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-gold" />
              تصنيف/فئة الفائدة
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-700 bg-zinc-50/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Source Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-gold" />
              المصدر (الكتاب والمؤلف)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="مثال: الفتاوى الكبرى لابن تيمية - ج٣ ص١٥"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
            />
          </div>
        </div>

        {/* Date Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-gold" />
              تاريخ تدوين الفائدة
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-700 bg-zinc-50/50"
            />
          </div>

          {/* "Save and Continue" Toggle Switch - ONLY show on adding benefits, not editing */}
          {!initialBenefit && (
            <div className="flex items-center justify-between p-3.5 bg-brand-cream/20 rounded-xl border border-brand-cream/40 self-end">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-brand-emerald-dark block">ميزة: حفظ مع الاستمرار</span>
                <span className="text-[10px] text-zinc-500 block">
                  يبقي الحقول فارغة بعد الحفظ لتدوين الفائدة التالية دون الخروج
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAndContinue}
                  onChange={(e) => setSaveAndContinue(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-emerald"></div>
              </label>
            </div>
          )}
        </div>

        {/* Save Actions Button */}
        <div className="pt-4 flex justify-end gap-3 border-t border-brand-cream/30 mt-6">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-emerald hover:bg-brand-emerald-light text-white font-bold font-sans transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Save className="w-5 h-5 text-brand-gold-light" />
            <span>{initialBenefit ? 'حفظ التعديلات العلمية' : 'حفظ وقيد الفائدة'}</span>
          </button>
        </div>
      </form>

      {/* OCR Source Selector Popup Modal */}
      <AnimatePresence>
        {isOcrMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden text-right font-sans border border-brand-cream shadow-2xl relative p-6 space-y-4"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="mx-auto w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-brand-emerald" />
                </div>
                <h4 className="text-base font-black text-zinc-800">استخراج النص بالذكاء الاصطناعي 🔮</h4>
                <p className="text-xs text-zinc-500 font-medium">اختر طريقة تزويدنا بصورة الفائدة العلمية لقراءتها</p>
                
                {/* Free uses status or Unlimited if premium */}
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold bg-brand-gold/10 text-brand-gold-dark">
                  {localStorage.getItem('abuosid_app_activated') === 'true' ? (
                    '🌟 النسخة المدفوعة نشطة: استخدام غير محدود'
                  ) : (
                    `🎁 متبقي لديك ${Math.max(0, 7 - ocrUses)} من 7 محاولات مجانية`
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectSource('camera')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-brand-cream hover:border-brand-emerald hover:bg-brand-cream/10 transition-all group"
                >
                  <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-zinc-700">التقاط بالكاميرا 📷</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSource('gallery')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-brand-cream hover:border-brand-emerald hover:bg-brand-cream/10 transition-all group"
                >
                  <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl group-hover:scale-110 transition-transform">
                    <Image className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-zinc-700">الاستوديو / الصور 🖼️</span>
                </button>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setIsOcrMenuOpen(false)}
                className="w-full py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"
              >
                إلغاء وتراجع ❌
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal */}
      <PremiumPromoModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        showToast={showToast}
      />
    </div>
  );
};
