/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, Lock, Mail, ShieldCheck, X, Eye, EyeOff, 
  Loader2, Sparkles, Key, LogOut, Database, Link, 
  Check, Code, Info, RefreshCw, Copy, CheckCircle
} from "lucide-react";
import { 
  supabase, 
  isRealSupabase, 
  setCustomSupabaseCredentials, 
  clearCustomSupabaseCredentials 
} from "../lib/supabaseClient";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onToast: (message: string, type: "success" | "info" | "error") => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onToast,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "database">("profile");

  // Profile management states
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Supabase Custom Connection States
  const [customUrl, setCustomUrl] = useState(localStorage.getItem("custom_supabase_url") || "");
  const [customKey, setCustomKey] = useState(localStorage.getItem("custom_supabase_key") || "");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !user) return null;

  // Handle immediate password update inside the platform
  const handleDirectPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onToast("يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل 🔒", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      onToast("تم تغيير وتحديث كلمة المرور الشخصية بنجاح! 🔑✨", "success");
      setNewPassword("");
    } catch (err: any) {
      onToast(err.message || "فشل تحديث كلمة المرور", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Send password reset link to user's registered email address
  const handleSendResetEmail = async () => {
    setIsSendingResetEmail(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      onToast(`تم إرسال رابط آمن لتغيير كلمة المرور إلى بريدك الإلكتروني: ${user.email} 📨`, "success");
    } catch (err: any) {
      onToast(err.message || "فشل إرسال رابط تغيير كلمة المرور", "error");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Handle Custom Supabase Connection settings
  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      onToast("يرجى إدخال جميع بيانات الربط المطلوبة 🛑", "error");
      return;
    }

    if (!customUrl.startsWith("https://")) {
      onToast("يجب أن يبدأ عنوان مشروع Supabase بـ https:// 🌐", "error");
      return;
    }

    onToast("جاري ربط قاعدة البيانات وإعادة تحميل المنصة... 🔄", "info");
    setTimeout(() => {
      setCustomSupabaseCredentials(customUrl.trim(), customKey.trim());
    }, 1500);
  };

  // Handle Reset to Default Sandbox/Mock Database
  const handleResetToDefault = () => {
    onToast("جاري استعادة الحساب السحابي الافتراضي وإعادة التشغيل... 🔄", "info");
    setTimeout(() => {
      clearCustomSupabaseCredentials();
    }, 1500);
  };

  // SQL schema code snippet
  const sqlSchema = `create table user_data (
  user_id text primary key,
  email text,
  answers jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- تفعيل سياسات الأمان RLS للسماح لكل مستخدم بمشاهدة وحفظ بياناته الشخصية فقط
alter table user_data enable row level security;

create policy "Users can read own data" on user_data
  for select using (auth.uid()::text = user_id);

create policy "Users can insert own data" on user_data
  for insert with check (auth.uid()::text = user_id);

create policy "Users can update own data" on user_data
  for update using (auth.uid()::text = user_id);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setIsCopied(true);
    onToast("تم نسخ كود SQL Schema إلى الحافظة بنجاح 📋", "success");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col"
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-l from-brand-primary to-brand-secondary w-full flex-shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Selection Headers */}
        <div className="px-6 pt-6 sm:px-8 flex-shrink-0">
          <div className="flex border-b border-stone-100 dark:border-stone-800 pb-2 gap-4">
            <button
              onClick={() => setActiveSettingsTab("profile")}
              className={`pb-2.5 text-sm font-black relative transition-all cursor-pointer flex items-center gap-2 ${
                activeSettingsTab === "profile"
                  ? "text-brand-primary dark:text-white border-b-2 border-brand-primary dark:border-brand-secondary"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <User className="w-4 h-4" />
              <span>إعدادات الحساب</span>
            </button>
            <button
              onClick={() => setActiveSettingsTab("database")}
              className={`pb-2.5 text-sm font-black relative transition-all cursor-pointer flex items-center gap-2 ${
                activeSettingsTab === "database"
                  ? "text-brand-primary dark:text-white border-b-2 border-brand-primary dark:border-brand-secondary"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>قاعدة البيانات و Supabase</span>
            </button>
          </div>
        </div>

        {/* Modal Body with Scrolling Support */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-grow max-h-[65vh]">
          {activeSettingsTab === "profile" ? (
            <div className="space-y-6">
              {/* Official Profile Section */}
              <div className="flex flex-col items-center text-center space-y-3 pb-3 border-b border-stone-100 dark:border-stone-850">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-lg flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-white dark:bg-stone-950 flex items-center justify-center text-brand-primary dark:text-brand-secondary">
                    <User className="w-8 h-8" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-stone-950 dark:text-white">حسابي الشخصي</h3>
                  <p className="text-xs text-brand-primary dark:text-brand-secondary font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isRealSupabase ? "متصل مباشرة بخادم Supabase الخاص بك" : "مزامنة سحابية آمنة (Sandbox)"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Account Information Card */}
              <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">البريد المسجل:</span>
                  <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[220px]" title={user.email}>
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">حالة المزامنة:</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    نشط ومتصل بالخادم
                  </span>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-brand-secondary" />
                  <span>إدارة وتغيير كلمة المرور:</span>
                </h4>

                {/* Direct Change Form */}
                <form onSubmit={handleDirectPasswordUpdate} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500">كلمة المرور الشخصية الجديدة:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary text-right"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-3 left-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-stone-800 dark:text-white dark:hover:bg-stone-750 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التحديث...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>تغيير كلمة المرور فورا</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-stone-100 dark:border-stone-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-stone-400 font-bold">أو استلام رابط خارجي</span>
                  <div className="flex-grow border-t border-stone-100 dark:border-stone-800"></div>
                </div>

                {/* Email Reset Request Link */}
                <button
                  onClick={handleSendResetEmail}
                  disabled={isSendingResetEmail}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-950 dark:hover:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSendingResetEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إرسال الإيميل...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-brand-secondary" />
                      <span>أرسل لي رابط التغيير إلى إيميلي المسجل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Accent about Supabase Integration */}
              <div className="bg-brand-primary/5 dark:bg-brand-secondary/5 border border-brand-primary/10 dark:border-brand-secondary/25 p-4 rounded-2xl text-xs leading-relaxed text-stone-600 dark:text-stone-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-brand-primary dark:text-brand-secondary">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>ربط قاعدة البيانات بـ Supabase الخاص بك</span>
                </div>
                <p className="font-light">
                  لتملك تحكمًا كاملاً بنسبة 100% ببيانات عملائك والمستخدمين والتحقق من حساباتهم، يمكنك ربط المنصة مباشرة بحسابك الشخصي في Supabase. سيتم حفظ البيانات في حسابك الخاص ومستودع الأمان الشخصي لديك.
                </p>
              </div>

              {/* Connection Status Badge */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/60 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">حالة الاتصال الحالي:</span>
                {isRealSupabase ? (
                  <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-brand-secondary px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    موصول بخادمك الخاص ✓
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-400" />
                    المحاكي السحابي (Sandbox)
                  </span>
                )}
              </div>

              {/* Supabase Connection Form */}
              <form onSubmit={handleConnectSupabase} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <span>رابط المشروع الخاص بك (Project URL):</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full text-left font-mono pl-4 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <span>مفتاح الوصول العام (Anon API Key):</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-left font-mono pl-4 pr-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-secondary"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Link className="w-4 h-4" />
                    <span>حفظ وربط قاعدة البيانات</span>
                  </button>

                  {isRealSupabase && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      قطع الاتصال
                    </button>
                  )}
                </div>
              </form>

              {/* Copyable SQL Schema Info */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <Code className="w-4 h-4 text-brand-secondary" />
                    <span>تجهيز قاعدة البيانات (SQL Schema):</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-[10px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary dark:text-brand-secondary font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "تم النسخ" : "نسخ الكود"}</span>
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 font-light leading-relaxed">
                  انسخ هذا الأمر البرمجي والصقه في خيار <strong className="text-stone-700 dark:text-stone-300">SQL Editor</strong> في لوحة تحكم Supabase الخاصة بك لإنشاء الجدول المطلوب وتفعيل حماية RLS لبيانات كل عميل.
                </p>

                <pre className="text-left bg-stone-950 text-stone-300 p-3.5 rounded-xl text-[9px] font-mono overflow-x-auto max-h-40 border border-stone-800 leading-relaxed" dir="ltr">
                  {sqlSchema}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-shrink-0 bg-stone-50/50 dark:bg-stone-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق الإعدادات
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
