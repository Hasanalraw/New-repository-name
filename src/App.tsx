/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, CheckCircle, Info, AlertCircle, Sparkles, LogOut, Download, 
  HelpCircle, Menu, Loader2, CloudLightning 
} from "lucide-react";

import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { SectionView } from "./components/SectionView";
import { FloatingAssistant } from "./components/FloatingAssistant";
import { AuthGate } from "./components/AuthGate";
import { defaultLectures } from "./data/defaultLectures";
import { supabase } from "./lib/supabaseClient";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Custom Toasts Queue
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Push custom toast notification to queue
  const addToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync dark mode class on main document body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load answers from Supabase database or LocalStorage fallback
  const loadUserAnswers = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Try to load from Supabase Database
      const { data, error } = await supabase
        .from("user_data")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data && data.answers) {
        setUserAnswers(data.answers);
        addToast("تمت مزامنة تقدمك الدراسي من السحابة بنجاح! ⚡", "success");
      } else {
        // 2. Fallback to LocalStorage answers if database has no record yet
        const localSaved = localStorage.getItem(`user_answers_${userId}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setUserAnswers(parsed);
          // Sync back to database
          await supabase.from("user_data").upsert({
            user_id: userId,
            answers: parsed,
            progress: calculateOverallProgress(parsed),
          });
        } else {
          setUserAnswers({});
        }
      }
    } catch (err) {
      console.warn("Could not fetch database answers, loading from LocalStorage:", err);
      // Fallback
      const localSaved = localStorage.getItem(`user_answers_${userId}`);
      if (localSaved) {
        setUserAnswers(JSON.parse(localSaved));
      } else {
        setUserAnswers({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Keep track of user auth status
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        await loadUserAnswers(data.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };
    checkSession();

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserAnswers(session.user.id);
      } else {
        setUser(null);
        setUserAnswers({});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save changes permanent
  const handleSaveAnswers = async (sectionId: string, answers: Record<string, string>, silent = false) => {
    if (!user) return;

    const updatedAnswers = {
      ...userAnswers,
      [sectionId]: answers,
    };

    setUserAnswers(updatedAnswers);
    
    // Save locally
    localStorage.setItem(`user_answers_${user.id}`, JSON.stringify(updatedAnswers));
    // Clear temp
    localStorage.removeItem(`temp_answers_${sectionId}`);

    // Push to Supabase Database
    try {
      await supabase.from("user_data").upsert({
        user_id: user.id,
        answers: updatedAnswers,
        progress: calculateOverallProgress(updatedAnswers),
      });
    } catch (err) {
      console.error("Failed to push answers to Supabase:", err);
    }
  };

  // Reset a section's contents
  const handleResetSection = async (sectionId: string, type: "all" | "local") => {
    if (!user) return;

    if (type === "all") {
      const updatedAnswers = { ...userAnswers };
      delete updatedAnswers[sectionId];
      setUserAnswers(updatedAnswers);

      localStorage.setItem(`user_answers_${user.id}`, JSON.stringify(updatedAnswers));
      localStorage.removeItem(`temp_answers_${sectionId}`);

      try {
        await supabase.from("user_data").upsert({
          user_id: user.id,
          answers: updatedAnswers,
          progress: calculateOverallProgress(updatedAnswers),
        });
      } catch (err) {
        console.error("Reset DB sync failed:", err);
      }
    } else {
      // Clear local storage temp inputs only, keep overall schema intact
      localStorage.removeItem(`temp_answers_${sectionId}`);
    }
  };

  // Calculate completion percentage of a single section
  const getSectionProgress = (sectionId: string): number => {
    const answers = userAnswers[sectionId] || {};
    
    // Check if custom AI exercises exist for this section
    const savedCustom = localStorage.getItem(`custom_exercises_${sectionId}`);
    let totalFieldsCount = 5; // Baseline for competitors is 5, others are 3
    let fieldIds = ["comp_classification", "comp_discovery_methods", "comp_store_analysis", "comp_ad_creatives", "comp_strategy_transition"]; // default ids

    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (parsed.exercises) {
          totalFieldsCount = parsed.exercises.length;
          fieldIds = parsed.exercises.map((e: any) => e.id);
        }
      } catch {}
    } else {
      // Get correct baseline field ids for the default questions
      if (sectionId === "competitors") {
        fieldIds = ["comp_classification", "comp_discovery_methods", "comp_store_analysis", "comp_ad_creatives", "comp_strategy_transition"];
      } else if (sectionId === "targetAudience") {
        fieldIds = ["audience_human_definition", "pain_moment_scenario", "deep_research_dictionary", "five_big_questions"];
      } else if (sectionId === "marketingAngles") {
        fieldIds = ["features_vs_angles", "angle_sources_extraction", "seven_levels_depth", "testing_scaling_strategy"];
      } else if (sectionId === "messagePillars") {
        fieldIds = ["authority_trust", "speed_ease", "risk_reversal"];
      } else if (sectionId === "contentFormats") {
        fieldIds = ["ugc_videos", "carousel_graphics", "case_studies"];
      } else if (sectionId === "hooksScripts") {
        fieldIds = ["hooks_lines", "ad_script"];
      } else if (sectionId === "adStrategy") {
        fieldIds = ["budget_allocation", "ab_testing_plan"];
      }
      totalFieldsCount = fieldIds.length;
    }

    if (totalFieldsCount === 0) return 0;

    let filledCount = 0;
    fieldIds.forEach((fid) => {
      if (answers[fid]?.trim().length > 5) {
        filledCount++;
      }
    });

    return Math.round((filledCount / totalFieldsCount) * 100);
  };

  // Get dynamic progress map for all 7 modules
  const getSectionProgressesMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    defaultLectures.forEach((sec) => {
      map[sec.id] = getSectionProgress(sec.id);
    });
    return map;
  };

  const calculateOverallProgress = (answersObj: Record<string, Record<string, string>>): number => {
    let sum = 0;
    defaultLectures.forEach((sec) => {
      const answers = answersObj[sec.id] || {};
      
      const savedCustom = localStorage.getItem(`custom_exercises_${sec.id}`);
      let fieldIds = ["comp_classification", "comp_discovery_methods", "comp_store_analysis", "comp_ad_creatives", "comp_strategy_transition"];
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          fieldIds = parsed.exercises.map((e: any) => e.id);
        } catch {}
      } else {
        if (sec.id === "competitors") fieldIds = ["comp_classification", "comp_discovery_methods", "comp_store_analysis", "comp_ad_creatives", "comp_strategy_transition"];
        else if (sec.id === "targetAudience") fieldIds = ["audience_human_definition", "pain_moment_scenario", "deep_research_dictionary", "five_big_questions"];
        else if (sec.id === "marketingAngles") fieldIds = ["features_vs_angles", "angle_sources_extraction", "seven_levels_depth", "testing_scaling_strategy"];
        else if (sec.id === "messagePillars") fieldIds = ["authority_trust", "speed_ease", "risk_reversal"];
        else if (sec.id === "contentFormats") fieldIds = ["ugc_videos", "carousel_graphics", "case_studies"];
        else if (sec.id === "hooksScripts") fieldIds = ["hooks_lines", "ad_script"];
        else if (sec.id === "adStrategy") fieldIds = ["budget_allocation", "ab_testing_plan"];
      }

      let filled = 0;
      fieldIds.forEach((fid) => {
        if (answers[fid]?.trim().length > 5) filled++;
      });
      sum += (filled / fieldIds.length);
    });

    return Math.round((sum / defaultLectures.length) * 100);
  };

  const overallProgress = calculateOverallProgress(userAnswers);
  const sectionProgresses = getSectionProgressesMap();

  // Export Cumulative formatted TXT files containing all completed modules answers
  const handleExportAllAnswers = () => {
    let text = `============================================================\n`;
    text += `             المخرجات والتقارير الشاملة للاستراتيجية التسويقية\n`;
    text += `============================================================\n`;
    text += `المالك: ${user?.email}\n`;
    text += `تاريخ التصدير: ${new Date().toLocaleDateString("ar-EG")}\n`;
    text += `الإنجاز الكلي: ${overallProgress}%\n`;
    text += `============================================================\n\n`;

    defaultLectures.forEach((sec) => {
      text += `[القسم]: ${sec.title}\n`;
      text += `------------------------------------------------------------\n`;
      
      // Load custom exercises or default baseline labels
      const savedCustom = localStorage.getItem(`custom_exercises_${sec.id}`);
      let exerciseFields: any[] = [];
      if (savedCustom) {
        try {
          exerciseFields = JSON.parse(savedCustom).exercises || [];
        } catch {}
      }

      if (exerciseFields.length === 0) {
        // Fallback fallback default questions labels
        if (sec.id === "competitors") {
          exerciseFields = [
            { id: "comp_classification", label: "تحديد وتصنيف منافسيك (نفس المنتج 100%، منتجات مشابهة 60-70%، وحلول نفس المشكلة)" },
            { id: "comp_discovery_methods", label: "طرق وقنوات العثور على المنافسين (Google Search, Facebook Library, TikTok, Amazon)" },
            { id: "comp_store_analysis", label: "تحليل صفحات منتجات المنافسين (الرسائل، الصور والفيديوهات، السعر والعرض، الثقة والاستعجال)" },
            { id: "comp_ad_creatives", label: "تحليل إعلانات المنافسين (أشكال الإعلانات، الخطافات الأكثر تكراراً، والفرص والاعتراضات غير المجابة)" },
            { id: "comp_strategy_transition", label: "تحويل التحليل لاستراتيجيتك الخاصة (الجمهور، التموضع والوعد، العرض الخارق، 3 زوايا إعلانية، و5 تحسينات لمتجرك)" }
          ];
        } else if (sec.id === "targetAudience") {
          exerciseFields = [
            { id: "audience_human_definition", label: "تعريف العميل كإنسان (تحديد من يواجه المشكلة وراء السن والجنس السطحي)" },
            { id: "pain_moment_scenario", label: "تحليل لحظة الوجع والسيناريو اليومي (الوجع، المشهد الزماني/المكاني، المشاعر السلبية، الأمنية)" },
            { id: "deep_research_dictionary", label: "قاموس كلمات ومصطلحات العميل الحقيقية (المستخرجة من المراجعات والمنصات)" },
            { id: "five_big_questions", label: "الأسئلة الخمسة الكبرى وتحليل سيكولوجية الشراء العاطفية والحلول البديلة" }
          ];
        } else if (sec.id === "marketingAngles") {
          exerciseFields = [
            { id: "features_vs_angles", label: "صياغة الميزة مقابل الزاوية التسويقية (تحويل مميزات منتجك الجافة إلى معانٍ وأثر نفسي يلامس العميل)" },
            { id: "angle_sources_extraction", label: "استخراج الزوايا التسويقية من مصادرها الخمسة (الألم، الرغبة، الاعتراضات، الحلول الفاشلة السابقة، الهوية)" },
            { id: "seven_levels_depth", label: "تطبيق مستويات التعمق السبعة على زاويتك المفضلة (المشهد، الشعور، العدو، الآلية، الإثبات، العرض، الـ CTA)" },
            { id: "testing_scaling_strategy", label: "استراتيجية اختبار الزوايا التسويقية المبتدئة وصياغة خطافات (Hooks) مختلفة لكل زاوية" }
          ];
        } else if (sec.id === "messagePillars") {
          exerciseFields = [
            { id: "authority_trust", label: "صياغة الركائز الرسائلية الأساسية للبراند (من 3 إلى 5 رسائل ثابتة)" },
            { id: "speed_ease", label: "تحديد الفروق الجوهرية والوعود الثابتة مقابل المداخل والزوايا الإعلانية" },
            { id: "risk_reversal", label: "خطة تفادي الأخطاء التسويقية الشائعة وبناء صورة ذهنية طويلة المدى" }
          ];
        } else if (sec.id === "contentFormats") {
          exerciseFields = [
            { id: "ugc_videos", label: "تخطيط إعلانات الفيديو القصير التفاعلي (UGC Video Ads)" },
            { id: "carousel_graphics", label: "منشورات الكاروسيل الطويلة والشرائح التعليمية القيمة" },
            { id: "case_studies", label: "صياغة دراسات الحالة العميقة وشهادات العملاء الحية" }
          ];
        } else if (sec.id === "hooksScripts") {
          exerciseFields = [
            { id: "hooks_lines", label: "صياغة 3 خطافات إعلانية جذابة وخاطفة للانتباه" },
            { id: "ad_script", label: "سيناريو الفيديو الإعلاني الكامل (المقدمة، المشكلة، الحل، والـ CTA)" }
          ];
        } else if (sec.id === "adStrategy") {
          exerciseFields = [
            { id: "budget_allocation", label: "هيكلية خطة الإعلانات واستراتيجية المحتوى لحملتك (الجمهور، الزوايا، العرض، القالب)" },
            { id: "ab_testing_plan", label: "خطة اختبار الزوايا الإعلانية ومجموعات المحتوى (قاعدة 1 زاوية = 5 إعلانات)" }
          ];
        }
      }

      const answers = userAnswers[sec.id] || {};
      exerciseFields.forEach((field) => {
        const answer = answers[field.id] || "بانتظار الإدخال";
        text += `السؤال: ${field.label}\n`;
        text += `الإجابة: ${answer}\n\n`;
      });
      text += `============================================================\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `استراتيجية_التسويق_المتكاملة_${user?.email.split("@")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("تم تصدير ملف الاستراتيجية الشامل بنجاح! 📥", "success");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserAnswers({});
    setActiveSectionId(null);
    addToast("تم تسجيل خروجك بأمان. رافقتك السلامة!", "info");
  };

  // If loading session on load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-white space-y-4 font-sans">
        <Loader2 className="w-10 h-10 text-brand-secondary animate-spin" />
        <p className="text-sm font-medium animate-pulse text-stone-300">جاري الاتصال السحابي وتحميل ملفاتك الشخصية...</p>
      </div>
    );
  }

  // Auth Gate check
  if (!user) {
    return <AuthGate onAuthenticated={(usr) => setUser(usr)} onToast={addToast} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300">
      
      {/* Toast Notification Container with Prohibited API protection (Renders internally) */}
      <div id="toast-notification-area" className="fixed top-6 left-6 z-50 space-y-3 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border pointer-events-auto backdrop-blur-md ${
                t.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                  : t.type === "error"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-400"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : t.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 shrink-0" />
              )}
              <p className="text-xs font-bold leading-relaxed">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 opacity-60" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Persistent Sidebar */}
      <Sidebar
        activeSectionId={activeSectionId}
        sectionProgresses={sectionProgresses}
        onNavigate={setActiveSectionId}
        onLogout={handleLogout}
        onExportAll={handleExportAllAnswers}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        userName={user.email}
      />

      {/* Main Content Area Container */}
      <main id="main-scroll-view" className="flex-1 p-6 sm:p-8 lg:p-12 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Sticky Header Progress Tracker on active sections */}
        {activeSectionId && (
          <div className="sticky top-0 z-30 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md py-3 border-b border-stone-100 dark:border-stone-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">إنجاز القسم الحالي:</span>
              <span className="font-mono text-xs font-bold text-brand-primary dark:text-brand-secondary">
                {sectionProgresses[activeSectionId]}%
              </span>
            </div>
            
            <div className="flex-1 max-w-xs bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-brand-secondary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${sectionProgresses[activeSectionId]}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeSectionId === null ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard
                progressPercentage={overallProgress}
                sectionProgresses={sectionProgresses}
                onNavigate={setActiveSectionId}
                userName={user.email.split("@")[0]}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeSectionId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SectionView
                sectionId={activeSectionId}
                answers={userAnswers[activeSectionId] || {}}
                onSave={handleSaveAnswers}
                onReset={handleResetSection}
                onBackToDashboard={() => setActiveSectionId(null)}
                onToast={addToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating AI Assistant Advisor */}
      {user && (
        <FloatingAssistant
          activeSectionId={activeSectionId || "competitors"}
          userAnswers={userAnswers}
        />
      )}

    </div>
  );
}
