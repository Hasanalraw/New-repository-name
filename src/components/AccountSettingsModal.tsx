/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, Mail, ShieldCheck, X, Eye, EyeOff, Loader2, Sparkles, Key, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

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
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden relative"
      >
        {/* Header decoration */}
        <div className="h-2 bg-gradient-to-l from-brand-primary to-brand-secondary w-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Official Profile Section */}
          <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-stone-100 dark:border-stone-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white dark:bg-stone-950 flex items-center justify-center text-brand-primary dark:text-brand-secondary">
                <User className="w-8 h-8" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black text-lg text-stone-950 dark:text-white">إعدادات الحساب الشخصي</h3>
              <p className="text-xs text-brand-primary dark:text-brand-secondary font-bold flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>حساب سحابي آمن ومعتمد</span>
              </p>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">البريد المسجل:</span>
              <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[200px]" title={user.email}>
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

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              إغلاق
            </button>

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
