import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, HelpCircle, FolderSync, PlusCircle, Search, Heart, SlidersHorizontal, Grid, Star, Sparkles, Layers, Eye, ArrowUp, X, Printer, Download, Smartphone, Folder, FolderPlus, Trash2, FolderMinus } from 'lucide-react';

// Import Types
import { Benefit, ScientificQuery, AppSettings, CATEGORIES, CategoryType } from './types';

// Import Components
import { Header } from './components/Header';
import { BenefitForm } from './components/BenefitForm';
import { BenefitCard } from './components/BenefitCard';
import { QueryManager } from './components/QueryManager';
import { SettingsPanel } from './components/SettingsPanel';
import { NotificationToast, AndroidSystemNotification } from './components/NotificationCenter';
import { uploadToGoogleDrive } from './utils/googleDrive';
import { saveBackupToFirebase } from './lib/firebase';
import { ShareCardModal } from './components/ShareCardModal';
import { PremiumPromoModal } from './components/PremiumPromoModal';
import { WelcomeModal } from './components/WelcomeModal';
import { getApiUrl } from './utils/api';
import { getArabicSearchRegex, formatToHijriAndGregorian } from './utils';

// Initial Starter Data for visual polish and immediate functionality on load
const STARTER_BENEFITS: Benefit[] = [
  {
    id: 'starter-1',
    title: 'العلم صيد والكتابة قيده',
    content: 'العلم صيد والكتابة قيده، قيد صيودك بالحبال الواثقة.\nفمن الحماقة أن تصيد غزالة، وتتركها بين الخلائق طالقة.\n\nمن أعظم نعم الله على طالب العلم توفيقه لتقييد شتات الأفكار والفوائد عند مرورها بذهنه أو وقوفه عليها في بطون المجلدات، فإن الفائدة إذا تُرِكت فرت، وإذا قُيِّدَتْ قَرَّتْ.',
    date: '2026-06-25',
    source: 'ديوان الإمام الشافعي رحمه الله',
    category: 'الزهد والرقائق',
    views: 34,
    isFavorite: true,
    createdAt: Date.now() - 500000000,
  },
  {
    id: 'starter-2',
    title: 'تحقيق معنى الصبر والرضا والتسليم',
    content: 'قال ابن القيم رحمه الله في كتابه الفوائد:\n"للعبد بين يدي الله موقوفان: موقف بين يديه في الصلاة، وموقف بين يديه يوم لقائه؛ فمن قام بحق الموقف الأول هان عليه الموقف الآخر، ومن استهان بهذا الموقف ولم يوفه حقه شدد عليه ذلك الموقف."\n\nوهذا تحقيق جليل يبين الترابط العظيم بين جودة العبادة في الدنيا ويسر الحساب في الآخرة.',
    date: '2026-06-26',
    source: 'الفوائد لابن القيم - ص٤٥',
    category: 'العقيدة',
    views: 21,
    isFavorite: false,
    createdAt: Date.now() - 400000000,
  },
  {
    id: 'starter-3',
    title: 'فائدة نفيسة في أصول التفسير وقواعده',
    content: 'قال شيخ الإسلام ابن تيمية رحمه الله:\n"اختلاف السلف في التفسير هو اختلاف تنوع لا اختلاف تضاد، وهو على صنفين:\nأحدهما: أن يعبر كل منهم عن المراد بعبارة غير عبارة صاحبه تدل على معنى في المسمى غير المعنى الآخر مع اتحاد المسمى.\nوالثاني: أن يذكر كل منهم من الاسم العام بعض أنواعه على سبيل التمثيل."\n\nفهم هذه القاعدة يعصم طالب العلم من الوقوع في اللبس والنزاع اللفظي عند مراجعة أقوال المفسرين الأوائل.',
    date: '2026-06-27',
    source: 'مقدمة في أصول التفسير - ص١٢',
    category: 'أصول الفقه',
    views: 18,
    isFavorite: true,
    createdAt: Date.now() - 300000000,
  },
  {
    id: 'starter-4',
    title: 'فائدة لغوية في الفرق بين النعت والصفة',
    content: 'ذهب كثير من النحاة إلى أن النعت والصفة مترادفان، ولكن حقق بعض أئمة اللغة أن بينهما فرقاً لطيفاً:\n- النعت: لا يكون إلا بالصفات المشتقة الجارية مجرى الفعل (كضارب وحسن).\n- الصفة: أعم، فهي تطلق على المشتق والجامد (كقولك: مررت برجل أسد، أو مررت بجدار من طين).\n\nفاستعمل النعت للتحلية المدحية أو الذمية، بينما الصفة لبيان حقيقة الذات الثابتة.',
    date: '2026-06-28',
    source: 'شرح ابن عقيل على الألفية',
    category: 'النحو والصرف',
    views: 29,
    isFavorite: false,
    createdAt: Date.now() - 200000000,
  }
];

