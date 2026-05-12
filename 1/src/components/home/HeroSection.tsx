"use client";

import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/i18n/LanguageContext";

interface HeroSectionProps {
  onNavigate: (page: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const { translations } = useLanguage();
  const { hero } = translations;

  const handleCTA = () => {
    setTimeout(() => {
      const el = document.getElementById("contact");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <section
      className="relative bg-white min-h-[80vh] flex items-center overflow-hidden"
      aria-label="Головний екран"
    >
      {/* Subtle background texture */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03]"
        style={{ backgroundImage: "url('/images/hero-tech.png')" }}
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-20 sm:pb-28 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side — text content */}
          <div className="max-w-[560px]">
            {/* Badge */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A1A1A] opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1A1A1A]" />
              </span>
              <span className="text-[13px] text-[#1A1A1A] font-medium">
                {hero.subtitle}
              </span>
            </m.div>

            {/* Heading */}
            <m.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-[34px] sm:text-[42px] lg:text-[48px] font-bold text-[#1A1A1A] leading-[1.12] tracking-[-0.025em] mb-5 sm:mb-6"
            >
              {hero.title}
            </m.h1>

            {/* Body text */}
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[16px] sm:text-[17px] text-[#6B7280] leading-relaxed mb-8 sm:mb-10 max-w-[480px]"
            >
              {hero.description}
            </m.p>

            {/* CTA Button */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <button
                onClick={handleCTA}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#1A1A1A] text-white font-semibold rounded-lg hover:bg-[#333] transition-colors duration-200 text-[15px] group shadow-md hover:shadow-lg"
              >
                {hero.cta}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                  aria-hidden="true"
                />
              </button>
            </m.div>

            {/* Trust badges */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-wrap items-center gap-5 mt-8"
            >
              {[
                { icon: "🔒", text: hero.trust1 },
                { icon: "⏱", text: hero.trust2 },
                { icon: "✓", text: hero.trust3 },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                  <span aria-hidden="true">{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </m.div>
          </div>

          {/* Right side — image with decorative frame */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Glow behind image */}
            <div className="absolute -inset-4 bg-gray-100 rounded-3xl blur-xl opacity-60" aria-hidden="true" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-200">
              <Image
                src="/images/hero-tech.png"
                alt="Рішення грантового фінансування"
                width={1344}
                height={768}
                sizes="(max-width: 1200px) 100vw, 50vw"
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            {/* Floating stats badge */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3.5"
            >
              <div className="text-[22px] font-bold text-[#1A1A1A]">€15M+</div>
              <div className="text-[12px] text-[#6B7280]">залучено для клієнтів</div>
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
