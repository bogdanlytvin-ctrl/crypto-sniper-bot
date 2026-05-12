"use client";

import { Linkedin, Facebook, Instagram, Send } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { translations } = useLanguage();
  const { footer: t, nav } = translations;

  const handleNav = (page: string) => {
    if (page === "contacts") {
      onNavigate("home");
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-50">
      {/* Border top */}
      <div className="border-t border-gray-200" aria-hidden="true" />

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Main footer content */}
        <div className="py-14 sm:py-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Column 1: Social Networks */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t.brand}</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-[300px]">
              {t.brandDescription}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-[#0077B5] flex items-center justify-center transition-colors group"
                aria-label="LinkedIn"
              >
                <Linkedin
                  size={16}
                  className="text-gray-400 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-[#1877F2] flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <Facebook
                  size={16}
                  className="text-gray-400 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-[#E4405F] flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Instagram
                  size={16}
                  className="text-gray-400 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-[#2AABEE] flex items-center justify-center transition-colors group"
                aria-label="Telegram"
              >
                <Send
                  size={16}
                  className="text-gray-400 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              {t.navigation}
            </h4>
            <ul className="space-y-3" role="list">
              {[
                { id: "home", label: nav.home },
                { id: "about", label: nav.about },
                { id: "cases", label: nav.cases },
                { id: "news", label: nav.news },
                { id: "contacts", label: nav.contacts },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              {t.company}
            </h4>
            <ul className="space-y-3" role="list">
              {[
                { id: "about", label: nav.about },
                { id: "about", label: translations.about.missionTitle.replace("Наша ", "") },
                { id: "cases", label: nav.cases },
                { id: "news", label: nav.news },
              ].map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">{t.rights}</p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.policies}
            </a>
            <span className="text-gray-200" aria-hidden="true">|</span>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.privacy}
            </a>
            <span className="text-gray-200" aria-hidden="true">|</span>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
