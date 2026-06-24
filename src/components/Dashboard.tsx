/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { defaultLectures } from "../data/defaultLectures";

interface DashboardProps {
  progressPercentage: number;
  sectionProgresses: Record<string, number>;
  onNavigate: (sectionId: string) => void;
  userName?: string;
  id?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progressPercentage,
  sectionProgresses,
  onNavigate,
  userName,
  id
}) => {
  // Helper to render icon dynamically
  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="w-5 h-5 text-brand-primary dark:text-brand-secondary" />;
    }
    return <Icons.HelpCircle className="w-5 h-5 text-brand-primary dark:text-brand-secondary" />;
  };

  return (
    <div id={id || "dashboard-view"} className="space-y-8 animate-fade-in text-right">
      {/* Welcome Banner */}
      <div className="bg-gradient-brand text-white p-8 sm:p-10 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/5 rounded-full blur-2xl -ml-16 -mb-16"></div>

        <div className="space-y-3 z-10 text-center md:text-right max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight">
            مرحباً بك {userName ? `يا ${userName}` : ""} في المنصة الدراسية التفاعلية الذكية ✨
          </h1>
          <p className="text-stone-200/90 text-sm leading-relaxed font-light">
            وجهتك الشاملة لبناء استراتيجيتك التسويقية وهندسة حملاتك الإعلانية بأدوات مدروسة وتوجيه فوري من الذكاء الاصطناعي. ابدأ بتحليل الأقسام السبعة واستخرج دليل عملك الآن.
          </p>
          <div className="inline-flex gap-2 items-center bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
            <Icons.Calendar className="w-3.5 h-3.5 text-brand-secondary" />
            <span>العام الدراسي الذكي 2026</span>
          </div>
        </div>

        {/* Overall Progress Circle */}
        <div className="relative shrink-0 z-10 flex flex-col items-center bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Circle Progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="54"
                className="stroke-white/20 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                className="stroke-brand-secondary fill-none transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-white">{progressPercentage}%</span>
            </div>
          </div>
          <div className="text-center mt-3 space-y-1">
            <p className="text-xs font-bold text-brand-secondary">رحلتك التسويقية</p>
            <p className="text-[10px] text-stone-200">
              {progressPercentage === 100
                ? "لقد أنجزت رحلتك بالكامل بنجاح! 🏆"
                : `لقد أنجزت ${progressPercentage}% من رحلتك التسويقية.`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of the 7 modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
            <Icons.Layers className="w-5 h-5 text-brand-primary dark:text-brand-secondary" />
            <span>الأقسام وموديولات العمل السبعة:</span>
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">اختر موديولاً للبدء في العمل والتحليل</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultLectures.map((lecture, index) => {
            const progress = sectionProgresses[lecture.id] || 0;
            const isCompleted = progress === 100;

            return (
              <motion.div
                key={lecture.id}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(lecture.id)}
                className={`group bg-white dark:bg-stone-900 rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer text-right flex flex-col justify-between h-[210px] relative overflow-hidden ${
                  isCompleted
                    ? "border-brand-secondary/80 bg-brand-secondary/[0.02]"
                    : "border-stone-100 dark:border-stone-800 hover:border-brand-secondary/40 glow-secondary-hover"
                }`}
              >
                {/* Background decorative index number */}
                <div className="absolute -left-4 -bottom-6 text-9xl font-black text-stone-50 dark:text-stone-950/60 font-mono select-none group-hover:text-stone-100 dark:group-hover:text-stone-900/60 transition-colors z-0">
                  0{index + 1}
                </div>

                <div className="space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-brand-primary/10 dark:bg-brand-secondary/10 rounded-2xl">
                      {renderIcon(lecture.icon)}
                    </div>
                    
                    {/* Completion indicator */}
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <span className="bg-brand-secondary/20 text-brand-primary dark:text-brand-secondary text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icons.CheckCircle className="w-3.5 h-3.5" />
                          <span>مكتمل</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-950 px-2 py-1 rounded-full">
                          بانتظار الإدخال
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-stone-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-secondary transition-colors">
                    {lecture.title}
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed line-clamp-2">
                    {lecture.description}
                  </p>
                </div>

                {/* Progress bar at the card bottom */}
                <div className="space-y-2 mt-auto pt-4 z-10">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-stone-700 dark:text-stone-300">نسبة الإنجاز:</span>
                    <span className="font-mono font-bold text-brand-primary dark:text-brand-secondary">{progress}%</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-secondary h-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
