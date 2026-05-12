"use client";

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { Users, Euro, Shield } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CounterAnimation } from "@/components/AnimatedSection";

const iconColor = "#2C3E50";

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { translations } = useLanguage();
  const { stats: t } = translations;

  const cards = [
    {
      icon: Users,
      value: <CounterAnimation target={80} suffix="+" duration={2} />,
      label: t.clients,
      description: t.clientsDesc,
    },
    {
      icon: Euro,
      value: <CounterAnimation target={15} prefix="€" suffix=" 000 000+" duration={2} />,
      label: t.funding,
      description: t.fundingDesc,
    },
    {
      icon: Shield,
      value: t.guarantee,
      label: t.guaranteeDesc,
      description: null,
    },
  ];

  return (
    <section
      ref={ref}
      className="py-20 bg-gray-50"
      aria-label={t.label}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <m.div
              key={card.label}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="bg-white border border-[#E0E0E0] rounded-[12px] shadow-sm p-6 sm:p-8 flex flex-col items-center text-center"
            >
              <card.icon
                size={28}
                strokeWidth={1.8}
                style={{ color: iconColor }}
                aria-hidden="true"
                className="mb-5"
              />

              <div
                className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2"
                style={{ color: iconColor }}
              >
                {card.value}
              </div>

              <div className="text-sm font-medium text-gray-700">
                {card.label}
              </div>

              {card.description && (
                <p className="text-xs text-gray-400 leading-relaxed mt-1">
                  {card.description}
                </p>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
