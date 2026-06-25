/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Mail, ShieldCheck, Sparkles, Loader2, Key, ChevronLeft } from "lucide-react";
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
  // Phase 1: Portal Lock (requires universal passcode)
  const [isPortalUnlocked, setIsPortalUnlocked] = useState(false);
  const [portalPassword, setPortalPassword] = useState("");
  const [portalError, setPortalError] = useState("");

  // Phase 2: Personal Cloud Login (requires pre-created account credentials)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    // Check if the portal is already unlocked
    const unlocked = localStorage.getItem("portal_unlocked") === "true";
    setIsPortalUnlocked(unlocked);

    // Check if user session already exists
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        onAuthenticated(data.user);
      }
    };
    checkUser();
  }, []);

  // Handle Phase 1: Verify Universal Passcode
  const handlePortalUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (portalPassword === "HasDTB2an2026?") {
      localStorage.setItem("portal_unlocked", "true");
      setIsPortalUnlocked(true);
      onToast("تم فك قفل المنصة بنجاح! يرجى تسجيل الدخول بحسابك الشخصي.", "success");
    } else {
      setPortalError("الرمز الموحد غير صحيح! يرجى التأكد من الرمز والمحاولة مجدداً.");
      onToast("الرمز الموحد لفك القفل خاطئ", "error");
    }
  };

  // Handle Phase 2: Log in with personal cloud credentials
  const handlePersonalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      onToast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      
      onToast("أهلاً بك! تم تسجيل دخولك الشخصي بنجاح ومزامنة دراستك.", "success");
      onAuthenticated(data.user);
    } catch (err: any) {
      console.error(err);
      onToast(err.message || "فشل تسجيل الدخول. يرجى التأكد من البريد وكلمة المرور.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Request (For forgotten passwords)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onToast("يرجى كتابة بريدك الإلكتروني", "error");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      onToast("تم إرسال رابط استعادة كلمة المرور لبريدك الإلكتروني بنجاح! 📨", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err: any) {
      onToast(err.message || "فشل إرسال رابط الاستعادة", "error");
    }
  };

  // Relock portal option for safety
  const handleRelockPortal = () => {
    localStorage.removeItem("portal_unlocked");
    setIsPortalUnlocked(false);
    setPortalPassword("");
    setPortalError("");
    onToast("تم قفل بوابة المنصة بأمان.", "info");
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
          <h2 className="text-2xl font-black text-brand-primary dark:text-white">المنصة الدراسية الذكية</h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs font-light">
            {isPortalUnlocked 
              ? "سجل دخولك لحسابك الشخصي المستقل لمتابعة دراستك" 
              : "المنصة محمية ومغلقة. يرجى إدخال الرمز الموحد لفك القفل"
            }
          </p>
        </div>

        {/* Dynamic Form Render based on Portal Unlocked state */}
        <AnimatePresence mode="wait">
          {!isPortalUnlocked ? (
            <motion.form
              key="portal-lock-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePortalUnlockSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">الرمز الموحد لفك قفل المنصة:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={portalPassword}
                    onChange={(e) => {
                      setPortalPassword(e.target.value);
                      setPortalError("");
                    }}
                    placeholder="أدخل الرمز الموحد المعتمد للمنصة..."
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
                <span>التحقق وفك قفل بوابة المنصة</span>
              </button>
              
              <div className="bg-stone-50 dark:bg-stone-950/40 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/40 text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed font-light">
                <strong className="text-brand-primary dark:text-brand-secondary block mb-1">🔒 بوابة حماية المنصة:</strong>
                تم دمج هذا القفل الأمني لضمان عدم وصول أي زائر عشوائي من الخارج إلى صفحة تسجيل الدخول أو إثقال خوادم المنصة.
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="personal-login-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Login Title Accent */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <span className="text-xs font-black text-stone-700 dark:text-stone-300">تسجيل الدخول للحساب الشخصي</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 dark:text-brand-secondary px-2 py-0.5 rounded-full font-bold">بوابة مغلقة ومؤمنة ✓</span>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handlePersonalLoginSubmit} className="space-y-4">
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

                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] font-semibold text-brand-primary dark:text-brand-secondary hover:underline cursor-pointer"
                  >
                    نسيت كلمة المرور الشخصية؟
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق والمزامنة السحابية...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>تسجيل دخول شخصي للوحة التحكم</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to passcode button */}
              <div className="text-center pt-2">
                <button
                  onClick={handleRelockPortal}
                  className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>قفل البوابة والعودة لشاشة الرمز الموحد</span>
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
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

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
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
