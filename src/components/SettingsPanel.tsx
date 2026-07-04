import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, Cloud, RefreshCw, Bell, User, Mail, ShieldCheck, ExternalLink, HelpCircle, Check, AlertTriangle, Play, Smartphone, Copy, Key, Lock, Unlock } from 'lucide-react';
import { AppSettings, Benefit, ScientificQuery, CATEGORIES } from '../types';
import { exportBenefitsToPDF, formatToHijriAndGregorian } from '../utils';
import { 
  listGoogleDriveBackups, 
  uploadToGoogleDrive, 
  downloadFromGoogleDrive, 
  deleteFromGoogleDrive 
} from '../utils/googleDrive';
import {
  saveBackupToFirebase,
  listBackupsFromFirebase,
  deleteBackupFromFirebase
} from '../lib/firebase';
import { AppLogo } from './AppLogo';
import { getApiUrl } from '../utils/api';

interface SettingsPanelProps {
  settings: AppSettings;
  benefits: Benefit[];
  queries: ScientificQuery[];
  onUpdateSettings: (settings: AppSettings) => void;
  onImportData: (data: { benefits: Benefit[]; queries: ScientificQuery[]; programmerName?: string }) => void;
  onRestoreBackup?: (backupDataStr: string) => boolean;
  triggerAutoBackup?: (triggerType: 'on_change' | 'daily' | 'on_exit' | 'manual') => void;
  triggerTestNotification: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  onShowPremiumPromo?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  benefits,
  queries,
  onUpdateSettings,
  onImportData,
  onRestoreBackup,
  triggerAutoBackup,
  triggerTestNotification,
  showToast,
  onShowPremiumPromo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingBackupAfterLoginRef = useRef<boolean>(false);
  const handleCloudBackupRef = useRef<() => Promise<void>>(async () => {});
  
