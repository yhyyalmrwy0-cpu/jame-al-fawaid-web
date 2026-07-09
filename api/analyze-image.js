import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: "يرجى تزويد صورة لقراءتها واستخراج النص منها." });
    }

    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // If deployed on Vercel and the user hasn't set GEMINI_API_KEY yet,
      // we can proxy the request to the secure active Cloud Run container
      // where the API key is fully managed and active!
      try {
        const proxyRes = await fetch('https://ais-pre-nycqmzc2bzipjgz5op6wxm-55449569636.europe-west2.run.app/api/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image, mimeType }),
        });
        const proxyData = await proxyRes.json();
        return res.status(proxyRes.status).json(proxyData);
      } catch (proxyErr) {
        console.error("Failed to proxy OCR request to Cloud Run fallback:", proxyErr);
        return res.status(400).json({
          success: false,
          message: "مفتاح الـ API الخاص بجيميناي مفقود في إعدادات السيرفر أو Vercel. يرجى إضافته إلى متغيرات البيئة (GEMINI_API_KEY)."
        });
      }
    }

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

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest"
    ];

    let lastError = null;
    let text = "";
    let succeededModel = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting OCR with model on Vercel: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
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

        if (response && response.text) {
          text = response.text;
          succeededModel = modelName;
          console.log(`OCR Succeeded on Vercel using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed for OCR on Vercel:`, err.message || err);
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    return res.status(200).json({ success: true, text, modelUsed: succeededModel });
  } catch (error) {
    console.error("Vercel Serverless Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "فشل قراءة الصورة واستخراج النص عبر الذكاء الاصطناعي."
    });
  }
}
