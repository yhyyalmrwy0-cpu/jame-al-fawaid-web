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
  selectedCategory: string = 'all'
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
            <col style="width: 5%;">
            <col style="width: 20%;">
            <col style="width: 45%;">
            <col style="width: 12%;">
            <col style="width: 10%;">
            <col style="width: 8%;">
          </colgroup>
          <thead>
            <tr>
              <th style="text-align: center;">م</th>
              <th>العنوان</th>
              <th>نص الفائدة المقيدة</th>
              <th>المصدر / الكتاب</th>
              <th style="text-align: center;">التصنيف</th>
              <th style="text-align: center;">تاريخ القيد</th>
            </tr>
          </thead>
          <tbody>
            ${catBenefits.map((b, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold; color: #1e3a2b;">${idx + 1}</td>
                <td style="font-weight: bold; color: #1a1a1a; font-family: 'Tajawal', sans-serif;">${b.title}</td>
                <td class="content-cell">${b.content}</td>
                <td style="color: #444; font-family: 'Tajawal', sans-serif;">${b.source || 'غير محدد'}</td>
                <td style="text-align: center;"><span class="badge">${b.category}</span></td>
                <td style="text-align: center; color: #555; direction: rtl; font-size: 11px;">${formatToHijriAndGregorian(b.date).split(' - ')[0]}</td>
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
          margin: 20mm 15mm 20mm 15mm;
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
          height: 297mm; /* Exact A4 standard height to fill the entire first page perfectly */
          width: 210mm;  /* Exact A4 standard width */
          margin: 0 auto;
          padding: 30mm 20mm; /* Spacious classical padding */
          border: 14px double #1e3a2b; /* Thick, rich scholarly double border */
          outline: 3px solid #b5944e;  /* Golden inner geometric border line */
          outline-offset: -24px;       /* Beautifully spaced relative to double border */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          background-color: #fdfbf7;
          box-sizing: border-box;
          position: relative;
        }

        /* Decorative Gold Corner Borders */
        .cover-corner {
          position: absolute;
          width: 35px;
          height: 35px;
          border-color: #b5944e;
          border-style: solid;
          pointer-events: none;
        }
        .cover-corner.top-right {
          top: 26px;
          right: 26px;
          border-width: 4px 4px 0 0;
        }
        .cover-corner.top-left {
          top: 26px;
          left: 26px;
          border-width: 4px 0 0 4px;
        }
        .cover-corner.bottom-right {
          bottom: 26px;
          right: 26px;
          border-width: 0 4px 4px 0;
        }
        .cover-corner.bottom-left {
          bottom: 26px;
          left: 26px;
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
          color: #1e3a2b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .cover-top-sub {
          font-family: 'Amiri', serif;
          font-size: 11px;
          color: #b5944e;
          margin-top: 6px;
          font-weight: bold;
        }

        .cover-ornament {
          font-size: 20px;
          color: #b5944e;
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
          border: 1px solid rgba(181, 148, 78, 0.4);
          background: #fdfcf9;
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
          border: 1px solid #b5944e;
          border-radius: 50%;
        }
        .cover-title-shield::before {
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          background: #fdfbf7;
        }
        .cover-title-shield::after {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          background: #fdfbf7;
        }

        .cover-title {
          font-family: 'Amiri', serif;
          font-size: 38px;
          font-weight: 700;
          color: #1e3a2b;
          margin: 0;
          line-height: 1.35;
          text-shadow: 0.5px 0.5px 0px rgba(181, 148, 78, 0.2);
        }

        .cover-divider {
          width: 180px;
          height: 3px;
          background: linear-gradient(to left, transparent, #b5944e, transparent);
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
          background-color: #f7f3e8;
          border: 1px solid #dcd3b8;
          border-right: 4px solid #1e3a2b;
          border-left: 4px solid #1e3a2b;
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
          color: #706856;
          margin-bottom: 4px;
          font-weight: 700;
        }

        .cover-author {
          font-family: 'Amiri', serif;
          font-size: 24px;
          font-weight: 700;
          color: #1e3a2b;
        }

        .cover-footer {
          margin-bottom: 5mm;
          width: 85%;
          border-top: 1px solid #e2ddcf;
          padding-top: 15px;
        }

        .cover-date-badge {
          font-family: 'Amiri', serif;
          font-size: 13px;
          font-weight: bold;
          color: #1e3a2b;
          background-color: #fcfbfa;
          border: 1px solid #b5944e;
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
          border-bottom: 2px solid #b5944e;
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
          color: #1e3a2b;
          margin: 0 0 4px 0;
        }
        
        .header-title-box h2 {
          font-family: 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: #b5944e;
          margin: 0;
        }
        
        .header-meta {
          text-align: left;
          font-size: 11px;
          color: #555;
          line-height: 1.6;
        }
        
        .header-meta strong {
          color: #1e3a2b;
        }

        /* Decorative Divider Accent */
        .decorative-bar {
          height: 3px;
          background: linear-gradient(to left, #1e3a2b, #b5944e, #1e3a2b);
          margin-bottom: 20px;
          border-radius: 2px;
        }

        /* Grid Table Layout Styling */
        table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 30px;
          box-sizing: border-box;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        tr {
          page-break-inside: auto;
        }
        
        th {
          background-color: #1e3a2b;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          padding: 10px 8px;
          border: 1px solid #1e3a2b;
          text-align: right;
          font-family: 'Tajawal', sans-serif;
        }
        
        th:first-child {
          text-align: center;
        }
        
        td {
          padding: 10px 8px;
          border: 1px solid #d4cfc5;
          vertical-align: top;
          line-height: 1.6;
          font-size: 12px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
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
          background-color: #faf8f5;
        }
        
        .badge {
          display: inline-block;
          padding: 2px 6px;
          background-color: #b5944e;
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
          border-bottom: 1px solid #e8e2d5;
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
          background-color: #1e3a2b;
          color: #ffffff;
          font-family: 'Tajawal', sans-serif;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          border-bottom: 2px solid #b5944e;
          shrink-0: 0;
        }

        .book-benefit-title {
          font-family: 'Tajawal', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #1e3a2b;
          margin: 0;
        }

        .book-benefit-content {
          font-family: 'Amiri', serif;
          font-size: 16px;
          line-height: 1.85;
          color: #111111;
          text-align: justify;
          text-indent: 1.2cm;
          white-space: pre-wrap;
          margin-bottom: 18px;
          padding-right: 15px;
          border-right: 2px solid #f0eae1;
        }

        .book-benefit-meta {
          font-family: 'Tajawal', sans-serif;
          font-size: 11px;
          color: #666;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          background-color: #faf8f5;
          padding: 8px 15px;
          border-radius: 6px;
          border-right: 3px solid #b5944e;
        }

        /* App Metadata Footer */
        .pdf-footer {
          margin-top: 40px;
          padding-top: 15px;
          border-top: 2px solid #b5944e;
          text-align: center;
          font-size: 10.5px;
          color: #555;
          line-height: 1.8;
          page-break-inside: avoid;
        }
        
        .pdf-footer .app-brand {
          font-weight: 800;
          color: #1e3a2b;
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
            border: 1px solid #1e3a2b;
            width: 100% !important;
          }
          
          th {
            background-color: #1e3a2b !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          tr:nth-child(even) {
            background-color: #faf8f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .badge {
            background-color: #b5944e !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .book-cover {
            border: 12px double #1e3a2b !important;
            outline: 2px solid #b5944e !important;
            background-color: #fcfbfa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cover-author-box {
            background-color: #f4efe2 !important;
            border-right: 4px solid #1e3a2b !important;
            border-left: 4px solid #1e3a2b !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .category-section-title {
          font-family: 'Tajawal', sans-serif;
          font-size: 16px;
          font-weight: 900;
          color: #1e3a2b;
          background-color: #f7f3e8;
          border-right: 5px solid #b5944e;
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
          border-bottom: 2px solid #1e3a2b;
          text-align: center;
          border-right: none;
          border-left: none;
          border-top: 2px solid #1e3a2b;
          background-color: #fcfbfa;
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
