import React, { useState, useRef, useEffect } from 'react';
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

type ThemeID = 'heritage' | 'royal_emerald' | 'midnight_gold' | 'crimson_andalus' | 'damask_rose' | 'sapphire_blue' | 'royal_violet' | 'magic_turquoise' | 'classic_gold' | 'serene_olive' | 'premium_lavender' | 'minimal_charcoal';

type FontID = 'ruqaa' | 'kufi' | 'amiri' | 'cairo' | 'tajawal' | 'almarai' | 'mirza' | 'lalezar' | 'harmattan' | 'marhey' | 'elmessiri';

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
  },
  {
    id: 'mirza',
    name: 'خط ميرزا الفني ✒️',
    cssValue: 'Mirza, serif',
    desc: 'خط متصل متناسق ذو هيبة تراثية متميزة جداً'
  },
  {
    id: 'lalezar',
    name: 'خط الليمون البارز 🍋',
    cssValue: 'Lalezar, sans-serif',
    desc: 'خط سميك وجذاب ومثالي للبطاقات ذات الكلمات القليلة'
  },
  {
    id: 'harmattan',
    name: 'خط هرموش الهادئ ✍️',
    cssValue: 'Harmattan, sans-serif',
    desc: 'خط كلاسيكي متوازن يتميز بوضوح فائق وسلاسة تامة'
  },
  {
    id: 'marhey',
    name: 'خط مرح الطليعي 🎨',
    cssValue: 'Marhey, sans-serif',
    desc: 'خط فني، جريء، غني بالانحناءات الابتكارية لبطاقات مبهرة'
  },
  {
    id: 'elmessiri',
    name: 'خط تجلي المعاصر 🌟',
    cssValue: 'El Messiri, sans-serif',
    desc: 'خط رشيق متناسق بلمسة إسلامية معاصرة فخمة'
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
    id: 'royal_violet',
    name: 'الأرجواني الفخم 💜',
    bgClass: 'bg-[#1e1b4b] border-[#eab308]',
    cardBg: '#1e1b4b',
    textColor: '#f5f3ff',
    accentColor: '#fbbf24',
    borderColor: '#eab308',
    sourceColor: '#ddd6fe',
    footerBg: '#12102f',
    footerTextColor: '#a78bfa',
    icon: '💜',
    desc: 'لون أرجواني ملكي فاخر للغاية مطعم بخطوط ورموز ذهبية ناصعة',
  },
  {
    id: 'magic_turquoise',
    name: 'الفيروزي الساحر 🪶',
    bgClass: 'bg-[#042f2e] border-[#38bdf8]',
    cardBg: '#042f2e',
    textColor: '#f0fdfa',
    accentColor: '#38bdf8',
    borderColor: '#0ea5e9',
    sourceColor: '#99f6e4',
    footerBg: '#021b1b',
    footerTextColor: '#5eead4',
    icon: '🪶',
    desc: 'لمسة فيروزية بحرية خلابة مع توهج سماوي ملفت للأنظار',
  },
  {
    id: 'classic_gold',
    name: 'الذهبي الإمبراطوري ⚜️',
    bgClass: 'bg-[#1c1917] border-[#d97706]',
    cardBg: '#1c1917',
    textColor: '#fef3c7',
    accentColor: '#fbbf24',
    borderColor: '#d97706',
    sourceColor: '#f59e0b',
    footerBg: '#110e0c',
    footerTextColor: '#d97706',
    icon: '⚜️',
    desc: 'طراز ذهبي أسود ملكي فخم يعبر عن النفاسة والأصالة الأكاديمية',
  },
  {
    id: 'serene_olive',
    name: 'الزيتوني الهادئ 🌿',
    bgClass: 'bg-[#fcfbf7] border-[#3f6212]',
    cardBg: '#fcfbf7',
    textColor: '#1a2e05',
    accentColor: '#3f6212',
    borderColor: '#4d7c0f',
    sourceColor: '#65a30d',
    footerBg: '#f4f6f0',
    footerTextColor: '#4d7c0f',
    icon: '🌿',
    desc: 'طبيعة هادئة وعميقة، مظهر زيتوني مريح مع ناصع ورق الشجر الدافئ',
  },
  {
    id: 'premium_lavender',
    name: 'اللافندر المشرق ☁️',
    bgClass: 'bg-[#faf5ff] border-[#8b5cf6]',
    cardBg: '#faf5ff',
    textColor: '#3b0764',
    accentColor: '#6d28d9',
    borderColor: '#8b5cf6',
    sourceColor: '#7c3aed',
    footerBg: '#f3e8ff',
    footerTextColor: '#8b5cf6',
    icon: '☁️',
    desc: 'مظهر لافندر ناعم رقيق، عصري وجذاب ومناسب جداً للشباب',
  },
  {
    id: 'minimal_charcoal',
    name: 'الجرانيت العصري 🖤',
    bgClass: 'bg-[#18181b] border-[#10b981]',
    cardBg: '#18181b',
    textColor: '#f4f4f5',
    accentColor: '#34d399',
    borderColor: '#10b981',
    sourceColor: '#a7f3d0',
    footerBg: '#09090b',
    footerTextColor: '#34d399',
    icon: '🖤',
    desc: 'جرانيتي داكن عصري جداً بنقوش فسفورية زمردية ساطعة لافتة للغاية',
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
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => {
      setIsBlurred(true);
    };
    const handleFocus = () => {
      // Small timeout to give them a brief moment when switching back
      setTimeout(() => {
        setIsBlurred(false);
      }, 500);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setTimeout(() => {
          setIsBlurred(false);
        }, 500);
      }
    };

    // Keyboard screenshot detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.key === 'PrtScn') {
        setIsBlurred(true);
        showToast('🚫 تصوير الشاشة المباشر غير مدعوم للحفاظ على نقاء التصميم وجودة الفائدة!', 'warning');
        e.preventDefault();
      }
      
      // Ctrl/Cmd + Shift + S (common screenshot shortcut on Windows/macOS)
      // or Ctrl/Cmd + S / Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        setIsBlurred(true);
        showToast('🚫 يرجى حفظ الفائدة أو مشاركتها عبر الأزرار الرسمية للحفاظ على دقتها الفائقة!', 'warning');
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [showToast]);

  if (!isOpen) return null;

  const activeTheme = CARD_THEMES.find(t => t.id === selectedTheme) || CARD_THEMES[0];
  const activeFont = CARD_FONTS.find(f => f.id === selectedFont) || CARD_FONTS[0];
  const authorName = settings.programmerName || 'طالب العلم';

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

      // 5. Benefit Title: "【 العنوان 】" (with multi-line wrapping if too long)
      ctx.fillStyle = activeTheme.accentColor;
      ctx.font = `bold 44px ${activeFont.cssValue}`;
      const titleRawText = `【 ${benefit.title.trim()} 】`;
      const titleMaxWidth = w - 240; // Same as content width margin for consistent bounds

      const wordsTitle = titleRawText.split(' ');
      let lineTitle = '';
      const titleLines: string[] = [];

      for (let n = 0; n < wordsTitle.length; n++) {
        const testLine = lineTitle + wordsTitle[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > titleMaxWidth && n > 0) {
          titleLines.push(lineTitle.trim());
          lineTitle = wordsTitle[n] + ' ';
        } else {
          lineTitle = testLine;
        }
      }
      titleLines.push(lineTitle.trim());

      const titleLineHeight = 55;
      // Center the title block vertically around Y = 230
      const titleTotalHeight = titleLines.length * titleLineHeight;
      const titleStartY = 230 - (titleTotalHeight / 2) + (titleLineHeight / 2);

      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i], w / 2, titleStartY + (i * titleLineHeight));
      }

      // 6. Draw Content with Multi-line Wrapping & Font Auto-scaling
      const titleBottomY = Math.max(260, titleStartY + ((titleLines.length - 1) * titleLineHeight) + 35);
      const contentAreaYStart = titleBottomY + 20;
      const contentAreaYEnd = h - 230;
      const contentAreaHeight = contentAreaYEnd - contentAreaYStart;
      const contentWidth = w - 240; // Generous margins on left/right

      const paragraphs = benefit.content.split('\n');

      // Font size calculation loop starting at a very generous 65px to fill the card!
      let fontSize = 65;
      let lineHeight = Math.floor(fontSize * 1.55);

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
        fontSize -= 1;
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
          // 1 & 2. Convert design to Blob (already done via canvas.toBlob) and convert to File Object 'faida.png'
          const file = new File([blob], 'faida.png', { type: 'image/png' });
          const shareText = `تم النشر بواسطة تطبيق جامع الفوائد 📚\nقيد فوائدك عبر هذا الرابط:\nhttps://jame-al-fawaid-kc2u.vercel.app\n\n📌 *${benefit.title}*\n\n${benefit.content}\n\n✍️ من فوائد: ${authorName}\n${benefit.source ? `📚 المصدر: ${benefit.source}` : ""}`;

          // 3. Verify share capability using the exact condition:
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              // 4. Launch direct native system share menu:
              await navigator.share({
                files: [file],
                title: 'فائدة',
                text: shareText
              });
              showToast('تمت مشاركة البطاقة بنجاح! 📲✅', 'success');
              onClose();
              return;
            } catch (shareErr: any) {
              console.log('Direct file share error:', shareErr);
              const isUserCancel = shareErr && (
                shareErr.name === 'AbortError' || 
                shareErr.name === 'NotAllowedError' ||
                shareErr.message?.toLowerCase().includes('cancel') || 
                shareErr.message?.toLowerCase().includes('dismiss') ||
                shareErr.message?.toLowerCase().includes('abort')
              );
              if (isUserCancel) {
                showToast('تم إلغاء المشاركة.', 'info');
                return;
              }
            }
          }

          // Fallback if browser does not support file sharing (e.g. older browsers or text-only)
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'فائدة',
                text: shareText,
                url: 'https://jame-al-fawaid-kc2u.vercel.app'
              });
              showToast('تمت مشاركة نص الفائدة بنجاح! 📲✨', 'success');
              onClose();
              return;
            } catch (textErr: any) {
              console.log('Text fallback share error:', textErr);
              const isCancel = textErr && (
                textErr.name === 'AbortError' || 
                textErr.name === 'NotAllowedError' ||
                textErr.message?.toLowerCase().includes('cancel') || 
                textErr.message?.toLowerCase().includes('dismiss') ||
                textErr.message?.toLowerCase().includes('abort')
              );
              if (isCancel) {
                showToast('تم إلغاء المشاركة.', 'info');
                return;
              }
            }
          }

          // Complete fallback for unsupported desktop environments: download + clipboard copy
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'faida.png';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);

          try {
            await navigator.clipboard.writeText(shareText);
            showToast('تم تحميل البطاقة ونسخ نص الفائدة لعدم توفر المشاركة المباشرة في جهازك! 📋📥', 'success');
          } catch (clipErr) {
            showToast('تم تحميل وحفظ بطاقة الفائدة المصورة بنجاح على جهازك! 💾📸', 'success');
          }
          onClose();
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
    const text = `تم النشر بواسطة تطبيق جامع الفوائد 📚\nقيد فوائدك عبر هذا الرابط:\nhttps://jame-al-fawaid-kc2u.vercel.app\n\n📌 *${benefit.title}*\n\n${benefit.content}\n\n✍️ من فوائد: ${authorName}\n${benefit.source ? `📚 المصدر: ${benefit.source}` : ""}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const getTelegramShareUrl = () => {
    const text = `تم النشر بواسطة تطبيق جامع الفوائد 📚\nقيد فوائدك عبر هذا الرابط:\nhttps://jame-al-fawaid-kc2u.vercel.app\n\n📌 *${benefit.title}*\n\n${benefit.content}\n\n✍️ من فوائد: ${authorName}\n${benefit.source ? `📚 المصدر: ${benefit.source}` : ""}`;
    return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
  };

  // Dynamic font size for the HTML teaser preview to match the "smaller text = bigger font, larger text = smaller font" request!
  const charCount = benefit.content.length;
  let htmlFontSize = '10.5px';
  let htmlLineHeight = '1.4';
  
  if (charCount < 40) {
    htmlFontSize = '26px';
    htmlLineHeight = '1.6';
  } else if (charCount < 80) {
    htmlFontSize = '21px';
    htmlLineHeight = '1.55';
  } else if (charCount < 140) {
    htmlFontSize = '17.5px';
    htmlLineHeight = '1.5';
  } else if (charCount < 220) {
    htmlFontSize = '14px';
    htmlLineHeight = '1.45';
  } else if (charCount < 320) {
    htmlFontSize = '12px';
    htmlLineHeight = '1.4';
  } else if (charCount < 450) {
    htmlFontSize = '11px';
    htmlLineHeight = '1.35';
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden text-right font-sans shadow-2xl h-[92vh] md:h-[85vh] max-h-[95vh]"
        >
          {/* Left panel: Live Beautiful Card Teaser Preview */}
          <div 
            className="flex-1 bg-zinc-950 p-4 sm:p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-l border-zinc-800 overflow-y-auto h-[45%] md:h-full shrink-0 md:shrink"
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="text-[10px] text-brand-gold uppercase tracking-wider font-extrabold mb-3 block self-start flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-brand-gold" />
              المعاينة الفنية الحية قبل الحفظ والنشر:
            </span>

            {/* Interactive styled HTML teaser matching the canvas output perfectly! */}
            <div 
              className={`w-full max-w-[310px] aspect-[4/5] ${activeTheme.bgClass} rounded-2xl p-5 border-4 flex flex-col justify-between text-center relative select-none shadow-2xl transition-all duration-300 transform hover:scale-[1.01] pointer-events-auto`}
              style={{ contentVisibility: 'auto', fontFamily: activeFont.cssValue, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
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

              {/* Card Content area with dynamic font size */}
              <div className="my-2.5 flex-1 flex items-center justify-center overflow-hidden px-1.5 py-1 z-10">
                <p 
                  className="font-medium text-center leading-relaxed" 
                  style={{ color: activeTheme.textColor, fontSize: htmlFontSize, lineHeight: htmlLineHeight }}
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

              {/* Heavy watermark layer covering the preview card */}
              <div 
                className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex flex-col justify-center items-center gap-10 select-none opacity-[0.25]"
                style={{ direction: 'rtl' }}
              >
                <div className="flex flex-col gap-8 rotate-[-28deg] scale-110 whitespace-nowrap">
                  <div 
                    className="flex gap-4 justify-center text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                    style={{ 
                      color: activeTheme.accentColor, 
                      backgroundColor: `${activeTheme.footerBg}dd`, 
                      borderColor: activeTheme.borderColor 
                    }}
                  >
                    <span>⚠️ نسخة تجريبية</span>
                    <span>اشترك لتصميم الفائدة</span>
                  </div>
                  <div 
                    className="flex gap-4 justify-center text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                    style={{ 
                      color: activeTheme.accentColor, 
                      backgroundColor: `${activeTheme.footerBg}dd`, 
                      borderColor: activeTheme.borderColor 
                    }}
                  >
                    <span>اشترك لتصميم الفائدة</span>
                    <span>⚠️ نسخة تجريبية</span>
                  </div>
                  <div 
                    className="flex gap-4 justify-center text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                    style={{ 
                      color: activeTheme.accentColor, 
                      backgroundColor: `${activeTheme.footerBg}dd`, 
                      borderColor: activeTheme.borderColor 
                    }}
                  >
                    <span>⚠️ نسخة تجريبية</span>
                    <span>اشترك لتصميم الفائدة</span>
                  </div>
                </div>
              </div>

              {/* Transparent protective shield to block context menus, long presses, clicks, and dragging */}
              <div 
                className="absolute inset-0 z-30 pointer-events-auto cursor-default rounded-xl"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
              />

              {/* Anti-screenshot elegant glassmorphic barrier overlay */}
              {isBlurred && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-5 text-center z-50 rounded-xl border-2 border-red-500/40 pointer-events-auto">
                  <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
                    <span className="text-xl">🚫</span>
                  </div>
                  <h5 className="text-xs font-black text-white leading-relaxed">غير مسموح بتصوير الشاشة المباشر 📸</h5>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed px-1">
                    يرجى استخدام زر <strong className="text-brand-gold">المشاركة</strong> أو <strong className="text-brand-gold">التحميل</strong> بالأسفل لحفظ البطاقة بأعلى دقة فنية ووضوح تام.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 mt-4 text-center leading-relaxed">
              * سيتم حفظ الصورة بدقة فائقة الوضوح ومناسبة جداً للنشر المباشر كحالة أو قصة دعوية في المنصات.
            </p>
          </div>

          {/* Right panel: Controls and premium trigger info */}
          <div className="w-full md:w-[420px] p-4 sm:p-6 flex flex-col justify-between bg-zinc-900 overflow-y-auto h-[55%] md:h-full shrink-0 md:shrink">
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
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">قوالب التصميم المتوفرة (اختر لوناً):</span>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] md:max-h-[180px] overflow-y-auto pr-1 scroll-smooth bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60 scrollbar-thin scrollbar-thumb-zinc-850">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between h-20 shrink-0 ${
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
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">نوع الخط الفني (اختر خطاً فائق الجمال):</span>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] md:max-h-[150px] overflow-y-auto pr-1 scroll-smooth bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60 scrollbar-thin scrollbar-thumb-zinc-850">
                  {CARD_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between h-16 shrink-0 ${
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
                {/* 1. Direct Share Button */}
                <button
                  onClick={() => generateCardBlobAndDownload('share')}
                  disabled={isExporting}
                  className="w-full py-3.5 bg-brand-emerald hover:bg-brand-emerald-dark disabled:bg-zinc-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-brand-emerald-light/10"
                >
                  <Share2 className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>{isExporting ? 'جاري تحضير البطاقة وتصميمها...' : 'مشاركة مباشرة 📲'}</span>
                </button>

                {/* 2. Download to Device Button */}
                <button
                  onClick={() => generateCardBlobAndDownload('download')}
                  disabled={isExporting}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>{isExporting ? 'جاري تحضير البطاقة وتصميمها...' : 'تحميل على الجهاز 📥'}</span>
                </button>

                <div className="flex justify-center items-center text-[9px] text-zinc-500 pt-1">
                  <span>الدعم والاشتراك: abuosid773@gmail.com</span>
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
