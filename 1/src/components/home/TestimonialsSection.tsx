"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

interface Testimonial {
  id: string;
  name: string;
  position: string;
  text: string;
  amount: string;
}

export function TestimonialsSection() {
  const { translations } = useLanguage();
  const { testimonials: t } = translations;

  const [items, setItems] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch("/api/public/testimonials")
      .then((r) => r.json())
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const item = items[idx];
  const hasMultiple = items.length > 1;

  return (
    <section className="py-20 bg-gray-50" aria-label={t.label}>
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <AnimatedSection className="mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight leading-tight">
            {t.title}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="max-w-[800px] mx-auto">
            <div className="relative bg-[#F8F9FA] border border-[#E0E0E0] rounded-2xl p-8 sm:p-10 lg:p-12">
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 opacity-[0.06]" aria-hidden="true">
                <Quote size={64} strokeWidth={1.5} />
              </div>

              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>

              <blockquote className="text-gray-700 text-base sm:text-[17px] leading-relaxed mb-8">
                &ldquo;{item.text}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-[22px] font-bold text-gray-500">
                    {item.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.position}</div>
                </div>
                {item.amount && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg shrink-0">
                    {item.amount}
                  </span>
                )}
              </div>

              {hasMultiple && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="flex gap-1.5">
                    {items.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIdx(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-gray-900" : "bg-gray-300"}`}
                        aria-label={`Відгук ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      aria-label="Попередній"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setIdx((i) => (i + 1) % items.length)}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      aria-label="Наступний"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
