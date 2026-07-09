import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Share2, ShieldAlert, BellRing, Database, CheckCircle, HelpCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: <BookOpen className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "تقييد الفوائد والشوارد",
      desc: "قيد فرائد الفوائد من بطون الكتب والمصنفات، ورتبها تحت تصنيفات علمية دقيقة لسهولة الرجوع إليها."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "التصوير الذكي بالذكاء الاصطناعي",
      desc: "صمم بطاقات دعوية وتعليمية لفوائدك بلمسة ذكية؛ سواء بكتابتها أو استخلاصها ذكياً من صور الاستوديو."
    },
    {
      icon: <Share2 className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "مشاركة وتصميم البطاقات",
      desc: "تصدير الفائدة في قوالب وتصميمات إسلامية وتراثية فاخرة وجذابة ومشاركتها مباشرة أو تحميلها بدقة فائقة."
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "حماية الخصوصية ونقاء التصميم",
      desc: "نظام ذكي يمنع تصوير الشاشة أثناء المعاينة لحفظ جودة وتناسق البطاقة ودعوتك لتحميل ومشاركة النسخة الرسمية."
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "زاوية الاستشكالات العلمية",
      desc: "دوّن المسائل المشكلة والمباحث العميقة التي تحتاج إلى بحث وتحرير، لتسجل حلولها وترجيحاتها لاحقاً."
    },
    {
      icon: <Database className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "مزامنة سحابية واحتياطية آمنة",
      desc: "حافظ على جهدك العلمي من الفقدان بمزامنة مستمرة وتلقائية مع حسابك في Google Drive وسحابة Firebase."
    },
    {
      icon: <BellRing className="w-5 h-5 text-brand-gold shrink-0" />,
      title: "مراجعة ذكية وتنبيهات دورية",
      desc: "يقوم التطبيق بتذكيرك بفوائدك القديمة عبر إشعارات دورية تظهر على هاتفك لضمان تعاهد العلم ومراجعته."
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-zinc-900 border border-zinc-800 text-right text-zinc-100 rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-2xl z-10 max-h-[90vh] flex flex-col"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="text-center pb-4 border-b border-zinc-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-emerald/10 border border-brand-emerald/30 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-3xl">📚</span>
            </div>
            <h2 className="text-xl font-bold font-sans text-brand-gold">مرحباً بك في جامع الفوائد ✨</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              أهلاً بك يا طالب العلم في بيئتك الرقمية المتكاملة لتقييد وتصميم ومراجعة شوارد الفوائد والتحريرات العلمية.
            </p>
          </div>

          {/* Body with scrollable features */}
          <div className="overflow-y-auto py-5 pr-1 pl-1 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
            <h3 className="text-xs font-black text-brand-emerald tracking-wide pb-1">أبرز مزايا ومكونات تطبيقك:</h3>
            
            <div className="space-y-3.5">
              {features.map((feat, idx) => (
                <div key={idx} className="flex gap-3 bg-zinc-950/40 border border-zinc-800/50 p-3 rounded-xl hover:border-zinc-800 transition-all">
                  <div className="mt-0.5 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                    {feat.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-200">{feat.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col items-center">
            <button
              id="welcome-modal-dismiss-btn"
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-brand-emerald to-emerald-700 hover:from-brand-emerald-dark hover:to-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>لقد فهمت، دعنا نبدأ! 🚀</span>
            </button>
            <span className="text-[9px] text-zinc-500 mt-3">
              صُنع بكل حب لخدمة طلاب العلم الشريف وتخليد فوائدهم 📚
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
