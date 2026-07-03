import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Sparkles, Check, Lock, Palette, Send } from 'lucide-react';
import { Benefit, AppSettings } from '../types';
import { formatToHijriAndGregorian } from '../utils';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  benefit: Benefit;
  settings: AppSettings;
  isActivated: boolean;
  onShowPremiumPromo: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

type ThemeID = 'heritage' | 'royal_emerald' | 'midnight_gold' | 'crimson_andalus' | 'damask_rose' | 'sapphire_blue';

type FontID = 'ruqaa' | 'kufi' | 'amiri' | 'cairo' | 'tajawal' | 'almarai';

interface CardFont {
  id: FontID;
  name: string;
  cssValue: string;
  desc: string;
}

const CARD_FONTS: CardFont[] = [
  {
    id: 'ruqaa',
    name: 'خط الرقعة البديع 🖋️',
    cssValue: 'Aref Ruqaa, Amiri, serif',
    desc: 'خط كلاسيكي منسق وجميل جداً للعناوين والفوائد القصيرة'
  },
  {
    id: 'kufi',
    name: 'الخط الكوفي الفخم 🕌',
    cssValue: 'Reem Kufi, Cairo, sans-serif',
    desc: 'خط كوفي أصيل ذو هيبة فنية تراثية رائعة'
  },
  {
    id: 'amiri',
    name: 'خط النسخ (الأميري) 📖',
    cssValue: 'Amiri, serif',
    desc: 'الخط التقليدي للكتب والمصاحف والمخطوطات العتيقة'
  },
  {
    id: 'cairo',
    name: 'خط القاهرة الحديث 🌆',
    cssValue: 'Cairo, sans-serif',
    desc: 'خط حديث، جريء، مقروء بوضوح فائق ومناسب للتصاميم المعاصرة'
  },
  {
    id: 'tajawal',
    name: 'خط تجوّل المتوازن 🍃',
    cssValue: 'Tajawal, sans-serif',
    desc: 'خط هادئ، متناسق، ناعم ومريح جداً للعين عند القراءة المطولة'
  },
  {
    id: 'almarai',
    name: 'خط المراعي الأنيق ✨',
    cssValue: 'Almarai, sans-serif',
    desc: 'خط ممتلئ، ناعم ذو انحناءات عصرية جذابة'
  }
];

