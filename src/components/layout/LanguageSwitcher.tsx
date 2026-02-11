// src/components/layout/LanguageSwitcher.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { FiGlobe } from "react-icons/fi";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
];

export const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();

  const switchLanguage = (langCode: string) => {
    router.push(`/${langCode}`);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <FiGlobe className="w-5 h-5" />
        <span className="text-sm font-medium">
          {languages.find((lang) => lang.code === locale)?.flag}
        </span>
        <span className="text-sm">{languages.find((lang) => lang.code === locale)?.name}</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hidden group-hover:block"
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
              ${locale === lang.code ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""}
            `}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
            {locale === lang.code && (
              <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
        ))}
      </motion.div>
    </div>
  );
};
