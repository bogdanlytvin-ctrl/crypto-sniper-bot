"use client";

import { ArrowRight, Shield, Clock, MessageCircle } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

interface CTASectionProps {
  onNavigate?: (page: string) => void;
}

export function CTASection({ onNavigate }: CTASectionProps) {
  const handleCTA = () => {
    if (onNavigate) {
      onNavigate("home");
      setTimeout(() => {
        const el = document.getElementById("contact");
        el?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } else {
      const el = document.getElementById("contact");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-24 sm:py-32 bg-background relative overflow-hidden" aria-label="Заклик до дії">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-accent/[0.03] rounded-full blur-[150px]" aria-hidden="true" />

      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
        <AnimatedSection>
          <div className="relative max-w-[800px] mx-auto">
            {/* Main CTA Card */}
            <div className="relative p-10 sm:p-14 rounded-[24px] bg-navy text-white overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-accent/[0.08] rounded-full blur-[100px]" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-accent/[0.04] rounded-full blur-[80px]" aria-hidden="true" />
              <div className="absolute inset-0 grid-pattern opacity-15" aria-hidden="true" />

              {/* Top border accent */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-accent/20 to-transparent" aria-hidden="true" />

              <div className="relative text-center">
                <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.02em] mb-5 leading-tight">
                  Готові залучити фінансування
                  <br />
                  <span className="text-gradient">для вашого проєкту?</span>
                </h2>

                <p className="text-white/35 text-[17px] max-w-[520px] mx-auto mb-10 leading-relaxed">
                  Заплануйте безкоштовну консультацію з нашими експертами. Ми
                  проаналізуємо ваш проєкт та запропонуємо оптимальну стратегію.
                </p>

                <button
                  onClick={handleCTA}
                  className="inline-flex items-center gap-2.5 px-9 py-4 bg-emerald-accent text-navy font-semibold rounded-[12px] hover:bg-emerald-accent/90 transition-all duration-300 shadow-lg shadow-emerald-accent/20 hover:shadow-xl hover:shadow-emerald-accent/30 hover:-translate-y-[2px] text-[16px] group"
                >
                  Забронювати безкоштовну консультацію
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </button>

                {/* Trust badges */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-7">
                  <div className="flex items-center gap-2 text-white/25 text-[13px]">
                    <Shield size={14} className="text-emerald-accent/50" aria-hidden="true" />
                    <span>Конфіденційність гарантована</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/25 text-[13px]">
                    <Clock size={14} className="text-emerald-accent/50" aria-hidden="true" />
                    <span>30 хвилин консультації</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/25 text-[13px]">
                    <MessageCircle size={14} className="text-emerald-accent/50" aria-hidden="true" />
                    <span>Без жодних зобов&apos;язань</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
