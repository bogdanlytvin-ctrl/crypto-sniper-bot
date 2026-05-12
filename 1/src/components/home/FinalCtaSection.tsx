"use client";

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export function FinalCtaSection() {
  const { translations } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleScrollToContact = () => {
    const el = document.getElementById("contact");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-[#0B1120]" aria-label="Final CTA">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 text-center">
        <m.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-white tracking-[-0.02em] mb-3 leading-tight">
            {translations.finalCta.title}
          </h2>
          <p className="text-[18px] sm:text-[20px] text-white/60 font-medium mb-5">
            {translations.finalCta.subtitle}
          </p>
          <p className="text-[16px] sm:text-[17px] text-white/40 max-w-[560px] mx-auto leading-relaxed mb-10">
            {translations.finalCta.description}
          </p>

          {/* Two CTA Buttons Side by Side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleScrollToContact}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#0B1120] font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300 text-[16px] w-full sm:w-auto"
            >
              {translations.finalCta.cta1}
            </button>
            <button
              onClick={handleScrollToContact}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent text-white font-semibold rounded-lg border border-white/30 hover:bg-white/10 transition-colors duration-300 text-[16px] w-full sm:w-auto"
            >
              {translations.finalCta.cta2}
            </button>
          </div>
        </m.div>
      </div>
    </section>
  );
}
