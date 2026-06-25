/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Sparkles, Send, Loader2, Info } from "lucide-react";
import { defaultLectures } from "../data/defaultLectures";

interface FloatingAssistantProps {
  activeSectionId: string;
  userAnswers: any;
  id?: string;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  activeSectionId,
  userAnswers,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get active section info
  const activeSection = defaultLectures.find((sec) => sec.id === activeSectionId) || defaultLectures[0];

  // Whenever section changes, clear previous AI advice to let user fetch new relevant one
  useEffect(() => {
    setAiAdvice(null);
    setError(null);
  }, [activeSectionId]);

  const fetchAIAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("custom_gemini_api_key") || ""
        },
        body: JSON.stringify({
          sectionId: activeSectionId,
          sectionTitle: activeSection.title,
          userAnswers: userAnswers[activeSectionId] || {}
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل الاتصال بالخادم");
      }

      const data = await response.json();
      setAiAdvice(data.advice);
    } catch (err: any) {
      console.error(err);
      setError("الذكاء الاصطناعي غير متصل حالياً بمفتاح API مفعل. إليك النصيحة المجهزة مسبقاً لهذا الموديول:");
    } finally {
      setLoading(false);
    }
  };

  // Preloaded tip as fallback
  const fallbackTip = activeSection.tips[0]?.quote || "ركز على جودة التفاصيل وابنِ خطتك خطوة بخطوة للوصول لجمهورك.";

  return (
    <div id={id || "floating-ai-assistant"} className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute bottom-16 left-0 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-right"
          >
            {/* Header */}
            <div className="bg-brand-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-secondary/20 p-1.5 rounded-full text-brand-secondary animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">مستشارك التسويقي الذكي</h3>
                  <p className="text-[10px] text-brand-secondary">مدعوم بـ Gemini 3.5 Flash</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              <div className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
                <Info className="w-4 h-4 text-brand-primary dark:text-brand-secondary shrink-0 mt-0.5" />
                <p>
                  أنت متواجد حالياً في موديول <span className="font-bold text-brand-primary dark:text-brand-secondary">"{activeSection.title}"</span>. انقر أدناه للحصول على استشارة تسويقية مخصصة بناءً على إجاباتك الحالية!
                </p>
              </div>

              {/* Advice box */}
              <div className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-2xl">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Loader2 className="w-7 h-7 text-brand-secondary animate-spin" />
                    <p className="text-xs text-stone-500">جاري تحليل بياناتك واستنباط الحل الاستراتيجي...</p>
                  </div>
                ) : aiAdvice ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-brand-primary dark:text-brand-secondary flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> استشارة مخصصة لك:
                    </p>
                    <p className="text-xs leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                      {aiAdvice}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {error && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed font-semibold">
                        {error}
                      </p>
                    )}
                    <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      أهم نصيحة لهذا القسم:
                    </p>
                    <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 italic">
                      "{fallbackTip}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {!aiAdvice && !loading && (
                <button
                  onClick={fetchAIAdvice}
                  className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 font-bold text-xs rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد نصيحة مخصصة بالذكاء الاصطناعي</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Circle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glow-secondary w-14 h-14 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};
