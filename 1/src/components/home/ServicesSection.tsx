"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  FileText,
  Handshake,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimatedSection";

const services = [
  {
    icon: FileText,
    title: "Грантовий супровід",
    description:
      "Комплексний супровід грантових заявок від пошуку можливостей до подання. Працюємо з грантами від €20 000 до €6 000 000 для технологічних компаній та стартапів будь-якого масштабу.",
    features: [
      "Пошук грантових можливостей під ваш проєкт",
      "Підготовка та подання конкурентних заявок",
      "Повний супровід на всіх етапах оцінки",
      "Захист проєкту перед експертною комісією",
    ],
    image: "/images/service-grants.png",
    imageAlt: "Грантовий консалтинг",
  },
  {
    icon: Target,
    title: "Стратегія фінансування",
    description:
      "Розробка індивідуальних стратегій залучення фінансування, адаптованих під ваш проєкт та цілі масштабування. Аналізуємо ринок можливостей та створюємо оптимальну дорожню карту.",
    features: [
      "Комплексний аудит проєкту та команди",
      "Індивідуальна дорожня карта фінансування",
      "Рекомендації по оптимізації стратегії",
      "Аналіз конкурентного середовища",
    ],
    image: "/images/service-strategy.png",
    imageAlt: "Планування фінансової стратегії",
  },
  {
    icon: Users,
    title: "Формування консорціумів",
    description:
      "Об'єднання партнерів для масштабних міжнародних проєктів. Створюємо сильні команди для конкурентних заявків у програмах Horizon Europe та інших європейських ініціативах.",
    features: [
      "Пошук стратегічних партнерів в ЄС",
      "Узгодження ролей та бюджетів",
      "Менеджмент консорціуму",
      "Підготовка консорціумної угоди",
    ],
    image: "/images/service-consortium.png",
    imageAlt: "Європейське партнерство",
  },
  {
    icon: Handshake,
    title: "Підготовка документації",
    description:
      "Pitch decks, бізнес-плани, фінансові моделі та вся супровідна документація для грантових заявок. Створюємо переконливі матеріали, що виділяють вашу заявку серед конкурентів.",
    features: [
      "Розробка pitch deck та презентацій",
      "Бізнес-планування та фінансове моделювання",
      "Опис інноваційного потенціалу",
      "Підготовка плану впровадження результатів",
    ],
    image: "/images/service-documentation.png",
    imageAlt: "Підготовка документації",
  },
];

export function ServicesSection() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const toggleService = useCallback((title: string) => {
    setExpandedService((prev) => (prev === title ? null : title));
  }, []);

  return (
    <section className="py-24 sm:py-32 bg-background" aria-label="Наші послуги">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
            Послуги
          </div>
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-navy tracking-[-0.02em] mb-5 leading-tight">
            Повний спектр послуг
            <br className="hidden sm:block" />
            <span className="text-gradient"> для вашого фінансування</span>
          </h2>
          <p className="text-muted-foreground text-[17px] max-w-[560px] mx-auto leading-relaxed">
            Від аналізу можливостей до підписання грантової угоди — ми поруч на
            кожному етапі
          </p>
        </AnimatedSection>

        {/* Service Cards */}
        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          staggerDelay={0.1}
        >
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expandedService === service.title}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleService(service.title);
                  }
                }}
                className={`group relative h-full rounded-2xl border transition-all duration-500 image-card-premium cursor-pointer overflow-hidden bg-white ${
                  expandedService === service.title
                    ? "border-emerald-accent/20 shadow-lg shadow-emerald-accent/[0.06]"
                    : "border-border hover:border-emerald-accent/15"
                }`}
                onClick={() => toggleService(service.title)}
              >
                {/* Image top area */}
                <div className="relative h-[200px] overflow-hidden card-image-top">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    width={1152}
                    height={864}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />

                  {/* Badge over image */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="w-10 h-10 rounded-[12px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-emerald-accent transition-all duration-300">
                      <service.icon
                        size={18}
                        className="text-white group-hover:text-navy transition-colors duration-300"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* Content below image */}
                <div className="p-7 sm:p-8">
                  {/* Title */}
                  <h3 className="text-[18px] font-bold text-navy flex items-center gap-2 mb-3">
                    {service.title}
                    <ArrowRight
                      size={15}
                      className={`text-emerald-accent transition-all duration-300 ${
                        expandedService === service.title
                          ? "rotate-[-45deg]"
                          : "opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
                      }`}
                      aria-hidden="true"
                    />
                  </h3>

                  {/* Description */}
                  <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {/* Expandable features */}
                  <AnimatePresence>
                    {expandedService === service.title && (
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-[12px] font-semibold text-navy/50 uppercase tracking-wider mb-3">
                            Ключові переваги
                          </p>
                          <ul className="space-y-2.5">
                            {service.features.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-2.5 text-[14px] text-foreground/70"
                              >
                                <CheckCircle2
                                  size={15}
                                  className="text-emerald-accent shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle hint */}
                  {expandedService !== service.title && (
                    <div className="mt-1">
                      <span className="text-[12px] text-emerald-accent/60 font-medium group-hover:text-emerald-accent transition-colors">
                        Детальніше
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
