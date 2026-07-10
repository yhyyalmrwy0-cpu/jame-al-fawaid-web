import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Sparkles, BookOpen, Cloud, Share2, Check, X, Key, Camera } from 'lucide-react';

const ENCRYPT_MAP: Record<string, string> = {
  'A': 'X', 'B': 'Y', 'C': 'Z', 'D': 'W', 'E': 'V', 'F': 'U', 'G': 'T', 'H': 'S', 'I': 'R', 'J': 'Q',
  'K': 'P', 'L': 'O', 'M': 'N', 'N': 'M', 'O': 'L', 'P': 'K', 'Q': 'J', 'R': 'I', 'S': 'H', 'T': 'G',
  'U': 'F', 'V': 'E', 'W': 'D', 'X': 'C', 'Y': 'B', 'Z': 'A',
  '0': '9', '1': '8', '2': '7', '3': '6', '4': '5', '5': '4', '6': '3', '7': '2', '8': '1', '9': '0'
};

function getOrCreateDeviceSeed(): string {
  if (typeof window === 'undefined') return 'SEED2026';
  let seed = localStorage.getItem('abuosid_device_seed');
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem('abuosid_device_seed', seed);
  }
  return seed;
}

function getEncryptedRequestCode(seed: string): string {
  const encrypted = seed.split('').map(char => {
    const upper = char.toUpperCase();
    return ENCRYPT_MAP[upper] || char;
  }).join('');
  return `REQ-${encrypted}`;
}

