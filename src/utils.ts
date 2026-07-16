import { CATEGORIES } from './types';

/**
 * Converts a standard Gregorian date string (YYYY-MM-DD) into a dual Hijri and Gregorian Arabic formatted string.
 * Example: "2026-06-25" -> "١٠ محرم ١٤٤٨ هـ - الموافق ٢٥ يونيو ٢٠٢٦ م"
 */
export function formatToHijriAndGregorian(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Safe parse to avoid UTC timezone-shift issues
    const parts = dateStr.split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);
      // Create at noon to prevent day-shifting with timezone offsets
      dateObj = new Date(year, month, day, 12, 0, 0);
    } else {
      dateObj = new Date(dateStr);
    }

    if (isNaN(dateObj.getTime())) {
      return dateStr;
    }

    // Format Hijri using Saudi Arabia's official Um Al-Qura calendar
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Format Gregorian in Arabic locale
    const gregorianFormatter = new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const hijriFormatted = hijriFormatter.format(dateObj);
    const gregorianFormatted = gregorianFormatter.format(dateObj);

    return `${hijriFormatted} هـ - الموافق ${gregorianFormatted} م`;
  } catch (error) {
    return dateStr;
  }
}

/**
 * Returns today's date in Gregorian format (YYYY-MM-DD)
 */
export function getTodayGregorianString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Helper to get only the current Hijri year or full Hijri text for labels
 */
export function getCurrentHijriDateString(): string {
  return formatToHijriAndGregorian(getTodayGregorianString());
}

/**
 * Generates an elegant print-ready frame which renders beautifully on desktop and mobile.
 * Allows the user to download a high-quality Arabic PDF with correct font shaping, RTL, page-breaks,
 * and professional grid formatting. Supports:
 * 1. Grid Table Layout (جدول منظم)
 * 2. Scientific Book Layout (كتاب علمي مطبوع) with optional cover page and numbered pages.
 */
