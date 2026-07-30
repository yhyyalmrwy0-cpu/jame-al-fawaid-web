import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageCircle, Copy, Check, X, Key, Tag, Sparkles } from 'lucide-react';

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

interface RequestCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export const RequestCodeModal: React.FC<RequestCodeModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const seed = getOrCreateDeviceSeed();
  const requestCode = getEncryptedRequestCode(seed);

  const emailSubject = 'طلب تفعيل تطبيق جامع الفوائد عبر الرمز المشفر';
  const messageBody = `السلام عليكم ورحمة الله وبركاته،

أرجو منكم تزويدي بمفتاح التفعيل لتطبيق (جامع الفوائد).

الرمز المشفر المخصص لجهازي هو: ${requestCode}

ولكم جزيل الشكر والتقدير.`;

  const mailtoUrl = `mailto:abuosid773@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
  const whatsappPhone = '967773793533';
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(messageBody)}`;

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(requestCode);
      setCopiedCode(true);
      showToast('تم نسخ رمز طلب التفعيل الخاص بك! 📋', 'success');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      showToast('تعذر النسخ التلقائي، يمكنك نسخ الرمز يدوياً.', 'warning');
    }
  };

  const handleSendEmail = () => {
    handleCopyCode();
    showToast('جاري فتح تطبيق البريد الإلكتروني... 📧', 'info');
    window.location.href = mailtoUrl;
  };

  const handleSendWhatsApp = () => {
    handleCopyCode();
    showToast('جاري فتح محادثة الواتساب مع المطور... 💬', 'info');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-lg w-full flex flex-col overflow-hidden text-right font-sans border-2 border-brand-gold/45 shadow-2xl relative"
        >
          {/* Header Accent */}
          <div className="bg-gradient-to-l from-brand-emerald-dark via-brand-emerald to-brand-emerald-dark p-5 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 transition-all text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl shrink-0">
                <Key className="w-6 h-6 text-brand-gold-light" />
              </div>
              <div>
                <h3 className="text-base font-black font-sans leading-tight">طلب رمز تفعيل التطبيق 🔑</h3>
                <p className="text-xs text-zinc-200 mt-1 font-medium">اختر وسيلة التواصل المريحة لك للحصول على كود التنشيط</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Price Banner Highlight */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border-2 border-brand-gold/40 rounded-2xl flex items-center gap-3 text-amber-950 font-sans shadow-xs">
              <div className="p-2 bg-brand-gold/20 text-brand-gold-dark rounded-xl shrink-0">
                <Tag className="w-5 h-5 text-brand-gold-dark" />
              </div>
              <div className="text-xs font-black leading-relaxed text-right flex-1">
                <span>تفعيل رمزي وسهل جداً: </span>
                <span className="text-brand-emerald-dark underline decoration-brand-gold decoration-2">10 ريال سعودي</span>
                <span> فقط (أو </span>
                <span className="text-brand-emerald-dark underline decoration-brand-gold decoration-2">1400 ريال يمني</span>
                <span>) لتنشيط كافة الميزات مدى الحياة! 🌟</span>
              </div>
            </div>

            {/* Encrypted Code Card */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-gold" />
                  الرمز المشفر المخصص لجهازك:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[11px] font-bold text-brand-emerald hover:text-brand-emerald-dark flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs cursor-pointer transition-all"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-brand-gold" />
                      <span>نسخ الرمز</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-white border border-zinc-200/80 rounded-xl text-center font-mono font-black text-sm text-brand-emerald-dark tracking-wider select-all">
                {requestCode}
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Email */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-zinc-700 text-right">
                اختر طريقة التواصل لإرسال الرمز واستلام كود التنشيط:
              </span>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-between gap-3 cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="p-2.5 bg-white/20 rounded-xl shrink-0 group-hover:bg-white/30 transition-colors">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-white">إرسال الرمز عبر الواتساب (WhatsApp) 💬</span>
                    <span className="text-[10px] text-emerald-100 font-medium dir-ltr block mt-0.5">00967773793533</span>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-white/30 transition-colors">
                  تواصل الآن ➔
                </span>
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={handleSendEmail}
                className="w-full p-4 bg-brand-emerald hover:bg-brand-emerald-dark text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-between gap-3 cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 text-right">
                  <div className="p-2.5 bg-white/20 rounded-xl shrink-0 group-hover:bg-white/30 transition-colors">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-white">إرسال الرمز عبر البريد الإلكتروني 📧</span>
                    <span className="text-[10px] text-emerald-100 font-medium dir-ltr block mt-0.5">abuosid773@gmail.com</span>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-white/30 transition-colors">
                  تواصل الآن ➔
                </span>
              </button>
            </div>
          </div>

          <div className="bg-zinc-100 p-3.5 border-t border-zinc-200 text-left shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
