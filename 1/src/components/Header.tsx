"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { language, translations, toggleLanguage } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const navItems = [
    { id: "about", labelKey: "about" as const },
    { id: "cases", labelKey: "cases" as const },
    { id: "news", labelKey: "news" as const },
    { id: "contacts", labelKey: "contacts" as const },
  ];

  const scrollToContact = useCallback(() => {
    onNavigate("home");
    setIsMobileOpen(false);
    setTimeout(() => {
      const el = document.getElementById("contact");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [onNavigate]);

  const handleNav = useCallback(
    (pageId: string) => {
      if (pageId === "contacts") {
        scrollToContact();
        return;
      }
      onNavigate(pageId);
      setIsMobileOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onNavigate, scrollToContact]
  );

  return (
    <>
      <m.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]"
            : "bg-white border-b border-border/60"
        }`}
        role="banner"
      >
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNav("home")}
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="Oh My Grant — home"
            >
              <div className="relative w-[130px] h-[32px] transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src="/TM.webp"
                  alt="Oh My Grant"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {navItems.map((item) => {
                const label = translations.nav[item.labelKey];
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative px-4 py-2 text-[14px] font-medium transition-colors duration-200 rounded-md ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    {/* Simple underline indicator */}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-foreground rounded-full transition-all duration-300 ${
                        isActive ? "w-5" : "w-0"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Right side: Language, Login, CTA */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                aria-label={`Switch to ${language === "uk" ? "English" : "Ukrainian"}`}
              >
                <Globe size={14} aria-hidden="true" />
                <span className={language === "uk" ? "text-foreground" : ""}>
                  UA
                </span>
                <span className="text-muted-foreground/40">/</span>
                <span className={language === "en" ? "text-foreground" : ""}>
                  EN
                </span>
              </button>

              {/* Log-in */}
              <a
                href="/admin"
                className="px-3 py-1.5 text-[13px] font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
              >
                {translations.nav.login}
              </a>

              {/* Book a Meeting CTA */}
              <Button
                size="sm"
                onClick={scrollToContact}
                className="h-8 px-4 text-[13px] font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90"
              >
                {translations.nav.bookMeeting}
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-md transition-colors text-foreground hover:bg-secondary"
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
            >
              {isMobileOpen ? (
                <X size={22} aria-hidden="true" />
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </m.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pt-16 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <m.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative mx-4 mt-2 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden"
            >
              <nav className="p-2" aria-label="Mobile navigation">
                {navItems.map((item, index) => {
                  const label = translations.nav[item.labelKey];
                  const isActive = currentPage === item.id;
                  return (
                    <m.button
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => handleNav(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {/* Active dot indicator */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                          isActive ? "bg-foreground" : "bg-transparent"
                        }`}
                      />
                      <span className="text-[15px]">{label}</span>
                    </m.button>
                  );
                })}

                {/* Divider */}
                <div className="my-2 border-t border-border/50" />

                {/* Language toggle */}
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors duration-200"
                >
                  <Globe size={16} aria-hidden="true" />
                  <span className="text-[15px]">
                    {language === "uk" ? "Українська" : "English"}
                  </span>
                  <span className="ml-auto text-[12px] font-medium text-muted-foreground/60">
                    {language === "uk" ? "UA" : "EN"}
                  </span>
                </button>

                {/* Log-in */}
                <a
                  href="/admin"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors duration-200"
                >
                  <span className="text-[15px]">{translations.nav.login}</span>
                </a>

                {/* CTA Button */}
                <div className="mt-2 px-2 pb-2">
                  <Button
                    onClick={scrollToContact}
                    className="w-full h-11 rounded-lg text-[15px] font-semibold bg-foreground text-background hover:bg-foreground/90"
                  >
                    {translations.nav.bookMeeting}
                  </Button>
                </div>
              </nav>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
