"use client";

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap, Star, Crown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const ICONS = [Zap, Star, Crown];

export function PricingSection() {
  const { translations } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const t = translations.packages;

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="relative py-24 sm:py-32 bg-navy overflow-hidden"
      aria-label={t.title}
    >
      {/* Atmospheric glow orbs */}
      <div
        className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full blur-[200px] bg-emerald-accent/[0.05] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] bg-emerald-accent/[0.03] pointer-events-none"
        aria-hidden="true"
      />

      {/* Dot texture */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" aria-hidden="true" />

      {/* Top / bottom accent lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-accent/25 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-accent/25 to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">

        {/* ── Section Header ── */}
        <m.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] border border-emerald-accent/20 text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
            {t.label}
          </div>
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-white tracking-[-0.025em] mb-5 leading-tight">
            {t.title}
          </h2>
          <p className="text-white/35 text-[17px] max-w-[540px] mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </m.div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 md:items-start">
          {t.plans.map((plan, index) => {
            const Icon = ICONS[index];
            const isPopular = plan.popular;

            return (
              <m.div
                key={plan.name}
                initial={{ opacity: 0, y: 56 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: index * 0.14,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className={`relative flex flex-col rounded-[22px] border transition-all duration-500 group ${
                  isPopular
                    ? "bg-white/[0.07] border-emerald-accent/50 shadow-[0_0_70px_rgba(0,212,170,0.1)] md:scale-[1.05] md:-translate-y-4 pricing-popular-border"
                    : "bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.055]"
                }`}
              >
                {/* Shimmer on popular */}
                {isPopular && (
                  <div
                    className="absolute inset-0 rounded-[22px] pricing-shimmer pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-accent text-navy text-[11px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-emerald-accent/40">
                      <Star size={10} fill="currentColor" aria-hidden="true" />
                      Найпопулярніший
                    </span>
                  </div>
                )}

                <div className={`relative z-10 p-7 sm:p-8 flex flex-col flex-1 ${isPopular ? "pt-11" : ""}`}>

                  {/* Icon + Name */}
                  <div className="mb-6">
                    <div
                      className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 transition-all duration-300 ${
                        isPopular
                          ? "bg-emerald-accent/[0.15] border border-emerald-accent/30"
                          : "bg-white/[0.06] border border-white/[0.08] group-hover:border-white/20 group-hover:bg-white/[0.09]"
                      }`}
                    >
                      {Icon && (
                        <Icon
                          size={22}
                          className={
                            isPopular
                              ? "text-emerald-accent"
                              : "text-white/40 group-hover:text-white/65 transition-colors duration-300"
                          }
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <h3 className="font-bold text-white text-[19px] leading-tight mb-1.5">
                      {plan.name}
                    </h3>
                    <p className="text-[12px] font-semibold text-emerald-accent/55 tracking-wide">
                      {plan.range}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/[0.08]">
                    <div
                      className={`text-[40px] sm:text-[46px] font-bold leading-none mb-2 tracking-tight ${
                        isPopular ? "text-emerald-accent" : "text-white"
                      }`}
                    >
                      {plan.price}
                    </div>
                    <p className="text-[12px] text-white/25">{plan.priceNote}</p>
                  </div>

                  {/* Description */}
                  <p className="text-[14px] text-white/40 leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Feature list */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.steps.map((step, stepIdx) => (
                      <m.li
                        key={step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                          duration: 0.38,
                          delay: index * 0.14 + stepIdx * 0.06 + 0.35,
                          ease: "easeOut",
                        }}
                        className="flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          size={15}
                          className={`shrink-0 mt-[2px] ${
                            isPopular ? "text-emerald-accent" : "text-white/25"
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-[14px] leading-snug ${
                            isPopular ? "text-white/65" : "text-white/40"
                          }`}
                        >
                          {step}
                        </span>
                      </m.li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={scrollToContact}
                    className={`w-full h-[52px] rounded-[14px] text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 group/btn ${
                      isPopular
                        ? "bg-emerald-accent text-navy hover:bg-emerald-accent/90 shadow-lg shadow-emerald-accent/25 hover:shadow-xl hover:shadow-emerald-accent/35 hover:-translate-y-[2px]"
                        : "bg-white/[0.08] text-white/75 border border-white/[0.1] hover:bg-white/[0.14] hover:text-white hover:border-white/20"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight
                      size={16}
                      className="group-hover/btn:translate-x-0.5 transition-transform duration-200"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </m.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <m.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-center text-[13px] text-white/20 mt-12 max-w-[520px] mx-auto leading-relaxed"
        >
          {t.note}
        </m.p>
      </div>
    </section>
  );
}
