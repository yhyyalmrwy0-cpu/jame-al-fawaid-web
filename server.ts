import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload limits high enough to handle photographic page captures
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS Middleware to allow requests from Vercel or any origin
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: OCR and Text Extraction with Gemini
  app.post("/api/gemini/ocr", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: "يرجى تزويد صورة لقراءتها واستخراج النص منها." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: "مفتاح API الخاص بـ Gemini غير مضبوط على الخادم. يرجى تفعيله من الإعدادات." });
      }

      let base64Data = image;
      let actualMimeType = mimeType || "image/jpeg";

      if (base64Data.includes(";base64,")) {
        const parts = base64Data.split(";base64,");
        const match = parts[0].match(/data:(image\/[a-zA-Z0-9.-]+)/);
        if (match) {
          actualMimeType = match[1];
        }
        base64Data = parts[1];
      }

      const imagePart = {
        inlineData: {
          mimeType: actualMimeType,
          data: base64Data,
        },
      };

      const systemInstruction = 
        "أنت قارئ مخطوطات وكتب خبير ومساعد علمي متقدم للشيخ المطور أبو أُسيد وتطبيق 'جامع الفوائد'. مهمتك هي قراءة الصورة المرسلة بدقة متناهية واستخراج النص العربي منها بالكامل.\n" +
        "التعليمات:\n" +
        "1. قم بتفريغ النص المكتوب (سواء كان مطبوعاً أو مكتوباً بخط اليد) بدقة وبنفس الأسطر وتنسيق الفقرات قدر الإمكان.\n" +
        "2. لا تقم بإضافة أي مقدمات أو تحيات أو هوامش تعليقية من عندك (مثل: 'هذا هو النص المستخرج:' أو 'تفضل تفريغ الصورة...'). فقط اعطنا النص المستخرج مباشرة وبشكل نقي.\n" +
        "3. حافظ على التشكيل وعلامات الترقيم والآيات القرآنية والأحاديث النبوية إن وجدت في النص كما هي مكتوبة.\n" +
        "4. إذا لم تتمكن من قراءة بعض الكلمات ضعها بين معقوفتين [غير واضح] أو قدرها حسب السياق.\n" +
        "النص المستخرج:";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: "الرجاء قراءة الصورة المرفقة واستخراج كامل النص العربي المكتوب فيها بدقة عالية." }
        ],
        config: {
          systemInstruction,
          temperature: 0.1,
        }
      });

      const text = response.text || "";
      return res.json({ success: true, text });
    } catch (error: any) {
      console.error("Gemini OCR Error:", error);
      return res.status(500).json({ success: false, message: error.message || "فشل قراءة الصورة واستخراج النص عبر الذكاء الاصطناعي." });
    }
  });

  // Setup/Ensure data directory and file exists
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'activation.json');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const initialKeys = {
    "ABU-OSID-PREMIUM-1111": { used: false, activatedAt: null, deviceId: null },
    "ABU-OSID-PREMIUM-2222": { used: false, activatedAt: null, deviceId: null },
    "ABU-OSID-PREMIUM-3333": { used: false, activatedAt: null, deviceId: null },
    "ABU-OSID-PREMIUM-4444": { used: false, activatedAt: null, deviceId: null },
    "ABU-OSID-PREMIUM-5555": { used: false, activatedAt: null, deviceId: null }
  };

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ keys: initialKeys }, null, 2), 'utf-8');
  }

  // Helper functions to get and set dynamic admin password stored in JSON file
  function getAdminPassword(): string {
    try {
      if (fs.existsSync(dbPath)) {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (dbData.adminPassword) {
          if (dbData.adminPassword === "abuosid2026") {
            dbData.adminPassword = "abuosid2026773793533";
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
          }
          return dbData.adminPassword;
        }
      }
    } catch (e) {
      console.error("Error reading admin password:", e);
    }
    return "abuosid2026773793533";
  }

  function setAdminPassword(newPassword: string): boolean {
    try {
      const dbData = fs.existsSync(dbPath)
        ? JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
        : { keys: initialKeys };
      dbData.adminPassword = newPassword;
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error("Error writing admin password:", e);
      return false;
    }
  }

  // Helper to generate a random key
  function generateRandomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let block1 = "";
    let block2 = "";
    for (let i = 0; i < 4; i++) {
      block1 += chars.charAt(Math.floor(Math.random() * chars.length));
      block2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ABU-OSID-${block1}-${block2}`;
  }

  // API Route: Verify Activation Key
  app.post("/api/activate", (req, res) => {
    try {
      const { code, deviceId } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "يرجى تزويد كود التفعيل لتتم عملية التنشيط." });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const normalizedCode = code.trim().toUpperCase();
      let keyEntry = dbData.keys[normalizedCode];

      if (!keyEntry) {
        return res.status(400).json({ success: false, message: "مفتاح التفعيل هذا غير صحيح أو غير موجود." });
      }

      if (keyEntry.used) {
        return res.status(400).json({ success: false, message: "مفتاح التفعيل هذا تم استخدامه مسبقاً لتنشيط جهاز آخر." });
      }

      // Mark as used
      dbData.keys[normalizedCode] = {
        used: true,
        activatedAt: Date.now(),
        deviceId: deviceId || 'unknown'
      };

      // Update persistent stats
      dbData.stats = dbData.stats || { totalVisitors: 0, totalSubscribers: 0 };
      dbData.stats.totalSubscribers = Object.values(dbData.keys).filter((k: any) => k.used).length;

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');

      return res.json({ success: true, message: "تم التحقق والتفعيل عبر الإنترنت بنجاح! تم فتح ميزة تصدير الـ PDF." });
    } catch (error) {
      console.error("Activation error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ داخلي في الخادم أثناء عملية التفعيل." });
    }
  });

  // API Route: Register Visit
  app.post("/api/stats/visit", (req, res) => {
    try {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      dbData.stats = dbData.stats || { totalVisitors: 0, totalSubscribers: 0 };
      dbData.stats.totalVisitors = (dbData.stats.totalVisitors || 0) + 1;
      
      const usedKeysCount = Object.values(dbData.keys).filter((k: any) => k.used).length;
      dbData.stats.totalSubscribers = usedKeysCount;

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      return res.json({ success: true, stats: dbData.stats });
    } catch (error) {
      console.error("Stats visit error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء تسجيل الزيارة." });
    }
  });

  // API Route: Get Admin Stats
  app.post("/api/admin/stats", (req, res) => {
    try {
      const { password } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      dbData.stats = dbData.stats || { totalVisitors: 0, totalSubscribers: 0 };
      const usedKeysCount = Object.values(dbData.keys).filter((k: any) => k.used).length;
      dbData.stats.totalSubscribers = usedKeysCount;

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');

      return res.json({
        success: true,
        stats: {
          totalVisitors: dbData.stats.totalVisitors || 0,
          totalSubscribers: dbData.stats.totalSubscribers || 0,
          totalKeys: Object.keys(dbData.keys).length,
          usedKeys: usedKeysCount,
          freeKeys: Object.keys(dbData.keys).length - usedKeysCount
        }
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب إحصائيات التطبيق." });
    }
  });

  // API Route: Get Admin Keys (secured with password)
  app.post("/api/admin/keys", (req, res) => {
    try {
      const { password } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      dbData.stats = dbData.stats || { totalVisitors: 0, totalSubscribers: 0 };
      const usedKeysCount = Object.values(dbData.keys).filter((k: any) => k.used).length;
      dbData.stats.totalSubscribers = usedKeysCount;

      return res.json({
        success: true,
        keys: dbData.keys,
        stats: {
          totalVisitors: dbData.stats.totalVisitors || 0,
          totalSubscribers: dbData.stats.totalSubscribers || 0,
          totalKeys: Object.keys(dbData.keys).length,
          usedKeys: usedKeysCount,
          freeKeys: Object.keys(dbData.keys).length - usedKeysCount
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "حدث خطأ في جلب مفاتيح التفعيل." });
    }
  });

  // API Route: Generate a new single-use key
  app.post("/api/admin/generate-key", (req, res) => {
    try {
      const { password, note } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const newKey = generateRandomCode();

      dbData.keys[newKey] = {
        used: false,
        activatedAt: null,
        deviceId: null,
        note: note || "مفتاح لشخص واحد",
        createdAt: Date.now()
      };

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      return res.json({ success: true, key: newKey });
    } catch (error) {
      console.error("Key generation error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء توليد مفتاح تفعيل جديد." });
    }
  });

  // API Route: Delete an activation key
  app.post("/api/admin/delete-key", (req, res) => {
    try {
      const { password, keyToDelete } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      if (dbData.keys[keyToDelete]) {
        delete dbData.keys[keyToDelete];
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
        return res.json({ success: true, message: "تم حذف مفتاح التفعيل بنجاح." });
      } else {
        return res.status(400).json({ success: false, message: "المفتاح غير موجود بالفعل." });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المفتاح." });
    }
  });

  // API Route: Change Admin Password
  app.post("/api/admin/change-password", (req, res) => {
    try {
      const { password, newPassword } = req.body;
      const currentPassword = getAdminPassword();
      if (password !== currentPassword) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة الحالية غير صحيحة!" });
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({ success: false, message: "يجب أن تكون كلمة المرور الجديدة مكونة من 4 أحرف أو أكثر." });
      }

      setAdminPassword(newPassword.trim());
      return res.json({ success: true, message: "تم تغيير كلمة مرور الإدارة بنجاح!" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء تغيير كلمة المرور." });
    }
  });

  // API Route: Reset Demo database keys (convenience for AI Studio previewing)
  app.post("/api/admin/reset-keys", (req, res) => {
    try {
      const { password } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      const currentPassword = getAdminPassword();
      const dbData = { keys: initialKeys, adminPassword: currentPassword };
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      return res.json({ success: true, message: "تم إعادة تهيئة قاعدة البيانات للمفاتيح التجريبية بنجاح." });
    } catch (error) {
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء تهيئة المفاتيح." });
    }
  });

  // API Route: Save Cloud Backup
  app.post("/api/backup/save", (req, res) => {
    try {
      const { code, email, backupData } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "يرجى تزويد كود التفعيل لحفظ النسخة السحابية." });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const normalizedCode = code.trim().toUpperCase();
      const keyEntry = dbData.keys[normalizedCode];

      if (!keyEntry) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح لحفظ نسخة احتياطية سحابية." });
      }

      if (!dbData.backups) {
        dbData.backups = {};
      }

      const backupKey = email ? `${normalizedCode}_${email.trim().toLowerCase()}` : normalizedCode;

      if (!dbData.backups[backupKey]) {
        dbData.backups[backupKey] = [];
      }

      const newBackup = {
        id: `cloud-${Date.now()}`,
        timestamp: Date.now(),
        trigger: backupData.trigger || 'manual',
        benefitsCount: backupData.benefitsCount || 0,
        queriesCount: backupData.queriesCount || 0,
        data: backupData.data // stringified JSON
      };

      dbData.backups[backupKey].unshift(newBackup);
      dbData.backups[backupKey] = dbData.backups[backupKey].slice(0, 10); // store up to 10 backups

      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');

      return res.json({ success: true, message: "تم رفع وحفظ النسخة الاحتياطية السحابية بنجاح!", backup: newBackup });
    } catch (error) {
      console.error("Save cloud backup error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ النسخة السحابية." });
    }
  });

  // API Route: List Cloud Backups
  app.post("/api/backup/list", (req, res) => {
    try {
      const { code, email } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "كود التفعيل مطلوب." });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const normalizedCode = code.trim().toUpperCase();
      const keyEntry = dbData.keys[normalizedCode];

      if (!keyEntry) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح." });
      }

      const backupKey = email ? `${normalizedCode}_${email.trim().toLowerCase()}` : normalizedCode;
      const backups = dbData.backups?.[backupKey] || [];
      return res.json({ success: true, backups });
    } catch (error) {
      console.error("List cloud backups error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء استرداد النسخ الاحتياطية السحابية." });
    }
  });

  // API Route: Delete Cloud Backup
  app.post("/api/backup/delete", (req, res) => {
    try {
      const { code, email, backupId } = req.body;
      if (!code || !backupId) {
        return res.status(400).json({ success: false, message: "كود التفعيل ومعرّف النسخة مطلوبان." });
      }

      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      const normalizedCode = code.trim().toUpperCase();
      const keyEntry = dbData.keys[normalizedCode];

      if (!keyEntry) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح." });
      }

      const backupKey = email ? `${normalizedCode}_${email.trim().toLowerCase()}` : normalizedCode;

      if (dbData.backups && dbData.backups[backupKey]) {
        dbData.backups[backupKey] = dbData.backups[backupKey].filter((b: any) => b.id !== backupId);
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8');
      }

      return res.json({ success: true, message: "تم حذف النسخة الاحتياطية السحابية بنجاح." });
    } catch (error) {
      console.error("Delete cloud backup error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف النسخة السحابية." });
    }
  });

  // ==========================================
  // GOOGLE DRIVE OAUTH ENPOINTS FOR BACKUPS
  // ==========================================

  const getRedirectUri = (req: any) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const forwardedHost = req.headers["x-forwarded-host"] || req.headers.host;
    if (forwardedProto && forwardedHost) {
      return `${forwardedProto}://${forwardedHost}/auth/callback`;
    }
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return `${appUrl.replace(/\/$/, "")}/auth/callback`;
  };

  // Endpoint to fetch the Google authorization URL
  app.get("/api/auth/google/url", (req, res) => {
    try {
      const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const redirectUri = getRedirectUri(req);
 
       if (!clientId) {
         console.error("Google Client ID is missing from environment.");
         return res.status(500).json({ 
           success: false, 
           message: "رمز تطبيق جوجل غير مبرمج في السيرفر. يرجى تزويد CLIENT_ID." 
         });
       }
 
       const params = new URLSearchParams({
         client_id: clientId,
         redirect_uri: redirectUri,
         response_type: "code",
         scope: "https://www.googleapis.com/auth/drive.file openid email profile",
         access_type: "offline",
         prompt: "consent",
       });
 
       const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
       return res.json({ success: true, url });
     } catch (err: any) {
       console.error("Error generating auth url:", err);
       return res.status(500).json({ success: false, message: "فشل في توليد رابط تسجيل الدخول." });
     }
   });
 
   // Redirect callback handler for Google authentication
   app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
     const { code } = req.query;
     if (!code) {
       return res.status(400).send("الكود غير متوفر أو منتهي الصلاحية.");
     }
 
     const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
     const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
     const redirectUri = getRedirectUri(req);
 
     if (!clientId || !clientSecret) {
       console.error("Google client secrets are missing.");
       return res.status(500).send("إعدادات جوجل غير متوفرة على السيرفر (CLIENT_ID / CLIENT_SECRET)");
     }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      const tokens: any = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error("OAuth token exchange failed:", tokens);
        return res.status(400).send(`فشل تبادل كود التسجيل: ${JSON.stringify(tokens)}`);
      }

      let email = null;
      let name = null;
      try {
        const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        });
        if (userinfoResponse.ok) {
          const userinfo: any = await userinfoResponse.json();
          email = userinfo.email;
          name = userinfo.name;
        }
      } catch (err) {
        console.error("Failed to fetch Google user info:", err);
      }

      // Return a complete HTML with postMessage and self-close
      return res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>اتصال آمن بجوجل درايف</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background-color: #f7f9fa;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              color: #1e293b;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 1rem;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
              border: 1px solid #e2e8f0;
            }
            h2 { color: #10b981; margin-top: 0; }
            p { color: #64748b; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🎉 تم الاتصال بجوجل درايف بنجاح!</h2>
            <p>تم ربط خزنة فوائدك بالسحاب بأمان. سيتم إغلاق هذه النافذة تلقائياً وتحديث واجهة التطبيق...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  accessToken: ${JSON.stringify(tokens.access_token)},
                  refreshToken: ${JSON.stringify(tokens.refresh_token || null)},
                  email: ${JSON.stringify(email)},
                  name: ${JSON.stringify(name)}
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                window.location.href = '/';
              }
            } catch (err) {
              console.error("postMessage failed:", err);
              window.location.href = '/';
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging authorization code:", error);
      return res.status(500).send("حدث خطأ تقني داخلي أثناء تبادل الكود السحابي.");
    }
  });

  // Endpoint to refresh expired Google Drive access tokens
  app.post("/api/auth/google/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: "مفتاح التحديث مطلوب." });
      }

      const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ success: false, message: "إعدادات جوجل غير متوفرة على السيرفر." });
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }).toString(),
      });

      const tokens: any = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error("Google token refresh failed:", tokens);
        return res.status(400).json({ success: false, error: tokens });
      }

      return res.json({
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      return res.status(500).json({ success: false, message: "فشل تجديد مفتاح الولوج السحابي." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
