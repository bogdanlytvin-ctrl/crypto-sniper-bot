"use client";

import { Shield, CheckCircle2, RotateCcw, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

export function GuaranteeSection() {
  const { translations } = useLanguage();
  const { guarantee: t } = translations;

  const icons = [CheckCircle2, RotateCcw, BarChart3];

  return (
    <section className="py-20 bg-[#F8F9FA]" aria-label="Guarantee">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Visual */}
            <div className="relative flex items-center justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-2xl bg-gray-900 flex items-center justify-center shadow-xl">
                <Shield
                  size={72}
                  strokeWidth={1.2}
                  className="text-white/90"
                  aria-hidden="true"
                />
              </div>
              {/* Decorative ring */}
              <div
                className="absolute w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full border border-gray-200"
                aria-hidden="true"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight mb-5">
                {t.title}
              </h2>
              <p className="text-gray-500 text-base sm:text-[17px] leading-relaxed mb-8">
                {t.description}
              </p>

              <ul className="space-y-4">
                {t.points.map((point, index) => {
                  const Icon = icons[index];
                  return (
                    <li key={point} className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E0E0E0] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon
                          size={16}
                          className="text-gray-700"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-gray-700 text-[15px] leading-relaxed pt-1.5">
                        {point}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
