"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = i18n.language;

  const languages = [
    { code: "en", label: "English", short: "EN" },
    { code: "jp", label: "日本語", short: "JP" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-ivory-deep bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-[var(--shadow-soft)] transition-colors hover:border-sage-300 hover:bg-sage-50"
      >
        <Globe className="h-3.5 w-3.5 text-moss" />
        <span>{currentLang === "jp" ? "JP" : "EN"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl bg-white py-1.5 shadow-[var(--shadow-float)] ring-1 ring-stone-200/60">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                  currentLang === lang.code
                    ? "bg-sage-50 font-medium text-moss"
                    : "text-ink-soft hover:bg-stone-50"
                }`}
              >
                {lang.label}
                {currentLang === lang.code && <Check className="h-3.5 w-3.5 text-moss" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