interface PremiumPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export const PremiumPromoModal: React.FC<PremiumPromoModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('abuosid773@gmail.com');
    showToast('تم نسخ بريد المطور بنجاح للتواصل! 📧', 'success');
  };

  const seed = getOrCreateDeviceSeed();
  const requestCode = getEncryptedRequestCode(seed);
  const emailSubject = 'طلب تفعيل تطبيق جامع الفوائد عبر الرمز المشفر';
  const emailBody = `السلام عليكم ورحمة الله وبركاته،

أرجو منكم تزويدي بمفتاح التفعيل لتطبيق (جامع الفوائد).

الرمز المشفر المخصص لجهازي هو: ${requestCode}

ولكم جزيل الشكر والتقدير.`;

  const mailtoUrl = `mailto:abuosid773@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-xl md:max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-right font-sans border-2 border-brand-gold/45 shadow-2xl relative"
        >
          {/* Header Accent Decorator */}
          <div className="bg-gradient-to-l from-brand-emerald-dark via-brand-emerald to-brand-emerald-dark p-6 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1 rounded-full bg-black/20 hover:bg-black/30 transition-all text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Sparkles className="w-6 h-6 text-brand-gold-light animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black font-sans leading-none">مزايا النسخة الاحترافية (الذهبية) 🌟</h3>
                <p className="text-xs text-zinc-200 mt-1.5 font-medium">افتح الإمكانات الكاملة لتطبيق جامع الفوائد</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
              شكرًا لاهتمامك ببرنامج <span className="text-brand-emerald font-bold">جامع الفوائد</span>! الترقية للنسخة الاحترافية تدعم استمرار تطوير التطبيق وتفتح لك باقة من المزايا الحصرية المصممة لطلاب العلم والباحثين:
            </p>

            {/* Features List */}
            <div className="space-y-4 pr-1">
              {/* Feature 1: OCR */}
              <div className="flex gap-3 items-start bg-brand-cream/15 p-3 rounded-2xl border border-brand-cream/30">
                <div className="p-2 bg-brand-gold/15 text-brand-gold-dark rounded-xl shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">القارئ الذكي وقارئ الكتب بالذكاء الاصطناعي (OCR) غير محدود 📷</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    امسح الكتب والمخطوطات من الكاميرا أو الاستوديو واستخرج النصوص العلمية فوراً بالذكاء الاصطناعي (Gemini OCR) بدقة متناهية وبعدد غير محدود من المرات بدلاً من حد المحاولات الـ 7 المجانية.
                  </p>
                </div>
              </div>

              {/* Feature 2: PDF Export */}
              <div className="flex gap-3 items-start bg-brand-cream/15 p-3 rounded-2xl border border-brand-cream/30">
                <div className="p-2 bg-brand-gold/15 text-brand-gold-dark rounded-xl shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">تصدير وطباعة الكتب بصيغة PDF (غير محدود) 📖</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    صمّم واطبع جميع فوائدك المقيدة على شكل كتاب تراثي فاخر ذو غلاف أنيق يحمل اسمك الشخصي، أو جدول أكاديمي منظم وخالٍ من القيود لطباعته وحفظه.
                  </p>
                </div>
              </div>

              {/* Feature 3: Share Card Customizations */}
              <div className="flex gap-3 items-start bg-brand-cream/15 p-3 rounded-2xl border border-brand-cream/30">
                <div className="p-2 bg-brand-gold/15 text-brand-gold-dark rounded-xl shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">البطاقات المصورة وتخصيص الخطوط الفاخرة (كامل الميزات) 🎨</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    افتح جميع قوالب وتصاميم البطاقات المصورة (التراثي، الزمردي الملكي، الكحلي والذهبي، الأندلسي) واستخدم الخطوط الفنية الفائقة الجمال كـ (خط الرقعة البديع، الكوفي الفخم، والخط الأميري) لمشاركة الفوائد بأبهى حلة علمية.
                  </p>
                </div>
              </div>

              {/* Feature 4: Cloud Backups */}
              <div className="flex gap-3 items-start bg-brand-cream/15 p-3 rounded-2xl border border-brand-cream/30">
                <div className="p-2 bg-brand-gold/15 text-brand-gold-dark rounded-xl shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">النسخ الاحتياطي السحابي التلقائي الآمن وجوجل درايف ☁️</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    احمِ مدوناتك وبحوثك من الضياع عبر تفعيل الرفع التلقائي المستمر والمزامنة الفورية مع السيرفر السحابي الآمن وجوجل درايف بضغطة زر.
                  </p>
                </div>
              </div>

              {/* Feature 5: Query Manager */}
              <div className="flex gap-3 items-start bg-brand-cream/15 p-3 rounded-2xl border border-brand-cream/30">
                <div className="p-2 bg-brand-gold/15 text-brand-gold-dark rounded-xl shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">تحقيق الاستشكالات والمسائل العلمية الصعبة 🔍</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    نظام متقدم لتتبع المسائل الصعبة والإشكالات الحديثية والفقهية التي تحتاج إلى بحث وتحقيق علمي، وتدوين نتائج بحثها وحلها خطوة بخطوة.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action and Activation Instructions */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-right space-y-3">
              <span className="text-xs font-black text-brand-emerald-dark block flex items-center gap-1.5">
                <Key className="w-4 h-4 text-brand-gold" />
                طريقة التفعيل والاشتراك السريع:
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                التفعيل سهل جداً ويدوي! للحصول على كود التفعيل المخصص لك مدى الحياة، يرجى التواصل مع المطور عبر البريد الإلكتروني مباشرة، وسيتم تزويدك بمفتاح التفعيل فوراً:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                <a
                  href={mailtoUrl}
                  onClick={(e) => {
                    try {
                      navigator.clipboard.writeText(requestCode);
                      showToast('تم نسخ رمز طلب التفعيل الخاص بك وجاري فتح تطبيق البريد الإلكتروني لإرساله للمطور 📧', 'success');
                    } catch (err) {
                      console.warn('Clipboard write failed:', err);
                    }
                    // Programmatic fallback redirect to be extremely reliable inside iframes
                    window.location.href = mailtoUrl;
                  }}
                  className="px-4 py-2.5 bg-brand-emerald hover:bg-brand-emerald-dark text-white font-bold text-xs rounded-xl flex-1 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Mail className="w-4 h-4" />
                  <span>مراسلة المطور عبر البريد الإلكتروني</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>abuosid773@gmail.com</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-100 p-4 border-t border-zinc-200 text-left shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              فهمت، إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
