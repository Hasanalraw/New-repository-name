/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

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
  const [portalPassword, setPortalPassword] = useState("");
  const [portalError, setPortalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the portal is already unlocked
    const unlocked = localStorage.getItem("portal_unlocked") === "true";
    if (unlocked) {
      let anonId = localStorage.getItem("anon_user_id");
      if (!anonId) {
        anonId = "anon_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("anon_user_id", anonId);
      }
      onAuthenticated({ id: anonId, email: "anonymous@portal.com", isAnonymous: true });
    }
  }, []);

  // Handle Verify Universal Passcode
  const handlePortalUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (portalPassword === "HasDTB2an2026?") {
        localStorage.setItem("portal_unlocked", "true");
        let anonId = localStorage.getItem("anon_user_id");
        if (!anonId) {
          anonId = "anon_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("anon_user_id", anonId);
        }
        onToast("تم فك قفل المنصة بنجاح! جاري تحميل ملفاتك المستقلة بأمان ⚡", "success");
        onAuthenticated({ id: anonId, email: "anonymous@portal.com", isAnonymous: true });
      } else {
        setPortalError("الرمز الموحد غير صحيح! يرجى التأكد من الرمز والمحاولة مجدداً.");
        onToast("الرمز الموحد لفك القفل خاطئ", "error");
        setLoading(false);
      }
    }, 600);
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
            المنصة محمية ومغلقة. يرجى إدخال الرمز الموحد لفك القفل والولوج لملفك المستقل.
          </p>
        </div>

        {/* Universal Passcode Form */}
        <form onSubmit={handlePortalUnlockSubmit} className="space-y-5">
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
                disabled={loading}
                required
              />
              <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute top-4 right-3" />
            </div>
            {portalError && <p className="text-[10px] text-rose-500 font-semibold">{portalError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white dark:bg-brand-secondary dark:text-black dark:hover:bg-brand-secondary/90 rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق وفك قفل الملف...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>التحقق وفك قفل بوابة المنصة</span>
              </>
            )}
          </button>
          
          <div className="bg-stone-50 dark:bg-stone-950/40 p-4 rounded-xl border border-stone-200/50 dark:border-stone-800/40 text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed font-light">
            <strong className="text-brand-primary dark:text-brand-secondary block mb-1">🔒 بيئة دراسة مستقلة لكل جهاز:</strong>
            بمجرد إدخال الرمز، ستحصل على نسختك الخاصة والمنفصلة تماماً لحفظ إجاباتك ومتابعة تقدمك من هذا المتصفح دون أن تتداخل بياناتك مع أي مستخدم آخر على الإطلاق!
          </div>
        </form>
      </div>
    </div>
  );
};