interface CardTheme {
  id: ThemeID;
  name: string;
  bgClass: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  sourceColor: string;
  footerBg: string;
  footerTextColor: string;
  icon: string;
  desc: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'heritage',
    name: 'التراثي الأندلسي 📜',
    bgClass: 'bg-[#fcfaf2] border-[#b45309]',
    cardBg: '#fcfaf2',
    textColor: '#1c1917',
    accentColor: '#14532d',
    borderColor: '#b45309',
    sourceColor: '#78350f',
    footerBg: '#f5f2e6',
    footerTextColor: '#78716c',
    icon: '📜',
    desc: 'مظهر المخطوطات والكتب التراثية القديمة العتيقة بلمسة دافئة',
  },
  {
    id: 'royal_emerald',
    name: 'الزمردي التاجي 💚',
    bgClass: 'bg-[#022c22] border-[#eab308]',
    cardBg: '#022c22',
    textColor: '#f8fafc',
    accentColor: '#eab308',
    borderColor: '#f59e0b',
    sourceColor: '#fef08a',
    footerBg: '#02221a',
    footerTextColor: '#94a3b8',
    icon: '💚',
    desc: 'لون أخضر زمردي ملكي مطعّم بزخارف ذهبية جذابة للغاية',
  },
  {
    id: 'midnight_gold',
    name: 'الأسود الملكي ✨',
    bgClass: 'bg-zinc-950 border-[#fbbf24]',
    cardBg: '#09090b',
    textColor: '#fafafa',
    accentColor: '#facc15',
    borderColor: '#fbbf24',
    sourceColor: '#fef08a',
    footerBg: '#18181b',
    footerTextColor: '#a1a1aa',
    icon: '✨',
    desc: 'مظهر داكن شديد الفخامة لعشاق التباين العالي والتصميم المعاصر',
  },
  {
    id: 'crimson_andalus',
    name: 'العقيق الأندلسي 🍎',
    bgClass: 'bg-[#450a0a] border-[#fbbf24]',
    cardBg: '#450a0a',
    textColor: '#fffbeb',
    accentColor: '#f59e0b',
    borderColor: '#fbbf24',
    sourceColor: '#fef08a',
    footerBg: '#3b0707',
    footerTextColor: '#d6d3d1',
    icon: '🍎',
    desc: 'لون عقيقي داكن يوحي بالوقار والهيبة الأندلسية العريقة',
  },
  {
    id: 'damask_rose',
    name: 'النسيم الدمشقي 🌸',
    bgClass: 'bg-[#fdf2f8] border-[#db2777]',
    cardBg: '#fdf2f8',
    textColor: '#4d072e',
    accentColor: '#86198f',
    borderColor: '#db2777',
    sourceColor: '#c026d3',
    footerBg: '#fbcfe8',
    footerTextColor: '#86198f',
    icon: '🌸',
    desc: 'لون وردي بنفسجي ناعم مبهج ومريح للعين لتصميم ناعم وعصري',
  },
  {
    id: 'sapphire_blue',
    name: 'الأزرق السماوي 💙',
    bgClass: 'bg-[#f0f9ff] border-[#0284c7]',
    cardBg: '#f0f9ff',
    textColor: '#0f172a',
    accentColor: '#0369a1',
    borderColor: '#0284c7',
    sourceColor: '#0369a1',
    footerBg: '#e0f2fe',
    footerTextColor: '#475569',
    icon: '💙',
    desc: 'لون سماوي مشرق وجميل يعبر عن الصفاء والوضوح الأكاديمي المشرق',
  }
];

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  benefit,
  settings,
  isActivated,
  onShowPremiumPromo,
  showToast,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeID>('heritage');
  const [selectedFont, setSelectedFont] = useState<FontID>('cairo');
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const activeTheme = CARD_THEMES.find(t => t.id === selectedTheme) || CARD_THEMES[0];
  const activeFont = CARD_FONTS.find(f => f.id === selectedFont) || CARD_FONTS[0];
  const authorName = settings.programmerName || 'أبي أُسيد';

  const generateCardBlobAndDownload = async (action: 'download' | 'share') => {
    // Check Activation Paywall
    if (!isActivated) {
      onShowPremiumPromo();
      return;
    }

    setIsExporting(true);
    showToast('جاري تصميم وتوليد بطاقتك فائقة الجودة... 🎨✨', 'info');

    // Wait a brief moment for state and fonts
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // 1. Setup Canvas Dimensions (1080 x 1350 - Golden Instagram Portrait Aspect Ratio)
      canvas.width = 1080;
      canvas.height = 1350;
      const w = canvas.width;
      const h = canvas.height;

      // 2. Fill Background
      ctx.fillStyle = activeTheme.cardBg;
      ctx.fillRect(0, 0, w, h);

      // 3. Draw Beautiful Borders
      ctx.strokeStyle = activeTheme.borderColor;
      
      // Outer border frame
      ctx.lineWidth = 8;
      ctx.strokeRect(35, 35, w - 70, h - 70);

      // Inner border frame (delicate)
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, w - 96, h - 96);

      // Corner ornaments for applicable themes
      if (['heritage', 'royal_emerald', 'midnight_gold', 'crimson_andalus'].includes(activeTheme.id)) {
        ctx.fillStyle = activeTheme.borderColor;
        const offset = 42;
        const size = 20;
        // Top Left
        ctx.fillRect(offset, offset, size, size);
        // Top Right
        ctx.fillRect(w - offset - size, offset, size, size);
        // Bottom Left
        ctx.fillRect(offset, h - offset - size, size, size);
        // Bottom Right
        ctx.fillRect(w - offset - size, h - offset - size, size, size);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 4. Header Section: "من فوائد [اسم المستخدم]" (Clean modern look, no "الشيخ" or "حفظه الله")
      ctx.fillStyle = activeTheme.accentColor;
      ctx.font = `bold 36px ${activeFont.cssValue}`;
      const headerText = `من فوائد: ${authorName}`;
      ctx.fillText(headerText, w / 2, 120);

      // Ornamental line under header
      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 150, 165);
      ctx.lineTo(w / 2 + 150, 165);
      ctx.stroke();

      // 5. Benefit Title: "【 العنوان 】"
      ctx.fillStyle = activeTheme.accentColor;
      ctx.font = `bold 44px ${activeFont.cssValue}`;
      const titleText = `【 ${benefit.title} 】`;
      ctx.fillText(titleText, w / 2, 230);

      // 6. Draw Content with Multi-line Wrapping & Font Auto-scaling
      const contentAreaYStart = 300;
      const contentAreaYEnd = h - 230;
      const contentAreaHeight = contentAreaYEnd - contentAreaYStart;
      const contentWidth = w - 240; // Generous margins on left/right

      const paragraphs = benefit.content.split('\n');

      // Font size calculation loop
      let fontSize = 35;
      let lineHeight = 58;
      
      const charCount = benefit.content.length;
      if (charCount > 600) {
        fontSize = 24;
        lineHeight = 42;
      } else if (charCount > 400) {
        fontSize = 28;
        lineHeight = 48;
      } else if (charCount > 250) {
        fontSize = 32;
        lineHeight = 54;
      }

      const measureLines = () => {
        ctx.font = `500 ${fontSize}px ${activeFont.cssValue}`;
        let totalHeight = 0;
        const paraLines: string[][] = [];

        for (const para of paragraphs) {
          const trimmed = para.trim();
          if (!trimmed) {
            totalHeight += lineHeight * 0.5;
            paraLines.push([]);
            continue;
          }

          const words = trimmed.split(' ');
          let line = '';
          const lines: string[] = [];

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > contentWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          totalHeight += lines.length * lineHeight + 12;
          paraLines.push(lines);
        }
        return { paraLines, totalHeight };
      };

      let layout = measureLines();
      
      // Auto-shrink font size if text overflows the area
      while (layout.totalHeight > contentAreaHeight && fontSize > 16) {
        fontSize -= 2;
        lineHeight = Math.floor(fontSize * 1.55);
        layout = measureLines();
      }

      // Draw Wrapped Paragraphs beautifully centered
      let currentY = contentAreaYStart + (contentAreaHeight - layout.totalHeight) / 2 + lineHeight / 2;
      ctx.fillStyle = activeTheme.textColor;

      for (let i = 0; i < paragraphs.length; i++) {
        const lines = layout.paraLines[i];
        if (lines.length === 0) {
          currentY += lineHeight * 0.5;
          continue;
        }

        for (const line of lines) {
          ctx.fillText(line.trim(), w / 2, currentY);
          currentY += lineHeight;
        }
        currentY += 12;
      }

      // 7. Reference/Source (No Date printed per user's requests)
      if (benefit.source) {
        ctx.fillStyle = activeTheme.sourceColor;
        ctx.font = `italic bold 32px ${activeFont.cssValue}`;
        const sourceText = `المصدر: ${benefit.source}`;
        ctx.fillText(sourceText, w / 2, h - 170);
      }

      // 8. Draw Branding Footer
      ctx.fillStyle = activeTheme.footerBg;
      ctx.fillRect(70, h - 110, w - 140, 60);

      ctx.strokeStyle = activeTheme.borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(70, h - 110, w - 140, 60);

      ctx.fillStyle = activeTheme.accentColor;
      ctx.font = `bold 20px ${activeFont.cssValue}`;
      ctx.fillText(`📅 تاريخ تدوين الفائدة: ${formatToHijriAndGregorian(benefit.date)}`, w / 2, h - 74);

      // Small secondary sub-footer with developer contact email
      ctx.fillStyle = activeTheme.footerTextColor;
      ctx.font = `bold 16px ${activeFont.cssValue}`;
      ctx.fillText(`بواسطة تطبيق جامع الفوائد 📱 بريد الدعم: abuosid773@gmail.com`, w / 2, h - 130);

      // 9. Process Action (Direct Download OR Native Web Share API integration)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('فشل تصميم وتصدير الصورة. يرجى المحاولة لاحقاً.', 'warning');
          return;
        }

        const fileName = `بطاقة_فائدة_${benefit.title.replace(/\s+/g, '_')}.png`;

        if (action === 'download') {
          // Normal local anchor download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = fileName;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          showToast('تم تحميل وحفظ بطاقة الفائدة المصورة بنجاح على جهازك! 🎉📸', 'success');
          onClose(); // Automatically close and return to main app
        } else if (action === 'share') {
          // Native Web Share API with actual file transfer!
          const file = new File([blob], fileName, { type: 'image/png' });
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: benefit.title,
                text: `فائدة مقيدة بعنوان: ${benefit.title}\nمن فوائد: ${authorName}\nتم النشر بواسطة تطبيق جامع الفوائد 📚`,
              });
              showToast('تم فتح قائمة المشاركة المباشرة لجهازك بنجاح! 📲✅', 'success');
              onClose(); // Automatically close and return to main app
            } catch (shareErr) {
              console.log('Share dismissed or failed:', shareErr);
              // Fallback to direct download link
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = fileName;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              showToast('تم تحميل الصورة بدلاً من ذلك، يمكنك مشاركتها الآن يدوياً! 📤', 'success');
              onClose(); // Automatically close and return to main app
            }
          } else {
            // No native share support, trigger download and offer WhatsApp/Telegram web text share fallback
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast('تم حفظ الصورة بنجاح على الهاتف لعدم توفر ميزة النشر التلقائي بجهازك! 📱💾', 'success');
            onClose(); // Automatically close and return to main app
          }
        }
      }, 'image/png');

    } catch (err) {
      console.error('Error drawing canvas share card:', err);
      showToast('حدث خطأ غير متوقع أثناء تصميم الصورة، يرجى المحاولة مجدداً.', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper quick social share links (text fallback)
  const getWhatsAppShareUrl = () => {
    const text = `📌 *${benefit.title}*\n\n${benefit.content}\n\n✍️ من فوائد: ${authorName}\n${benefit.source ? `📚 المصدر: ${benefit.source}` : ''}\n\n📱 تم التقييد بواسطة تطبيق جامع الفوائد`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const getTelegramShareUrl = () => {
    const text = `📌 *${benefit.title}*\n\n${benefit.content}\n\n✍️ من فوائد: ${authorName}\n${benefit.source ? `📚 المصدر: ${benefit.source}` : ''}\n\n📱 تم التقييد بواسطة تطبيق جامع الفوائد`;
    return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden text-right font-sans shadow-2xl h-[95vh] md:h-auto md:max-h-[90vh]"
        >
          {/* Left panel: Live Beautiful Card Teaser Preview */}
          <div className="flex-1 bg-zinc-950 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-l border-zinc-800 overflow-y-auto min-h-[360px] md:min-h-0">
            <span className="text-[10px] text-brand-gold uppercase tracking-wider font-extrabold mb-3 block self-start flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-brand-gold" />
              المعاينة الفنية الحية قبل الحفظ والنشر:
            </span>

            {/* Interactive styled HTML teaser matching the canvas output perfectly! */}
            <div 
              className={`w-full max-w-[310px] aspect-[4/5] ${activeTheme.bgClass} rounded-2xl p-5 border-4 flex flex-col justify-between text-center relative select-none shadow-2xl transition-all duration-300 transform hover:scale-[1.01]`}
              style={{ contentVisibility: 'auto', fontFamily: activeFont.cssValue }}
            >
              {/* Antique inner border design */}
              <div className={`absolute inset-1.5 border border-dashed ${selectedTheme === 'heritage' ? 'border-[#b45309]/50' : 'border-white/15'} rounded-xl pointer-events-none`} />
              
              {/* Card Header area */}
              <div className="space-y-1.5 z-10 pt-1">
                <span className="text-[11px] font-black block opacity-90 tracking-wide" style={{ color: activeTheme.accentColor }}>
                  من فوائد: {authorName}
                </span>
                <div className="w-20 h-0.5 mx-auto opacity-40" style={{ backgroundColor: activeTheme.borderColor }} />
                <h4 className="text-xs sm:text-sm font-black leading-tight" style={{ color: activeTheme.accentColor }}>
                  【 {benefit.title} 】
                </h4>
              </div>

              {/* Card Content area with scroll fallback */}
              <div className="my-2.5 flex-1 flex items-center justify-center overflow-hidden px-1.5 py-1 z-10">
                <p 
                  className="text-[10px] leading-relaxed font-medium line-clamp-[7] text-center" 
                  style={{ color: activeTheme.textColor }}
                >
                  {benefit.content}
                </p>
              </div>

              {/* Card Footer area */}
              <div className="space-y-1.5 z-10 pb-1">
                {benefit.source && (
                  <span className="text-[9.5px] font-black block italic truncate opacity-90" style={{ color: activeTheme.sourceColor }}>
                    المصدر: {benefit.source}
                  </span>
                )}
                
                <div className="rounded-lg p-1.5 text-[8.5px] font-bold flex items-center justify-center truncate" style={{ backgroundColor: activeTheme.footerBg, color: activeTheme.accentColor, border: `1px solid ${activeTheme.borderColor}` }}>
                  📅 تاريخ تدوين الفائدة: {formatToHijriAndGregorian(benefit.date)}
                </div>
                
                <span className="text-[7px] block opacity-60 font-semibold" style={{ color: activeTheme.footerTextColor }}>
                  📱 مطور التطبيق: abuosid773@gmail.com
                </span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 mt-4 text-center leading-relaxed">
              * سيتم حفظ الصورة بدقة فائقة الوضوح ومناسبة جداً للنشر المباشر كحالة أو قصة دعوية في المنصات.
            </p>
          </div>

          {/* Right panel: Controls and premium trigger info */}
          <div className="w-full md:w-[400px] p-6 flex flex-col justify-between bg-zinc-900 overflow-y-auto">
            {/* Header */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg">
                    <Palette className="w-4 h-4 text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white leading-none">تخصيص وتصميم بطاقتك 🎨</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">اختر من القوالب التراثية الفخمة المتنوعة</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Themes Selector */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 block">قوالب التصميم المتوفرة (اختر لوناً):</span>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        selectedTheme === theme.id
                          ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald ring-1 ring-brand-emerald/25 shadow-lg'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">{theme.icon}</span>
                        <span className="text-[10.5px] font-black tracking-tight">{theme.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-[8.5px] text-zinc-500 font-semibold line-clamp-2 leading-relaxed">
                        {theme.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 block">نوع الخط الفني (اختر خطاً فائق الجمال):</span>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between h-16 ${
                        selectedFont === font.id
                          ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald ring-1 ring-brand-emerald/25 shadow-lg'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-[11px] font-black tracking-tight pt-1 block" style={{ fontFamily: font.cssValue }}>
                        {font.name}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-medium line-clamp-1 leading-none pb-1">
                        {font.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions area with Paywall disclaimer */}
            <div className="pt-5 border-t border-zinc-800 mt-5 space-y-4">
              {!isActivated ? (
                <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-2xl text-right">
                  <span className="text-[10.5px] font-black text-brand-gold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-brand-gold" />
                    ميزة حصرية للنسخة الذهبية (المدفوعة) 🔑
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                    المشاركة المتقدمة بالبطاقات المصورة المتنوعة هي ميزة مخصصة لدعم ومساندة المطور.
                  </p>
                  <button
                    onClick={onShowPremiumPromo}
                    className="w-full mt-2 py-1.5 bg-brand-gold/20 border border-brand-gold hover:bg-brand-gold text-white hover:text-zinc-950 font-black text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>عرض مزايا التفعيل والتواصل 🌟</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-right">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    🟢 رخصتك مفعلة! استمتع بصناعة وحفظ صورك بلا حدود.
                  </span>
                </div>
              )}

              {/* Advanced Multi-Action Buttons */}
              <div className="space-y-2.5">
                {/* 1. Integrated Download & Share Action */}
                <button
                  onClick={() => generateCardBlobAndDownload('share')}
                  disabled={isExporting}
                  className="w-full py-3.5 bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-zinc-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-brand-emerald-light/10"
                >
                  <Share2 className="w-4 h-4 text-brand-gold shrink-0 animate-bounce" />
                  <span>{isExporting ? 'جاري تحضير البطاقة وتصميمها...' : 'تحميل ومشاركة البطاقة المصورة مباشرة 📥📲'}</span>
                </button>

                <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1">
                  <span>الدعم والاشتراك: abuosid773@gmail.com</span>
                  <button 
                    onClick={() => generateCardBlobAndDownload('download')} 
                    className="underline text-zinc-400 hover:text-white transition-colors"
                  >
                    حفظ كملف صورة فقط 📥
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Invisible Canvas used solely for high-res rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </AnimatePresence>
  );
};