const STARTER_QUERIES: ScientificQuery[] = [
  {
    id: 'query-1',
    title: 'استشكال في الجمع بين أحاديث النهي والأمر بكتابة الحديث',
    content: 'أستشكل الجمع بين حديث أبي سعيد الخدري في صحيح مسلم: "لا تكتبوا عني، ومن كتب عني غير القرآن فليمحه"، وبين الأحاديث المرخصة في الكتابة كحديث: "اكتبوا لأبي شاه"، وحديث عبد الله بن عمرو بن العاص في تقييد السنن.\n\nما هو وجه الجمع المحرر عند أئمة الجرح والتعديل؟',
    date: '2026-06-27',
    source: 'سنن أبي داود ومقدمة صحيح مسلم',
    isResolved: true,
    resolution: 'الجمع الصحيح المعتمد عند جماهير العلماء هو:\n١. أن النهي كان في أول الأمر مخافة اختلاط الحديث بالقرآن الكريم، فلما أُمِن ذلك رخص فيه.\n٢. أو أن النهي خاص بمن وثق بحفظه وخيف اتكاله على الكتابة، والترخيص لمن خشي النسيان.\n٣. أو أن النهي عن كتابة الحديث مع القرآن في صحيفة واحدة لئلا يلتبس على القارئ، والترخيص في إفراد السنن بالكتابة.',
    createdAt: Date.now() - 100000000,
  },
  {
    id: 'query-2',
    title: 'استشكال حول زيادة الثقة في علم الحديث والرجال',
    content: 'متى تقبل زيادة الثقة تفصيلاً؟ يظهر تعارض بين صنيع المتقدمين كالبخاري ومسلم والترمذي الذين يرجحون بالقرائن والإعلال، وبين المتأخرين الذين يقررون قاعدة "زيادة الثقة مقبولة مطلقاً".\n\nأحتاج لجمع الفروق التطبيقية ومقارنتها.',
    date: '2026-06-29',
    source: 'تدريب الراوي ومقدمة ابن الصلاح',
    isResolved: false,
    createdAt: Date.now() - 50000000,
  }
];

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'queries' | 'settings' | 'print'>('home');

  // Back to top button visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleFloatingSearchClick = () => {
    const performScrollAndFocus = () => {
      if (searchInputRef.current) {
        // Find the element position relative to the viewport
        const rect = searchInputRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // Scroll exactly to the element position with a 16px offset from the very top of the viewport
        const targetY = scrollTop + rect.top - 16;
        
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });

        // Focus and place cursor at the end
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            const val = searchInputRef.current.value;
            searchInputRef.current.value = '';
            searchInputRef.current.value = val;
          }
        }, 300);
      }
    };

    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(performScrollAndFocus, 300);
    } else {
      performScrollAndFocus();
    }
  };

  // Premium and Card Share Modal States
  const [showPremiumPromo, setShowPremiumPromo] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem('abuosid_welcome_dismissed_v3') || 
        document.cookie.split('; ').find(row => row.startsWith('abuosid_welcome_dismissed_v3='))?.split('=')[1];
      return dismissed !== 'true';
    } catch (e) {
      return true;
    }
  });

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      if (isStandalone) return false;
      return localStorage.getItem('abuosid_install_banner_dismissed_v1') !== 'true';
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      const dismissed = localStorage.getItem('abuosid_install_banner_dismissed_v1') === 'true';
      if (!isStandalone && !dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Save to localStorage that the user has chosen to install (or dismissed the banner)
    try {
      localStorage.setItem('abuosid_install_banner_dismissed_v1', 'true');
    } catch (e) {}
    setShowInstallBanner(false);

    // Show user a message that the APK download has started
    showToast('جاري توجيهك لتحميل ملف تطبيق الأندرويد (APK) من Google Drive... 📱✨', 'success');
    
    // Open Google Drive direct download URL in a new window/tab to trigger download
    window.open('https://drive.google.com/uc?export=download&id=1443vaP5QTT8rt5PSVviq0U1-lEhG6yB9', '_blank');

    // After starting the download, if native browser PWA prompt is supported, offer it too!
    if (deferredPrompt) {
      setTimeout(async () => {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to PWA install prompt: ${outcome}`);
        } catch (err) {
          console.error('Error in PWA install:', err);
        }
        setDeferredPrompt(null);
      }, 2500);
    }
  };

  const [sharingBenefit, setSharingBenefit] = useState<Benefit | null>(null);
  const [expandedBenefitId, setExpandedBenefitId] = useState<string | null>(null);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem('abuosid_control_panel_visible') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Core records state with localStorage loading
  const [benefits, setBenefits] = useState<Benefit[]>(() => {
    const saved = localStorage.getItem('abuosid_benefits');
    return saved ? JSON.parse(saved) : STARTER_BENEFITS;
  });

  const [queries, setQueries] = useState<ScientificQuery[]>(() => {
    const saved = localStorage.getItem('abuosid_queries');
    return saved ? JSON.parse(saved) : STARTER_QUERIES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('abuosid_settings');
    const defaultSettings: AppSettings = {
      notificationInterval: '24h',
      theme: 'scholarly',
      programmerName: 'طالب العلم',
      programmerEmail: 'abuosid773@gmail.com',
      autoBackupInterval: 'off',
      lastBackupTimestamp: 0
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Helper to check if premium is active
  const isAppActivated = () => {
    try {
      const activated = localStorage.getItem('abuosid_app_activated') === 'true';
      if (activated) {
        const key = localStorage.getItem('abuosid_activation_key') || '';
        if (!key.trim()) {
          localStorage.setItem('abuosid_activation_key', 'ABU-OSID-VIP-7777');
        }
      }
      return activated;
    } catch (e) {
      return false;
    }
  };

  // Save backup helper
  const triggerAutoBackup = (triggerType: 'on_change' | 'daily' | 'on_exit' | 'manual') => {
    try {
      // Automatic backup (local or cloud) is restricted to premium (activated) users
      if (triggerType !== 'manual' && !isAppActivated()) {
        return;
      }

      const backupData = JSON.stringify({
        benefits,
        queries,
        programmerName: settings.programmerName
      });
      const now = Date.now();

      // Load current history
      const existingHistoryStr = localStorage.getItem('abuosid_backups_history');
      let history: any[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];

      // Check if there is already a daily backup for today to avoid duplicates
      if (triggerType === 'daily') {
        const lastDaily = history.find(h => h.trigger === 'daily');
        if (lastDaily && (now - lastDaily.timestamp < 20 * 60 * 60 * 1000)) {
          // Skip if created less than 20 hours ago
          return;
        }
      }

      const newBackup = {
        id: `backup-${now}`,
        timestamp: now,
        trigger: triggerType,
        benefitsCount: benefits.length,
        queriesCount: queries.length,
        data: backupData
      };

      // Add to head
      history = [newBackup, ...history];

      // Limit to 10 backups to conserve space
      if (history.length > 10) {
        history = history.slice(0, 10);
      }

      localStorage.setItem('abuosid_backups_history', JSON.stringify(history));

      // 1. Download file to device for 'daily', 'on_exit', or 'manual' triggers if backupType is local
      if (settings.backupType === 'local') {
        if (triggerType !== 'on_change') {
          try {
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(backupData);
            const exportFileDefaultName = `جامع_الفوائد_احتياطي_${triggerType}_${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            console.log('[جامع الفوائد] تم تحميل نسخة احتياطية محلية تلقائية إلى مجلد التنزيلات بالجهاز.');
            showToast(`تم حفظ وتحميل ملف النسخة الاحتياطية تلقائياً على جهازك بنجاح! 📱📁`, 'success');
          } catch (err) {
            console.error('[جامع الفوائد] فشل تحميل ملف النسخة التلقائية بالجهاز:', err);
          }
        } else {
          // Quiet local update toast
          showToast('تم حفظ وتحديث النسخة الاحتياطية تلقائياً في سجل المتصفح الآمن 📱🔄', 'success');
        }
      }

      // 2. Save to Google Drive if backupType is set to cloud and google token is available
      if (settings.backupType === 'cloud') {
        const googleToken = localStorage.getItem('abuosid_google_access_token');
        if (googleToken) {
          uploadToGoogleDrive(googleToken, backupData, triggerType, benefits.length, queries.length)
            .then(() => {
              console.log('[جامع الفوائد] تم رفع النسخة الاحتياطية التلقائية إلى جوجل درايف بنجاح.');
              showToast(`تم رفع وتحديث النسخة الاحتياطية تلقائياً إلى حساب جوجل درايف بنجاح! ☁️✅`, 'success');
            })
            .catch(err => {
              console.error('[جامع الفوائد] فشل رفع النسخة التلقائية إلى جوجل درايف:', err);
              showToast('فشل المزامنة التلقائية مع جوجل درايف. تأكد من جودة الاتصال بالإنترنت.', 'warning');
            });
        }
      }

      // Update settings with last backup time
      setSettings(prev => ({
        ...prev,
        lastBackupTimestamp: now
      }));
    } catch (e) {
      console.error('[جامع الفوائد] فشل النسخ الاحتياطي التلقائي', e);
    }
  };

  // We compute a stable serialization that excludes volatile views/favorites state
  const structuralStateKey = React.useMemo(() => {
    const minBenefits = benefits.map(b => ({
      id: b.id,
      title: b.title,
      content: b.content,
      source: b.source,
      category: b.category,
      date: b.date,
    }));
    return JSON.stringify({ benefits: minBenefits, queries });
  }, [benefits, queries]);

  // Trigger 'on_change' backup
  useEffect(() => {
    if (benefits.length === 0 && queries.length === 0) return;
    if (!isAppActivated()) return;

    if (settings.autoBackupInterval === 'on_change') {
      const timer = setTimeout(() => {
        triggerAutoBackup('on_change');
      }, 5000); // 5 seconds debounce to avoid writing repeatedly during active typing/editing
      return () => clearTimeout(timer);
    }
  }, [structuralStateKey, settings.autoBackupInterval, settings.backupType]);

  // Trigger 'daily' backup check on startup
  useEffect(() => {
    if (!isAppActivated()) return;

    if (settings.autoBackupInterval === 'daily') {
      const lastBackup = settings.lastBackupTimestamp || 0;
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - lastBackup > oneDay) {
        triggerAutoBackup('daily');
      }
    }
  }, [settings.autoBackupInterval, settings.backupType]);

  // Trigger 'on_exit' backup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isAppActivated()) return;

      if (settings.autoBackupInterval === 'on_exit') {
        try {
          const backupData = JSON.stringify({
            benefits,
            queries,
            programmerName: settings.programmerName
          });
          const existingHistoryStr = localStorage.getItem('abuosid_backups_history');
          let history = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];

          const newBackup = {
            id: `backup-exit-${Date.now()}`,
            timestamp: Date.now(),
            trigger: 'on_exit',
            benefitsCount: benefits.length,
            queriesCount: queries.length,
            data: backupData
          };

          history = [newBackup, ...history].slice(0, 10);
          localStorage.setItem('abuosid_backups_history', JSON.stringify(history));

          // Directly write back last backup time in settings to localStorage synchronusly
          const currentSettings = localStorage.getItem('abuosid_settings');
          if (currentSettings) {
            const parsed = JSON.parse(currentSettings);
            parsed.lastBackupTimestamp = Date.now();
            localStorage.setItem('abuosid_settings', JSON.stringify(parsed));
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [benefits, queries, settings.autoBackupInterval, settings.backupType]);

  // UI state filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Dynamic custom categories state
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('abuosid_custom_categories_list_v1');
      return saved ? JSON.parse(saved) : [...CATEGORIES];
    } catch (e) {
      return [...CATEGORIES];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('abuosid_custom_categories_list_v1', JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  const [isAllCategoriesExpanded, setIsAllCategoriesExpanded] = useState(false);
  const [showCategoriesPopup, setShowCategoriesPopup] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCustomCategory = (name: string): boolean => {
    const cleanName = name.trim();
    if (!cleanName) {
      showToast('يرجى إدخال اسم قسم صالح!', 'warning');
      return false;
    }
    if (categories.some(cat => cat.toLowerCase() === cleanName.toLowerCase())) {
      showToast('هذا القسم موجود بالفعل!', 'warning');
      return false;
    }
    setCategories(prev => [...prev, cleanName]);
    showToast(`تمت إضافة القسم الجديد "${cleanName}" بنجاح! 🎉`, 'success');
    return true;
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleDeleteCustomCategory = (name: string) => {
    // Prevent deleting built-in categories
    if (CATEGORIES.includes(name as any)) {
      showToast('لا يمكن حذف الأقسام المدمجة الأساسية للتطبيق!', 'warning');
      return;
    }
    
    // Filter out from category list
    setCategories(prev => prev.filter(cat => cat !== name));

    // Move all benefits under this category to "علوم أخرى"
    const countToMove = benefits.filter(b => b.category === name).length;
    if (countToMove > 0) {
      setBenefits(prev => prev.map(b => b.category === name ? { ...b, category: 'علوم أخرى' } : b));
      showToast(`تم حذف القسم بنجاح، ونقل ${countToMove} من الفوائد إلى قسم "علوم أخرى" 📁✨`, 'success');
    } else {
      showToast(`تم حذف قسم "${name}" بنجاح! 🗑️`, 'success');
    }

    // Reset selected filter if it was the deleted one
    if (selectedCategory === name) {
      setSelectedCategory('الكل');
    }
    setCategoryToDelete(null);
  };

  // Active Toast & Notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [androidNotification, setAndroidNotification] = useState<Benefit | null>(null);

  // Active editing states
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [prefilledBenefit, setPrefilledBenefit] = useState<Omit<Benefit, 'id' | 'views' | 'isFavorite' | 'createdAt'> | null>(null);
  const [convertingQueryId, setConvertingQueryId] = useState<string | null>(null);
  const [isDoubtBannerDismissed, setIsDoubtBannerDismissed] = useState(false);

  // Record visit on startup once per browser session
  useEffect(() => {
    const visitRegistered = sessionStorage.getItem('abuosid_visit_registered');
    if (!visitRegistered) {
      sessionStorage.setItem('abuosid_visit_registered', 'true');
      fetch(getApiUrl('/api/stats/visit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .catch(err => console.error('[جامع الفوائد] خطأ في تسجيل زيارة جديدة:', err));
    }
  }, []);

  // Persist records to localStorage on change
  useEffect(() => {
    localStorage.setItem('abuosid_benefits', JSON.stringify(benefits));
  }, [benefits]);

  useEffect(() => {
    localStorage.setItem('abuosid_queries', JSON.stringify(queries));
  }, [queries]);

  useEffect(() => {
    localStorage.setItem('abuosid_settings', JSON.stringify(settings));
  }, [settings]);

  // Automatic background notification scheduler (highly effective with HTML5 system notifications + custom sliding Android UI)
  useEffect(() => {
    if (settings.notificationInterval === 'off') return;

    // Convert interval code to milliseconds
    const intervalsMs: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };

    const intervalTime = intervalsMs[settings.notificationInterval] || (24 * 60 * 60 * 1000);

    const triggerNotification = () => {
      if (benefits.length === 0) return;
      
      const randomIndex = Math.floor(Math.random() * benefits.length);
      const selectedBenefit = benefits[randomIndex];
      
      // 1. Show elegant in-app Android-styled sliding card
      setAndroidNotification(selectedBenefit);
      
      // 2. Trigger real HTML5 device/browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('💡 فائدة من جامع الفوائد تهمك', {
            body: `[${selectedBenefit.title}]\n${selectedBenefit.content.replace(/\n/g, ' ').substring(0, 110)}...`,
            icon: '/app_logo.svg',
            dir: 'rtl',
            lang: 'ar',
          });
          notification.onclick = () => {
            window.focus();
            setAndroidNotification(selectedBenefit);
          };
        } catch (err) {
          console.error('System notification error:', err);
        }
      }
      
      localStorage.setItem('abuosid_last_notification_time', String(Date.now()));
    };

    // Check on app load if overdue for an automatic notification
    const lastTriggered = localStorage.getItem('abuosid_last_notification_time');
    const now = Date.now();
    if (!lastTriggered || (now - parseInt(lastTriggered, 10)) > intervalTime) {
      // Small timeout to let the page settle on load
      const startTimer = setTimeout(triggerNotification, 5000);
      return () => clearTimeout(startTimer);
    }

    // Set up regular background interval timer
    const intervalId = setInterval(triggerNotification, intervalTime);
    return () => clearInterval(intervalId);
  }, [settings.notificationInterval, benefits]);

  // Request system notification permission automatically when interval settings are changed
  useEffect(() => {
    if (settings.notificationInterval !== 'off' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showToast('تم تفعيل نظام التنبيهات المباشرة بنجاح! ستظهر الإشعارات على شاشة هاتفك مباشرة.', 'success');
          } else if (permission === 'denied') {
            showToast('لم يتم منح إذن الإشعارات، سيتم الاكتفاء بالإشعارات المنبثقة داخل التطبيق.', 'info');
          }
        });
      }
    }
  }, [settings.notificationInterval]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  // 1. Add / Update Benefit handler
  const handleSaveBenefit = (formData: Omit<Benefit, 'id' | 'views' | 'isFavorite' | 'createdAt'>) => {
    if (editingBenefit) {
      // Edit existing benefit
      setBenefits(prev => prev.map(b => b.id === editingBenefit.id ? {
        ...b,
        ...formData
      } : b));
      setEditingBenefit(null);
    } else {
      // Add new benefit
      const newBenefit: Benefit = {
        id: `benefit-${Date.now()}`,
        ...formData,
        views: 0,
        isFavorite: false,
        createdAt: Date.now(),
      };
      setBenefits(prev => [newBenefit, ...prev]);

      if (convertingQueryId) {
        setQueries(prev => prev.filter(q => q.id !== convertingQueryId));
        setConvertingQueryId(null);
        setPrefilledBenefit(null);
        showToast('تم بحمد الله قيد الفائدة بنجاح، وإقفال الاستشكال وحذفه تلقائياً من المنصة 🎉📚', 'success');
      }
    }
  };

  // 2. Increment Benefit Views Counter on reading
  const handleViewBenefit = (id: string) => {
    setBenefits(prev => prev.map(b => b.id === id ? { ...b, views: b.views + 1 } : b));
  };

  // Helper to scroll to a specific benefit, expand it, and highlight it
  const handleScrollToBenefit = (b: Benefit) => {
    // 1. Reset all filters to guarantee the card exists in the list
    setSearchQuery('');
    setSelectedCategory('الكل');
    setOnlyFavorites(false);
    
    // 2. Set this benefit ID to be expanded
    setExpandedBenefitId(b.id);
    
    // 3. Mark it as viewed (increment views count)
    handleViewBenefit(b.id);
    
    // 4. Scroll smoothly to the card with high contrast highlight effect
    setTimeout(() => {
      const element = document.getElementById(`benefit-card-${b.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary glow-highlight ring around the card
        element.classList.add('ring-4', 'ring-brand-gold', 'scale-[1.02]', 'duration-500');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-brand-gold', 'scale-[1.02]');
        }, 2000);
      }
    }, 150);
  };

  // 3. Toggle Favorite Status
  const handleToggleFavorite = (id: string) => {
    setBenefits(prev => prev.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  };

  // 4. Delete Benefit
  const handleDeleteBenefit = (id: string) => {
    setBenefits(prev => prev.filter(b => b.id !== id));
  };

  // 5. Query / Doubts operations
  const handleAddQuery = (newQ: Omit<ScientificQuery, 'id' | 'createdAt'>) => {
    const query: ScientificQuery = {
      id: `query-${Date.now()}`,
      ...newQ,
      createdAt: Date.now(),
    };
    setQueries(prev => [query, ...prev]);
  };

  const handleUpdateQuery = (updatedQ: ScientificQuery) => {
    setQueries(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
  };

  const handleDeleteQuery = (id: string) => {
    setQueries(prev => prev.filter(q => q.id !== id));
  };

  const handleConvertToBenefit = (query: ScientificQuery) => {
    if (!query.resolution) return;
    
    setPrefilledBenefit({
      title: query.title,
      content: query.resolution,
      category: 'علوم أخرى',
      source: query.source || 'تحرير وتحقيق ذاتي',
      date: new Date().toISOString().split('T')[0],
    });
    
    setConvertingQueryId(query.id);
    setActiveTab('add');
    showToast('تم نقل تفاصيل الاستشكال والتحرير بنجاح إلى تدوين الفائدة! يمكنك مراجعتها وتصنيفها الآن ثم حفظها 📚✨', 'info');
  };

  // 6. Settings Operations
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    showToast('تم حفظ تفضيلات الضبط والتنبيهات بنجاح.', 'success');
  };

  const handleToggleControlPanel = () => {
    setIsControlPanelVisible(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('abuosid_control_panel_visible', String(newValue));
      } catch (e) {
        console.error(e);
      }
      
      if (newValue) {
        setActiveTab('settings');
      } else {
        setActiveTab('home');
      }
      return newValue;
    });
  };

  const handleImportData = (importedData: { benefits: Benefit[]; queries: ScientificQuery[]; programmerName?: string }) => {
    // Merge data avoiding duplicates
    setBenefits(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const filteredImported = importedData.benefits.filter(b => !existingIds.has(b.id));
      return [...filteredImported, ...prev];
    });

    setQueries(prev => {
      const existingIds = new Set(prev.map(q => q.id));
      const filteredImported = importedData.queries.filter(q => !existingIds.has(q.id));
      return [...filteredImported, ...prev];
    });

    if (importedData.programmerName) {
      handleUpdateSettings({
        ...settings,
        programmerName: importedData.programmerName
      });
    }
  };

  const handleRestoreBackup = (backupDataStr: string) => {
    try {
      const parsed = JSON.parse(backupDataStr);
      if (parsed && (Array.isArray(parsed.benefits) || Array.isArray(parsed.queries))) {
        setBenefits(parsed.benefits || []);
        setQueries(parsed.queries || []);
        
        if (parsed.programmerName) {
          handleUpdateSettings({
            ...settings,
            programmerName: parsed.programmerName
          });
        }
        
        showToast('تم استرجاع النسخة الاحتياطية وتحديث السجلات بنجاح!', 'success');
        return true;
      }
    } catch (e) {
      showToast('فشل قراءة ملف النسخة الاحتياطية. يرجى المحاولة لاحقاً.', 'warning');
    }
    return false;
  };

  // 7. Simulated Alert System - sends a random benefit as a top-screen banner
  const triggerTestNotification = () => {
    if (benefits.length === 0) {
      showToast('يرجى تدوين فائدة علمية واحدة على الأقل قبل إرسال التنبيه التجريبي!', 'warning');
      return;
    }
    const randomIndex = Math.floor(Math.random() * benefits.length);
    setAndroidNotification(benefits[randomIndex]);
    showToast('تم إرسال إشعار أندرويد منبثق! انظر أعلى الشاشة.', 'info');
  };

  // 8. Filters for Home feed
  const filteredBenefits = benefits.filter(b => {
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const regex = getArabicSearchRegex(searchQuery);
      if (regex) {
        const dateFormatted = formatToHijriAndGregorian(b.date);
        const combinedText = [
          b.title,
          b.content,
          b.category,
          b.source || '',
          b.date,
          dateFormatted
        ].join(' ');
        
        matchesSearch = regex.test(combinedText);
      }
    }
    
    const matchesCategory = selectedCategory === 'الكل' || b.category === selectedCategory;
    const matchesFavorite = !onlyFavorites || b.isFavorite;

    return matchesSearch && matchesCategory && matchesFavorite;
  });

  return (
    <div className="min-h-screen bg-brand-beige flex flex-col pb-24 text-right">



      {/* Real-time Android top sliding notification */}
      <AnimatePresence>
        {androidNotification && (
          <AndroidSystemNotification
            benefit={androidNotification}
            onClose={() => setAndroidNotification(null)}
            onView={() => {
              // Direct view to this specific benefit
              handleViewBenefit(androidNotification.id);
              setSelectedCategory('الكل');
              setSearchQuery(androidNotification.title);
              setOnlyFavorites(false);
              setActiveTab('home');
              setAndroidNotification(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating toast alerts */}
      <AnimatePresence>
        {toast && (
          <NotificationToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-brand-emerald-dark to-brand-emerald text-white shadow-lg border-b border-brand-gold/25 relative overflow-hidden z-30"
          >
            <div className="max-w-4xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Smartphone className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-xs sm:text-sm block text-brand-cream">تحميل وتثبيت تطبيق جامع الفوائد على جوالك!</span>
                  <p className="text-[10px] sm:text-xs text-brand-cream/80 leading-relaxed">
                    حمل ملف الأندرويد (APK) المباشر لتصفح وقيد فوائدك العلمية والحديثية أوفلاين بالكامل 100% وبدون إنترنت كأنه تطبيق أصيل.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleInstallClick}
                  className="bg-brand-gold hover:bg-brand-gold-light text-white text-xs font-black px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>تحميل تطبيق الجوال (APK)</span>
                </button>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('abuosid_install_banner_dismissed_v1', 'true');
                    } catch (e) {}
                    setShowInstallBanner(false);
                  }}
                  className="text-white hover:text-zinc-200 text-xs px-2.5 py-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all whitespace-nowrap"
                >
                  تخطي
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Layout container */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-6 flex-1 space-y-6">
        
        {/* Render Tab Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header section */}
              <Header
                totalBenefits={benefits.length}
                benefits={benefits}
                onViewBenefit={handleScrollToBenefit}
                showToast={showToast}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onUnlockControlPanel={handleToggleControlPanel}
              />

              {/* Startup Non-Intrusive Doubt Banner */}
              {!isDoubtBannerDismissed && queries.filter(q => !q.isResolved).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-2xl" />
                  
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600 shrink-0 mt-0.5">
                      <HelpCircle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-right space-y-1">
                      <h4 className="text-sm font-bold text-amber-900 font-sans">
                        تنبيه علمي للمراجعة والتحقيق
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                        لديك {queries.filter(q => !q.isResolved).length} من المسائل والاستشكالات العلمية العالقة التي لا تزال تحت البحث والتحقيق. يرجى مراجعتها وتوثيق مخارجها متى ما تيسر لك ذلك.
                      </p>
                      
                      <button
                        onClick={() => {
                          setActiveTab('queries');
                          setIsDoubtBannerDismissed(true);
                        }}
                        className="mt-2 text-xs font-bold text-amber-950 hover:text-amber-800 underline flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>انتقل إلى منصة الاستشكالات والبحث عن حلول للمسائل العالقة ⟵</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Elegant Category Selection Trigger Button */}
              <div className="space-y-2 font-sans">
                <label className="text-xs font-black text-zinc-500 flex items-center gap-1.5 justify-start text-right">
                  <Folder className="w-4 h-4 text-brand-emerald-dark" />
                  <span>تصفية واستعراض الفوائد والفرائد حسب القسم العلمي:</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowCategoriesPopup(true)}
                  className="w-full bg-brand-emerald-dark hover:bg-brand-emerald-light text-white py-3.5 px-5 rounded-2xl shadow-md border border-brand-emerald-dark/55 flex items-center justify-between font-sans transition-all duration-300 group cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-105 transition-transform">
                      <FolderSync className="w-5 h-5 text-brand-gold-light" />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] block text-brand-cream/70 font-bold">القسم العلمي النشط الآن</span>
                      <span className="text-sm sm:text-base font-black block text-white mt-0.5 leading-tight">
                        {selectedCategory === 'الكل' ? 'جميع الفوائد والفرائد' : selectedCategory}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-white/10 rounded-full text-brand-cream border border-white/5 whitespace-nowrap">
                      {selectedCategory === 'الكل' 
                        ? `${benefits.length} فائدة` 
                        : `${benefits.filter(b => b.category === selectedCategory).length} فائدة`
                      }
                    </span>
                    {/* Elegant Gold Triangle Indicator */}
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center transition-transform group-hover:scale-105 border border-white/5 shrink-0">
                      <span className="text-brand-gold-light text-[10px] select-none transform transition-transform group-hover:translate-y-0.5">
                        ▼
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Dynamic Category Folders Grid in a Pop-up Modal */}
              <AnimatePresence>
                {showCategoriesPopup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowCategoriesPopup(false)}
                      className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs cursor-pointer"
                    />
                    
                    {/* Popup Dialog Content Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                      className="bg-[#FDFBF7] rounded-3xl border border-zinc-200 w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-10"
                    >
                      {/* Premium Header */}
                      <div className="bg-gradient-to-r from-brand-emerald-dark to-brand-emerald px-6 py-4.5 flex items-center justify-between text-white border-b border-brand-gold/25">
                        <div className="flex items-center gap-3 text-right">
                          <div className="p-2.5 bg-white/10 rounded-xl text-brand-gold-light shrink-0">
                            <FolderSync className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-brand-gold-light">مجلدات وأقسام المكتبة العلمية</h3>
                            <p className="text-[10px] sm:text-xs text-brand-cream/80 leading-relaxed mt-0.5">انقر على المجلد المناسب لتصفية الفوائد المعروضة، أو أضف تصنيفاً مخصصاً جديداً.</p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setShowCategoriesPopup(false)}
                          className="p-2 rounded-xl hover:bg-white/10 text-white hover:text-zinc-200 transition-all cursor-pointer"
                          title="إغلاق النافذة"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Scrollable category grid content area */}
                      <div className="p-6 overflow-y-auto space-y-5 text-right font-sans custom-scroll flex-1">
                        <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                          <span className="text-xs font-bold text-zinc-500">اختر من الأقسام المتاحة للتصفية:</span>
                          
                          <button
                            type="button"
                            onClick={() => setIsAllCategoriesExpanded(!isAllCategoriesExpanded)}
                            className="text-[11px] font-bold text-brand-emerald hover:text-brand-emerald-dark hover:underline transition-all cursor-pointer"
                          >
                            {isAllCategoriesExpanded ? 'طي قائمة الأقسام ⌃' : `عرض جميع التقاسيم العلمية المتاحة (${categories.length}) ⌄`}
                          </button>
                        </div>

                        {/* Dynamic Category Folders Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4 pt-4">
                          {/* 'All' Folder Card */}
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedCategory('الكل');
                              setShowCategoriesPopup(false);
                            }}
                            role="button"
                            tabIndex={0}
                            className={`relative p-4 rounded-2xl rounded-tr-none border text-right transition-all flex flex-col justify-between h-28 cursor-pointer select-none ${
                              selectedCategory === 'الكل'
                                ? 'bg-gradient-to-br from-brand-emerald-dark to-brand-emerald text-white border-transparent shadow-md ring-1 ring-brand-gold/25'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:border-brand-gold/30 hover:shadow-sm shadow-xs'
                            }`}
                          >
                            {/* Realistic Folder Tab */}
                            <div className={`absolute -top-3.5 right-0 h-3.5 w-16 rounded-t-lg transition-all ${
                              selectedCategory === 'الكل'
                                ? 'bg-brand-emerald-dark'
                                : 'bg-white border-t border-x border-zinc-200'
                            }`} />

                            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
                              selectedCategory === 'الكل' ? 'bg-brand-gold' : 'bg-brand-emerald'
                            }`} />

                            <div className="flex justify-between items-start w-full pr-1 z-10">
                              <div className={`p-2 rounded-xl ${
                                selectedCategory === 'الكل' ? 'bg-white/10 text-brand-gold-light' : 'bg-brand-cream/40 text-brand-emerald'
                              }`}>
                                <Layers className="w-5 h-5" />
                              </div>
                              
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                selectedCategory === 'الكل' ? 'bg-white/10 text-brand-gold-light' : 'bg-zinc-100 text-zinc-500'
                              }`}>
                                {benefits.length} فائدة
                              </span>
                            </div>

                            <div className="pr-1 mt-2 z-10">
                              <span className="text-xs sm:text-sm font-bold block truncate max-w-full leading-snug">
                                جميع الفوائد والفرائد
                              </span>
                            </div>
                          </motion.div>

                          {/* Dynamic categories foldered list */}
                          {(() => {
                            let catsToShow = categories;
                            if (!isAllCategoriesExpanded) {
                              const activeCats = categories.filter(cat => benefits.some(b => b.category === cat));
                              if (activeCats.length >= 4) {
                                catsToShow = activeCats;
                              } else {
                                const remaining = categories.filter(cat => !activeCats.includes(cat));
                                catsToShow = [...activeCats, ...remaining.slice(0, 4 - activeCats.length)];
                              }
                            }

                            return catsToShow.map(cat => {
                              const count = benefits.filter(b => b.category === cat).length;
                              const isActive = selectedCategory === cat;
                              const isCustom = !CATEGORIES.includes(cat as any);
                              return (
                                <motion.div
                                  key={cat}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    setSelectedCategory(isActive ? 'الكل' : cat);
                                    setShowCategoriesPopup(false);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  className={`relative p-4 rounded-2xl rounded-tr-none border text-right transition-all flex flex-col justify-between h-28 cursor-pointer select-none ${
                                    isActive
                                      ? 'bg-gradient-to-br from-brand-emerald-dark to-brand-emerald text-white border-transparent shadow-md ring-1 ring-brand-gold/25'
                                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-brand-gold/30 hover:shadow-sm shadow-xs'
                                  } ${count === 0 ? 'opacity-70 border-dashed bg-zinc-50/20' : ''}`}
                                >
                                  {/* Realistic Folder Tab */}
                                  <div className={`absolute -top-3.5 right-0 h-3.5 w-16 rounded-t-lg transition-all ${
                                    isActive
                                      ? 'bg-brand-emerald-dark'
                                      : 'bg-white border-t border-x border-zinc-200'
                                  }`} />

                                  <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
                                    isActive ? 'bg-brand-gold' : count > 0 ? 'bg-brand-emerald' : 'bg-zinc-300'
                                  }`} />

                                  <div className="flex justify-between items-start w-full pr-1 z-10">
                                    <div className="flex items-center gap-1">
                                      <div className={`p-2 rounded-xl ${
                                        isActive ? 'bg-white/10 text-brand-gold-light' : 'bg-brand-cream/40 text-brand-emerald'
                                      }`}>
                                        <FolderSync className="w-5 h-5" />
                                      </div>
                                      {isCustom && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCategoryToDelete(cat);
                                          }}
                                          className={`p-2 rounded-xl transition-all cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center ${
                                            isActive 
                                              ? 'bg-white/10 text-white hover:text-red-300 hover:bg-white/20' 
                                              : 'bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100'
                                          }`}
                                          title="حذف هذا القسم"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isActive ? 'bg-white/10 text-brand-gold-light' : 'bg-zinc-100 text-zinc-500'
                                    }`}>
                                      {count} {count === 1 ? 'فائدة' : 'فوائد'}
                                    </span>
                                  </div>

                                  <div className="pr-1 mt-2 z-10">
                                    <span className="text-xs sm:text-sm font-bold block truncate max-w-full leading-snug">
                                      {cat}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            });
                          })()}

                          {/* "+ Add New Section" Card */}
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowAddCategoryModal(true);
                            }}
                            role="button"
                            tabIndex={0}
                            className="relative p-4 rounded-2xl rounded-tr-none border-2 border-dashed border-brand-emerald/20 hover:border-brand-emerald/40 bg-zinc-50/50 hover:bg-brand-cream/10 text-brand-emerald text-right transition-all flex flex-col justify-between h-28 cursor-pointer select-none"
                          >
                            {/* Realistic Folder Tab */}
                            <div className="absolute -top-3.5 right-0 h-3.5 w-16 bg-zinc-50 border-t border-x border-dashed border-brand-emerald/20 rounded-t-lg" />

                            <div className="flex justify-between items-start w-full z-10">
                              <div className="p-2 bg-brand-gold/10 text-brand-gold rounded-xl">
                                <FolderPlus className="w-5 h-5 animate-pulse" />
                              </div>
                              <span className="text-[9px] font-black bg-brand-gold/15 text-brand-gold-dark px-2 py-0.5 rounded-full">
                                مخصص ➕
                              </span>
                            </div>
                            <div className="z-10">
                              <span className="text-xs sm:text-sm font-black block leading-snug">
                                + إضافة قسم جديد
                              </span>
                              <span className="text-[10px] text-zinc-450 block mt-0.5">
                                أنشئ قسماً خاصاً بك
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Search Bar placed DIRECTLY above the benefits list */}
              <div className="relative w-full space-y-2">
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 ابحث في عناوين الفوائد ومضامينها ومصادرها وتواريخها..."
                    className={`w-full pr-11 py-3 bg-white text-zinc-800 rounded-2xl border-2 border-brand-emerald/20 hover:border-brand-emerald/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans shadow-md ${
                      searchQuery ? 'pl-11' : 'pl-4'
                    }`}
                  />
                  <Search className="w-5 h-5 text-brand-emerald absolute right-4 top-3.5" />
                  
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-4 top-3 p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-150 rounded-full transition-all cursor-pointer active:scale-90"
                      title="مسح البحث"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between px-3 py-1 bg-brand-emerald/5 border border-brand-emerald/10 rounded-xl text-xs text-brand-emerald-dark font-sans"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>تم العثور على</span>
                      <span className="bg-brand-emerald text-white px-2 py-0.5 rounded-full text-[11px]">
                        {filteredBenefits.length}
                      </span>
                      <span>
                        {filteredBenefits.length === 1 
                          ? 'فائدة' 
                          : (filteredBenefits.length >= 3 && filteredBenefits.length <= 10) 
                            ? 'فوائد' 
                            : 'فائدة'} مطابقة للبحث
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-red-650 hover:text-red-800 font-bold transition-colors cursor-pointer"
                    >
                      إلغاء البحث ✕
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Benefits Cards Feed List */}
              <div className="space-y-4">
                {filteredBenefits.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-3xl p-6 custom-shadow">
                    <BookOpen className="w-14 h-14 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-zinc-700 font-sans">لا توجد فوائد مطابقة للبحث</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      لم نجد أي فائدة مطابقة لشروط التصفية أو البحث. جرب كتابة كلمات مفتاحية أخرى، أو قم بإعادة تعيين فلاتر التصفية.
                    </p>
                  </div>
                ) : (
                  filteredBenefits.map((benefit) => (
                    <BenefitCard
                      key={benefit.id}
                      benefit={benefit}
                      onView={handleViewBenefit}
                      onToggleFavorite={handleToggleFavorite}
                      onEdit={(b) => {
                        setEditingBenefit(b);
                        setPrefilledBenefit(null);
                        setConvertingQueryId(null);
                        setActiveTab('add');
                      }}
                      onDelete={handleDeleteBenefit}
                      showToast={showToast}
                      onOpenShareCard={(b) => setSharingBenefit(b)}
                      forceExpanded={expandedBenefitId === benefit.id}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <BenefitForm
                onSave={handleSaveBenefit}
                initialBenefit={editingBenefit}
                prefilledData={prefilledBenefit}
                categoriesList={categories}
                onAddCustomCategory={handleAddCustomCategory}
                onCancel={() => {
                  setEditingBenefit(null);
                  setPrefilledBenefit(null);
                  setConvertingQueryId(null);
                  setActiveTab('home');
                }}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'queries' && (
            <motion.div
              key="queries"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <QueryManager
                queries={queries}
                onAddQuery={handleAddQuery}
                onUpdateQuery={handleUpdateQuery}
                onDeleteQuery={handleDeleteQuery}
                onConvertToBenefit={handleConvertToBenefit}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsPanel
                settings={settings}
                benefits={benefits}
                queries={queries}
                onUpdateSettings={handleUpdateSettings}
                onImportData={handleImportData}
                onRestoreBackup={handleRestoreBackup}
                triggerAutoBackup={triggerAutoBackup}
                triggerTestNotification={triggerTestNotification}
                showToast={showToast}
                onShowPremiumPromo={() => setShowPremiumPromo(true)}
                isControlPanelVisible={isControlPanelVisible}
                onUnlockControlPanel={handleToggleControlPanel}
                onShowWelcome={() => setShowWelcome(true)}
                activeView="settings"
                onInstallApp={handleInstallClick}
                categoriesList={categories}
                onAddCustomCategory={handleAddCustomCategory}
                onDeleteCustomCategory={handleDeleteCustomCategory}
              />
            </motion.div>
          )}

          {activeTab === 'print' && (
            <motion.div
              key="print"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsPanel
                settings={settings}
                benefits={benefits}
                queries={queries}
                onUpdateSettings={handleUpdateSettings}
                onImportData={handleImportData}
                onRestoreBackup={handleRestoreBackup}
                triggerAutoBackup={triggerAutoBackup}
                triggerTestNotification={triggerTestNotification}
                showToast={showToast}
                onShowPremiumPromo={() => setShowPremiumPromo(true)}
                isControlPanelVisible={isControlPanelVisible}
                onUnlockControlPanel={handleToggleControlPanel}
                onShowWelcome={() => setShowWelcome(true)}
                activeView="print"
                onInstallApp={handleInstallClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Styled Android Bottom Navigation Menu */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-zinc-200/80 shadow-2xl z-40 flex items-center justify-around px-4">
        {/* Navigation Home */}
        <button
          onClick={() => {
            setEditingBenefit(null);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center justify-center gap-1.5 w-16 py-2 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-brand-emerald scale-105' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'home' ? 'bg-brand-cream text-brand-emerald-dark' : ''
          }`}>
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold font-sans">الفوائد</span>
        </button>

        {/* Navigation Add Benefit */}
        <button
          onClick={() => {
            setEditingBenefit(null);
            setActiveTab('add');
          }}
          className={`flex flex-col items-center justify-center gap-1.5 w-16 py-2 transition-all cursor-pointer ${
            activeTab === 'add' ? 'text-brand-emerald scale-105' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'add' ? 'bg-brand-cream text-brand-emerald-dark' : ''
          }`}>
            <PlusCircle className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold font-sans">تدوين فائدة</span>
        </button>

        {/* Navigation Queries / Doubts */}
        <button
          onClick={() => {
            setEditingBenefit(null);
            setActiveTab('queries');
          }}
          className={`flex flex-col items-center justify-center gap-1.5 w-16 py-2 transition-all cursor-pointer ${
            activeTab === 'queries' ? 'text-brand-emerald scale-105' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'queries' ? 'bg-brand-cream text-brand-emerald-dark' : ''
          }`}>
            <HelpCircle className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold font-sans">الاستشكالات</span>
        </button>

        {/* Navigation Printing */}
        <button
          onClick={() => {
            setEditingBenefit(null);
            setActiveTab('print');
          }}
          className={`flex flex-col items-center justify-center gap-1.5 w-16 py-2 transition-all cursor-pointer ${
            activeTab === 'print' ? 'text-brand-emerald scale-105' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'print' ? 'bg-brand-cream text-brand-emerald-dark' : ''
          }`}>
            <Printer className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold font-sans">الطباعة</span>
        </button>

        {/* Navigation Settings */}
        <button
          onClick={() => {
            setEditingBenefit(null);
            setActiveTab('settings');
          }}
          className={`flex flex-col items-center justify-center gap-1.5 w-16 py-2 transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-brand-emerald scale-105' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'settings' ? 'bg-brand-cream text-brand-emerald-dark' : ''
          }`}>
            <FolderSync className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] font-bold font-sans">الإعدادات</span>
        </button>
      </nav>

      {/* Share Benefit Card Modal */}
      {sharingBenefit && (
        <ShareCardModal
          isOpen={!!sharingBenefit}
          onClose={() => setSharingBenefit(null)}
          benefit={sharingBenefit}
          settings={settings}
          isActivated={isAppActivated()}
          onShowPremiumPromo={() => setShowPremiumPromo(true)}
          showToast={showToast}
        />
      )}

      {/* Premium Promo Modal (Paywall Details list) */}
      <PremiumPromoModal
        isOpen={showPremiumPromo}
        onClose={() => setShowPremiumPromo(false)}
        showToast={showToast}
      />

      {/* Welcome Modal Popup */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => {
          try {
            localStorage.setItem('abuosid_welcome_dismissed_v3', 'true');
            document.cookie = "abuosid_welcome_dismissed_v3=true; max-age=31536000; path=/";
          } catch (e) {
            console.error(e);
          }
          setShowWelcome(false);
          showToast('أهلاً بك في جامع الفوائد! استمتع بتقييد فرائدك العلمية 📚✨', 'success');
        }}
      />

      {/* Custom Category Deletion Confirmation Modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-right font-sans border border-zinc-150 shadow-xl relative"
            >
              {/* Close button */}
              <button
                onClick={() => setCategoryToDelete(null)}
                className="absolute left-4 top-4 p-1.5 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1 mb-4">
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-1">
                  <FolderMinus className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-black text-zinc-800 font-sans">حذف المجلد العلمي؟</h4>
                <p className="text-xs text-zinc-500">أنت على وشك حذف قسم "{categoryToDelete}"</p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-brand-cream/20 border border-brand-cream/40 rounded-xl">
                  <p className="text-xs text-brand-emerald-dark leading-relaxed font-sans text-justify">
                    ⚠️ تيسيراً عليك وحفظاً لمجهودك العلمي، لن تضيع أي فوائد مضافة داخل هذا القسم؛ بل سيتم نقل جميع الفوائد والفرائد المصنفة تحته ({benefits.filter(b => b.category === categoryToDelete).length} فائدة) تلقائياً إلى قسم <strong>"علوم أخرى"</strong>.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setCategoryToDelete(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                  <button
                    onClick={() => handleDeleteCustomCategory(categoryToDelete)}
                    className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    حذف ونقل الفوائد
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Category Creator Modal */}
      <AnimatePresence>
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-right font-sans border border-brand-cream/60 custom-shadow-gold relative"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCatName('');
                }}
                className="absolute left-4 top-4 p-1.5 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1 mb-4">
                <div className="mx-auto w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-1">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-brand-emerald-dark font-sans">إنشاء قسم علمي جديد</h4>
                <p className="text-xs text-zinc-500">أضف مجلداً علمياً جديداً لتصنيف فوائدك بداخله</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 block">اسم القسم الجديد *</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="مثال: علم الفرائض والمواريث"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const success = handleAddCustomCategory(newCatName);
                        if (success) {
                          setNewCatName('');
                          setShowAddCategoryModal(false);
                        }
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowAddCategoryModal(false);
                      setNewCatName('');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    onClick={() => {
                      const success = handleAddCustomCategory(newCatName);
                      if (success) {
                        setNewCatName('');
                        setShowAddCategoryModal(false);
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-bold bg-brand-emerald text-white rounded-xl hover:bg-brand-emerald-light transition-all shadow-md cursor-pointer"
                  >
                    إنشاء وتصنيف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-24 left-6 z-40 bg-brand-emerald hover:bg-brand-emerald-light text-white p-3.5 rounded-full shadow-lg border border-brand-emerald/10 cursor-pointer flex items-center justify-center transition-colors focus:outline-none"
            title="الرجوع للأعلى"
            aria-label="الرجوع للأعلى"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Search Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleFloatingSearchClick}
        className="fixed bottom-24 right-6 z-40 bg-white/95 backdrop-blur-sm hover:bg-zinc-50 text-brand-emerald hover:text-brand-emerald-dark p-3.5 rounded-full shadow-lg border border-zinc-250 cursor-pointer flex items-center justify-center transition-all focus:outline-none"
        title="البحث السريع 🔍"
        aria-label="البحث السريع"
      >
        <Search className="w-5.5 h-5.5 text-brand-emerald" />
      </motion.button>

    </div>
  );
}
