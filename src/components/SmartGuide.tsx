/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Quote } from "lucide-react";

interface SmartGuideProps {
  title: string;
  description: string;
  points: string[];
  quote?: string;
  id?: string;
}

export const SmartGuide: React.FC<SmartGuideProps> = ({
  title,
  description,
  points,
  quote,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id={id || `smart-guide-${Math.random().toString(36).substr(2, 9)}`} className="mt-3">
      {/* Accordion Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 dark:text-brand-secondary dark:bg-brand-secondary/10 dark:hover:bg-brand-secondary/20 rounded-xl transition-all duration-200 cursor-pointer group"
      >
        <span className="transform transition-transform duration-200 group-hover:scale-110">
          ▲
        </span>
        <span>طريقة التنفيذ والدعم الذكي</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      {/* Accordion Content Box */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-5 bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl text-stone-800 dark:text-stone-200 leading-relaxed text-sm shadow-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-brand-primary dark:text-brand-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-white text-sm mb-1">
                    {title}
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 text-xs">
                    {description}
                  </p>
                </div>
              </div>

              {/* Instructions Points */}
              <ul className="list-disc list-inside space-y-1.5 pr-6 text-xs text-stone-700 dark:text-stone-300">
                {points.map((point, index) => (
                  <li key={index} className="leading-relaxed">
                    <span className="font-medium">{point}</span>
                  </li>
                ))}
              </ul>

              {/* Optional Quote / Inspiration */}
              {quote && (
                <div className="relative mt-4 p-3.5 bg-brand-primary/5 dark:bg-brand-secondary/5 border-r-4 border-brand-primary dark:border-brand-secondary rounded-l-xl text-xs italic text-stone-600 dark:text-stone-400 flex gap-2">
                  <Quote className="w-3.5 h-3.5 text-brand-primary/50 dark:text-brand-secondary/50 shrink-0" />
                  <p className="leading-relaxed font-serif pr-1">{quote}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