export function exportBenefitsToPDF(
  benefits: any[],
  style: 'grid' | 'book',
  bookTitle: string,
  authorName: string,
  appEmail: string,
  includeCover: boolean = true,
  selectedCategory: string = 'all',
  pdfTheme: string = 'emerald'
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('الرجاء السماح بالنوافذ المنبثقة (Popups) لتتمكن من تصدير ملف PDF.');
    return;
  }

  const currentDateText = formatToHijriAndGregorian(getTodayGregorianString());
  const hijriYearOnly = currentDateText.includes('١٤٤') ? currentDateText.match(/١٤٤\d/)?.[0] || '١٤٤٨' : '١٤٤٨';

  const printedBenefits = selectedCategory === 'all'
    ? benefits
    : benefits.filter(b => b.category === selectedCategory);

  const totalCount = printedBenefits.length;

  // Resolve which categories to process
  let categoriesToProcess: string[] = [];
  if (selectedCategory === 'all') {
    categoriesToProcess = CATEGORIES.filter(cat => printedBenefits.some(b => b.category === cat));
    
    // Check if there are any benefits with other categories not inside CATEGORIES
    printedBenefits.forEach(b => {
      if (b.category && !CATEGORIES.includes(b.category as any) && !categoriesToProcess.includes(b.category)) {
        categoriesToProcess.push(b.category);
      }
    });
  } else {
    categoriesToProcess = [selectedCategory];
  }

  // Dynamic Design Customizations based on chosen theme and style
  let primaryColor = '#1e3a2b';
  let accentColor = '#b5944e';
  let rowEvenColor = '#faf8f5';
  let borderColor = '#d4cfc5';
  
  let bookBg = '#fdfbf7';
  let bookPrimary = '#1e3a2b';
  let bookAccent = '#b5944e';
  let bookTextColor = '#111111';
  let bookBorder = '14px double #1e3a2b';
  let bookOutline = '3px solid #b5944e';
  let bookHeadingFont = "'Tajawal', sans-serif";
  let bookContentFont = "'Amiri', serif";
  let coverCardBg = '#fdfcf9';
  let coverAuthorBoxBg = '#f7f3e8';
  let coverAuthorBoxBorder = '1px solid #dcd3b8';
  let tableHeaderBg = '#1e3a2b';
  let tableHeaderTextColor = '#ffffff';

  if (style === 'grid') {
    if (pdfTheme === 'sapphire') {
      primaryColor = '#1e3a8a';
      accentColor = '#06b6d4';
      rowEvenColor = '#f1f5f9';
      borderColor = '#cbd5e1';
      tableHeaderBg = '#1e3a8a';
    } else if (pdfTheme === 'ruby') {
      primaryColor = '#7f1d1d';
      accentColor = '#c2410c';
      rowEvenColor = '#fff5f5';
      borderColor = '#fca5a5';
      tableHeaderBg = '#7f1d1d';
    } else if (pdfTheme === 'charcoal') {
      primaryColor = '#18181b';
      accentColor = '#10b981';
      rowEvenColor = '#f4f4f5';
      borderColor = '#e4e4e7';
      tableHeaderBg = '#18181b';
    }
  } else if (style === 'book') {
    if (pdfTheme === 'royal') {
      bookBg = '#faf5ff';
      bookPrimary = '#1e1b4b';
      bookAccent = '#eab308';
      bookTextColor = '#1e1b4b';
      bookBorder = '14px double #1e1b4b';
      bookOutline = '3px solid #eab308';
      coverCardBg = '#faf8ff';
      coverAuthorBoxBg = '#f3e8ff';
      coverAuthorBoxBorder = '1px solid #ddd6fe';
    } else if (pdfTheme === 'minimal') {
      bookBg = '#ffffff';
      bookPrimary = '#18181b';
      bookAccent = '#71717a';
      bookTextColor = '#1c1917';
      bookBorder = '2px solid #27272a';
      bookOutline = '1px dashed #a1a1aa';
      coverCardBg = '#ffffff';
      coverAuthorBoxBg = '#f4f4f5';
      coverAuthorBoxBorder = '1px solid #e4e4e7';
    }
  }

  // Generate Table/Grid layout rows safely
  let rowsHTML = '';
  if (style === 'grid') {
    categoriesToProcess.forEach(category => {
      const catBenefits = printedBenefits.filter(b => b.category === category);
      if (catBenefits.length === 0) return;

      rowsHTML += `
        <div class="category-section-title">📋 قسم ${category}</div>
        <table>
          <colgroup>
            <col style="width: 4%;">
            <col style="width: 16%;">
            <col style="width: 38%;">
            <col style="width: 12%;">
            <col style="width: 15%;">
            <col style="width: 15%;">
          </colgroup>
          <thead>
            <tr>
              <th style="text-align: center; white-space: nowrap;">م</th>
              <th style="white-space: nowrap;">العنوان</th>
              <th>نص الفائدة المقيدة</th>
              <th style="white-space: nowrap;">المصدر / الكتاب</th>
              <th style="text-align: center; white-space: nowrap;">التصنيف</th>
              <th style="text-align: center; white-space: nowrap;">تاريخ القيد</th>
            </tr>
          </thead>
          <tbody>
            ${catBenefits.map((b, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold; color: ${primaryColor};">${idx + 1}</td>
                <td style="font-weight: bold; color: #1a1a1a; font-family: 'Tajawal', sans-serif;">${b.title}</td>
                <td class="content-cell">${b.content}</td>
                <td style="color: #444; font-family: 'Tajawal', sans-serif;">${b.source || 'غير محدد'}</td>
                <td style="text-align: center; white-space: nowrap;"><span class="badge">${b.category}</span></td>
                <td style="text-align: center; color: #555; direction: rtl; font-size: 11px; white-space: nowrap;">${formatToHijriAndGregorian(b.date).split(' - ')[0]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
  }

  // Generate Scientific Book chapters/sections
  let bookChaptersHTML = '';
  if (style === 'book') {
    categoriesToProcess.forEach(category => {
      const catBenefits = printedBenefits.filter(b => b.category === category);
      if (catBenefits.length === 0) return;

      bookChaptersHTML += `
        <div class="category-section-title book-category-title">📖 قسم ${category}</div>
      `;

      bookChaptersHTML += catBenefits.map((b, idx) => `
        <div class="book-benefit">
          <div class="book-title-container">
            <span class="book-index">الفائدة (${idx + 1})</span>
            <h3 class="book-benefit-title">${b.title}</h3>
          </div>
          
          <div class="book-benefit-content">${b.content}</div>
          
          <div class="book-benefit-meta">
            <div><strong>المصدر / الكتاب:</strong> ${b.source || 'مسودة شخصية'}</div>
            <div><strong>التصنيف:</strong> ${b.category}</div>
            <div><strong>تاريخ التدوين:</strong> ${formatToHijriAndGregorian(b.date).split(' - ')[0]}</div>
          </div>
        </div>
      `).join('');
    });
  }

  // Generate Book Cover HTML if selected
  const coverHTML = includeCover && style === 'book' ? `
    <div class="book-cover">
      <!-- Decorative Gold Corners -->
      <div class="cover-corner top-right"></div>
      <div class="cover-corner top-left"></div>
      <div class="cover-corner bottom-right"></div>
      <div class="cover-corner bottom-left"></div>

      <div class="cover-top">
        <div class="cover-top-brand">خِزَانَةُ الفَوَائِدِ وَالشَّوَارِدِ العِلميَّة</div>
        <div class="cover-top-sub">« مَنْ كَتَبَ فَقَدْ قَيَّدَ، وَمَنْ حَفِظَ فَقَدْ شَرَدَ »</div>
      </div>
      
      <div class="cover-main">
        <div class="cover-ornament">✦ ❊ ✦</div>
        
        <div class="cover-title-shield">
          <h1 class="cover-title">${bookTitle || 'جامع الفوائد والفرائد العلمية'}</h1>
        </div>
        
        <div class="cover-divider"></div>
        <p class="cover-subtitle">مَجموعٌ مباركٌ يشتمل على نفائس الفوائد، وغرائب النكات، وبواهر الشوارد المستقاة من بطون الدفاتر وحواشي الكتب الأثرية</p>
        
        <div class="cover-author-box">
          <div class="cover-author-label">جَمَعَهُ وَعُنِيَ بِتَقْيِيدِهِ وَتَصْنِيفِهِ الشَّيْخُ:</div>
          <div class="cover-author">${authorName || 'طالب العلم الباحث'}</div>
        </div>
      </div>
      
      <div class="cover-footer">
        <div class="cover-date-badge">عام ${hijriYearOnly} هـ - الموافق ${new Date().getFullYear()} م</div>
        <div class="cover-sys-info">طُبِع وتنسيقه آلِياً بواسطة "تطبيق جامع الفوائد" للهواتف والأجهزة الذكية</div>
      </div>
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${bookTitle || 'جامع الفوائد'} - سجل فوائد ${authorName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
      <style>
        /* General Printing Configurations with Page Numbering */
        @page {
          size: A4 portrait;
          margin: ${style === 'grid' ? '12mm 10mm 15mm 10mm' : '20mm 15mm 20mm 15mm'};
          @bottom-center {
            content: "— " counter(page) " —";
            font-family: 'Amiri', serif;
            font-size: 12px;
            font-weight: bold;
            color: #555;
          }
        }
        
        /* Disable page numbering for the cover page specifically */
        @page :first {
          margin: 0;
          @bottom-center {
            content: "";
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Tajawal', 'Amiri', serif;
          background-color: #ffffff;
          color: #2c2c2c;
          margin: 0;
          padding: 0;
          direction: rtl;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 100%;
        }

        .container {
          width: 100%;
          max-width: 100%;
          padding: 0;
          margin: 0;
        }

        /* Scientific Book Cover Sheet Styling */
        .book-cover {
          page-break-after: always;
          page-break-inside: avoid;
          break-after: page;
          height: 255mm; /* Exact safe height to prevent overflow on first page */
          width: 100%;
          margin: 0 auto;
          padding: 20mm 15mm; /* Spacious classical padding */
          border: ${bookBorder}; /* Thick, rich scholarly double border */
          outline: ${bookOutline};  /* Golden inner geometric border line */
          outline-offset: -20px;       /* Beautifully spaced relative to double border */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          background-color: ${bookBg};
          box-sizing: border-box;
          position: relative;
        }

        /* Decorative Gold Corner Borders */
        .cover-corner {
          position: absolute;
          width: 35px;
          height: 35px;
          border-color: ${bookAccent};
          border-style: solid;
          pointer-events: none;
        }
        .cover-corner.top-right {
          top: 22px;
          right: 22px;
          border-width: 4px 4px 0 0;
        }
        .cover-corner.top-left {
          top: 22px;
          left: 22px;
          border-width: 4px 0 0 4px;
        }
        .cover-corner.bottom-right {
          bottom: 22px;
          right: 22px;
          border-width: 0 4px 4px 0;
        }
        .cover-corner.bottom-left {
          bottom: 22px;
          left: 22px;
          border-width: 0 0 4px 4px;
        }

        .cover-top {
          margin-top: 5mm;
          width: 100%;
        }

        .cover-top-brand {
          font-family: 'Tajawal', sans-serif;
          font-size: 15px;
          font-weight: 900;
          color: ${bookPrimary};
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .cover-top-sub {
          font-family: 'Amiri', serif;
          font-size: 11px;
          color: ${bookAccent};
          margin-top: 6px;
          font-weight: bold;
        }

        .cover-ornament {
          font-size: 20px;
          color: ${bookAccent};
          margin: 15px 0;
          letter-spacing: 5px;
        }

        .cover-main {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .cover-title-shield {
          border: 1px solid ${bookAccent}80;
          background: ${coverCardBg};
          padding: 20px 25px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(30, 58, 43, 0.03);
          max-width: 95%;
          width: 95%;
          margin: 5px auto;
          position: relative;
          box-sizing: border-box;
        }

        .cover-title-shield::before, .cover-title-shield::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid ${bookAccent};
          border-radius: 50%;
        }
        .cover-title-shield::before {
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          background: ${bookBg};
        }
        .cover-title-shield::after {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          background: ${bookBg};
        }

        .cover-title {
          font-family: 'Amiri', serif;
          font-size: 38px;
          font-weight: 700;
          color: ${bookPrimary};
          margin: 0;
          line-height: 1.35;
          text-shadow: 0.5px 0.5px 0px rgba(181, 148, 78, 0.2);
        }

        .cover-divider {
          width: 180px;
          height: 3px;
          background: linear-gradient(to left, transparent, ${bookAccent}, transparent);
          margin: 15px auto 15px auto;
        }

        .cover-subtitle {
          font-family: 'Amiri', serif;
          font-size: 15px;
          line-height: 1.75;
          color: #4a4a4a;
          max-width: 85%;
          margin: 0 auto 20px auto;
          text-align: center;
        }

        .cover-author-box {
          background-color: ${coverAuthorBoxBg};
          border: ${coverAuthorBoxBorder};
          border-right: 4px solid ${bookPrimary};
          border-left: 4px solid ${bookPrimary};
          padding: 12px 35px;
          border-radius: 100px;
          display: inline-block;
          max-width: 90%;
          margin: 15px auto 0 auto;
          box-shadow: 0 3px 8px rgba(181, 148, 78, 0.08);
        }

        .cover-author-label {
          font-family: 'Tajawal', sans-serif;
          font-size: 11px;
          color: ${bookAccent};
          margin-bottom: 4px;
          font-weight: 700;
        }

        .cover-author {
          font-family: 'Amiri', serif;
          font-size: 24px;
          font-weight: 700;
          color: ${bookPrimary};
        }

        .cover-footer {
          margin-bottom: 5mm;
          width: 85%;
          border-top: 1px solid ${borderColor};
          padding-top: 15px;
        }

        .cover-date-badge {
          font-family: 'Amiri', serif;
          font-size: 13px;
          font-weight: bold;
          color: ${bookPrimary};
          background-color: #fcfbfa;
          border: 1px solid ${bookAccent};
          padding: 3px 18px;
          border-radius: 30px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .cover-sys-info {
          font-family: 'Tajawal', sans-serif;
          font-size: 9px;
          color: #888;
          line-height: 1.5;
        }
        
        /* Grid Header Styling */
        .pdf-header {
          border-bottom: 2px solid ${accentColor};
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .header-title-box h1 {
          font-family: 'Tajawal', sans-serif;
          font-weight: 900;
          font-size: 24px;
          color: ${primaryColor};
          margin: 0 0 4px 0;
        }
        
        .header-title-box h2 {
          font-family: 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: ${accentColor};
          margin: 0;
        }
        
        .header-meta {
          text-align: left;
          font-size: 11px;
          color: #555;
          line-height: 1.6;
        }
        
        .header-meta strong {
          color: ${primaryColor};
        }

        /* Decorative Divider Accent */
        .decorative-bar {
          height: 3px;
          background: linear-gradient(to left, ${primaryColor}, ${accentColor}, ${primaryColor});
          margin-bottom: 20px;
          border-radius: 2px;
        }

        /* Grid Table Layout Styling */
        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid ${borderColor};
          border-radius: 8px;
          overflow: hidden;
          margin-top: 10px;
          margin-bottom: 30px;
          box-sizing: border-box;
          word-wrap: break-word;
          overflow-wrap: break-word;
          page-break-inside: auto;
        }
        
        thead {
          display: table-header-group;
        }

        tbody {
          display: table-row-group;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        th {
          background-color: ${tableHeaderBg};
          color: ${tableHeaderTextColor};
          font-weight: 700;
          font-size: 12px;
          padding: 10px 8px;
          border-bottom: 1px solid ${borderColor};
          border-left: 1px solid ${borderColor};
          text-align: right;
          font-family: 'Tajawal', sans-serif;
        }
        
        th:first-child {
          text-align: center;
        }

        th:last-child {
          border-left: none;
        }
        
        td {
          padding: 10px 8px;
          border-bottom: 1px solid ${borderColor};
          border-left: 1px solid ${borderColor};
          vertical-align: top;
          line-height: 1.6;
          font-size: 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        td:last-child {
          border-left: none;
        }

        tr:last-child td {
          border-bottom: none;
        }
        
        .content-cell {
          white-space: pre-wrap;
          font-family: 'Amiri', Georgia, serif;
          font-size: 13.5px;
          line-height: 1.7;
          color: #1a1a1a;
          text-align: justify;
        }
        
        tr:nth-child(even) {
          background-color: ${rowEvenColor};
        }
        
        .badge {
          display: inline-block;
          padding: 2px 6px;
          background-color: ${accentColor};
          color: #ffffff;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          font-family: 'Tajawal', sans-serif;
        }

        /* Scientific Book Style Layout Styling */
        .book-container {
          padding: 5px;
        }

        .book-benefit {
          page-break-inside: avoid;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 1px solid ${borderColor};
        }

        .book-benefit:last-child {
          border-bottom: none;
        }

        .book-title-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .book-index {
          background-color: ${bookPrimary};
          color: #ffffff;
          font-family: 'Tajawal', sans-serif;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          border-bottom: 2px solid ${bookAccent};
          shrink-0: 0;
        }

        .book-benefit-title {
          font-family: 'Tajawal', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: ${bookPrimary};
          margin: 0;
        }

        .book-benefit-content {
          font-family: ${bookContentFont};
          font-size: 16px;
          line-height: 1.85;
          color: ${bookTextColor};
          text-align: justify;
          text-indent: 1.2cm;
          white-space: pre-wrap;
          margin-bottom: 18px;
          padding-right: 15px;
          border-right: 2px solid ${borderColor}50;
        }

        .book-benefit-meta {
          font-family: 'Tajawal', sans-serif;
          font-size: 11px;
          color: #666;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          background-color: ${rowEvenColor};
          padding: 8px 15px;
          border-radius: 6px;
          border-right: 3px solid ${bookAccent};
        }

        /* App Metadata Footer */
        .pdf-footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 2px solid ${accentColor};
          text-align: center;
          font-size: 10.5px;
          color: #555;
          line-height: 1.8;
          page-break-inside: avoid;
        }
        
        .pdf-footer .app-brand {
          font-weight: 800;
          color: ${primaryColor};
          font-size: 13px;
          margin-bottom: 4px;
        }

        /* Responsive Print Adjustments */
        @media print {
          body {
            background-color: #ffffff;
            color: #000000;
          }
          
          table {
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid ${primaryColor} !important;
            width: 100% !important;
          }
          
          th {
            background-color: ${tableHeaderBg} !important;
            color: ${tableHeaderTextColor} !important;
            border-bottom: 1px solid ${borderColor} !important;
            border-left: 1px solid ${borderColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          th:last-child {
            border-left: none !important;
          }

          td {
            border-bottom: 1px solid ${borderColor} !important;
            border-left: 1px solid ${borderColor} !important;
          }

          td:last-child {
            border-left: none !important;
          }

          tr:last-child td {
            border-bottom: none !important;
          }
          
          tr:nth-child(even) {
            background-color: ${rowEvenColor} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .badge {
            background-color: ${accentColor} !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .book-cover {
            border: ${bookBorder} !important;
            outline: ${bookOutline} !important;
            background-color: ${bookBg} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cover-author-box {
            background-color: ${coverAuthorBoxBg} !important;
            border-right: 4px solid ${bookPrimary} !important;
            border-left: 4px solid ${bookPrimary} !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .category-section-title {
          font-family: 'Tajawal', sans-serif;
          font-size: 16px;
          font-weight: 900;
          color: ${primaryColor};
          background-color: ${rowEvenColor};
          border-right: 5px solid ${accentColor};
          padding: 8px 15px;
          margin-top: 35px;
          margin-bottom: 15px;
          border-radius: 4px;
          page-break-after: avoid;
          page-break-inside: avoid;
          display: block;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .book-category-title {
          font-size: 18px;
          border-bottom: 2px solid ${bookPrimary};
          text-align: center;
          border-right: none;
          border-left: none;
          border-top: 2px solid ${bookPrimary};
          background-color: ${bookBg};
          padding: 10px;
          margin-bottom: 25px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Optional Cover Page -->
        ${coverHTML}

        <!-- Layout 1: Academic Structured Grid Table -->
        ${style === 'grid' ? `
          <div class="pdf-header">
            <div class="header-title-box">
              <h1>${bookTitle || 'جَامِع الفَوَائِد'}</h1>
              <h2>سجل مقيدات وفوائد الشيخ / الطالب: ${authorName || 'طالب العلم'}</h2>
            </div>
            <div class="header-meta">
              <div>تاريخ الاستخراج: <strong>${currentDateText}</strong></div>
              <div>إجمالي المقيدات المطبوعة: <strong>${totalCount} فائدة علمية</strong></div>
            </div>
          </div>

          <div class="decorative-bar"></div>

          ${rowsHTML}
        ` : ''}

        <!-- Layout 2: Scholarly Printed Book Style -->
        ${style === 'book' ? `
          <div class="book-container">
            <!-- Continuous Page header (Except first page) -->
            <div class="pdf-header">
              <div class="header-title-box">
                <h1>${bookTitle || 'جَامِع الفَوَائِد'}</h1>
                <h2 style="font-family: 'Amiri', serif; font-size: 14px;">مقيدات الشيخ الموفق: ${authorName}</h2>
              </div>
              <div class="header-meta">
                <div>نسخة مطبوعة بتاريخ: <strong>${currentDateText}</strong></div>
                <div>العدد: <strong>${totalCount} مقيدة علمية</strong></div>
              </div>
            </div>
            
            <div class="decorative-bar"></div>

            <div class="book-body-flow">
              ${bookChaptersHTML}
            </div>
          </div>
        ` : ''}

        <div class="pdf-footer">
          <div class="app-brand">تم التصدير بواسطة تطبيق "جامع الفوائد" لتقييد الأوابد العلمية</div>
          <div>تطبيق ذكي لتدوين الفوائد والاستشكالات والشوارد العلمية واللغوية</div>
          <div>للتواصل والدعم العلمي للمطور: ${appEmail}</div>
        </div>
      </div>
      
      <script>
        // Trigger print/save as PDF as soon as page finishes resource loading
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 800);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generates a regular expression for smart Arabic search.
 * It ignores tashkeel (diacritics), standardizes hamzas, converts Arabic/Eastern and Western digits interchangeably,
 * and matches space with punctuation/spaces. It also supports Arabic ligatures matching.
 */
export function getArabicSearchRegex(query: string): RegExp | null {
  if (!query || !query.trim()) return null;
  
  // Clean the query: trim, normalize spacing, and decompose compatibility presentation forms via NFKC
  const cleanQuery = query.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (!cleanQuery) return null;
  
  // Strip diacritics from the search query itself first so they don't interfere
  let diacriticsRemoved = cleanQuery.replace(/[\u064B-\u065F\u0670]/g, '');
  
  // Decompose ligatures in query so the loop handles them properly
  diacriticsRemoved = diacriticsRemoved.replace(/ﷲ/g, 'الله');
  diacriticsRemoved = diacriticsRemoved.replace(/[\uFDF2]/g, 'الله');
  diacriticsRemoved = diacriticsRemoved.replace(/ﻷ/g, 'لأ');
  diacriticsRemoved = diacriticsRemoved.replace(/[\uFEF7\uFEF8]/g, 'لأ');
  diacriticsRemoved = diacriticsRemoved.replace(/ﻹ/g, 'لإ');
  diacriticsRemoved = diacriticsRemoved.replace(/[\uFEF9\uFEFA]/g, 'لإ');
  diacriticsRemoved = diacriticsRemoved.replace(/ﻵ/g, 'لآ');
  diacriticsRemoved = diacriticsRemoved.replace(/[\uFEF5\uFEF6]/g, 'لآ');
  diacriticsRemoved = diacriticsRemoved.replace(/ﻻ/g, 'لا');
  diacriticsRemoved = diacriticsRemoved.replace(/[\uFEFB\uFEFC]/g, 'لا');
  
  let regexStr = '';
  
  for (let i = 0; i < diacriticsRemoved.length; i++) {
    const char = diacriticsRemoved[i];
    const nextChar = diacriticsRemoved[i + 1];
    
    // Check for Lam-Alef sequence to match standard form and ligatures
    if (char === 'ل' && nextChar && /[اأإآ]/.test(nextChar)) {
      if (nextChar === 'أ') {
        regexStr += '(?:ل[\\u064B-\\u065F\\u0670]*أ|[\uFEF7\uFEF8])[\\u064B-\\u065F\\u0670]*';
      } else if (nextChar === 'إ') {
        regexStr += '(?:ل[\\u064B-\\u065F\\u0670]*إ|[\uFEF9\uFEFA])[\\u064B-\\u065F\\u0670]*';
      } else if (nextChar === 'آ') {
        regexStr += '(?:ل[\\u064B-\\u065F\\u0670]*آ|[\uFEF5\uFEF6])[\\u064B-\\u065F\\u0670]*';
      } else {
        regexStr += '(?:ل[\\u064B-\\u065F\\u0670]*[اٱ]|[\uFEFB\uFEFC])[\\u064B-\\u065F\\u0670]*';
      }
      i++; // Skip next character
    } else if (char === 'ا' && diacriticsRemoved.substring(i, i + 4) === 'الله') {
      regexStr += '(?:ا[\\u064B-\\u065F\\u0670]*ل[\\u064B-\\u065F\\u0670]*ل[\\u064B-\\u065F\\u0670]*ه|[\uFDF2])[\\u064B-\\u065F\\u0670]*';
      i += 3; // Skip ل, ل, ه
    } else if (/[اأإآٱ]/.test(char)) {
      regexStr += '[اأإآٱ][\\u064B-\\u065F\\u0670]*';
    } else if (/[هة]/.test(char)) {
      regexStr += '[هة][\\u064B-\\u065F\\u0670]*';
    } else if (/[يىئ]/.test(char)) {
      regexStr += '[يىئ][\\u064B-\\u065F\\u0670]*';
    } else if (/[وؤ]/.test(char)) {
      regexStr += '[وؤ][\\u064B-\\u065F\\u0670]*';
    } else if (char === 'ء') {
      regexStr += '[ءأإآؤئ][\\u064B-\\u065F\\u0670]*';
    } else if (/[0٠]/.test(char)) {
      regexStr += '[0٠]';
    } else if (/[1١]/.test(char)) {
      regexStr += '[1١]';
    } else if (/[2٢]/.test(char)) {
      regexStr += '[2٢]';
    } else if (/[3٣]/.test(char)) {
      regexStr += '[3٣]';
    } else if (/[4٤]/.test(char)) {
      regexStr += '[4٤]';
    } else if (/[5٥]/.test(char)) {
      regexStr += '[5٥]';
    } else if (/[6٦]/.test(char)) {
      regexStr += '[6٦]';
    } else if (/[7٧]/.test(char)) {
      regexStr += '[7٧]';
    } else if (/[8٨]/.test(char)) {
      regexStr += '[8٨]';
    } else if (/[9٩]/.test(char)) {
      regexStr += '[9٩]';
    } else if (char === ' ') {
      regexStr += '[^a-zA-Z0-9\\u0621-\\u064A\\u0660-\\u0669\\u06F0-\\u06F9\\u064B-\\u065F\\u0670]+';
    } else {
      const escaped = char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      regexStr += `${escaped}[\\u064B-\\u065F\\u0670]*`;
    }
  }
  
  try {
    return new RegExp(`(${regexStr})`, 'gi');
  } catch (e) {
    console.error('Error creating Arabic search regex:', e);
    return null;
  }
}

/**
 * Normalizes Arabic text for 100% accurate and reliable search matching.
 * It strips Tashkeel (diacritics), Kashida (tatweel), zero-width characters, 
 * control characters (often copied from Maktaba Shamela), Quranic signs, 
 * standardizes hamzas, converts Taa Marbuta to Haa, and Alef Maqsura to Yaa.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  // Use compatibility normalization (NFKC) to resolve Arabic Presentation Forms-A and Forms-B
  // (e.g. ﺣ, ﺪ, ﺛ, ﻨ, ﺎ, ﷲ, ﻻ, ﻷ, ﻹ, ﻵ) into standard Arabic letters instantly and reliably.
  let normalized = text.normalize('NFKC').toLowerCase();
  
  // 1. Decompose Arabic ligatures (e.g. ﷲ, ﻻ, ﻷ, ﻹ, ﻵ) into separate standard characters (just in case)
  normalized = normalized.replace(/ﷲ/g, 'الله');
  normalized = normalized.replace(/[\uFDF2]/g, 'الله');
  
  normalized = normalized.replace(/ﻷ/g, 'لأ');
  normalized = normalized.replace(/[\uFEF7\uFEF8]/g, 'لأ');
  
  normalized = normalized.replace(/ﻹ/g, 'لإ');
  normalized = normalized.replace(/[\uFEF9\uFEFA]/g, 'لإ');
  
  normalized = normalized.replace(/ﻵ/g, 'لآ');
  normalized = normalized.replace(/[\uFEF5\uFEF6]/g, 'لآ');
  
  normalized = normalized.replace(/ﻻ/g, 'لا');
  normalized = normalized.replace(/[\uFEFB\uFEFC]/g, 'لا');
  
  // 2. Remove Kashida / Tatweel (ـ)
  normalized = normalized.replace(/\u0640/g, '');
  
  // 3. Remove all zero-width characters, soft hyphens, word joiners, and bidi control characters
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00AD\u202A-\u202E\u2060\u2066-\u2069\u00a0]/g, ' ');
  
  // 4. Remove standard Arabic diacritics (tashkeel & Quranic signs)
  // Fatha, Damma, Kasra, Shadda, Sukun, Tanween (Fathatayn, Dammatayn, Kasratayn), Superscript Alef
  // Range: \u064B to \u065F, and \u0670. Plus extended Quranic signs: \u06D6 to \u06ED, and \u0610-\u061A
  normalized = normalized.replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '');
  
  // 5. Normalize hamzas and different shapes of Alef to a plain Alef (ا)
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');
  
  // 6. Normalize Taa Marbuta (ة) to Haa (ه)
  normalized = normalized.replace(/ة/g, 'ه');
  
  // 7. Normalize Alef Maqsura (ى) to Yaa (ي)
  normalized = normalized.replace(/ى/g, 'ي');
  
  // 8. Normalize Hamza variants (ؤ, ئ) to a standalone Hamza (ء)
  normalized = normalized.replace(/[ؤئ]/g, 'ء');
  
  // 9. Remove ornamental Quranic brackets ﴿ ﴾
  normalized = normalized.replace(/[﴿﴾]/g, '');
  
  // 10. Replace punctuation, symbols, and any non-alphanumeric, non-Arabic character with a space to allow clean keyword searching
  normalized = normalized.replace(/[^a-z0-9\u0621-\u064A\u0660-\u0669\u06F0-\u06F9]/g, ' ');
  
  // 11. Collapse multiple spaces into a single space and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Finds matching ranges/spans in original text based on a normalized query.
 * This ensures that even if the original text contains diacritics, presentation forms,
 * ligatures, or punctuation, highlighting will still accurately target the original characters.
 */
export function getHighlightSpans(originalText: string, query: string): { start: number; end: number }[] {
  if (!originalText || !query || !query.trim()) return [];
  
  // Clean query similarly to how we clean text
  const cleanQuery = query.normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '');
  
  const simplifiedQueryChars: string[] = [];
  for (let i = 0; i < cleanQuery.length; i++) {
    let char = cleanQuery[i];
    if (/[أإآٱ]/.test(char)) {
      char = 'ا';
    } else if (char === 'ة') {
      char = 'ه';
    } else if (char === 'ى') {
      char = 'ي';
    } else if (/[ؤئ]/.test(char)) {
      char = 'ء';
    } else if (/[﴿﴾]/.test(char)) {
      continue;
    } else if (/[^a-z0-9\u0621-\u064A\u0660-\u0669\u06F0-\u06F9]/.test(char)) {
      char = ' ';
    }
    simplifiedQueryChars.push(char);
  }
  
  // Collapse spaces in simplifiedQuery
  const collapsedQueryChars: string[] = [];
  for (let i = 0; i < simplifiedQueryChars.length; i++) {
    const c = simplifiedQueryChars[i];
    if (c === ' ') {
      if (collapsedQueryChars.length > 0 && collapsedQueryChars[collapsedQueryChars.length - 1] !== ' ') {
        collapsedQueryChars.push(' ');
      }
    } else {
      collapsedQueryChars.push(c);
    }
  }
  const finalQuery = collapsedQueryChars.join('').trim();
  if (!finalQuery) return [];
  
  // Now, build clean mapping of the original text
  const cleanTextChars: string[] = [];
  const origIndices: number[] = [];
  
  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];
    
    // Check for ignored characters
    const isDiacritic = /[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/.test(char);
    const isKashida = char === '\u0640';
    const isZeroWidthOrBidi = /[\u200B-\u200D\uFEFF\u200E\u200F\u00AD\u202A-\u202E\u2060\u2066-\u2069\u00a0]/.test(char);
    
    if (isDiacritic || isKashida || isZeroWidthOrBidi) {
      continue;
    }
    
    let normalizedChar = char.normalize('NFKC').toLowerCase();
    
    // Manual fallbacks
    if (normalizedChar === 'ﷲ' || normalizedChar === '\uFDF2') {
      normalizedChar = 'الله';
    } else if (normalizedChar === 'ﻷ' || normalizedChar === '\uFEF7' || normalizedChar === '\uFEF8') {
      normalizedChar = 'لأ';
    } else if (normalizedChar === 'ﻹ' || normalizedChar === '\uFEF9' || normalizedChar === '\uFEFA') {
      normalizedChar = 'لإ';
    } else if (normalizedChar === 'ﻵ' || normalizedChar === '\uFEF5' || normalizedChar === '\uFEF6') {
      normalizedChar = 'لآ';
    } else if (normalizedChar === 'ﻻ' || normalizedChar === '\uFEFB' || normalizedChar === '\uFEFC') {
      normalizedChar = 'لا';
    }
    
    for (let j = 0; j < normalizedChar.length; j++) {
      let subChar = normalizedChar[j];
      
      if (/[أإآٱ]/.test(subChar)) {
        subChar = 'ا';
      } else if (subChar === 'ة') {
        subChar = 'ه';
      } else if (subChar === 'ى') {
        subChar = 'ي';
      } else if (/[ؤئ]/.test(subChar)) {
        subChar = 'ء';
      } else if (/[﴿﴾]/.test(subChar)) {
        continue;
      } else if (/[^a-z0-9\u0621-\u064A\u0660-\u0669\u06F0-\u06F9]/.test(subChar)) {
        subChar = ' ';
      }
      
      cleanTextChars.push(subChar);
      origIndices.push(i);
    }
  }
  
  // Collapse spaces and adjust origIndices
  const finalCleanChars: string[] = [];
  const finalOrigIndices: number[] = [];
  
  for (let k = 0; k < cleanTextChars.length; k++) {
    const c = cleanTextChars[k];
    if (c === ' ') {
      if (finalCleanChars.length > 0 && finalCleanChars[finalCleanChars.length - 1] !== ' ') {
        finalCleanChars.push(' ');
        finalOrigIndices.push(origIndices[k]);
      }
    } else {
      finalCleanChars.push(c);
      finalOrigIndices.push(origIndices[k]);
    }
  }
  
  const cleanText = finalCleanChars.join('');
  const spans: { start: number; end: number }[] = [];
  let index = cleanText.indexOf(finalQuery);
  
  while (index !== -1) {
    const matchStartInClean = index;
    const matchEndInClean = index + finalQuery.length - 1;
    
    const startInOrig = finalOrigIndices[matchStartInClean];
    const endInOrig = matchEndInClean < finalOrigIndices.length - 1 
      ? finalOrigIndices[matchEndInClean + 1] 
      : originalText.length;
    
    if (startInOrig !== undefined && endInOrig !== undefined && startInOrig < endInOrig) {
      spans.push({ start: startInOrig, end: endInOrig });
    }
    
    index = cleanText.indexOf(finalQuery, index + 1);
  }
  
  if (spans.length <= 1) return spans;
  
  spans.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const last = merged[merged.length - 1];
    const curr = spans[i];
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push(curr);
    }
  }
  
  return merged;
}

