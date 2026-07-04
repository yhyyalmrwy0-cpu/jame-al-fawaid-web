import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, HelpCircle, FolderSync, PlusCircle, Search, Heart, SlidersHorizontal, Grid, Star, Sparkles, Layers, Eye, ArrowUp } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'home' | 'add' | 'queries' | 'settings'>('home');

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

  // Premium and Card Share Modal States
  const [showPremiumPromo, setShowPremiumPromo] = useState(false);
  const [sharingBenefit, setSharingBenefit] = useState<Benefit | null>(null);

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
        if (parsed.programmerName === 'أبو أُسيد' || parsed.programmerName === 'أبو أسيد' || parsed.programmerName === 'أبي أُسيد' || parsed.programmerName === 'أبي أسيد') {
          parsed.programmerName = 'طالب العلم';
          localStorage.setItem('abuosid_settings', JSON.stringify(parsed));
        }
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
      return localStorage.getItem('abuosid_app_activated') === 'true';
    } catch (e) {
      return false;
    }
  };

  // Save backup helper
  const triggerAutoBackup = (triggerType: 'on_change' | 'daily' | 'on_exit' | 'manual') => {
    try {
      // Automatic local backup is free, cloud backup requires activation OR Google Drive connection
      const hasGoogleDrive = !!localStorage.getItem('abuosid_google_access_token');
      const isLocal = settings.backupType === 'local';
      if (settings.backupType === 'cloud' && !isAppActivated() && !hasGoogleDrive && triggerType !== 'manual') {
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

        // Save to Firebase Cloud Backup (Durable and serverless-friendly!)
        if (isAppActivated()) {
          const key = localStorage.getItem('abuosid_activation_key') || '';
          if (key) {
            const email = localStorage.getItem('abuosid_user_email') || '';
            saveBackupToFirebase(key, email, {
              trigger: triggerType,
              benefitsCount: benefits.length,
              queriesCount: queries.length,
              data: backupData
            })
            .then(() => {
              console.log('[جامع الفوائد] تم حفظ النسخة الاحتياطية السحابية عبر Firebase بنجاح.');
              if (!googleToken) {
                showToast('تم رفع وتحديث النسخة الاحتياطية تلقائياً إلى سحابة Firebase بنجاح! ☁️✅', 'success');
              }
            })
            .catch(err => {
              console.error('[جامع الفوائد] خطأ أثناء حفظ النسخة الاحتياطية السحابية لـ Firebase:', err);
            });

            // Mirror on custom server as secondary fallback
            fetch('/api/backup/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: key,
                email,
                backupData: {
                  trigger: triggerType,
                  benefitsCount: benefits.length,
                  queriesCount: queries.length,
                  data: backupData
                }
              })
            })
            .catch(err => {
              console.warn('[جامع الفوائد] خطأ اتصال بالخادم الثانوي للنسخ الاحتياطي (متوقع على Vercel):', err);
            });
          }
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
    const hasGoogleDrive = !!localStorage.getItem('abuosid_google_access_token');
    const isLocal = settings.backupType === 'local';
    const isAllowed = isAppActivated() || hasGoogleDrive || isLocal;
    if (!isAllowed) return;

    if (settings.autoBackupInterval === 'on_change') {
      const timer = setTimeout(() => {
        triggerAutoBackup('on_change');
      }, 5000); // 5 seconds debounce to avoid writing repeatedly during active typing/editing
      return () => clearTimeout(timer);
    }
  }, [structuralStateKey, settings.autoBackupInterval, settings.backupType]);

  // Trigger 'daily' backup check on startup
  useEffect(() => {
    const hasGoogleDrive = !!localStorage.getItem('abuosid_google_access_token');
    const isLocal = settings.backupType === 'local';
    const isAllowed = isAppActivated() || hasGoogleDrive || isLocal;
    if (!isAllowed) return;

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
      const hasGoogleDrive = !!localStorage.getItem('abuosid_google_access_token');
      const isLocal = settings.backupType === 'local';
      const isAllowed = isAppActivated() || hasGoogleDrive || isLocal;
      if (!isAllowed) return;

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'الكل'>('الكل');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Active Toast & Notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [androidNotification, setAndroidNotification] = useState<Benefit | null>(null);

  // Active editing states
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  // Record visit on startup once per browser session
  useEffect(() => {
    const visitRegistered = sessionStorage.getItem('abuosid_visit_registered');
    if (!visitRegistered) {
      sessionStorage.setItem('abuosid_visit_registered', 'true');
      fetch('/api/stats/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          localStorage.setItem('abuosid_local_visitors_count', String(data.stats.totalVisitors));
          localStorage.setItem('abuosid_local_subscribers_count', String(data.stats.totalSubscribers));
        }
      })
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
    }
  };

  // 2. Increment Benefit Views Counter on reading
  const handleViewBenefit = (id: string) => {
    setBenefits(prev => prev.map(b => b.id === id ? { ...b, views: b.views + 1 } : b));
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

  // 6. Settings Operations
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    showToast('تم حفظ تفضيلات الضبط والتنبيهات بنجاح.', 'success');
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
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.source && b.source.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
                onViewBenefit={(b) => {
                  handleViewBenefit(b.id);
                  // Filter strictly to view this card expanded
                  setSearchQuery(b.title);
                }}
                showToast={showToast}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />

              {/* Filtering Controls Panel */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 custom-shadow space-y-4">
                {/* Favorites Filter & Reset Button */}
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                    <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
                    <span>تصفح وتصفية الفوائد العلمية بحسب الفئة والمفضلة:</span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {/* Toggle favorites switch */}
                    <button
                      onClick={() => setOnlyFavorites(!onlyFavorites)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        onlyFavorites
                          ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                      <span>المفضلة</span>
                    </button>

                    {/* Reset search filter */}
                    {(searchQuery || selectedCategory !== 'الكل' || onlyFavorites) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('الكل');
                          setOnlyFavorites(false);
                          showToast('تمت إعادة تهيئة فلاتر التصفح والمشاهدة.', 'info');
                        }}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-bold text-zinc-600 transition-all flex items-center gap-1 cursor-pointer"
                        title="إعادة تعيين الكل"
                      >
                        إعادة تعيين
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Selection Chips Carousel */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-zinc-50/40 rounded-xl border border-zinc-100">
                    <button
                      onClick={() => setSelectedCategory('الكل')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === 'الكل'
                          ? 'bg-brand-emerald text-white'
                          : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      الكل ({benefits.length})
                    </button>

                    {CATEGORIES.map(cat => {
                      const count = benefits.filter(b => b.category === cat).length;
                      if (count === 0) return null; // Only show category chips that have at least one benefit to keep UI extremely clean!
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-brand-emerald text-white'
                              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Search Bar placed DIRECTLY above the benefits list */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 ابحث في عناوين الفوائد ومضامينها ومصادرها..."
                  className="w-full pl-4 pr-11 py-3 bg-white text-zinc-800 rounded-2xl border-2 border-brand-emerald/20 hover:border-brand-emerald/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans shadow-md"
                />
                <Search className="w-5 h-5 text-brand-emerald absolute right-4 top-3.5" />
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
                        setActiveTab('add');
                      }}
                      onDelete={handleDeleteBenefit}
                      showToast={showToast}
                      onOpenShareCard={(b) => setSharingBenefit(b)}
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
                onCancel={() => {
                  setEditingBenefit(null);
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
          <span className="text-[10px] font-bold font-sans">الفوائد العلمية</span>
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
          <span className="text-[10px] font-bold font-sans">الحفظ والطباعة</span>
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

    </div>
  );
}
