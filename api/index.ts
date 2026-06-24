/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai, platform: "vercel" });
});

// API: AI-Powered Content Extraction from lecture notes or transcript
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { content, sectionId, sectionTitle } = req.body;

    if (!content) {
      return res.status(400).json({ error: "محتوى المحاضرة مطلوب للتحليل" });
    }

    if (!ai) {
      return res.status(503).json({ 
        error: "مفتاح Gemini API غير مهيأ بعد. يرجى تفعيله في الإعدادات أو استخدام البيانات الأساسية المتاحة." 
      });
    }

    const systemInstruction = `أنت خبير تسويق واستراتيجي أعمال ذكي ومتحدث باللغة العربية الفصحى الفخمة والمنسقة.
مهمتك هي تحليل نص المحاضرة/الدرس التعليمي المدخل واستخراج خطة عمل مخصصة للقسم المحدد: "${sectionTitle}" (المعرف: ${sectionId}).
يجب أن تركز مخرجاتك بنسبة 100% على محتوى المحاضرة وتقوم بصياغتها كتمارين عملية (حقول عمل مخصصة) مع تزويد المستخدم بدليل تنفيذ ذكي (نصائح تفصيلية تشرح "كيف" يجيب).
يجب أن تعيد النتيجة بتنسيق JSON متوافق تماماً مع المخطط (Schema) التالي فقط.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        extractedTitle: {
          type: Type.STRING,
          description: "عنوان استراتيجي فخم ومخصص ومستخرج من المحاضرة للقسم"
        },
        extractedDescription: {
          type: Type.STRING,
          description: "شرح وجيز ملهم للمهمة الموكلة للمستخدم بناءً على الدرس"
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "معرف فريد للتمرين بالإنجليزية مثل field_1" },
              label: { type: Type.STRING, description: "السؤال العملي المباشر باللغة العربية الفصحى" },
              placeholder: { type: Type.STRING, description: "نص مساعد يوضح للعميل نموذج الإجابة المطلوبة" },
              guideTitle: { type: Type.STRING, description: "عنوان فقرة طريقة التنفيذ" },
              guideDescription: { type: Type.STRING, description: "شرح مبسط لكيفية صياغة الإجابة" },
              guidePoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "خطوات تنفيذية عملية (3 نقاط على الأقل)"
              },
              guideQuote: { type: Type.STRING, description: "اقتباس ملهم يعكس فلسفة هذا التمرين" }
            },
            required: ["id", "label", "placeholder", "guideTitle", "guideDescription", "guidePoints"]
          }
        },
        floatingTip: {
          type: Type.STRING,
          description: "أهم نصيحة سريعة ومختصرة يمكن للمساعد العائم تقديمها للمستخدم أثناء ملء هذا القسم"
        }
      },
      required: ["extractedTitle", "extractedDescription", "exercises", "floatingTip"]
    };

    const prompt = `حلل نص المحاضرة التالي واستخرج منه التمارين ودليل التنفيذ الخاص بالقسم "${sectionTitle}":

--- نص المحاضرة ---
${content}
------------------`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    res.json(data);
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء معالجة المحتوى بواسطة الذكاء الاصطناعي." });
  }
});

// API: AI Floating Assistant chat context advisor
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { sectionId, sectionTitle, userAnswers, currentQuestion } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: "الذكاء الاصطناعي غير متوفر حالياً. يرجى إعداد مفتاح API في الإعدادات."
      });
    }

    const systemInstruction = `أنت المساعد الذكي العائم لمنصة "المنصة الدراسية التفاعلية الذكية".
مهمتك هي تقديم نصيحة ذهبية فورية، ذكية، وعميقة للمستخدم بناءً على القسم الذي يدرسه حالياً والبيانات التي أدخلها.
خاطب المستخدم بلغة عربية فخمة، بليغة ومباشرة جداً دون إطالة (بحد أقصى 150 كلمة).
تجنب الردود العامة، واجعل نصيحتك مخصصة جداً لما يكتبه أو يدرسه.`;

    const prompt = `المستخدم يتواجد حالياً في قسم: "${sectionTitle}" (${sectionId}).
${currentQuestion ? `يقوم حالياً بملء حقل: "${currentQuestion}"` : ""}
البيانات الحالية التي قام بكتابتها في هذا القسم حتى الآن:
${JSON.stringify(userAnswers || {}, null, 2)}

أعطِ المستخدم نصيحة تسويقية استراتيجية فريدة لمساعدته على إكمال هذا العمل بذكاء، مع استخلاص توصية بناءً على المدخلات المكتوبة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({ advice: response.text });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({ error: error.message || "فشل جلب نصيحة المساعد الذكي." });
  }
});

export default app;
