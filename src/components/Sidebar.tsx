/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { defaultLectures } from "../data/defaultLectures";

interface SidebarProps {
  activeSectionId: string | null;
  sectionProgresses: Record<string, number>;
  onNavigate: (sectionId: string | null) => void;
  onLogout: () => void;
  onExportAll: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userName?: string;
  id?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSectionId,
  sectionProgresses,
  onNavigate,
  onLogout,
  onExportAll,
  darkMode,
  onToggleDarkMode,
  userName,
  id
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Dynamic Icon mapping
  const getIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = (Icons as any)[iconName];
    const colorClass = isActive 
      ? "text-brand-secondary" 
      : "text-stone-400 group-hover:text-white dark:group-hover:text-brand-secondary";
    if (IconComponent) {
      return <IconComponent className={`w-4.5 h-4.5 transition-colors ${colorClass}`} />;
    }
    return <Icons.BookOpen className={`w-4.5 h-4.5 transition-colors ${colorClass}`} />;
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-6 text-right font-sans select-none">
      
      {/* Top Brand Logo and Welcome */}
      <div className="space-y-6">
        <div 
          onClick={() => { onNavigate(null); setIsMobileOpen(false); }}
          className="flex items-center gap-3 pb-5 border-b border-white/10 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-brand-secondary text-black rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-105 duration-200 transition-transform">
            <Icons.Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm text-white tracking-wide">المنصة الدراسية الذكية</h2>
            <p className="text-[10px] text-stone-300">مستشارك الإعلاني الشامل</p>
          </div>
        </div>

        {/* User Info Capsule */}
        {userName && (
          <div className="bg-white/10 dark:bg-black/20 p-3 rounded-2xl flex items-center gap-2.5 border border-white/5">
            <div className="w-7 h-7 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary">
              <Icons.User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-white truncate">{userName}</p>
              <p className="text-[8px] text-stone-300">حساب سحابي نشط</p>
            </div>
          </div>
        )}

        {/* Navigation Items (The 7 Modules) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[9px] font-bold text-stone-300 tracking-wider">أقسام وموديولات الدراسة:</span>
            <button
              onClick={() => { onNavigate(null); setIsMobileOpen(false); }}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                activeSectionId === null 
                  ? "bg-brand-secondary text-black" 
                  : "text-stone-300 hover:bg-white/10"
              }`}
            >
              الرئيسية
            </button>
          </div>

          <nav className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {defaultLectures.map((lecture) => {
              const isActive = activeSectionId === lecture.id;
              const progress = sectionProgresses[lecture.id] || 0;
              const isCompleted = progress === 100;

              return (
                <button
                  key={lecture.id}
                  onClick={() => {
                    onNavigate(lecture.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-right text-xs font-semibold cursor-pointer relative ${
                    isActive
                      ? "bg-white/15 text-white border-r-4 border-brand-secondary"
                      : "text-stone-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {getIcon(lecture.icon, isActive)}
                    <span className="truncate max-w-[130px]">{lecture.title}</span>
                  </div>

                  {/* Right hand metadata: progress or sync notification dot */}
                  <div className="flex items-center gap-1.5">
                    {/* Synchronized dynamic pulsing notification indicator */}
                    <span
                      id={`sync-dot-${lecture.id}`}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-brand-secondary" : "bg-stone-500/50"
                      }`}
                    ></span>
                    <span className="font-mono text-[9px] font-bold text-stone-300">{progress}%</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom controls and utility action bars */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        
        {/* Toggle Mode & Cumulative Export */}
        <div className="grid grid-cols-2 gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer"
            title="تبديل وضع الإضاءة"
          >
            {darkMode ? (
              <>
                <Icons.Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>النهاري</span>
              </>
            ) : (
              <>
                <Icons.Moon className="w-3.5 h-3.5 text-stone-200" />
                <span>الداكن</span>
              </>
            )}
          </button>

          {/* Overall Export Button */}
          <button
            onClick={onExportAll}
            className="p-2.5 bg-brand-secondary/90 hover:bg-brand-secondary text-black rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black transition-all cursor-pointer"
            title="تصدير جميع المخرجات"
          >
            <Icons.FolderDown className="w-3.5 h-3.5" />
            <span>تصدير الكل</span>
          </button>
        </div>

        {/* Global Signout */}
        <button
          onClick={onLogout}
          className="w-full py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-extrabold transition-all cursor-pointer"
        >
          <Icons.LogOut className="w-3.5 h-3.5" />
          <span>تسجيل خروج شخصي آمن</span>
        </button>

        {/* Credits */}
        <div className="text-center">
          <p className="text-[8px] text-stone-400 font-mono tracking-tight select-none">
            Supabase Cloud Core &copy; 2026
          </p>
        </div>
      </div>

    </div>
  );

  return (
    <div id={id || "sidebar-container"}>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 bg-brand-primary h-screen sticky top-0 border-l border-white/5 shadow-2xl shrink-0 z-40 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sticky Navbar */}
      <div className="lg:hidden bg-brand-primary text-white py-3 px-4 flex items-center justify-between border-b border-white/10 z-50 relative sticky top-0 shadow-md">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
        >
          <Icons.Menu className="w-5.5 h-5.5 text-white" />
        </button>

        <div 
          onClick={() => onNavigate(null)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 bg-brand-secondary text-black rounded-lg flex items-center justify-center font-bold text-sm">
            <Icons.Sparkles className="w-4 h-4" />
          </div>
          <span className="font-black text-xs tracking-wide">المنصة الدراسية الذكية</span>
        </div>

        <button
          onClick={onExportAll}
          className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
          title="تصدير كلي للملفات"
        >
          <Icons.Download className="w-5 h-5 text-brand-secondary" />
        </button>
      </div>

      {/* Mobile Drawer Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute top-0 right-0 w-72 h-full bg-brand-primary shadow-2xl overflow-y-auto border-l border-white/5"
            >
              {/* Close Drawer Button */}
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-all text-white/80"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
