"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowUpRight, Filter } from "lucide-react";
import Image from "next/image";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimatedSection";
import { Badge } from "@/components/ui/badge";

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  tags: string[];
  amount: string;
  image: string;
  order: number;
}

export function CasesPage() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("Всі");

  useEffect(() => {
    fetch("/api/public/cases")
      .then((r) => r.json())
      .then((data: CaseStudy[]) => {
        if (Array.isArray(data)) setCases(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(
    () => ["Всі", ...Array.from(new Set(cases.flatMap((c) => c.tags)))],
    [cases]
  );

  const filtered = useMemo(
    () => (activeTag === "Всі" ? cases : cases.filter((c) => c.tags.includes(activeTag))),
    [cases, activeTag]
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-background overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-accent/[0.03] rounded-full blur-[150px]" aria-hidden="true" />
        <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center max-w-[700px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
              Кейси
            </div>
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-navy tracking-[-0.03em] mb-6 leading-[1.1]">
              Проєкти, що{" "}
              <span className="text-gradient">отримали фінансування</span>
            </h1>
            <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed">
              Реальні історії успіху наших клієнтів, які залучили міжнародні
              гранти для розвитку своїх технологічних проєктів
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      {allTags.length > 1 && (
        <section className="py-6 sticky top-[72px] z-30 border-b border-border/50 bg-background/85 backdrop-blur-xl">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="toolbar" aria-label="Фільтр кейсів">
              <Filter size={15} className="text-muted-foreground/50 shrink-0 mr-1" aria-hidden="true" />
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  aria-pressed={activeTag === tag}
                  className={`px-4 py-2 rounded-[10px] text-[13px] font-medium whitespace-nowrap transition-all duration-300 ${
                    activeTag === tag
                      ? "bg-navy text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cases Grid */}
      <section className="py-10 sm:py-14 bg-surface" aria-label="Список кейсів">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[380px] rounded-2xl bg-white border border-border animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-[15px]">
              Кейсів ще немає
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
              {filtered.map((item) => (
                <StaggerItem key={item.id}>
                  <article className="group h-full flex flex-col rounded-2xl bg-white border border-border hover:border-emerald-accent/15 transition-all duration-500 image-card-premium overflow-hidden">
                    <div className="relative h-[200px] overflow-hidden card-image-top">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={1152}
                        height={864}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />

                      {item.tags[0] && (
                        <div className="absolute top-4 left-4 z-10">
                          <Badge variant="secondary" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-[12px] rounded-[8px]">
                            {item.tags[0]}
                          </Badge>
                        </div>
                      )}

                      {item.amount && (
                        <div className="absolute bottom-4 left-4 z-10">
                          <div className="text-[24px] font-bold text-white tracking-tight">{item.amount}</div>
                        </div>
                      )}

                      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                          <ArrowUpRight size={16} className="text-white" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-[16px] font-bold text-navy mb-2 group-hover:text-emerald-accent transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-[14px] text-muted-foreground leading-relaxed flex-1">
                        {item.description}
                      </p>

                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-border/50">
                          {item.tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-[6px] bg-surface text-[11px] font-medium text-foreground/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </div>
  );
}