  // Backups History local list
  const [backupsHistory, setBackupsHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('abuosid_backups_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Google Drive connection states
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveConnected, setDriveConnected] = useState(() => {
    try {
      return !!localStorage.getItem('abuosid_google_access_token');
    } catch (e) {
      return false;
    }
  });
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  // Custom PDF Export Options State
  const [pdfStyle, setPdfStyle] = useState<'grid' | 'book'>('grid');
  const [pdfBookTitle, setPdfBookTitle] = useState('خِزانة الفوائد والفرائد العلمية');
  const [pdfAuthorName, setPdfAuthorName] = useState(settings.programmerName || 'طالب العلم الباحث');
  const [includeCover, setIncludeCover] = useState(true);
  const [pdfCategorySelect, setPdfCategorySelect] = useState<string>('all');

  // Online Activation States (reconnect-free offline storage once validated)
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('abuosid_app_activated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [activationKey, setActivationKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('abuosid_user_email') || '';
    } catch (e) {
      return '';
    }
  });

  const handleEmailChange = (val: string) => {
    setUserEmail(val);
    try {
      localStorage.setItem('abuosid_user_email', val);
    } catch (e) {
      console.error(e);
    }
  };

  // Keep backup function reference fresh
  React.useEffect(() => {
    handleCloudBackupRef.current = handleCloudBackup;
  }, [benefits, queries, userEmail, isActivated, settings.programmerName]);

  // Keep pdfAuthorName synced with settings.programmerName
  React.useEffect(() => {
    if (settings.programmerName) {
      setPdfAuthorName(settings.programmerName);
    }
  }, [settings.programmerName]);
  const [showDemoKeys, setShowDemoKeys] = useState(false);
  const [demoKeys] = useState<string[]>([
    "ABU-OSID-PREMIUM-1111",
    "ABU-OSID-PREMIUM-2222",
    "ABU-OSID-PREMIUM-3333",
    "ABU-OSID-PREMIUM-4444"
  ]);

  // One-time free PDF trial state
  const [freePdfUsed, setFreePdfUsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('abuosid_free_pdf_used') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Admin Panel states
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminKeysList, setAdminKeysList] = useState<Record<string, { used: boolean, activatedAt: number | null, deviceId: string | null, note?: string, createdAt?: number }>>({});
  const [adminStats, setAdminStats] = useState<{
    totalVisitors: number;
    totalSubscribers: number;
    totalKeys: number;
    usedKeys: number;
    freeKeys: number;
  } | null>(() => {
    try {
      const cached = localStorage.getItem('abuosid_admin_stats');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [newKeyNote, setNewKeyNote] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState<string | null>(null);

  // Password changing states
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // Cloud Backups list and state
  const [cloudBackups, setCloudBackups] = useState<any[]>([]);
  const [isLoadingCloudBackups, setIsLoadingCloudBackups] = useState(false);
  const [backupTab, setBackupTab] = useState<'local' | 'cloud'>(
    settings.backupType === 'cloud' ? 'cloud' : 'local'
  );

  const fetchCloudBackups = async () => {
    const googleToken = localStorage.getItem('abuosid_google_access_token');
    
    // 1. If Google Drive is connected, fetch backups from Google Drive directly
    if (googleToken) {
      setIsLoadingCloudBackups(true);
      try {
        const driveFiles = await listGoogleDriveBackups(googleToken);
        setCloudBackups(driveFiles);
      } catch (err) {
        console.error('Error listing Google Drive backups:', err);
      } finally {
        setIsLoadingCloudBackups(false);
      }
      return;
    }

    // 2. Otherwise use Firebase Cloud Backup (Durable and serverless-friendly!)
    const key = localStorage.getItem('abuosid_activation_key') || '';
    if (!key) return;
    setIsLoadingCloudBackups(true);
    try {
      const firebaseBackups = await listBackupsFromFirebase(key, userEmail);
      setCloudBackups(firebaseBackups);
    } catch (err) {
      console.error('Error listing Firebase backups, falling back to local server:', err);
      // Fallback to local server backup if any error
      try {
        const response = await fetch(getApiUrl('/api/backup/list'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: key, email: userEmail }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setCloudBackups(data.backups);
        }
      } catch (innerErr) {
        console.error('Error listing server backups:', innerErr);
      }
    } finally {
      setIsLoadingCloudBackups(false);
    }
  };

  // Google OAuth Connection & Popup Handler
  const handleConnectGoogleDrive = async (triggerBackupAfterLogin: boolean = false) => {
    try {
      if (triggerBackupAfterLogin) {
        pendingBackupAfterLoginRef.current = true;
      } else {
        pendingBackupAfterLoginRef.current = false;
      }
      showToast('جاري تحضير الاتصال الآمن مع جوجل...', 'info');
      const res = await fetch(getApiUrl('/api/auth/google/url'));
      let data;
      try {
        data = await res.json();
      } catch (e) {
        // Ignore JSON parsing failure
      }
      if (!res.ok) {
        throw new Error(data?.message || 'فشل الاتصال بخادم تفويض جوجل أو لم يتم ضبط بيانات التطبيق على الخادم بعد.');
      }
      if (data && data.success && data.url) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          data.url,
          'الاتصال بجوجل درايف',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );
        
        if (!popup) {
          showToast('الرجاء السماح بالنوافذ المنبثقة للاتصال بجوجل درايف.', 'warning');
        }
      } else {
        showToast(data.message || 'فشل توليد رابط تسجيل الدخول.', 'warning');
      }
    } catch (err) {
      console.error('Error initiating Google OAuth:', err);
      showToast('حدث خطأ أثناء بدء ربط جوجل درايف.', 'warning');
    }
  };

  const handleDisconnectGoogleDrive = () => {
    localStorage.removeItem('abuosid_google_access_token');
    localStorage.removeItem('abuosid_google_refresh_token');
    setDriveConnected(false);
    setCloudBackups([]);
    showToast('تم فصل حساب جوجل درايف بنجاح.', 'info');
  };

  // Listen for login messages from the popup window
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { accessToken, refreshToken, email, name } = event.data;
        if (accessToken) {
          localStorage.setItem('abuosid_google_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('abuosid_google_refresh_token', refreshToken);
          }
          if (email) {
            localStorage.setItem('abuosid_user_email', email);
            setUserEmail(email);
          }
          if (name) {
            localStorage.setItem('abuosid_google_user_name', name);
          }
          setDriveConnected(true);
          showToast(email ? `تم ربط حسابك بجوجل درايف بنجاح! ☁️✅ (${email})` : 'تم ربط حسابك بجوجل درايف بنجاح! ☁️✅', 'success');
          
          if (pendingBackupAfterLoginRef.current) {
            pendingBackupAfterLoginRef.current = false;
            setTimeout(() => {
              handleCloudBackupRef.current();
            }, 600);
          }

          setIsLoadingCloudBackups(true);
          listGoogleDriveBackups(accessToken)
            .then(driveFiles => {
              setCloudBackups(driveFiles);
            })
            .catch(err => {
              console.error('Error listing after login:', err);
            })
            .finally(() => {
              setIsLoadingCloudBackups(false);
            });
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  React.useEffect(() => {
    fetchCloudBackups();
  }, [isActivated, driveConnected, settings.backupType]);

  const handleAdminLogin = async () => {
    if (!adminPasswordInput.trim()) {
      showToast('يرجى إدخال كلمة مرور الإدارة أولاً.', 'warning');
      return;
    }

    const password = adminPasswordInput.trim();

    try {
      const response = await fetch(getApiUrl('/api/admin/keys'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdminLoggedIn(true);
          setAdminKeysList(data.keys || {});
          if (data.stats) {
            setAdminStats(data.stats);
          }
          showToast('مرحباً بك يا شيخ في لوحة التحكم وتوليد الرموز بنجاح! 🔑', 'success');
          return;
        } else {
          showToast(data.message || 'كلمة المرور غير صحيحة!', 'warning');
          return;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.message || 'كلمة المرور غير صحيحة!', 'warning');
      }
    } catch (error) {
      console.error('Could not connect to online server for admin login:', error);
      showToast('فشل الاتصال بخادم قاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت والملفات الدستورية.', 'warning');
    }
  };

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    const password = adminPasswordInput.trim();
    const note = newKeyNote.trim() || 'مفتاح مخصص لشخص واحد';

    try {
      const response = await fetch(getApiUrl('/api/admin/generate-key'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          note
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(`تم توليد مفتاح تفعيل جديد بنجاح: ${data.key}`, 'success');
          setNewKeyNote('');
          
          const listResponse = await fetch(getApiUrl('/api/admin/keys'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
          });
          const listData = await listResponse.json();
          if (listResponse.ok && listData.success) {
            setAdminKeysList(listData.keys || {});
            if (listData.stats) {
              setAdminStats(listData.stats);
            }
          }
          setIsGeneratingKey(false);
          return;
        } else {
          showToast(data.message || 'فشل توليد المفتاح على الخادم.', 'warning');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.message || 'فشل توليد المفتاح.', 'warning');
      }
    } catch (error) {
      console.error('Error generating key online:', error);
      showToast('خطأ في الاتصال بالخادم السحابي لتوليد المفتاح.', 'warning');
    }

    setIsGeneratingKey(false);
  };

  const handleDeleteKey = async (keyToDelete: string) => {
    const password = adminPasswordInput.trim();

    requestConfirm('تأكيد الحذف 🗑️', 'هل أنت متأكد من رغبتك في حذف هذا المفتاح نهائياً؟', async () => {
      setIsDeletingKey(keyToDelete);
      try {
        const response = await fetch(getApiUrl('/api/admin/delete-key'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
            keyToDelete
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            showToast('تم حذف مفتاح التفعيل بنجاح من قاعدة البيانات.', 'success');
            
            const listResponse = await fetch(getApiUrl('/api/admin/keys'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ password }),
            });
            const listData = await listResponse.json();
            if (listResponse.ok && listData.success) {
              setAdminKeysList(listData.keys || {});
              if (listData.stats) {
                setAdminStats(listData.stats);
              }
            }
            setIsDeletingKey(null);
            return;
          } else {
            showToast(data.message || 'فشل حذف المفتاح من قاعدة البيانات.', 'warning');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          showToast(errorData.message || 'فشل حذف المفتاح.', 'warning');
        }
      } catch (error) {
        console.error('Error deleting key online:', error);
        showToast('فشل في الاتصال بالشبكة لحذف المفتاح.', 'warning');
      }

      setIsDeletingKey(null);
    });
  };

  const handleResetKeys = async () => {
    requestConfirm('تأكيد إعادة التهيئة ⚠️', 'تنبيه هام جداً: هل أنت متأكد من إعادة تهيئة قاعدة البيانات؟ سيتم حذف كافة الرموز المولدة حديثاً واستعادة الرموز الافتراضية.', async () => {
      try {
        const response = await fetch(getApiUrl('/api/admin/reset-keys'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: adminPasswordInput.trim() }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('تمت إعادة تهيئة قاعدة البيانات للمفاتيح بنجاح.', 'success');
          // Refresh key list
          const listResponse = await fetch(getApiUrl('/api/admin/keys'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: adminPasswordInput.trim() }),
          });
          const listData = await listResponse.json();
          if (listResponse.ok && listData.success) {
            setAdminKeysList(listData.keys || {});
            if (listData.stats) {
              setAdminStats(listData.stats);
            }
          }
        } else {
          showToast(data.message || 'فشل إعادة تهيئة المفاتيح.', 'warning');
        }
      } catch (error) {
        showToast('حدث خطأ في الشبكة أثناء تهيئة المفاتيح.', 'warning');
      }
    });
  };

  const handleChangeAdminPassword = async () => {
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 4) {
      showToast('يجب أن تكون كلمة المرور الجديدة مكونة من 4 أحرف أو أكثر.', 'warning');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(getApiUrl('/api/admin/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPasswordInput.trim(),
          newPassword: newAdminPassword.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('تم تغيير كلمة مرور الإدارة بنجاح! استخدم كلمة المرور الجديدة في المرات القادمة.', 'success');
        setAdminPasswordInput(newAdminPassword.trim());
        setNewAdminPassword('');
        setShowChangePasswordForm(false);
      } else {
        showToast(data.message || 'فشل تغيير كلمة المرور.', 'warning');
      }
    } catch (error) {
      showToast('حدث خطأ في الشبكة أثناء تغيير كلمة المرور.', 'warning');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOnlineActivation = async () => {
    const trimmedKey = activationKey.trim();
    if (!trimmedKey) {
      showToast('الرجاء إدخال مفتاح التفعيل أولاً.', 'warning');
      return;
    }

    setIsActivating(true);
    showToast('جاري الاتصال للتحقق وتنشيط رخصتك...', 'info');

    let localMessage = '';

    try {
      const response = await fetch(getApiUrl('/api/activate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: trimmedKey,
          deviceId: typeof window !== 'undefined' ? (navigator.userAgent || 'web-browser') : 'web'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsActivated(true);
          localStorage.setItem('abuosid_app_activated', 'true');
          localStorage.setItem('abuosid_activation_key', trimmedKey.toUpperCase().trim());
          
          showToast('تم التحقق والتفعيل عبر الإنترنت بنجاح! تم فتح ميزات النسخة المدفوعة والنسخ الاحتياطي السحابي وتصدير PDF مدى الحياة. 🎉', 'success');
          setIsActivating(false);
          return;
        } else {
          localMessage = data.message || 'كود التفعيل المدخل غير صحيح.';
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        localMessage = errorData.message || 'كود التفعيل المدخل غير صحيح أو مستخدم مسبقاً.';
      }
    } catch (error) {
      console.error('Activation connection error:', error);
      localMessage = 'فشل الاتصال بالخادم للتحقق من الكود. يرجى التأكد من اتصالك بالإنترنت.';
    }

    showToast(localMessage, 'warning');
    setIsActivating(false);
  };

  const handleCopyLink = () => {
    try {
      const appUrl = 'https://jame-al-fawaid-kc2u.vercel.app';
      navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      showToast('تم نسخ رابط التطبيق بنجاح! افتحه على هاتفك لتثبيته كـ PWA.', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      showToast('فشل في نسخ الرابط، يرجى نسخه يدوياً من المتصفح.', 'warning');
    }
  };

  const handleExportLocal = () => {
    try {
      const dataStr = JSON.stringify({ benefits, queries, programmerName: settings.programmerName }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `فوائد_أبي_أسيد_احتياطي_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showToast('تم تصدير النسخة الاحتياطية بنجاح على ذاكرة جهازك!', 'success');
    } catch (e) {
      showToast('فشل تصدير النسخة الاحتياطية، يرجى المحاولة لاحقاً.', 'warning');
    }
  };

  const handleImportLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          
          // Validate structure
          if (parsedData && (Array.isArray(parsedData.benefits) || Array.isArray(parsedData.queries))) {
            const importedBenefits = parsedData.benefits || [];
            const importedQueries = parsedData.queries || [];
            
            onImportData({
              benefits: importedBenefits,
              queries: importedQueries,
              programmerName: parsedData.programmerName,
            });
            showToast(`تمت استعادة البيانات بنجاح! تم دمج ${importedBenefits.length} فائدة و ${importedQueries.length} استشكال.`, 'success');
          } else {
            showToast('ملف النسخة الاحتياطية غير متوافق أو تالف!', 'warning');
          }
        } catch (error) {
          showToast('فشل في قراءة الملف، تأكد من اختيار ملف بخلفية JSON صحيحة.', 'warning');
        }
      };
    }
  };

  const handleCloudBackup = async () => {
    const googleToken = localStorage.getItem('abuosid_google_access_token');
    
    // 1. If Google Drive is connected, do real upload to Google Drive
    if (googleToken) {
      setIsDriveSyncing(true);
      showToast('جاري رفع نسختك الاحتياطية مباشرة إلى جوجل درايف السحابي... ☁️', 'info');
      try {
        const backupData = JSON.stringify({ benefits, queries, programmerName: settings.programmerName });
        await uploadToGoogleDrive(googleToken, backupData, 'manual', benefits.length, queries.length);
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLastDriveSync(timeStr);
        showToast('تم حفظ ورفع النسخة الاحتياطية بنجاح إلى حساب جوجل درايف الخاص بك! ☁️✅', 'success');
        fetchCloudBackups(); // Refresh list
      } catch (err) {
        console.error('Error uploading to Google Drive:', err);
        showToast('فشل رفع النسخة إلى جوجل درايف. تأكد من اتصالك بالإنترنت.', 'warning');
      } finally {
        setIsDriveSyncing(false);
      }
      return;
    }

    // 2. Otherwise use Firebase Cloud Backup (Durable and serverless-friendly!)
    if (!isActivated) {
      showToast('ميزة النسخ الاحتياطي السحابي تتطلب تفعيل كود بريميوم 🔑 أو ربط حساب جوجل درايف مجاناً! ☁️', 'info');
      return;
    }

    const key = localStorage.getItem('abuosid_activation_key') || '';
    if (!key) {
      showToast('لم يتم العثور على مفتاح التفعيل المحفوظ. يرجى تفعيل الكود أولاً.', 'warning');
      return;
    }

    setIsDriveSyncing(true);
    showToast('جاري حفظ النسخة الاحتياطية سحابياً (Firebase) بأمان... ☁️', 'info');

    try {
      const backupDataStr = JSON.stringify({ benefits, queries, programmerName: settings.programmerName });
      await saveBackupToFirebase(key, userEmail, {
        trigger: 'manual',
        benefitsCount: benefits.length,
        queriesCount: queries.length,
        data: backupDataStr
      });

      // Best effort to mirror on the server
      try {
        await fetch(getApiUrl('/api/backup/save'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: key,
            email: userEmail,
            backupData: {
              trigger: 'manual',
              benefitsCount: benefits.length,
              queriesCount: queries.length,
              data: backupDataStr
            }
          }),
        });
      } catch (serverErr) {
        console.warn('Server backup mirror skipped or failed:', serverErr);
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastDriveSync(timeStr);
      showToast('تم رفع وحفظ النسخة الاحتياطية السحابية بنجاح عبر Firebase! ☁️✅', 'success');
      fetchCloudBackups(); // Refresh cloud backup list
    } catch (error) {
      console.error('Firebase Cloud backup error:', error);
      showToast('حدث خطأ أثناء رفع النسخة السحابية لـ Firebase.', 'warning');
    } finally {
      setIsDriveSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* 1. Schedulers & Notifications */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 custom-shadow">
        <h3 className="text-base font-bold text-brand-emerald-dark border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-gold" />
          نظام التنبيهات والإشعارات الخارجية
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-zinc-800">تكرار إرسال التنبيهات الدورية التلقائية</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                سيقوم جامع الفوائد تلقائياً بإرسال فوائد عشوائية مذكرّة إلى شاشة هاتفك مباشرة حسب الفاصل الزمني المختار.
              </p>
            </div>
            
            <select
              value={settings.notificationInterval}
              onChange={(e) => onUpdateSettings({
                ...settings,
                notificationInterval: e.target.value as any,
              })}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-emerald font-sans font-bold"
            >
              <option value="5m">تنبيه تلقائي سريع (كل 5 دقائق)</option>
              <option value="30m">كل نصف ساعة (30 دقيقة)</option>
              <option value="1h">كل ساعة كاملة</option>
              <option value="6h">كل 6 ساعات</option>
              <option value="12h">كل 12 ساعة (نصف يوم)</option>
              <option value="24h">كل يوم (24 ساعة)</option>
              <option value="off">إيقاف التنبيهات التلقائية</option>
            </select>
          </div>

          {/* Browser / Device Native Notifications Permission Status */}
          <div className="p-4 rounded-xl border border-zinc-150 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-zinc-700 block">حالة إذن الإشعارات الرسمية للنظام (Web Notifications):</span>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                تسمح هذه الميزة للتطبيق بتذكيرك حتى عندما لا تستخدم التطبيق بنشاط.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {typeof window !== 'undefined' && 'Notification' in window ? (
                <>
                  {Notification.permission === 'granted' && (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      مفعلة ونشطة بالكامل على هاتفك ✅
                    </span>
                  )}
                  {Notification.permission === 'denied' && (
                    <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                      محظورة من المتصفح ❌ (يرجى السماح بها من الإعدادات)
                    </span>
                  )}
                  {Notification.permission === 'default' && (
                    <button
                      onClick={() => {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            showToast('تم تفعيل إشعارات النظام بنجاح!', 'success');
                          } else {
                            showToast('لم يتم منح الإذن بعد.', 'info');
                          }
                          // Refresh panel rendering
                          onUpdateSettings({ ...settings });
                        });
                      }}
                      className="px-3 py-1.5 bg-brand-gold hover:bg-brand-gold-light text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      طلب إذن التنبيهات المباشرة 🔔
                    </button>
                  )}
                </>
              ) : (
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  غير مدعومة على متصفحك الحالي ⚠️
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-brand-cream/20 rounded-xl border border-brand-cream/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-brand-emerald-dark block">جرب نظام الإشعارات فوراً</span>
              <span className="text-[10px] text-zinc-500 block">
                اضغط على الزر لمحاكاة ظهور إشعار بالفوائد المكتوبة.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (benefits.length > 0) {
                  const randomBenefit = benefits[Math.floor(Math.random() * benefits.length)];
                  if (Notification.permission === 'granted') {
                    try {
                      new Notification('فائدة مقيدة 💡', {
                        body: `${randomBenefit.title}\n${randomBenefit.content.substring(0, 80)}...`,
                      });
                    } catch (e) {
                      showToast(`💡 فائدة عشوائية: ${randomBenefit.title}`, 'success');
                    }
                  } else {
                    showToast(`💡 فائدة عشوائية: ${randomBenefit.title}`, 'success');
                  }
                } else {
                  showToast('لا توجد فوائد مقيدة لمحاكاتها!', 'warning');
                }
              }}
              className="px-3 py-1.5 bg-brand-emerald text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-brand-emerald-dark transition-all"
            >
              تجربة إشعار التذكير 🔔
            </button>
          </div>

          {/* PDF Export Section */}
          <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border border-brand-gold/30 bg-brand-cream/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-gold/10 pb-3 mb-1">
              <div className="space-y-1">
                <span className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                  <span className="p-1.5 bg-brand-gold/15 text-brand-gold-dark rounded-lg text-base">📄</span>
                  تصدير وطباعة الفوائد المقيدة كملف PDF
                </span>
                <p className="text-zinc-600 text-xs leading-relaxed">
                  اختر شكل ونوع التصدير المناسب لك، حيث يمكنك تصدير فوائدك على شكل جدول منظم أو كتاب علمي مطبوع ذو ترتيب عصري فريد.
                </p>
              </div>

              {isActivated ? (
                <span className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  شريك متميز - نشط بالكامل 🌟
                </span>
              ) : (
                <span className="self-start sm:self-center px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Lock className="w-4 h-4 text-amber-600" />
                  ميزة تتطلب التنشيط 🔐
                </span>
              )}
            </div>

            {/* Always Available Export Customizer Settings (lets users test/prepare) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">شكل التصدير وتنسيق الصفحات:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfStyle('grid')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      pdfStyle === 'grid'
                        ? 'bg-brand-emerald text-white border-brand-emerald shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span>📊 جدول منظم</span>
                    <span className="text-[10px] opacity-85 font-normal">أكاديمي مقسم في صفوف</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfStyle('book')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      pdfStyle === 'book'
                        ? 'bg-brand-emerald text-white border-brand-emerald shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span>📖 كتاب علمي</span>
                    <span className="text-[10px] opacity-85 font-normal">تنسيق الكتب والمؤلفات</span>
                  </button>
                </div>
              </div>

              {/* Cover toggle / generic config */}
              <div className="space-y-2 flex flex-col justify-end">
                {pdfStyle === 'book' ? (
                  <label className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-zinc-200/60 hover:bg-white cursor-pointer transition-all self-stretch">
                    <input
                      type="checkbox"
                      checked={includeCover}
                      onChange={(e) => setIncludeCover(e.target.checked)}
                      className="rounded border-zinc-300 text-brand-emerald focus:ring-brand-emerald"
                    />
                    <div className="text-right">
                      <span className="block text-xs font-bold text-zinc-800">إضافة غلاف للكتاب</span>
                      <span className="block text-[10px] text-zinc-500">تصميم غلاف تراثي أنيق باسمك واسم الكتاب</span>
                    </div>
                  </label>
                ) : (
                  <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-150 leading-relaxed self-stretch">
                    ℹ️ يتم تقسيم الفوائد في جدول A4 يمنع تداخل الكلمات ويحافظ على جودة قراءة الخط عند الطباعة.
                  </div>
                )}
              </div>

              {/* Customizable Book details */}
              <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-200/50">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700">عنوان الكتاب / التقرير المطبوع:</label>
                  <input
                    type="text"
                    value={pdfBookTitle}
                    onChange={(e) => setPdfBookTitle(e.target.value)}
                    placeholder="مثال: خزانة الفوائد السنية"
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-250 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-zinc-800 font-bold"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700">اسم كاتب وجامع الفوائد (المؤلف):</label>
                  <input
                    type="text"
                    value={pdfAuthorName}
                    onChange={(e) => setPdfAuthorName(e.target.value)}
                    onBlur={() => {
                      if (pdfAuthorName.trim() && pdfAuthorName !== settings.programmerName) {
                        onUpdateSettings({
                          ...settings,
                          programmerName: pdfAuthorName.trim(),
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="اسمك الكريم كمؤلف للكتاب"
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-250 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-zinc-800 font-bold"
                  />
                </div>
              </div>

              {/* Category Selection for Export */}
              <div className="col-span-1 sm:col-span-2 space-y-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-200/50 text-right">
                <label className="block text-xs font-bold text-zinc-700">تحديد نطاق التصدير:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: All categories */}
                  <button
                    type="button"
                    onClick={() => setPdfCategorySelect('all')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 justify-center ${
                      pdfCategorySelect === 'all'
                        ? 'bg-brand-emerald text-white border-brand-emerald shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span>📚 تصدير جميع الفوائد العلمية</span>
                  </button>

                  {/* Option 2: Specific category dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={pdfCategorySelect === 'all' ? '' : pdfCategorySelect}
                      onChange={(e) => {
                        if (e.target.value) {
                          setPdfCategorySelect(e.target.value);
                        } else {
                          setPdfCategorySelect('all');
                        }
                      }}
                      className={`w-full text-xs p-2.5 rounded-xl border font-bold focus:outline-none focus:ring-1 focus:ring-brand-gold text-right ${
                        pdfCategorySelect !== 'all'
                          ? 'bg-brand-emerald text-white border-brand-emerald'
                          : 'bg-white text-zinc-700 border-zinc-250'
                      }`}
                    >
                      <option value="" className="text-zinc-700 font-bold bg-white">📁 اختر قسماً محدداً فقط لتصديره...</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="text-zinc-700 font-bold bg-white">
                          قسم {cat} ({benefits.filter(b => b.category === cat).length} فائدة)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {pdfCategorySelect === 'all' ? (
                  <p className="text-[10px] text-zinc-500 leading-relaxed pt-1">
                    ✨ سيتم فرز وترتيب جميع الفوائد تلقائياً تحت اسم كل قسم بشكل مستقل وعريض، مع ترقيم متسلسل خاص يبدأ بـ (1) لكل قسم على حدة.
                  </p>
                ) : (
                  <p className="text-[10px] text-brand-emerald-dark font-bold leading-relaxed pt-1">
                    🎯 سيتم تصدير وطباعة فوائد <strong>قسم {pdfCategorySelect}</strong> فقط، مرقمة من الفائدة الأولى وحتى الأخيرة في هذا القسم.
                  </p>
                )}
              </div>
            </div>

            {/* Trial and Activation Status Board */}
            <div id="activation-section" className="p-4 rounded-xl border border-brand-gold/20 bg-white/70 space-y-3">
              {isActivated ? (
                <div className="text-xs text-emerald-800 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <span className="text-base">🌟</span>
                  <div>
                    <span className="font-bold block">ميزة التصدير نشطة بالكامل وغير محدودة!</span>
                    <span>يمكنك الآن طباعة وتصدير فوائدك بلا قيود وبأعلى جودة تراثية. شكراً لدعمك.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Trial status banner */}
                  {!freePdfUsed ? (
                    <div className="text-xs text-brand-emerald-dark bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-start gap-2">
                      <span className="text-lg">🎁</span>
                      <div className="space-y-0.5">
                        <span className="font-black block">محاولة تجريبية مجانية واحدة متاحة!</span>
                        <span>يمكنك تحميل وتصدير ملف الـ PDF لمرة واحدة <strong className="font-bold">مجاناً</strong> لتجربة جودة وأناقة الأغلفة والتنسيق التراثي قبل التفعيل.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div className="space-y-0.5">
                        <span className="font-black block">انتهت المحاولة المجانية لمرة واحدة!</span>
                        <span>لقد قمت بتحميل وتجربة التصدير مسبقاً. لاستئناف التصدير والتحميل المفتوح بجميع الأشكال والتحديثات المستقبلية، يرجى تفعيل رخصتك أدناه.</span>
                      </div>
                    </div>
                  )}

                  {/* Online Activation Area & Request keys */}
                  <div className="pt-3 border-t border-zinc-200/60 space-y-3">
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 justify-start">
                        <Key className="w-4 h-4 text-brand-gold" />
                        تفعيل رخصة التصدير والطباعة اللامحدودة:
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                        للحصول على كود تفعيل مخصص لشخص واحد، يرجى مراسلة الشيخ المطور بالضغط على الزر أدناه وسيتم تزويدك بمفتاح تفعيل فوراً عبر البريد الإلكتروني.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <a
                        href={`mailto:abuosid773@gmail.com?subject=طلب مفتاح تفعيل تطبيق جامع الفوائد&body=السلام عليكم ورحمة الله وبركاته،%0D%0A%0D%0Aأرجو من فضيلتكم تزويدي بمفتاح تفعيل لتطبيق (جامع الفوائد) لأتمكن من تصدير وطباعة تقارير وكتب الفوائد والمدونات العلمية بصيغة PDF.%0D%0A%0D%0Aولكم جزيل الشكر والتقدير.`}
                        className="px-4 py-2.5 bg-brand-cream text-brand-emerald-dark hover:bg-brand-cream/80 border border-brand-cream/35 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-brand-gold" />
                        <span>طلب مفتاح التفعيل عبر البريد 📧</span>
                      </a>

                      <div className="relative flex-1">
                        <input
                          type="password"
                          value={activationKey}
                          onChange={(e) => setActivationKey(e.target.value)}
                          placeholder="أدخل مفتاح التفعيل المستلم (ABU-OSID-XXXX-XXXX)"
                          className="w-full text-xs p-2.5 pr-8 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold text-zinc-850 font-mono font-bold tracking-wide"
                          disabled={isActivating}
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOnlineActivation}
                        disabled={isActivating}
                        className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-zinc-350 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {isActivating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري التفعيل...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>تفعيل الكود 🔑</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Submit Export Button with Trial Check */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-brand-gold/10">
              <div className="text-[10px] text-zinc-500 text-right">
                {!isActivated && !freePdfUsed && (
                  <span className="text-brand-emerald-dark font-bold">✨ سيتم استهلاك المحاولة التجريبية المجانية لمرة واحدة عند التحميل.</span>
                )}
                {!isActivated && freePdfUsed && (
                  <span className="text-rose-600 font-bold">❌ انتهت المحاولة المجانية. يرجى التفعيل للتحميل.</span>
                )}
                {isActivated && (
                  <span className="text-emerald-700 font-bold">🟢 التصدير نشط وغير محدود مدى الحياة.</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (benefits.length === 0) {
                    showToast('لا توجد مدونات علمية لتصديرها! يرجى إضافة فائدة أولاً.', 'warning');
                    return;
                  }

                  if (!isActivated && freePdfUsed) {
                    showToast('عذراً، لقد استنفدت محاولتك المجانية لمرة واحدة. يرجى تفعيل رخصة التصدير للاستخدام اللامحدود. 🔒', 'warning');
                    if (onShowPremiumPromo) onShowPremiumPromo();
                    return;
                  }

                  // Perform PDF Generation
                  exportBenefitsToPDF(benefits, pdfStyle, pdfBookTitle, pdfAuthorName, settings.programmerEmail, includeCover, pdfCategorySelect);
                  
                  if (!isActivated && !freePdfUsed) {
                    // Consume the free trial
                    localStorage.setItem('abuosid_free_pdf_used', 'true');
                    setFreePdfUsed(true);
                    showToast('تم تصدير ملف الـ PDF بنجاح واستهلاك المحاولة المجانية لمرة واحدة. للتصدير مجدداً يرجى التفعيل. 🎉', 'success');
                  } else {
                    showToast('جاري تحضير ملف PDF وتوليده بنجاح للطباعة... 📥', 'success');
                  }
                }}
                disabled={!isActivated && freePdfUsed}
                className={`px-6 py-3 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto hover:scale-[1.01] active:scale-[0.99] ${
                  (!isActivated && freePdfUsed)
                    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                    : 'bg-brand-gold hover:bg-brand-gold-light text-white'
                }`}
              >
                <Download className="w-4 h-4 text-white" />
                <span>تحميل وتوليد ملف الـ PDF 📥</span>
              </button>
            </div>
          </div>

          {/* Automatic Backup Interval Settings */}
          <div className="col-span-1 md:col-span-2 p-4 rounded-xl border border-zinc-150 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            
            <div className="space-y-1 z-10">
              <span className="font-bold text-zinc-850 text-sm block flex items-center gap-1.5 flex-wrap">
                <span>النسخ الاحتياطي التلقائي (اختياري):</span>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-brand-emerald-dark text-[10px] font-black rounded-full flex items-center gap-0.5 whitespace-nowrap">
                  ✨ مجاني محلياً بالكامل
                </span>
                {!isActivated && (
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-0.5 whitespace-nowrap">
                    ☁️ السحابي (يتطلب تفعيل) 🔒
                  </span>
                )}
              </span>
              <p className="text-zinc-500 text-xs leading-relaxed">
                حدد موعداً ومكان حفظ نسخك الاحتياطية تلقائياً (محلياً أو سحابياً) لحماية كتاباتك من الضياع أو الحذف العرضي.
              </p>
            </div>
            
            <div className="z-10 shrink-0 flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* Backup Location Selection */}
              <select
                value={settings.backupType || 'local'}
                onChange={(e) => {
                  const updatedVal = e.target.value as any;
                  if (updatedVal === 'cloud' && !isActivated) {
                    showToast('تنبيه: النسخ السحابي التلقائي والربط بالدرايف يتطلب تفعيل كود النسخة الذهبية 👑', 'warning');
                  }
                  const updated = {
                    ...settings,
                    backupType: updatedVal
                  };
                  onUpdateSettings(updated);
                  setBackupTab(updatedVal);
                  
                  if (updatedVal === 'local') {
                    showToast('تم تفعيل حفظ النسخ التلقائية محلياً على ذاكرة الهاتف بنجاح! 📱📁', 'success');
                  } else {
                    showToast('تم ضبط وتفعيل النسخ الاحتياطي والرفع السحابي التلقائي (Firebase / Drive) بنجاح! ☁️✅', 'success');
                  }
                }}
                className="px-3 py-2 rounded-xl border text-xs font-sans font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand-emerald w-full sm:w-auto bg-white text-zinc-700 border-zinc-200 cursor-pointer hover:bg-zinc-50"
              >
                <option value="local">📁 حفظ محلي (على ذاكرة الجهاز)</option>
                <option value="cloud">☁️ ربط بالدرايف والنسخ السحابي تلقائياً</option>
              </select>

              {/* Backup Interval Selection */}
              <select
                value={settings.autoBackupInterval || 'off'}
                onChange={(e) => {
                  const updatedVal = e.target.value as any;
                  const updated = {
                    ...settings,
                    autoBackupInterval: updatedVal
                  };
                  onUpdateSettings(updated);
                  
                  if (updatedVal !== 'off') {
                    const isLocal = (settings.backupType || 'local') === 'local';
                    if (isLocal) {
                      showToast('تم ضبط النسخ التلقائي لحفظ سجلاتك محلياً على ذاكرة الهاتف بنجاح! 📱📁', 'success');
                    } else {
                      showToast('تم ضبط النسخ التلقائي للرفع والحفظ سحابياً بنجاح! ☁️✅', 'success');
                    }
                    
                    if (triggerAutoBackup) {
                      // Trigger an immediate backup to initialize the list
                      triggerAutoBackup('manual');
                      // Update current history rendering immediately
                      setTimeout(() => {
                        const saved = localStorage.getItem('abuosid_backups_history');
                        if (saved) setBackupsHistory(JSON.parse(saved));
                      }, 500);
                    }
                  } else {
                    showToast('تم إيقاف النسخ الاحتياطي التلقائي.', 'info');
                  }
                }}
                className="px-3 py-2 rounded-xl border text-xs font-sans font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand-emerald w-full sm:w-auto bg-white text-zinc-700 border-zinc-200 cursor-pointer hover:bg-zinc-50"
              >
                <option value="on_change">نسخ تلقائي فوري (عند إضافة أو تعديل أي فائدة)</option>
                <option value="daily">نسخ تلقائي دوري كل يوم (عند تشغيل التطبيق)</option>
                <option value="on_exit">نسخ تلقائي عند مغادرة التطبيق أو الخروج 🚪</option>
                <option value="off">إيقاف النسخ الاحتياطي التلقائي</option>
              </select>
            </div>
          </div>

          {/* Local Phone Backup */}
          <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/40 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-800">تصدير واستيراد ملف يدوي (.json)</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                قم بتنزيل ملف النسخة الاحتياطية على جهازك أو استرجاع بياناتك السابقة عبر رفع الملف في أي وقت.
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100">
              <button
                onClick={handleExportLocal}
                className="flex-1 py-2 text-xs font-bold bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-brand-gold-light" />
                <span>تصدير الملف 📤</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 text-xs font-bold bg-white hover:bg-zinc-50 text-brand-emerald border border-brand-emerald/40 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع واستعادة 📥</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportLocal}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Real Secure Cloud Backup */}
          <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/40 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-800">النسخ الاحتياطي السحابي (Firebase) ☁️</h4>
                {isActivated ? (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    نشط ومزامن مع سحابة Firebase 🟢
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    النسخة الذهبية المميزة 👑
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                يدعم التطبيق النسخ الاحتياطي السحابي التلقائي واليدوي فائق الأمان والسرعة والاستقرار عبر قاعدة بيانات <b>Firebase Firestore</b> السحابية المخصصة (مستقرة 100% ومستقلة لتفادي قيود المتصفحات والأمان).
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-zinc-100 z-10 space-y-2">
              {isActivated ? (
                <button
                  onClick={handleCloudBackup}
                  disabled={isDriveSyncing}
                  className="w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-brand-emerald hover:bg-brand-emerald-light text-white shadow-sm hover:shadow active:scale-[0.98] duration-150"
                >
                  {isDriveSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-brand-gold-light" />
                  )}
                  <span>
                    {isDriveSyncing ? 'جاري رفع النسخة الاحتياطية...' : 'حفظ ومزامنة نسخة احتياطية سحابية فورية (Firebase) ☁️'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    showToast('النسخ الاحتياطي السحابي ميزة خاصة بالنسخة الذهبية المميزة 👑', 'warning');
                    const section = document.getElementById('activation-section');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-zinc-200 hover:bg-zinc-250 text-zinc-500 border border-zinc-300 shadow-sm active:scale-[0.98] duration-150"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>تفعيل النسخة الذهبية للنسخ الاحتياطي السحابي الفوري 🔒</span>
                </button>
              )}

              {lastDriveSync && (
                <p className="text-[10px] text-zinc-400 text-center mt-1.5 font-sans">
                  آخر مزامنة ناجحة: اليوم في {lastDriveSync}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Backups History and Restore Manager */}
        <div className="mt-5 pt-4 border-t border-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-zinc-150 pb-2">
            <h4 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>🗄️ مدير واسترجاع النسخ الاحتياطية:</span>
            </h4>

            {/* Tabs Selector */}
            <div className="flex bg-zinc-100 p-1 rounded-xl text-[10px] font-bold font-sans self-start">
              <button
                type="button"
                onClick={() => setBackupTab('local')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  backupTab === 'local'
                    ? 'bg-white text-zinc-850 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                📁 النسخ المحلية ({backupsHistory.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isActivated && !driveConnected) {
                    showToast('عرض النسخ الاحتياطية السحابية متاح للنسخة المفعلة 🔑 أو عند ربط حساب جوجل درايف مجاناً! ☁️', 'warning');
                    return;
                  }
                  setBackupTab('cloud');
                  fetchCloudBackups();
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  backupTab === 'cloud'
                    ? 'bg-brand-emerald text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                ☁️ النسخ السحابية ({cloudBackups.length})
                {(!isActivated && !driveConnected) && <span className="text-[10px]">🔒</span>}
              </button>
            </div>
          </div>

          {backupTab === 'local' ? (
            /* Render Local Backups */
            backupsHistory.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">لا توجد نسخ احتياطية محلية محفوظة حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {backupsHistory.map((historyItem) => {
                  const dateObj = new Date(historyItem.timestamp);
                  const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                  const formattedDate = formatToHijriAndGregorian(
                    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
                  ).split(' - ')[0]; // Just the Hijri date for layout space

                  let triggerLabel = 'يدوي';
                  let triggerColor = 'bg-zinc-100 text-zinc-700 border-zinc-200';
                  if (historyItem.trigger === 'on_change') {
                    triggerLabel = 'تلقائي عند التحديث';
                    triggerColor = 'bg-sky-50 text-sky-800 border-sky-100';
                  } else if (historyItem.trigger === 'daily') {
                    triggerLabel = 'يومي دوري';
                    triggerColor = 'bg-amber-50 text-amber-800 border-amber-100';
                  } else if (historyItem.trigger === 'on_exit') {
                    triggerLabel = 'عند مغادرة التطبيق';
                    triggerColor = 'bg-purple-50 text-purple-800 border-purple-100';
                  }

                  return (
                    <div
                      key={historyItem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors text-xs gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 ${triggerColor}`}>
                          {triggerLabel}
                        </span>
                        <div className="text-right">
                          <span className="font-sans font-bold text-zinc-700 block text-xs leading-none mb-1">{formattedDate} ({timeStr})</span>
                          <span className="text-[10px] text-zinc-400">
                            تحتوي على {historyItem.benefitsCount} فائدة و {historyItem.queriesCount} استشكال
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onRestoreBackup) {
                              requestConfirm('استعادة النسخة المحلية 🔄', 'تنبيه: هل أنت متأكد من استرجاع هذه النسخة بالكامل؟ سيتم استبدال جميع السجلات الحالية بسجلات هذه النسخة.', () => {
                                const ok = onRestoreBackup(historyItem.data);
                                if (ok) {
                                  showToast('تم استعادة بيانات النسخة المختارة بنجاح!', 'success');
                                }
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-lg font-bold transition-colors cursor-pointer text-[10px]"
                        >
                          استعادة هذه النسخة 🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            requestConfirm('حذف النسخة 🗑️', 'هل تريد حذف هذه النسخة الاحتياطية من السجل؟', () => {
                              const updatedHistory = backupsHistory.filter(h => h.id !== historyItem.id);
                              localStorage.setItem('abuosid_backups_history', JSON.stringify(updatedHistory));
                              setBackupsHistory(updatedHistory);
                              showToast('تم حذف النسخة الاحتياطية من السجل.', 'info');
                            });
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف النسخة"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Render Cloud Backups */
            isLoadingCloudBackups ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <RefreshCw className="w-5 h-5 text-brand-emerald animate-spin" />
                <span className="text-xs text-zinc-400">جاري تحميل النسخ السحابية من الخادم الآمن...</span>
              </div>
            ) : cloudBackups.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">لا توجد نسخ احتياطية سحابية محفوظة حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cloudBackups.map((historyItem) => {
                  const dateObj = new Date(historyItem.timestamp);
                  const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                  const formattedDate = formatToHijriAndGregorian(
                    `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
                  ).split(' - ')[0]; // Just the Hijri date for layout space

                  let triggerLabel = 'يدوي سحابي';
                  let triggerColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                  if (historyItem.trigger === 'on_change') {
                    triggerLabel = 'سحابي عند التحديث';
                    triggerColor = 'bg-sky-50 text-sky-800 border-sky-100';
                  } else if (historyItem.trigger === 'daily') {
                    triggerLabel = 'سحابي يومي دوري';
                    triggerColor = 'bg-amber-50 text-amber-800 border-amber-100';
                  } else if (historyItem.trigger === 'on_exit') {
                    triggerLabel = 'سحابي عند المغادرة';
                    triggerColor = 'bg-purple-50 text-purple-800 border-purple-100';
                  }

                  return (
                    <div
                      key={historyItem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50/20 transition-colors text-xs gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 ${triggerColor}`}>
                          {triggerLabel}
                        </span>
                        <div className="text-right">
                          <span className="font-sans font-bold text-zinc-700 block text-xs leading-none mb-1">{formattedDate} ({timeStr})</span>
                          <span className="text-[10px] text-zinc-400">
                            تحتوي على {historyItem.benefitsCount} فائدة و {historyItem.queriesCount} استشكال
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            if (onRestoreBackup) {
                              requestConfirm(
                                historyItem.isFirebase 
                                  ? 'استعادة من سحابة Firebase ☁️🔄' 
                                  : historyItem.isGoogleDrive 
                                    ? 'استعادة من جوجل درايف ☁️🔄' 
                                    : 'استعادة النسخة السحابية ☁️🔄',
                                historyItem.isFirebase
                                  ? 'تنبيه: هل أنت متأكد من استرجاع هذه النسخة بالكامل من سحابة Firebase؟ سيتم استبدال جميع السجلات الحالية.'
                                  : historyItem.isGoogleDrive 
                                    ? 'تنبيه: هل أنت متأكد من استرجاع هذه النسخة بالكامل من حساب جوجل درايف الخاص بك؟ سيتم استبدال جميع السجلات الحالية.'
                                    : 'تنبيه: هل أنت متأكد من استرجاع هذه النسخة السحابية بالكامل؟ سيتم استبدال جميع السجلات الحالية بسجلات هذه النسخة السحابية.',
                                async () => {
                                  try {
                                    let backupDataStr = historyItem.data;
                                    if (historyItem.isGoogleDrive) {
                                      const googleToken = localStorage.getItem('abuosid_google_access_token') || '';
                                      showToast('جاري تحميل ملف النسخة الاحتياطية من جوجل درايف الخاص بك...', 'info');
                                      backupDataStr = await downloadFromGoogleDrive(googleToken, historyItem.id);
                                    }
                                    const ok = onRestoreBackup(backupDataStr);
                                    if (ok) {
                                      showToast('تم استعادة بيانات النسخة بنجاح! 🎉', 'success');
                                    }
                                  } catch (err) {
                                    console.error('Failed to restore cloud backup:', err);
                                    showToast('فشل تحميل واستعادة النسخة الاحتياطية السحابية.', 'warning');
                                  }
                                }
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer text-[10px]"
                        >
                          استعادة سحابية 🔄
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            requestConfirm(
                              historyItem.isGoogleDrive ? 'حذف من جوجل درايف 🗑️' : 'حذف نسخة سحابية 🗑️',
                              historyItem.isGoogleDrive 
                                ? 'هل تريد حذف هذا الملف الاحتياطي نهائياً من حساب جوجل درايف الخاص بك؟'
                                : 'هل تريد حذف هذه النسخة السحابية نهائياً من الخادم؟',
                              async () => {
                                if (historyItem.isGoogleDrive) {
                                  const googleToken = localStorage.getItem('abuosid_google_access_token') || '';
                                  try {
                                    showToast('جاري حذف الملف من جوجل درايف...', 'info');
                                    await deleteFromGoogleDrive(googleToken, historyItem.id);
                                    showToast('تم حذف النسخة الاحتياطية بنجاح من جوجل درايف.', 'success');
                                    fetchCloudBackups();
                                  } catch (err) {
                                    console.error('Failed to delete from google drive:', err);
                                    showToast('فشل حذف النسخة من جوجل درايف.', 'warning');
                                  }
                                  return;
                                }

                                if (historyItem.isFirebase) {
                                  try {
                                    showToast('جاري حذف الملف من سحابة Firebase...', 'info');
                                    await deleteBackupFromFirebase(historyItem.id);
                                    showToast('تم حذف النسخة الاحتياطية بنجاح من Firebase.', 'success');
                                    fetchCloudBackups();
                                  } catch (err) {
                                    console.error('Failed to delete from Firebase:', err);
                                    showToast('فشل حذف النسخة من Firebase.', 'warning');
                                  }
                                  return;
                                }

                                const key = localStorage.getItem('abuosid_activation_key') || '';
                                if (!key) return;
                                try {
                                  const response = await fetch(getApiUrl('/api/backup/delete'), {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ code: key, email: userEmail, backupId: historyItem.id }),
                                  });
                                  const data = await response.json();
                                  if (response.ok && data.success) {
                                    showToast('تم حذف النسخة السحابية بنجاح من الخادم.', 'success');
                                    fetchCloudBackups();
                                  } else {
                                    showToast(data.message || 'فشل حذف النسخة السحابية.', 'warning');
                                  }
                                } catch (err) {
                                  showToast('خطأ اتصال بالخادم أثناء حذف النسخة السحابية.', 'warning');
                                }
                              }
                            );
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف النسخة من الخادم"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* 3. Mobile PWA Installation Guidelines */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 custom-shadow">
        <h3 className="text-base font-bold text-brand-emerald-dark border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-brand-gold" />
          تثبيت تطبيق جامع الفوائد على هاتفك
        </h3>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Visual Phone App Mockup */}
          <div className="relative flex flex-col items-center shrink-0 p-4 bg-brand-cream/15 rounded-2xl border border-brand-cream/30 w-full md:w-56 text-center select-none">
            <div className="absolute top-2 right-2 text-[9px] bg-brand-gold/15 text-brand-emerald-dark px-2 py-0.5 rounded-full font-bold">
              إيقونة التطبيق الرسمية
            </div>
            
            {/* Phone Frame App Icon Simulation */}
            <div className="relative group mt-4 mb-3">
              <div className="absolute inset-0 bg-brand-gold/20 rounded-3xl blur-md scale-105 group-hover:blur-lg transition-all" />
              <AppLogo className="w-24 h-24 relative" animate={true} />
            </div>
            
            <span className="text-sm font-black text-brand-emerald-dark">جامع الفوائد</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">تطبيق ويب تقدمي (PWA)</span>
            
            <button
              onClick={handleCopyLink}
              className="mt-4 w-full py-2 bg-brand-cream/60 hover:bg-brand-cream text-brand-emerald-dark text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-brand-cream/30"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" /> : <Copy className="w-3.5 h-3.5 text-brand-gold" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق لهاتفك'}</span>
            </button>
          </div>

          {/* Installation steps */}
          <div className="flex-1 space-y-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              يدعم هذا التطبيق التثبيت المباشر والمستقر على شاشة هاتفك كـ <strong className="text-brand-emerald font-bold">تطبيق ويب تقدمي (PWA)</strong>. يعمل بالكامل وبكفاءة عالية وموفر لمساحة تخزين الهاتف، دون الحاجة لتحميل ملفات APK الخارجية التي تطلب صلاحيات قد تؤثر على أمان وسلاسة هاتفك.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Android Steps */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2 mb-2 text-brand-emerald border-b border-zinc-200/50 pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-cream text-brand-emerald flex items-center justify-center text-xs font-bold">أ</span>
                  <span className="text-xs font-bold">لأجهزة أندرويد (Google Chrome)</span>
                </div>
                <ul className="text-[11px] text-zinc-600 space-y-2 leading-relaxed">
                  <li>١. افتح رابط التطبيق في متصفح <strong className="text-zinc-800">Google Chrome</strong> على هاتفك.</li>
                  <li>٢. اضغط على زر القائمة <strong className="text-zinc-800">(︙)</strong> أعلى يسار الشاشة.</li>
                  <li>٣. اختر <strong className="text-brand-emerald">إضافة إلى الشاشة الرئيسية</strong> أو <strong className="text-brand-emerald">تثبيت التطبيق</strong> لتأكيد التثبيت.</li>
                </ul>
              </div>

              {/* iOS Steps */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2 mb-2 text-brand-emerald border-b border-zinc-200/50 pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-cream text-brand-emerald flex items-center justify-center text-xs font-bold">آي</span>
                  <span className="text-xs font-bold">لأجهزة آيفون وآيباد (Safari)</span>
                </div>
                <ul className="text-[11px] text-zinc-600 space-y-2 leading-relaxed">
                  <li>١. افتح رابط التطبيق في متصفح <strong className="text-zinc-800">Safari</strong> الخاص بجهازك.</li>
                  <li>٢. اضغط على أيقونة <strong className="text-zinc-800">المشاركة (📤)</strong> أسفل شاشة المتصفح.</li>
                  <li>٣. اسحب القائمة لأسفل واختر <strong className="text-brand-emerald">إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Benefits of PWA over APK */}
            <div className="text-[10px] text-zinc-500 bg-brand-cream/15 p-3 rounded-lg border border-brand-cream/30 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
              <div>🔒 آمن بالكامل ويحمي خصوصيتك</div>
              <div>⚡️ سرعة خارقة في التصفح والولوج</div>
              <div>💾 يدعم وضع عدم الاتصال (Offline)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5. Admin Key Management Control Panel */}
      <div className="bg-white rounded-2xl border-2 border-brand-gold/20 p-5 custom-shadow space-y-4">
        <button
          type="button"
          onClick={() => setShowAdminSection(!showAdminSection)}
          className="w-full text-right flex items-center justify-between group cursor-pointer focus:outline-none"
        >
          <div className="space-y-1 text-right">
            <h3 className="text-base font-bold text-brand-emerald-dark flex items-center gap-2">
              <span className="p-1.5 bg-brand-gold/10 text-brand-gold-dark rounded-lg text-base">🔑</span>
              لوحة تحكم المشرف وتوليد الرموز (خاصة بالشيخ المطور)
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              خاص بمشرف ومطور البرنامج لتوليد وحذف رموز التفعيل المخصصة لشخص واحد ومتابعة الأجهزة النشطة.
            </p>
          </div>
          <span className="text-zinc-400 group-hover:text-brand-gold transition-colors text-sm font-bold">
            {showAdminSection ? '▲ إغلاق اللوحة' : '▼ فتح لوحة التحكم'}
          </span>
        </button>

        <AnimatePresence>
          {showAdminSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-zinc-100 pt-4 space-y-4"
            >
              {!isAdminLoggedIn ? (
                /* Admin Login Form */
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 max-w-md mx-auto space-y-3">
                  <div className="text-center space-y-1">
                    <span className="text-2xl">🔐</span>
                    <h4 className="text-xs font-bold text-zinc-800">بوابة الدخول الآمن للإدارة</h4>
                    <p className="text-[10px] text-zinc-400">الرجاء إدخال كلمة مرور الإدارة لتوليد مفاتيح التفعيل المخصصة.</p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="أدخل كلمة مرور الإدارة هنا"
                      className="w-full text-center text-xs p-2.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold text-zinc-800 font-bold"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminLogin();
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAdminLogin}
                      className="w-full py-2 bg-brand-gold hover:bg-brand-gold-light text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      تسجيل دخول المشرف 🔑
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Admin Control Dashboard */
                <div className="space-y-4 font-sans text-right">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-cream/15 p-4 rounded-xl border border-brand-cream/35">
                    <div className="space-y-1 text-right w-full sm:w-auto">
                      <span className="text-xs font-bold text-zinc-800 block">أهلاً بك يا طالب العلم في نظام الإدارة الفوري 🌟</span>
                      <span className="text-[10px] text-brand-emerald-dark block font-sans">أنت الآن متصل مباشرة بقاعدة البيانات السحابية الآمنة للمفاتيح.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminLoggedIn(false);
                        setAdminKeysList({});
                        setAdminPasswordInput('');
                        showToast('تم تسجيل الخروج بنجاح من لوحة المشرف.', 'info');
                      }}
                      className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      تسجيل خروج 🚪
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Visitor Stats */}
                    <div className="p-3.5 rounded-xl bg-brand-cream/10 border border-brand-cream/40 text-center space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-zinc-500 font-bold block">👥 إجمالي الزوار للمنصة</span>
                      <span className="text-xl font-black text-zinc-800 font-mono">
                        {adminStats?.totalVisitors ?? 0}
                      </span>
                    </div>

                    {/* Subscriber Stats */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-amber-800 font-bold block">⭐ المشتركين الفعليين</span>
                      <span className="text-xl font-black text-amber-700 font-mono">
                        {adminStats?.totalSubscribers ?? 0}
                      </span>
                    </div>

                    {/* Total Keys */}
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 font-bold block">🔑 مجموع المفاتيح</span>
                      <span className="text-xl font-black text-zinc-800 font-mono">
                        {Object.keys(adminKeysList).length}
                      </span>
                    </div>

                    {/* Ready/Free Keys */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center space-y-1">
                      <span className="text-[10px] text-emerald-800 font-bold block">🟢 جاهزة للتسليم</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">
                        {(Object.values(adminKeysList) as any[]).filter(k => !k.used).length}
                      </span>
                    </div>

                    {/* Used/Activated Keys */}
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center space-y-1">
                      <span className="text-[10px] text-rose-800 font-bold block">🔴 مفاتيح مستخدمة</span>
                      <span className="text-xl font-black text-rose-700 font-mono">
                        {(Object.values(adminKeysList) as any[]).filter(k => k.used).length}
                      </span>
                    </div>
                  </div>

                  {/* Database Persistence Explanation Alert */}
                  <div className="p-3 bg-brand-emerald/5 border border-brand-emerald/15 rounded-xl text-[10px] text-zinc-600 space-y-1 leading-relaxed">
                    <div className="font-bold text-brand-emerald-dark flex items-center gap-1">
                      <span>🔄 نظام المزامنة والتحفيظ المستمر (Persistent & Cloud Database Sync):</span>
                    </div>
                    <div>
                      يتم تخزين جميع إحصائيات زوار ومشركي تطبيق <strong>جامع الفوائد</strong> بشكل مزدوج وتلقائي: سحابياً على خادم التطبيق لضمان ثباتها الدائم وعدم تصفيرها أبداً عند إغلاق المتصفح أو إطفاء الهاتف، ومحلياً عبر <strong>LocalStorage / Cache Engine</strong> لسرعة التشغيل الفوري والتصفح في وضع عدم الاتصال (Offline).
                    </div>
                  </div>

                  {/* Generate Key Section */}
                  <div className="p-4 rounded-xl border border-brand-gold/25 bg-zinc-50/50 space-y-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-800 block">➕ توليد مفتاح تفعيل جديد لشخص واحد (صالح للاستخدام لمرة واحدة):</span>
                      <span className="text-[10px] text-zinc-400 block">اكتب اسم المستفيد لتوثيقه على النظام قبل نسخ المفتاح وإرساله له.</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newKeyNote}
                        onChange={(e) => setNewKeyNote(e.target.value)}
                        placeholder="مثال: رخصة الشيخ صالح الفوزان أو طالب العلم أحمد..."
                        className="flex-1 text-xs p-2.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold text-zinc-800 font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleGenerateKey();
                        }}
                      />

                      <button
                        type="button"
                        onClick={handleGenerateKey}
                        disabled={isGeneratingKey}
                        className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        {isGeneratingKey ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري التوليد...</span>
                          </>
                        ) : (
                          <>
                            <span>صنع وتوليد الرمز 🔑</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Change Admin Password Section */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                      className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer focus:outline-none"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>⚙️ تغيير كلمة مرور الإدارة الحالية (طالب العلم)</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">
                        {showChangePasswordForm ? '▲ إغلاق النموذج' : '▼ فتح النموذج'}
                      </span>
                    </button>

                    {showChangePasswordForm && (
                      <div className="space-y-3 pt-2 border-t border-zinc-200/60 transition-all">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">
                            تحديث كلمة مرور الدخول للوحة الإدارة. الرجاء اختيار كلمة مرور قوية لتأمين المفاتيح.
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور الجديدة (4 أحرف فأكثر)"
                            className="flex-1 text-xs p-2.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold text-zinc-800 font-bold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleChangeAdminPassword();
                            }}
                          />

                          <button
                            type="button"
                            onClick={handleChangeAdminPassword}
                            disabled={isChangingPassword}
                            className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            {isChangingPassword ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري التحديث...</span>
                              </>
                            ) : (
                              <span>تحديث كلمة المرور 🔐</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* List of keys on server */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-700 block">📋 قائمة الرموز المسجلة حالياً على الخادم:</span>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-zinc-200/60 p-2 rounded-xl bg-white/50">
                      {Object.keys(adminKeysList).length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 py-4 font-sans">لا توجد رموز مسجلة حالياً في قاعدة البيانات.</p>
                      ) : (
                        (Object.entries(adminKeysList) as [string, any][]).map(([keyString, info]) => (
                          <div
                            key={keyString}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 transition-colors text-xs gap-2.5"
                          >
                            <div className="space-y-1 flex-1 text-right w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-brand-emerald-dark tracking-wide bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-xs">
                                  {keyString}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      navigator.clipboard.writeText(keyString);
                                      showToast('تم نسخ مفتاح التفعيل بنجاح لحافظة جهازك!', 'success');
                                    } catch (err) {
                                      showToast('فشل في النسخ التلقائي.', 'warning');
                                    }
                                  }}
                                  className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                                  title="نسخ الكود"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                                <span className="font-bold text-zinc-700">👤 المستفيد:</span>
                                <span>{info.note || 'مفتاح مخصص'}</span>
                                {info.createdAt && (
                                  <>
                                    <span className="text-zinc-300">|</span>
                                    <span>صُنع بتاريخ: {new Date(info.createdAt).toLocaleDateString('ar-SA')}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Status indicator */}
                            <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                              {info.used ? (
                                <div className="text-[10px] text-right text-rose-700 bg-rose-50 border border-rose-100 p-1.5 rounded-lg leading-relaxed flex flex-col">
                                  <span className="font-bold text-center">🔴 تم استخدامه</span>
                                  {info.activatedAt && (
                                    <span className="text-[8px] opacity-80">
                                      في: {new Date(info.activatedAt).toLocaleString('ar-SA')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg shrink-0">
                                  🟢 نشط وجاهز
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteKey(keyString)}
                                disabled={isDeletingKey === keyString}
                                className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                title="حذف الرمز نهائياً"
                              >
                                {isDeletingKey === keyString ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <span>🗑️</span>
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Reset database button */}
                  <div className="pt-3 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>* جميع العمليات تتم مباشرة عبر قاعدة البيانات السحابية.</span>
                    <button
                      type="button"
                      onClick={handleResetKeys}
                      className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                    >
                      إعادة تهيئة المفاتيح الافتراضية ⚠️
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Developer and App Information */}
      <div className="bg-gradient-to-l from-brand-emerald-dark to-brand-emerald rounded-2xl p-6 text-white border border-brand-gold/20 custom-shadow">
        <h3 className="text-base font-bold text-brand-gold-light border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-gold-light" />
          معلومات التطبيق والمبرمج المعتمد
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3 font-sans">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10 text-brand-gold-light shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">اسم مطور البرنامج</p>
                <p className="text-sm font-bold text-white">أبو أُسيد</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/10 text-brand-gold-light shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">البريد الإلكتروني للتواصل والدعم العلمي</p>
                <a href="mailto:abuosid773@gmail.com" className="text-sm font-bold text-white hover:text-brand-gold-light transition-colors underline">
                  abuosid773@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2.5 text-right font-sans">
            <div className="flex items-center gap-1.5 text-brand-gold-light text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>حقوق التدوين والملكية</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans">
              هذا التطبيق مخصص للطلبة والباحثين لتقييد وتدوين وحل الفوائد والاستشكالات العلمية، ومصمم ليوفر أعلى سبل الراحة والخصوصية على الهواتف والأجهزة الذكية.
            </p>
            <div className="text-[10px] text-zinc-300 pt-1.5 border-t border-white/5 flex items-center justify-between">
              <span>الإصدار الحالي: v1.0.0</span>
              <span>بكل فخر بالوطن العربي 🇾🇪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 font-sans" id="custom-confirm-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right border border-zinc-200 shadow-2xl space-y-4 relative">
            <h4 className="text-sm font-black text-zinc-900 border-b border-zinc-150 pb-2 flex items-center gap-2">
              <span>{confirmModal.title}</span>
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed font-bold">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                إلغاء ❌
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-brand-emerald hover:bg-brand-emerald-dark text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                تأكيد ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
