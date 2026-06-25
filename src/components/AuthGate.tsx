/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Mail, ShieldCheck, Sparkles, Loader2, Key } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface AuthGateProps {
  onAuthenticated: (user: any) => void;
  onToast: (message: string, type: "success" | "info" | "error") => void;
  id?: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onAuthenticated,
  onToast,
  id
}) => {
  // Tab selector: "unified" for direct passcode, "personal" for cloud accounts
  const [activeTab, setActiveTab] = useState<"unified" | "personal">("unified");

  // Phase 1: Direct Passcode (Unified Login)
  const [portalPassword, setPortalPassword] = useState("");
  const [portalError, setPortalError] = useState("");

  // Phase 2: Personal Cloud Account
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    // Check if the user is already authenticated (unified or personal)
    const checkUser = async () => {
      const isUnified = localStorage.getItem("is_logged_in_as_unified") === "true";
      if (isUnified) {
        onAuthenticated({ id: "unified-user", email: "unified@portal.com", isUnified: true });
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        onAuthenticated(data.user);
      }
    };
    checkUser();
  }, []);

  // Handle Unified Code Login
  const handleUnifiedLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalPassword === "HasDTB2an2026?") {
      sessionStorage.setItem("portal_unlocked_at", "true");
      localStorage.setItem("is_logged_in_as_unified", "true");
      onToast("تم تسجيل الدخول السريع بالرمز الموحد بنجاح! أهلاً بك.", "success");
      onAuthenticated({ id: "unified-user", email: "unified@portal.com", isUnified: true });
    } else {
      setPortalError("الرمز الموحد غير صحيح! يرجى التأكد من الرمز والمحاولة مجدداً.");
      onToast("فشل التحقق من الرمز الموحد للمنصة", "error");
    }
  };

  // Handle Personal Account (Supabase) Sign In or Sign Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      onToast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isLoginTab) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;
        
        onToast("أهلاً بك مجدداً! تم تسجيل دخولك الشخصي بنجاح.", "success");
        onAuthenticated(data.user);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        onToast("تهانينا! تم إنشاء حسابك الشخصي بنجاح وجاري إعداد لوحة التحكم.", "success");
        onAuthenticated(data.user);
      }
    } catch (err: any) {
      console.error(err);
      onToast(err.message || "حدث خطأ أثناء المصادقة", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onToast("يرجى كتابة بريدك الإلكتروني", "error");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase());
      if (error) throw error;
      onToast("تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني بنجاح! 📨", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err: any) {
      onToast(err.message || "فشل إرسال رابط الاستعادة", "error");
    }
  };

  return (
    <div id={id || "auth-gate-view"} className="min-h-screen bg-gradient-brand dark:bg-gradient-dark flex items-center justify-center p-4 sm:p-6 text-right font-sans" dir="rtl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

      <div className="w-full max-w-md bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/20 dark:border-stone-800 shadow-2xl z-10 relative space-y-8">
        
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-brand-primary/10 dark:bg-brand-secondary/10 text-brand-primary dark:text-brand-secondary rounded-2xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-brand-primary dark:text-white">بوابة الوصول والدراسة الذكية</h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs font-light">
            اختر وسيلة الدخول المناسبة لك لبدء بناء استراتيجيتك التسويقية
          </p>
        </div>

        {/* Tab switcher: Unified Code vs Personal Cloud */}
        <div className="flex bg-stone-100 dark:bg-stone-950 p-1.5 rounded-2xl border border-stone-200/50 dark:border-stone-800/50">
          <button
            onClick={() => setActiveTab("unified")}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "unified"
                ? "bg-brand-primary text-white dark:bg-brand-secondary dark:text-black shadow-md"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الرمز الموحد (دخول سريع)</span>
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "personal"
                ? "bg-brand-primary text-white dark:bg-brand-secondary dark:text-black shadow-md"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>حساب سحابي شخصي</span>
          </button>
        </div>

        {/* Dynamic Form Render */}
        <AnimatePresence mode="wait">
          {activeTab === "unified" ? (
            <motion.form
              key="unified-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleUnifiedLoginSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">الرمز الموحد للمنصة:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={portalPassword}
                    onChange={(e) => {
                      setPortalPassword(e.target.value);
                      setPortalError("");
                    }}
                    placeholder="أدخل الرمز الموحد (مثال: HasDTB2an2026?)..."
                    className="w-full pl-4 pr-10 py-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary text-right"
                    required
                  />
                  <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute top-4 right-3" />
                </div>
                {portalError && <p className="text-[10px] text-rose-500 font-semibold">{portalError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تحقق ودخول مباشر وسريع للمنصة</span>
              </button>
              
              <div className="bg-stone-50 dark:bg-stone-950/40 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/40 text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed font-light">
                <strong className="text-brand-primary dark:text-brand-secondary block mb-1">💡 ميزة الدخول السريع بالرمز الموحد:</strong>
                تسمح لك بالدخول الفوري والدراسة دون حاجة لإنشاء حساب أو بريد إلكتروني، مع حفظ تقدمك التلقائي بشكل آمن محلياً على جهازك.
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="personal-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Inner Tabs: Sign In vs Sign Up */}
              <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl">
                <button
                  onClick={() => setIsLoginTab(true)}
                  className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isLoginTab
                      ? "bg-white dark:bg-stone-900 text-brand-primary dark:text-brand-secondary shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
                  }`}
                >
                  تسجيل دخول
                </button>
                <button
                  onClick={() => setIsLoginTab(false)}
                  className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isLoginTab
                      ? "bg-white dark:bg-stone-900 text-brand-primary dark:text-brand-secondary shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
                  }`}
                >
                  إنشاء حساب سحابي
                </button>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">البريد الإلكتروني الشخصي:</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-4 pr-10 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary text-right"
                      required
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute top-3.5 right-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">كلمة المرور الشخصية:</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-10 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary text-right"
                      required
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute top-3.5 right-3" />
                  </div>
                </div>

                {isLoginTab && (
                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[10px] font-semibold text-brand-primary dark:text-brand-secondary hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور الشخصية؟
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري المعالجة والمزامنة السحابية...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isLoginTab ? "تسجيل دخول شخصي" : "تفعيل الحساب ومزامنة الدراسة"}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-sm w-full text-right space-y-4 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-brand-primary dark:text-brand-secondary">
              <Key className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base">استعادة كلمة المرور الشخصية:</h3>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              أدخل بريدك الإلكتروني وسيرسل لك نظام المصادقة السحابية رابط استعادة وتحديث كلمة المرور لتعود فوراً إلى العمل.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-4 pr-3 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary text-right"
                required
              />
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 text-xs font-bold rounded-lg cursor-pointer"
                >
                  أرسل الرابط
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
