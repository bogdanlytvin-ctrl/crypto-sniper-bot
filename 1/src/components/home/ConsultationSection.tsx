"use client";

import { ArrowRight, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

export function ConsultationSection() {
  const { translations } = useLanguage();
  const { consultation: t } = translations;

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-white" aria-label="Consultation">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <AnimatedSection>
          <div className="relative rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] p-8 sm:p-12 lg:p-16 overflow-hidden">
            {/* Decorative icon */}
            <div className="absolute top-6 right-6 sm:top-10 sm:right-10 opacity-[0.06]" aria-hidden="true">
              <Search size={120} strokeWidth={1} />
            </div>

            <div className="relative max-w-[640px]">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-4">
                {t.title}
              </h2>
              <p className="text-gray-500 text-base sm:text-[17px] leading-relaxed mb-8">
                {t.description}
              </p>
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
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
