import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Mic, MicOff, BookOpen, Tag, Calendar, Sparkles, Layers, Camera, Loader2, Image, Check, X } from 'lucide-react';
import { Benefit, CATEGORIES } from '../types';
import { PremiumPromoModal } from './PremiumPromoModal';
import { getApiUrl } from '../utils/api';

const compressImage = (
  file: File, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.80, 
  maxSizeBytes = 1000000 // 1MB limit
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Apply max dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const runCompression = (currentWidth: number, currentHeight: number, currentQuality: number, attempt = 1): string => {
          const canvas = document.createElement('canvas');
          canvas.width = currentWidth;
          canvas.height = currentHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('[القارئ الذكي] فشل إنشاء سياق 2D للوحة الرسم (Canvas)، سيتم استخدام الصورة الأصلية.');
            return event.target?.result as string;
          }

          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

          // Compress to JPEG for maximum compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          
          // Estimate size in bytes from Base64 string length
          const estimatedSize = Math.round((compressedDataUrl.length * 3) / 4);
          
          if (estimatedSize > maxSizeBytes && attempt < 4) {
            console.log(`[القارئ الذكي] المحاولة ${attempt}: الحجم ${Math.round(estimatedSize / 1024)} KB يتجاوز الحد المسموح (1MB). جاري تقليل الأبعاد والجودة...`);
            return runCompression(
              Math.round(currentWidth * 0.75),
              Math.round(currentHeight * 0.75),
              Math.max(0.4, currentQuality - 0.15),
              attempt + 1
            );
          }
          
          return compressedDataUrl;
        };

        try {
          const finalDataUrl = runCompression(width, height, quality);
          resolve(finalDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = (err) => {
        console.error('[القارئ الذكي] فشل تحميل الصورة للضغط:', err);
        reject(err);
      };
    };
    reader.onerror = (err) => {
      console.error('[القارئ الذكي] فشل قراءة الملف للضغط:', err);
      reject(err);
    };
  });
};

interface BenefitFormProps {
  onSave: (benefit: Omit<Benefit, 'id' | 'views' | 'isFavorite' | 'createdAt'>) => void;
  initialBenefit?: Benefit | null;
  prefilledData?: Omit<Benefit, 'id' | 'views' | 'isFavorite' | 'createdAt'> | null;
  onCancel?: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  categoriesList?: string[];
  onAddCustomCategory?: (name: string) => boolean;
}

