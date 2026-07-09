import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import dotenv from "dotenv";

dotenv.config();
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy 
} from "firebase/firestore";

const app = express();
const PORT = 3000;

  // Set payload limits high enough to handle photographic page captures
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Middleware to handle and strip development/preview environment subpath routing (e.g. /1416/api/...)
  app.use((req, res, next) => {
    const match = req.url.match(/^\/([^\/]+)(\/api\/.*)$/);
    if (match) {
      req.url = match[2];
    }
    next();
  });

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

  // API Route: OCR and Text Extraction with Gemini
  app.post(["/api/gemini/ocr", "/api/analyze-image"], async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: "يرجى تزويد صورة لقراءتها واستخراج النص منها." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          message: "مفتاح الـ API الخاص بجيميناي مفقود في إعدادات السيرفر أو Vercel. يرجى إضافته إلى متغيرات البيئة (GEMINI_API_KEY) لتفعيل ميزة القارئ الذكي (OCR)." 
        });
      }

      // Initialize Gemini Client Lazily
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

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
        contents: {
          parts: [
            imagePart,
            { text: "الرجاء قراءة الصورة المرفقة واستخراج كامل النص العربي المكتوب فيها بدقة عالية." }
          ]
        },
        config: {
          systemInstruction,
          temperature: 0.1,
        }
      });

      const text = response.text || "";
      return res.json({ success: true, text });
    } catch (error: any) {
      console.error("خطأ السيرفر المحلي:", error);
      console.error("Gemini OCR Error Detailed Log:", {
        message: error.message,
        stack: error.stack,
        errorObject: error,
        apiKeyPresent: !!process.env.GEMINI_API_KEY
      });
      return res.status(500).json({ 
        success: false, 
        message: error.message || "فشل قراءة الصورة واستخراج النص عبر الذكاء الاصطناعي." 
      });
    }
  });

  // Initialize Firebase using the config file or Environment Variables
  let db: any;

  try {
    let firebaseConfig: any = null;
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    
    if (fs.existsSync(firebaseConfigPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    } else if (process.env.FIREBASE_API_KEY) {
      firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || ""
      };
    }

    if (firebaseConfig) {
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
      console.log("Firebase initialized successfully on server.");
    } else {
      console.warn("No Firebase configuration found (either firebase-applet-config.json or Environment Variables).");
    }
  } catch (err) {
    console.error("Failed to initialize Firebase on server:", err);
  }

  // Pre-seed initial keys if they do not exist
  async function ensureInitialKeys() {
    if (!db) return;
    try {
      const testDocRef = doc(db, "activation_keys", "ABU-OSID-PREMIUM-1111");
      const testSnap = await getDoc(testDocRef);
      if (!testSnap.exists()) {
        console.log("Seeding initial activation keys into Firestore...");
        const initialKeys: { [key: string]: string } = {
          "ABU-OSID-PREMIUM-1111": "مفتاح تجريبي أول",
          "ABU-OSID-PREMIUM-2222": "مفتاح تجريبي ثانٍ",
          "ABU-OSID-PREMIUM-3333": "مفتاح تجريبي ثالث",
          "ABU-OSID-PREMIUM-4444": "مفتاح تجريبي رابع",
          "ABU-OSID-PREMIUM-5555": "مفتاح تجريبي خامس"
        };
        for (const [key, note] of Object.entries(initialKeys)) {
          await setDoc(doc(db, "activation_keys", key), {
            used: false,
            activatedAt: null,
            deviceId: null,
            note: note,
            createdAt: Date.now()
          });
        }
        // Initialize keys index
        const indexDocRef = doc(db, "app_state", "keys_index");
        await setDoc(indexDocRef, { keys: Object.keys(initialKeys) });
      }
    } catch (error) {
      console.error("Error seeding initial keys in Firestore:", error);
    }
  }

  // Trigger seeding
  ensureInitialKeys();

  // Helper functions to get and set dynamic admin password stored in Firestore
  async function getAdminPassword(): Promise<string> {
    if (!db) return "abuosid2026773793533";
    try {
      const adminDocRef = doc(db, "app_state", "admin");
      const adminDocSnap = await getDoc(adminDocRef);
      if (adminDocSnap.exists()) {
        const data = adminDocSnap.data();
        if (data.adminPassword) {
          return data.adminPassword;
        }
      } else {
        const defaultPass = "abuosid2026773793533";
        await setDoc(adminDocRef, { adminPassword: defaultPass });
        return defaultPass;
      }
    } catch (e) {
      console.error("Error reading admin password from Firestore:", e);
    }
    return "abuosid2026773793533";
  }

  async function setAdminPassword(newPassword: string): Promise<boolean> {
    if (!db) return false;
    try {
      const adminDocRef = doc(db, "app_state", "admin");
      await setDoc(adminDocRef, { adminPassword: newPassword });
      return true;
    } catch (e) {
      console.error("Error writing admin password to Firestore:", e);
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

  async function registerFreeUser(email: string, name?: string) {
    if (!db || !email || !email.trim()) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === "abuosid773@gmail.com") return;
    try {
      const regDocRef = doc(db, "app_state", "registered_users");
      const regSnap = await getDoc(regDocRef);
      let users: { [email: string]: { name?: string, registeredAt: number, lastActive: number } } = {};
      
      if (regSnap.exists()) {
        const data = regSnap.data();
        if (data.users) {
          users = data.users;
        }
      }

      const now = Date.now();
      if (!users[normalizedEmail]) {
        users[normalizedEmail] = {
          name: name || "",
          registeredAt: now,
          lastActive: now
        };
      } else {
        users[normalizedEmail].lastActive = now;
        if (name) users[normalizedEmail].name = name;
      }

      await setDoc(regDocRef, { users });
      console.log(`Registered/updated free user ${normalizedEmail} successfully in app_state/registered_users.`);
    } catch (error) {
      console.error("Error registering free user in database:", error);
    }
  }

  // API Route: Verify Activation Key
  app.post("/api/activate", async (req, res) => {
    try {
      const { code, deviceId } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "يرجى تزويد كود التفعيل لتتم عملية التنشيط." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const MASTER_KEYS = [
        "ABU-OSID-VIP-7777",
        "ABU-OSID-GOLD-PRO-9999",
        "ABU-OSID-MASTER-9999-PREMIUM"
      ];

      if (MASTER_KEYS.includes(normalizedCode)) {
        return res.status(200).json({
          success: true,
          message: "تم التفعيل بنجاح باستخدام كود المطور الرئيسي المعتمد!"
        });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const keyDocRef = doc(db, "activation_keys", normalizedCode);
      const keyDocSnap = await getDoc(keyDocRef);

      if (!keyDocSnap.exists()) {
        return res.status(400).json({ success: false, message: "مفتاح التفعيل هذا غير صحيح أو غير موجود." });
      }

      const keyData = keyDocSnap.data();
      if (keyData.used) {
        return res.status(400).json({ success: false, message: "مفتاح التفعيل هذا تم استخدامه مسبقاً لتنشيط جهاز آخر." });
      }

      // Mark as used in Firestore
      await updateDoc(keyDocRef, {
        used: true,
        activatedAt: Date.now(),
        deviceId: deviceId || 'unknown'
      });

      // Update persistent stats efficiently without querying all documents on every event
      try {
        const statsDocRef = doc(db, "app_state", "stats");
        const statsSnap = await getDoc(statsDocRef);
        let totalVisitors = 1;
        let totalSubscribers = 0;
        if (statsSnap.exists()) {
          const d = statsSnap.data();
          totalVisitors = d.totalVisitors || 1;
          totalSubscribers = d.totalSubscribers || 0;
        }
        totalSubscribers += 1;

        await setDoc(statsDocRef, {
          totalVisitors,
          totalSubscribers
        }, { merge: true });
      } catch (err) {
        console.error("Error updating stats during activation:", err);
      }

      return res.json({ success: true, message: "تم التحقق والتفعيل عبر الإنترنت بنجاح! تم فتح ميزة تصدير الـ PDF." });
    } catch (error) {
      console.error("Activation error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ داخلي في الخادم أثناء عملية التفعيل." });
    }
  });

  // API Route: Register Visit with detailed logs in Firestore
  app.post("/api/stats/visit", async (req, res) => {
    try {
      if (!db) {
        return res.json({ success: true, stats: { totalVisitors: 1, totalSubscribers: 0 } });
      }

      const statsDocRef = doc(db, "app_state", "stats");
      const statsSnap = await getDoc(statsDocRef);
      let totalVisitors = 0;
      let totalSubscribers = 0;
      
      if (statsSnap.exists()) {
        const d = statsSnap.data();
        totalVisitors = d.totalVisitors || 0;
        totalSubscribers = d.totalSubscribers || 0;
      }
      
      totalVisitors += 1;

      // Update stats document directly with atomic incremented values
      await setDoc(statsDocRef, {
        totalVisitors,
        totalSubscribers
      }, { merge: true });

      // Save highly accurate and detailed visit entry in "visits" collection
      try {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        const referrer = req.headers["referer"] || "direct";
        const visitId = `visit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        await setDoc(doc(db, "visits", visitId), {
          id: visitId,
          timestamp: Date.now(),
          ip: typeof ip === 'string' ? ip : String(ip),
          userAgent: typeof userAgent === 'string' ? userAgent : String(userAgent),
          referrer: typeof referrer === 'string' ? referrer : String(referrer),
          dateString: new Date().toISOString().split('T')[0],
          timeString: new Date().toLocaleTimeString('ar-EG', { timeZone: 'Asia/Riyadh' })
        });
      } catch (visitErr) {
        console.error("Error saving detailed visit record to Firestore:", visitErr);
      }

      return res.json({ success: true, stats: { totalVisitors, totalSubscribers } });
    } catch (error) {
      console.error("Stats visit error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء تسجيل الزيارة." });
    }
  });

  // API Route: Set User passcode (PIN lock) associated with their activation key in Firebase
  app.post("/api/user/set-passcode", async (req, res) => {
    try {
      const { code, passcode } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "كود التفعيل مطلوب لحماية التطبيق." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const MASTER_KEYS = [
        "ABU-OSID-VIP-7777",
        "ABU-OSID-GOLD-PRO-9999",
        "ABU-OSID-MASTER-9999-PREMIUM"
      ];

      const keyDocRef = MASTER_KEYS.includes(normalizedCode)
        ? doc(db, "activation_keys", `MASTER_${normalizedCode}`)
        : doc(db, "activation_keys", normalizedCode);

      if (!MASTER_KEYS.includes(normalizedCode)) {
        const keyDocSnap = await getDoc(keyDocRef);
        if (!keyDocSnap.exists()) {
          return res.status(400).json({ success: false, message: "كود التفعيل غير صالح للربط بالرقم السري." });
        }
      }

      // Save passcode inside Firestore
      await setDoc(keyDocRef, {
        userPasscode: passcode ? passcode.trim() : null,
        passcodeUpdatedAt: Date.now()
      }, { merge: true });

      return res.json({ success: true, message: "تم حفظ وتزامن الرقم السري لحماية مدونتك بنجاح على قاعدة البيانات السحابية! 🔒" });
    } catch (error: any) {
      console.error("Set user passcode error:", error);
      return res.status(500).json({ success: false, message: error.message || "حدث خطأ أثناء مزامنة الرقم السري." });
    }
  });

  // API Route: Verify User passcode (PIN lock) from Firebase
  app.post("/api/user/verify-passcode", async (req, res) => {
    try {
      const { code, passcode } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "كود التفعيل مطلوب للتحقق." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const MASTER_KEYS = [
        "ABU-OSID-VIP-7777",
        "ABU-OSID-GOLD-PRO-9999",
        "ABU-OSID-MASTER-9999-PREMIUM"
      ];

      const keyDocRef = MASTER_KEYS.includes(normalizedCode)
        ? doc(db, "activation_keys", `MASTER_${normalizedCode}`)
        : doc(db, "activation_keys", normalizedCode);

      const keyDocSnap = await getDoc(keyDocRef);
      if (!keyDocSnap.exists()) {
        if (MASTER_KEYS.includes(normalizedCode)) {
          return res.json({ success: true, verified: true, hasPasscode: false });
        }
        return res.status(400).json({ success: false, message: "كود التفعيل غير صحيح." });
      }

      const keyData = keyDocSnap.data();
      const savedPasscode = keyData.userPasscode;

      if (!savedPasscode) {
        return res.json({ success: true, verified: true, hasPasscode: false });
      }

      if (savedPasscode === passcode.trim()) {
        return res.json({ success: true, verified: true, hasPasscode: true });
      } else {
        return res.status(400).json({ success: false, verified: false, message: "الرمز السري غير صحيح! يرجى إعادة المحاولة." });
      }
    } catch (error: any) {
      console.error("Verify user passcode error:", error);
      return res.status(500).json({ success: false, message: error.message || "حدث خطأ أثناء التحقق من الرقم السري." });
    }
  });

  // API Route: Register Free User manually from Client
  app.post("/api/user/register", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "البريد الإلكتروني مطلوب" });
      }
      await registerFreeUser(email, name);
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Register free user error:", error);
      return res.status(500).json({ success: false, message: error.message || "حدث خطأ أثناء تسجيل المستخدم." });
    }
  });

  // API Route: Get Admin Stats
  app.post("/api/admin/stats", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPass = await getAdminPassword();
      if (password !== adminPass) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const statsDocRef = doc(db, "app_state", "stats");
      const statsSnap = await getDoc(statsDocRef);
      let totalVisitors = 0;
      if (statsSnap.exists()) {
        totalVisitors = statsSnap.data().totalVisitors || 0;
      }

      // Get keys list from keys_index
      const indexDocRef = doc(db, "app_state", "keys_index");
      const indexSnap = await getDoc(indexDocRef);
      let keyIds: string[] = [
        "ABU-OSID-PREMIUM-1111",
        "ABU-OSID-PREMIUM-2222",
        "ABU-OSID-PREMIUM-3333",
        "ABU-OSID-PREMIUM-4444",
        "ABU-OSID-PREMIUM-5555"
      ];
      
      if (indexSnap.exists()) {
        const data = indexSnap.data();
        if (Array.isArray(data.keys)) {
          keyIds = data.keys;
        }
      } else {
        await setDoc(indexDocRef, { keys: keyIds });
      }

      let usedKeysCount = 0;
      let totalKeysCount = 0;

      const fetchPromises = keyIds.map(async (keyId) => {
        try {
          const docSnap = await getDoc(doc(db!, "activation_keys", keyId));
          if (docSnap.exists()) {
            totalKeysCount++;
            if (docSnap.data().used) usedKeysCount++;
          }
        } catch (err) {
          console.error(`Error fetching key ${keyId}:`, err);
        }
      });
      await Promise.all(fetchPromises);

      // Calculate unique free users
      let totalFreeUsers = 0;
      try {
        const regDocRef = doc(db, "app_state", "registered_users");
        const regSnap = await getDoc(regDocRef);
        if (regSnap.exists()) {
          const data = regSnap.data();
          if (data.users) {
            totalFreeUsers = Object.keys(data.users).length;
          }
        }
      } catch (err) {
        console.error("Error fetching registered_users size:", err);
      }

      await setDoc(statsDocRef, {
        totalVisitors,
        totalSubscribers: usedKeysCount,
        totalFreeUsers
      }, { merge: true });

      return res.json({
        success: true,
        stats: {
          totalVisitors,
          totalSubscribers: usedKeysCount,
          totalFreeUsers,
          totalKeys: totalKeysCount,
          usedKeys: usedKeysCount,
          freeKeys: totalKeysCount - usedKeysCount
        }
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب إحصائيات التطبيق." });
    }
  });

  // API Route: Get Admin Keys (secured with password)
  app.post("/api/admin/keys", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPass = await getAdminPassword();
      if (password !== adminPass) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      // Get the keys list from keys_index
      const indexDocRef = doc(db, "app_state", "keys_index");
      const indexSnap = await getDoc(indexDocRef);
      let keyIds: string[] = [
        "ABU-OSID-PREMIUM-1111",
        "ABU-OSID-PREMIUM-2222",
        "ABU-OSID-PREMIUM-3333",
        "ABU-OSID-PREMIUM-4444",
        "ABU-OSID-PREMIUM-5555"
      ];
      
      if (indexSnap.exists()) {
        const data = indexSnap.data();
        if (Array.isArray(data.keys)) {
          keyIds = data.keys;
        }
      } else {
        await setDoc(indexDocRef, { keys: keyIds });
      }

      // Fetch all keys in parallel using getDoc
      const keys: { [key: string]: any } = {};
      let usedKeysCount = 0;
      let totalKeysCount = 0;

      const fetchPromises = keyIds.map(async (keyId) => {
        try {
          const docSnap = await getDoc(doc(db!, "activation_keys", keyId));
          if (docSnap.exists()) {
            totalKeysCount++;
            const d = docSnap.data();
            keys[keyId] = {
              used: d.used,
              activatedAt: d.activatedAt,
              deviceId: d.deviceId,
              note: d.note || "",
              createdAt: d.createdAt || 0
            };
            if (d.used) usedKeysCount++;
          }
        } catch (err) {
          console.error(`Error fetching key ${keyId}:`, err);
        }
      });
      await Promise.all(fetchPromises);

      // Calculate unique free users
      let totalFreeUsers = 0;
      try {
        const regDocRef = doc(db, "app_state", "registered_users");
        const regSnap = await getDoc(regDocRef);
        if (regSnap.exists()) {
          const data = regSnap.data();
          if (data.users) {
            totalFreeUsers = Object.keys(data.users).length;
          }
        }
      } catch (err) {
        console.error("Error fetching registered_users size:", err);
      }

      const statsDocRef = doc(db, "app_state", "stats");
      const statsSnap = await getDoc(statsDocRef);
      let totalVisitors = 0;
      if (statsSnap.exists()) {
        totalVisitors = statsSnap.data().totalVisitors || 0;
      }

      return res.json({
        success: true,
        keys: keys,
        stats: {
          totalVisitors,
          totalSubscribers: usedKeysCount,
          totalFreeUsers,
          totalKeys: totalKeysCount,
          usedKeys: usedKeysCount,
          freeKeys: totalKeysCount - usedKeysCount
        }
      });
    } catch (error: any) {
      console.error("Get admin keys error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ في جلب مفاتيح التفعيل: " + (error?.message || error) });
    }
  });

  // API Route: Generate a new single-use key
  app.post("/api/admin/generate-key", async (req, res) => {
    try {
      const { password, note } = req.body;
      const adminPass = await getAdminPassword();
      if (password !== adminPass) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const newKey = generateRandomCode();
      const keyDocRef = doc(db, "activation_keys", newKey);
      await setDoc(keyDocRef, {
        used: false,
        activatedAt: null,
        deviceId: null,
        note: note || "مفتاح لشخص واحد",
        createdAt: Date.now()
      });

      // Add to keys_index array
      try {
        const indexDocRef = doc(db, "app_state", "keys_index");
        const indexSnap = await getDoc(indexDocRef);
        let keyIds = [];
        if (indexSnap.exists()) {
          const data = indexSnap.data();
          if (Array.isArray(data.keys)) {
            keyIds = data.keys;
          }
        }
        if (!keyIds.includes(newKey)) {
          keyIds.push(newKey);
          await setDoc(indexDocRef, { keys: keyIds });
        }
      } catch (e) {
        console.error("Error updating keys_index during generate-key:", e);
      }

      return res.json({ success: true, key: newKey });
    } catch (error) {
      console.error("Key generation error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء توليد مفتاح تفعيل جديد." });
    }
  });

  // API Route: Delete an activation key
  app.post("/api/admin/delete-key", async (req, res) => {
    try {
      const { password, keyToDelete } = req.body;
      const adminPass = await getAdminPassword();
      if (password !== adminPass) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const keyDocRef = doc(db, "activation_keys", keyToDelete);
      const keyDocSnap = await getDoc(keyDocRef);
      if (keyDocSnap.exists()) {
        await deleteDoc(keyDocRef);

        // Remove from keys_index array
        try {
          const indexDocRef = doc(db, "app_state", "keys_index");
          const indexSnap = await getDoc(indexDocRef);
          if (indexSnap.exists()) {
            const data = indexSnap.data();
            if (Array.isArray(data.keys)) {
              const updatedKeys = data.keys.filter((k: string) => k !== keyToDelete);
              await setDoc(indexDocRef, { keys: updatedKeys });
            }
          }
        } catch (e) {
          console.error("Error updating keys_index during delete-key:", e);
        }

        return res.json({ success: true, message: "تم حذف مفتاح التفعيل بنجاح." });
      } else {
        return res.status(400).json({ success: false, message: "المفتاح غير موجود بالفعل." });
      }
    } catch (error) {
      console.error("Delete key error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المفتاح." });
    }
  });

  // API Route: Change Admin Password
  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { password, newPassword } = req.body;
      const currentPassword = await getAdminPassword();
      if (password !== currentPassword) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة الحالية غير صحيحة!" });
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({ success: false, message: "يجب أن تكون كلمة المرور الجديدة مكونة من 4 أحرف أو أكثر." });
      }

      const success = await setAdminPassword(newPassword.trim());
      if (success) {
        return res.json({ success: true, message: "تم تغيير كلمة مرور الإدارة بنجاح!" });
      } else {
        return res.status(500).json({ success: false, message: "فشل حفظ كلمة المرور الجديدة على قاعدة البيانات." });
      }
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء تغيير كلمة المرور." });
    }
  });

  // API Route: Reset Demo database keys (convenience for AI Studio previewing)
  app.post("/api/admin/reset-keys", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPass = await getAdminPassword();
      if (password !== adminPass) {
        return res.status(401).json({ success: false, message: "كلمة مرور الإدارة غير صحيحة!" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      // Get current list of keys from index to delete them individually
      const indexDocRef = doc(db, "app_state", "keys_index");
      const indexSnap = await getDoc(indexDocRef);
      let currentKeys: string[] = [];
      if (indexSnap.exists()) {
        currentKeys = indexSnap.data().keys || [];
      }
      
      // Delete each current key
      for (const key of currentKeys) {
        await deleteDoc(doc(db, "activation_keys", key));
      }

      // Also delete standard demo keys just in case
      const initialKeysList = [
        "ABU-OSID-PREMIUM-1111",
        "ABU-OSID-PREMIUM-2222",
        "ABU-OSID-PREMIUM-3333",
        "ABU-OSID-PREMIUM-4444",
        "ABU-OSID-PREMIUM-5555"
      ];
      for (const key of initialKeysList) {
        await deleteDoc(doc(db, "activation_keys", key));
      }

      // Seed the initial keys
      const initialKeys: { [key: string]: string } = {
        "ABU-OSID-PREMIUM-1111": "مفتاح تجريبي أول",
        "ABU-OSID-PREMIUM-2222": "مفتاح تجريبي ثانٍ",
        "ABU-OSID-PREMIUM-3333": "مفتاح تجريبي ثالث",
        "ABU-OSID-PREMIUM-4444": "مفتاح تجريبي رابع",
        "ABU-OSID-PREMIUM-5555": "مفتاح تجريبي خامس"
      };
      for (const [key, note] of Object.entries(initialKeys)) {
        await setDoc(doc(db, "activation_keys", key), {
          used: false,
          activatedAt: null,
          deviceId: null,
          note: note,
          createdAt: Date.now()
        });
      }

      // Set the index doc back to the initial list
      await setDoc(indexDocRef, { keys: initialKeysList });

      return res.json({ success: true, message: "تمت إعادة تعيين مفاتيح التفعيل لقاعدة البيانات الافتراضية بنجاح." });
    } catch (error) {
      console.error("Reset keys error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء إعادة تعيين مفاتيح التفعيل." });
    }
  });

  // API Route: Save Cloud Backup
  app.post("/api/backup/save", async (req, res) => {
    try {
      const { code, email, backupData } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "يرجى تزويد كود التفعيل لحفظ النسخة السحابية." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const keyDocRef = doc(db, "activation_keys", normalizedCode);
      const keyDocSnap = await getDoc(keyDocRef);

      if (!keyDocSnap.exists()) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح لحفظ نسخة احتياطية سحابية." });
      }

      const backupId = `cloud-${Date.now()}`;
      const backupDocRef = doc(db, "cloud_backups", backupId);
      
      const newBackup = {
        id: backupId,
        code: normalizedCode,
        email: email ? email.trim().toLowerCase() : "",
        timestamp: Date.now(),
        trigger: backupData.trigger || 'manual',
        benefitsCount: backupData.benefitsCount || 0,
        queriesCount: backupData.queriesCount || 0,
        data: backupData.data, // stringified JSON
        createdAt: Date.now()
      };

      await setDoc(backupDocRef, newBackup);

      if (email) {
        await registerFreeUser(email);
      }

      // Clean up older backups for this key/email combo if they exceed 10
      try {
        const backupKeyEmail = email ? email.trim().toLowerCase() : "";
        const backupsColl = collection(db, "cloud_backups");
        const q = query(
          backupsColl,
          where("code", "==", normalizedCode),
          where("email", "==", backupKeyEmail)
        );
        
        const snapshot = await getDocs(q);
        const userBackups: any[] = [];
        snapshot.forEach((d) => userBackups.push({ id: d.id, ...d.data() }));
        
        // Sort in descending order
        userBackups.sort((a, b) => b.timestamp - a.timestamp);
        
        // Delete extra backups beyond 10
        if (userBackups.length > 10) {
          const toDelete = userBackups.slice(10);
          for (const b of toDelete) {
            await deleteDoc(doc(db, "cloud_backups", b.id));
          }
        }
      } catch (err) {
        console.error("Error pruning old backups:", err);
      }

      return res.json({ success: true, message: "تم رفع وحفظ النسخة الاحتياطية السحابية بنجاح!", backup: newBackup });
    } catch (error) {
      console.error("Save cloud backup error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء حفظ النسخة السحابية." });
    }
  });

  // API Route: List Cloud Backups
  app.post("/api/backup/list", async (req, res) => {
    try {
      const { code, email } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "كود التفعيل مطلوب." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const keyDocRef = doc(db, "activation_keys", normalizedCode);
      const keyDocSnap = await getDoc(keyDocRef);

      if (!keyDocSnap.exists()) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح." });
      }

      const backupKeyEmail = email ? email.trim().toLowerCase() : "";
      const backupsColl = collection(db, "cloud_backups");
      const q = query(
        backupsColl,
        where("code", "==", normalizedCode),
        where("email", "==", backupKeyEmail)
      );

      const snapshot = await getDocs(q);
      const backups: any[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        backups.push({
          id: d.id,
          timestamp: d.timestamp,
          trigger: d.trigger,
          benefitsCount: d.benefitsCount,
          queriesCount: d.queriesCount,
          data: d.data
        });
      });

      // Sort in descending order
      backups.sort((a, b) => b.timestamp - a.timestamp);

      return res.json({ success: true, backups });
    } catch (error) {
      console.error("List cloud backups error:", error);
      return res.status(500).json({ success: false, message: "حدث خطأ أثناء استرداد النسخ الاحتياطية السحابية." });
    }
  });

  // API Route: Delete Cloud Backup
  app.post("/api/backup/delete", async (req, res) => {
    try {
      const { code, email, backupId } = req.body;
      if (!code || !backupId) {
        return res.status(400).json({ success: false, message: "كود التفعيل ومعرّف النسخة مطلوبان." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "قاعدة البيانات غير متصلة بالخادم حالياً." });
      }

      const normalizedCode = code.trim().toUpperCase();
      const keyDocRef = doc(db, "activation_keys", normalizedCode);
      const keyDocSnap = await getDoc(keyDocRef);

      if (!keyDocSnap.exists()) {
        return res.status(400).json({ success: false, message: "كود التفعيل غير صالح." });
      }

      const backupDocRef = doc(db, "cloud_backups", backupId);
      const backupSnap = await getDoc(backupDocRef);
      if (backupSnap.exists()) {
        await deleteDoc(backupDocRef);
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

      if (email) {
        await registerFreeUser(email, name);
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

  // Global JSON Error Handler to prevent Express crashing or sending HTML pages in development
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("خطأ السيرفر المحلي (Global Error Handler):", err);
    res.status(err.status || err.statusCode || 500).json({
      success: false,
      message: err.message || "حدث خطأ داخلي غير متوقع في الخادم المحلي."
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      try {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (e) {
        console.error("Failed to initialize Vite development server:", e);
      }
    })();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
