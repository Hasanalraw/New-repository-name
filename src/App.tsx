/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, CheckCircle, Info, AlertCircle, Sparkles, LogOut, Download, 
  HelpCircle, Menu, Loader2, CloudLightning, Lock, Key 
} from "lucide-react";

import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { SectionView } from "./components/SectionView";
import { FloatingAssistant } from "./components/FloatingAssistant";
import { AuthGate } from "./components/AuthGate";
import { AccountSettingsModal } from "./components/AccountSettingsModal";
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const handleAuthenticated = async (usr: any) => {
    setUser(usr);
    await loadUserAnswers(usr.id);
  };
  
  // Password Recovery / Update password state
  const [showUpdatePassword, setShowUpdatePassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  
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

      // Check if it's a real connection error (code PGRST116 means 'no rows', which is normal for new users)
      if (error && error.code !== "PGRST116") {
        console.error("Supabase load error:", error);
        addToast(`فشل تحميل البيانات من السحابة: ${error.message || "خطأ غير معروف"}. يرجى التحقق من صحة الرابط والمفتاح في الإعدادات 🛑`, "error");
      }

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
          const { error: upsertErr } = await supabase.from("user_data").upsert({
            user_id: userId,
            answers: parsed,
            progress: calculateOverallProgress(parsed),
          });
          if (upsertErr) {
            console.error("Failed to sync local backup to database:", upsertErr);
          }
        } else {
          setUserAnswers({});
        }
      }
    } catch (err: any) {
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
      const isPortalUnlocked = localStorage.getItem("portal_unlocked") === "true";
      if (isPortalUnlocked) {
        let anonId = localStorage.getItem("anon_user_id");
        if (!anonId) {
          anonId = "anon_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("anon_user_id", anonId);
        }
        const mockUser = { id: anonId, email: "anonymous@portal.com", isAnonymous: true };
        setUser(mockUser);
        await loadUserAnswers(anonId);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };
    checkSession();
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
      const { error } = await supabase.from("user_data").upsert({
        user_id: user.id,
        answers: updatedAnswers,
        progress: calculateOverallProgress(updatedAnswers),
      });

      if (error) {
        console.error("Failed to push answers to Supabase:", error);
        if (!silent) {
          addToast(`فشل الحفظ في السحابة: ${error.message} (رمز: ${error.code}) ❌. تأكد من إعدادات الاتصال وتشغيل جدول قاعدة البيانات.`, "error");
        }
      } else {
        if (!silent) {
          addToast("تم الحفظ والمزامنة السحابية بنجاح! ☁️", "success");
        }
      }
    } catch (err: any) {
      console.error("Failed to push answers to Supabase:", err);
      if (!silent) {
        addToast(`حدث خطأ أثناء الاتصال بقاعدة البيانات: ${err.message || err} ❌`, "error");
      }
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
        const { error } = await supabase.from("user_data").upsert({
          user_id: user.id,
          answers: updatedAnswers,
          progress: calculateOverallProgress(updatedAnswers),
        });
        if (error) {
          console.error("Reset DB sync failed:", error);
          addToast(`فشل مسح البيانات من السحابة: ${error.message} ❌`, "error");
        } else {
          addToast("تم مسح البيانات وتحديث السحابة بنجاح 🧹", "success");
        }
      } catch (err: any) {
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

  // Export Cumulative formatted HTML report containing all completed modules answers with beautiful layout & print support
  const handleExportAllAnswers = () => {
    let sectionsHtml = "";

    defaultLectures.forEach((sec) => {
      // Load custom exercises or default baseline labels
      const savedCustom = localStorage.getItem(`custom_exercises_${sec.id}`);
      let exerciseFields: any[] = [];
      if (savedCustom) {
        try {
          exerciseFields = JSON.parse(savedCustom).exercises || [];
        } catch {}
      }

      if (exerciseFields.length === 0) {
        // Fallback default questions labels
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
      const sectionProgress = sectionProgresses[sec.id] || 0;
      const isCompleted = sectionProgress === 100;

      let qaHtml = "";
      exerciseFields.forEach((field) => {
        const rawAnswer = answers[field.id] || "";
        const isPending = !rawAnswer.trim() || rawAnswer.trim() === "بانتظار الإدخال" || rawAnswer.trim().length <= 5;
        const answerVal = isPending ? "بانتظار الإدخال والتحليل والدراسة من قبلك..." : rawAnswer;
        
        qaHtml += `
        <div class="qa-item">
          <div class="question">${field.label}</div>
          <div class="answer ${isPending ? 'pending' : ''}">${answerVal}</div>
        </div>`;
      });

      sectionsHtml += `
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="color: var(--brand-primary)">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span>${sec.title}</span>
          </div>
          <span class="section-badge ${isCompleted ? 'completed' : ''}">الإنجاز: ${sectionProgress}%</span>
        </div>
        <div class="section-content">
          ${qaHtml}
        </div>
      </div>`;
    });

    const htmlLayout = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>التقرير الشامل للاستراتيجية التسويقية</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --brand-primary: #235355;
      --brand-secondary: #0DF1BA;
      --stone-900: #1c1917;
      --stone-800: #292524;
      --stone-100: #f5f5f4;
      --stone-200: #e7e5e4;
      --stone-500: #78716c;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Tajawal', sans-serif;
      background-color: var(--stone-100);
      color: var(--stone-900);
      line-height: 1.75;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    /* Floating Action / Navigation Area */
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    .btn {
      font-family: 'Tajawal', sans-serif;
      padding: 12px 24px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--brand-primary);
      color: white;
      box-shadow: 0 4px 15px rgba(35, 83, 85, 0.2);
    }
    .btn-primary:hover {
      background: #153233;
      transform: translateY(-1px);
    }
    .back-link {
      color: var(--stone-500);
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    /* Header Section */
    .header {
      background: linear-gradient(135deg, var(--brand-primary) 0%, #112627 100%);
      color: white;
      padding: 45px;
      border-radius: 28px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(35, 83, 85, 0.12);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .header-logo {
      font-size: 12px;
      font-weight: 900;
      color: var(--brand-secondary);
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      display: inline-block;
      background: rgba(13, 241, 186, 0.1);
      padding: 4px 12px;
      border-radius: 30px;
    }
    .header-title {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 10px;
    }
    .header-desc {
      font-size: 14px;
      opacity: 0.85;
      font-weight: 300;
      max-width: 640px;
      line-height: 1.6;
    }
    .meta-grid {
      display: grid;
      grid-template-cols: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-top: 35px;
      padding-top: 25px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 11px;
      opacity: 0.6;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .meta-val {
      font-size: 14px;
      font-weight: 700;
    }
    
    /* Overall Progress Box */
    .progress-box {
      background: white;
      padding: 30px;
      border-radius: 24px;
      margin-bottom: 35px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.015);
      border: 1px solid rgba(35, 83, 85, 0.08);
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .progress-label {
      font-weight: 800;
      font-size: 15px;
      color: var(--stone-800);
    }
    .progress-pct {
      font-weight: 900;
      color: var(--brand-primary);
      font-size: 20px;
    }
    .progress-bar {
      height: 10px;
      background: var(--stone-200);
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
      border-radius: 10px;
      width: ${overallProgress}%;
    }

    /* Section Cards */
    .section-card {
      background: white;
      border-radius: 28px;
      padding: 35px;
      margin-bottom: 35px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.01);
      border: 1px solid rgba(35, 83, 85, 0.08);
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 18px;
      border-bottom: 2px solid var(--stone-100);
    }
    .section-title {
      font-size: 18px;
      font-weight: 900;
      color: var(--brand-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-badge {
      font-size: 11px;
      font-weight: 800;
      background: var(--stone-100);
      padding: 6px 14px;
      border-radius: 30px;
      color: var(--stone-500);
    }
    .section-badge.completed {
      background: rgba(13, 241, 186, 0.12);
      color: #12725d;
    }
    
    /* Q&A list */
    .qa-item {
      margin-bottom: 30px;
    }
    .qa-item:last-child {
      margin-bottom: 0;
    }
    .question {
      font-weight: 800;
      font-size: 14px;
      color: var(--stone-800);
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.5;
    }
    .question::before {
      content: '✦';
      color: var(--brand-secondary);
      font-size: 14px;
      margin-top: -2px;
    }
    .answer {
      background: #fafaf9;
      padding: 20px 24px;
      border-radius: 18px;
      font-size: 13px;
      color: var(--stone-900);
      white-space: pre-wrap;
      border-right: 4px solid var(--brand-primary);
      line-height: 1.75;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.01);
    }
    .answer.pending {
      color: var(--stone-500);
      font-style: italic;
      border-right: 4px solid var(--stone-200);
      background: #fdfdfd;
    }

    /* Footer */
    .footer {
      text-align: center;
      font-size: 11px;
      color: var(--stone-500);
      margin-top: 60px;
      border-top: 1px solid var(--stone-200);
      padding-top: 30px;
      line-height: 1.8;
    }

    /* Print styling */
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .actions, .btn {
        display: none !important;
      }
      .header {
        box-shadow: none;
        border: 1px solid var(--brand-primary);
        background: white !important;
        color: var(--stone-900) !important;
        padding: 30px;
      }
      .header-logo {
        border: 1px solid var(--brand-primary);
        color: var(--brand-primary);
        background: none;
      }
      .header-desc {
        color: var(--stone-800);
      }
      .meta-grid {
        border-top: 1px solid var(--stone-200);
      }
      .meta-val {
        color: var(--stone-900);
      }
      .section-card {
        box-shadow: none;
        border: 1px solid var(--stone-200);
        page-break-inside: avoid;
        padding: 25px;
      }
      .answer {
        background: #fdfdfd;
        border: 1px solid var(--stone-200);
        border-right: 4px solid var(--brand-primary);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions">
      <span class="back-link">منصة التدريب الذكي المتكاملة</span>
      <button onclick="window.print()" class="btn btn-primary">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        <span>طباعة / حفظ كـ PDF</span>
      </button>
    </div>

    <div class="header">
      <div class="header-logo">مخرجات التدريب الذكي</div>
      <h1 class="header-title">التقرير الشامل للاستراتيجية التسويقية</h1>
      <p class="header-desc">مستند استراتيجي مخصص تم إعداده وتطويره عبر منصة التدريب التفاعلية الذكية لمساعدتك في بناء حملات إعلانية وتوسيع حضورك الرقمي بنجاح.</p>
      
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">الحساب البريدي المالك</span>
          <span class="meta-val">${user?.email || "غير محدد"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">تاريخ التصدير</span>
          <span class="meta-val">${new Date().toLocaleDateString("ar-EG")}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">نسبة الإنجاز الإجمالي</span>
          <span class="meta-val">${overallProgress}%</span>
        </div>
      </div>
    </div>

    <div class="progress-box">
      <div class="progress-header">
        <span class="progress-label">مستوى إكمال خطة الاستراتيجية</span>
        <span class="progress-pct">${overallProgress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>

    ${sectionsHtml}

    <div class="footer">
      <p>تم استخراج هذا التقرير بأمان من منصة التدريب الذكي المتكاملة لعام 2026.</p>
      <p>© جميع الحقوق محفوظة لمالك الحساب البريدي.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlLayout], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `استراتيجية_التسويق_المتكاملة_${(user?.email || "مستخدم").split("@")[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    addToast("تم تصدير تقرير الاستراتيجية الأنيق بنجاح! 📥 يمكنك طباعته أو حفظه كـ PDF بكبسة زر واحدة.", "success");
  };

  const handleLogout = async () => {
    localStorage.removeItem("portal_unlocked");
    setUser(null);
    setUserAnswers({});
    setActiveSectionId(null);
    addToast("تم قفل بوابة المنصة بأمان. رافقتك السلامة!", "info");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل 🔒", "error");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      addToast("تم تحديث كلمة المرور الشخصية بنجاح! 🔑 يمكنك الآن الدخول بشكل آمن.", "success");
      setShowUpdatePassword(false);
      setNewPassword("");
      // Clear URL fragment hash to clean up the address bar
      window.location.hash = "";
    } catch (err: any) {
      addToast(err.message || "فشل تحديث كلمة المرور الشخصية", "error");
    } finally {
      setUpdatingPassword(false);
    }
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
    return <AuthGate onAuthenticated={handleAuthenticated} onToast={addToast} />;
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
        userName={user?.email || "مستخدم"}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
                userName={(user?.email || "مستخدم").split("@")[0]}
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

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={handleLogout}
        onToast={addToast}
      />

    </div>
  );
}