export const BenefitForm: React.FC<BenefitFormProps> = ({
  onSave,
  initialBenefit,
  prefilledData,
  onCancel,
  showToast,
  categoriesList = [...CATEGORIES],
  onAddCustomCategory,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<string>('العقيدة');
  const [date, setDate] = useState('');
  const [saveAndContinue, setSaveAndContinue] = useState(false);

  // Auto-resizing textarea ref
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height dynamically as content grows (capped between 180px and 280px with scrollbar)
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = '180px';
      const scrollH = contentRef.current.scrollHeight;
      contentRef.current.style.height = `${Math.min(280, Math.max(180, scrollH))}px`;
    }
  }, [content]);

  // Saved sources history and autocomplete
  const [savedSources, setSavedSources] = useState<string[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const sourceContainerRef = useRef<HTMLDivElement>(null);

  const getSavedSources = (): string[] => {
    const set = new Set<string>();
    try {
      const customSourcesStr = localStorage.getItem('abuosid_saved_sources');
      if (customSourcesStr) {
        const parsed = JSON.parse(customSourcesStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (typeof s === 'string' && s.trim()) set.add(s.trim());
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const savedBenefitsStr = localStorage.getItem('abuosid_benefits');
      if (savedBenefitsStr) {
        const parsed = JSON.parse(savedBenefitsStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((b: any) => {
            if (b && typeof b.source === 'string' && b.source.trim()) {
              set.add(b.source.trim());
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    return Array.from(set);
  };

  useEffect(() => {
    setSavedSources(getSavedSources());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceContainerRef.current && !sourceContainerRef.current.contains(event.target as Node)) {
        setShowSourceSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteSavedSource = (e: React.MouseEvent, srcToDelete: string) => {
    e.stopPropagation();
    const updated = savedSources.filter((s) => s !== srcToDelete);
    setSavedSources(updated);
    try {
      localStorage.setItem('abuosid_saved_sources', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSources = savedSources.filter(
    (s) => !source.trim() || s.toLowerCase().includes(source.trim().toLowerCase())
  );

  // Free tier constants & activation checks
  const MAX_FREE_CHAR_LIMIT = 12000; // 12,000 characters limit for free version
  const isAppActivated = typeof window !== 'undefined' && localStorage.getItem('abuosid_app_activated') === 'true';
  const [upgradeNoticeMessage, setUpgradeNoticeMessage] = useState<string | null>(null);

  // Custom Category creation inline states
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleToggleAddCategoryInput = () => {
    if (!isAppActivated) {
      const msg = 'تنويه: إضافة أقسام جديدة ميزة خاصة بالنسخة المدفوعة. يرجى الترقية لفتح إمكانية إنشاء وتخصيص الأقسام بلا حدود.';
      showToast(msg, 'warning');
      setUpgradeNoticeMessage(msg);
      return;
    }
    setShowAddCategoryInput(!showAddCategoryInput);
  };

  const handleCreateCategory = () => {
    if (!isAppActivated) {
      const msg = 'تنويه: إضافة أقسام جديدة ميزة خاصة بالنسخة المدفوعة. يرجى الترقية لفتح إمكانية إنشاء وتخصيص الأقسام بلا حدود.';
      showToast(msg, 'warning');
      setUpgradeNoticeMessage(msg);
      return;
    }
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      showToast('يرجى إدخال اسم فئة/قسم صالح!', 'warning');
      return;
    }
    if (onAddCustomCategory) {
      const success = onAddCustomCategory(cleanName);
      if (success) {
        setCategory(cleanName);
        setNewCategoryName('');
        setShowAddCategoryInput(false);
      }
    }
  };

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

    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح فقط (PNG, JPEG, WEBP, ...). 📸', 'warning');
      e.target.value = '';
      return;
    }

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
    showToast('جاري ضغط ومعالجة الصورة لتقليل الحجم وتسريع الرفع... ⚡', 'info');

    const originalSizeKB = Math.round(file.size / 1024);
    console.log(`[القارئ الذكي] حجم الصورة الأصلي: ${originalSizeKB} KB`);

    try {
      const base64String = await compressImage(file);
      const compressedSizeKB = Math.round((base64String.length * 3) / 4 / 1024);
      console.log(`[القارئ الذكي] حجم الصورة بعد الضغط: ${compressedSizeKB} KB (نسبة التقليص: ${originalSizeKB > 0 ? Math.round((1 - compressedSizeKB / originalSizeKB) * 100) : 0}%)`);

      showToast('جاري إرسال الصورة وقراءتها بالذكاء الاصطناعي (Gemini OCR)... ⏳', 'info');

      try {
        const response = await fetch(getApiUrl('/api/analyze-image'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64String,
            mimeType: 'image/jpeg'
          }),
        });

        const contentType = response.headers.get('content-type');
        let data: any;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const rawText = await response.text();
          throw new Error(`استجابة غير صالحة من الخادم (ليست JSON): ${rawText.slice(0, 200)}...`);
        }

        if (response.ok && data.success) {
          const extractedText = data.text;
          if (extractedText && extractedText.trim()) {
            setContent((prev) => prev ? `${prev}\n\n${extractedText}` : extractedText);
            showToast('تم استخراج النص وتفريغه تلقائياً بنجاح! ✨📖', 'success');
          } else {
            showToast('لم نتمكن من العثور على نص واضح في الصورة. يرجى التأكد من جودة الصورة والمحاولة مجدداً.', 'warning');
          }
        } else {
          console.error('[القارئ الذكي] فشل استخراج النص من السيرفر. كود الاستجابة:', response.status, 'البيانات:', data);
          showToast(data.message || 'فشل استخراج النص من الصورة.', 'warning');
        }
      } catch (error: any) {
        console.error('[القارئ الذكي] خطأ شبكة أو اتصال أثناء الإرسال لخادم الـ OCR:', error);
        showToast(`حدث خطأ أثناء الاتصال بالخادم: ${error.message || 'خطأ في الشبكة'}`, 'warning');
      } finally {
        setIsOcrLoading(false);
        e.target.value = '';
      }
    } catch (err) {
      console.error('[القارئ الذكي] فشل ضغط الصورة محلياً أو خطأ غير متوقع:', err);
      showToast('حدث خطأ غير متوقع أثناء معالجة وضغط الصورة.', 'warning');
      setIsOcrLoading(false);
      e.target.value = '';
    }
  };

  // Initialize form with values (useful if editing)
  useEffect(() => {
    if (initialBenefit) {
      setTitle(initialBenefit.title);
      setContent(initialBenefit.content);
      setSource(initialBenefit.source);
      setCategory(initialBenefit.category as string);
      setDate(initialBenefit.date);
    } else if (prefilledData) {
      setTitle(prefilledData.title);
      setContent(prefilledData.content);
      setSource(prefilledData.source);
      setCategory(prefilledData.category as string);
      setDate(prefilledData.date);
    } else {
      // Default to today's date
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(formattedDate);
    }
  }, [initialBenefit, prefilledData]);

  // Set up Speech Recognition with Continuous Recording
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
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

    // Check Free Tier character limit (12,000 characters)
    if (!isAppActivated && content.trim().length > MAX_FREE_CHAR_LIMIT) {
      const msg = 'تنويه: لقد تجاوزت الحد المسموح به في النسخة المجانية (12,000 حرف). للحصول على سعة لا محدودة لنصوص الفوائد، يرجى الترقية للنسخة المدفوعة.';
      showToast(msg, 'warning');
      setUpgradeNoticeMessage(msg);
      return;
    }

    // Save source to history for future autocomplete suggestions
    if (source.trim()) {
      const trimmedSource = source.trim();
      try {
        const existing = getSavedSources();
        if (!existing.includes(trimmedSource)) {
          const updated = [trimmedSource, ...existing].slice(0, 50);
          localStorage.setItem('abuosid_saved_sources', JSON.stringify(updated));
          setSavedSources(updated);
        }
      } catch (err) {
        console.error(err);
      }
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
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              نص الفائدة العلمية بالتفصيل *
            </label>
            
            <div className="flex items-center gap-2">
              {/* Elegant Single OCR Button */}
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

          {/* Main Dynamic Textarea with Fixed Max Height & Internal Vertical Scrollbar */}
          <div className="relative group">
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب الفائدة العلمية بالتفصيل هنا..."
              style={{ minHeight: '180px', maxHeight: '280px' }}
              className="w-full pr-4 pl-12 pt-3 pb-10 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-serif text-base text-zinc-800 bg-zinc-50/50 leading-relaxed resize-y overflow-y-auto"
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={() => startVoiceInput('content')}
              className={`absolute left-3 bottom-10 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                isListeningContent
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
              }`}
              title="إدخال بالنص صوتياً (تسجيل مستمر)"
            >
              {isListeningContent ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Character counter & Free Tier Limit Status */}
            <div className="flex items-center justify-between text-xs pt-1.5 px-1 font-sans">
              <span className={`text-[11px] ${!isAppActivated && content.length > MAX_FREE_CHAR_LIMIT ? 'text-red-600 font-bold' : 'text-zinc-500 font-medium'}`}>
                عدد الحروف: <span className="font-bold">{content.length.toLocaleString()}</span> {!isAppActivated ? `/ 12,000 حرف (حد النسخة المجانية)` : `حرف (النسخة المدفوعة: سعة لا محدودة ✨)`}
              </span>
              {!isAppActivated && content.length > MAX_FREE_CHAR_LIMIT && (
                <button
                  type="button"
                  onClick={() => setUpgradeNoticeMessage('تنويه: لقد تجاوزت الحد المسموح به في النسخة المجانية (12,000 حرف). للحصول على سعة لا محدودة لنصوص الفوائد، يرجى الترقية للنسخة المدفوعة.')}
                  className="text-[11px] text-brand-emerald font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>تجاوزت الحد! ترقية الحساب</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dual Grid Fields: Category & Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-brand-gold" />
                تصنيف/فئة الفائدة
              </label>
              {onAddCustomCategory && (
                <button
                  type="button"
                  onClick={handleToggleAddCategoryInput}
                  className="text-xs font-bold text-brand-emerald hover:text-brand-emerald-dark hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showAddCategoryInput ? '✕ إلغاء' : '+ إضافة قسم جديد'}
                </button>
              )}
            </div>

            {showAddCategoryInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اكتب اسم القسم الجديد... (مثال: الفرائض)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-250 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-4 py-2.5 bg-brand-emerald hover:bg-brand-emerald-light text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  إضافة
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-700 bg-zinc-50/50"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Source Input with Autocomplete & History Suggestions */}
          <div className="space-y-1.5 relative" ref={sourceContainerRef}>
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-gold" />
              المصدر (الكتاب والمؤلف)
            </label>

            <div className="relative">
              <input
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setShowSourceSuggestions(true);
                }}
                onFocus={() => setShowSourceSuggestions(true)}
                placeholder="مثال: الفتاوى الكبرى لابن تيمية - ج٣ ص١٥"
                list="saved-sources-datalist"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
              />

              {/* Native Datalist for automatic browser suggestions */}
              <datalist id="saved-sources-datalist">
                {savedSources.map((s, idx) => (
                  <option key={idx} value={s} />
                ))}
              </datalist>

              {/* Custom Dropdown Menu for Arabic Autocomplete Selection */}
              <AnimatePresence>
                {showSourceSuggestions && filteredSources.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-30 top-full right-0 left-0 mt-1 bg-white border border-brand-cream rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-100"
                  >
                    <div className="px-3 py-1.5 bg-brand-cream/20 text-[11px] font-bold text-brand-emerald-dark flex justify-between items-center">
                      <span>المصادر المحفوظة سابقاً (انقر للاختيار التلقائي):</span>
                      <button
                        type="button"
                        onClick={() => setShowSourceSuggestions(false)}
                        className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {filteredSources.map((srcItem, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSource(srcItem);
                          setShowSourceSuggestions(false);
                        }}
                        className="px-3.5 py-2.5 text-xs text-zinc-800 hover:bg-brand-cream/30 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <span className="font-serif font-medium truncate flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{srcItem}</span>
                        </span>
                        <button
                          type="button"
                          title="حذف من السجل"
                          onClick={(e) => handleDeleteSavedSource(e, srcItem)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 p-1 rounded transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
        isOpen={isPremiumModalOpen || !!upgradeNoticeMessage}
        onClose={() => {
          setIsPremiumModalOpen(false);
          setUpgradeNoticeMessage(null);
        }}
        showToast={showToast}
        noticeMessage={upgradeNoticeMessage || undefined}
      />
    </div>
  );
};
