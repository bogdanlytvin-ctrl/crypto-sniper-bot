"use client";

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

export function IndustriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const { translations } = useLanguage();
  const { industries: t } = translations;

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={ref} className="py-20 bg-[#F8F9FA]" aria-label={t.label}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <AnimatedSection className="mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight">
            {t.title}
          </h2>
        </AnimatedSection>

        {/* Tags grid */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {t.tags.map((tag, index) => (
            <m.div
              key={tag}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.4,
                delay: index * 0.04,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white border border-[#E0E0E0] rounded-xl text-sm sm:text-[15px] text-gray-700 font-medium hover:border-gray-400 hover:shadow-sm transition-all duration-200 cursor-default"
            >
              {tag}
            </m.div>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection delay={0.3} className="mt-10 sm:mt-14">
          <button
            onClick={scrollToContact}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gray-900 text-white text-[15px] font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-[1px]"
          >
            {t.cta}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
}
