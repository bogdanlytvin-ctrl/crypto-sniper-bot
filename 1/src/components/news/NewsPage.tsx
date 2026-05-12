"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Calendar, X } from "lucide-react";
import Image from "next/image";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimatedSection";
import { Badge } from "@/components/ui/badge";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  date: string;
  active: boolean;
}

const categoryColors: Record<string, string> = {
  "Грантові можливості": "bg-emerald-accent/[0.08] text-emerald-accent",
  "Новини": "bg-emerald-accent/[0.08] text-emerald-accent",
  "Horizon Europe": "bg-blue-50 text-blue-600",
  "EIC": "bg-purple-50 text-purple-600",
  "Аналітика": "bg-blue-50 text-blue-600",
  "Гранти": "bg-emerald-accent/[0.08] text-emerald-accent",
  "Кейс": "bg-amber-50 text-amber-600",
  "Партнерство": "bg-pink-50 text-pink-600",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NewsPage() {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/news")
      .then((r) => r.json())
      .then((data: NewsArticle[]) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openArticle = useCallback((article: NewsArticle) => setSelectedArticle(article), []);
  const closeArticle = useCallback(() => setSelectedArticle(null), []);

  useEffect(() => {
    document.body.style.overflow = selectedArticle ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedArticle]);

  useEffect(() => {
    if (!selectedArticle) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeArticle(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedArticle, closeArticle]);

  const handleModalCTA = useCallback(() => {
    closeArticle();
    setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 300);
  }, [closeArticle]);

  const featured = items[0] ?? null;
  const rest = items.slice(1);

  return (
    <div>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-background overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-accent/[0.03] rounded-full blur-[150px]" aria-hidden="true" />
        <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center max-w-[700px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
              Новини
            </div>
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-navy tracking-[-0.03em] mb-6 leading-[1.1]">
              Інсайди та{" "}
              <span className="text-gradient">новини галузі</span>
            </h1>
            <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed">
              Актуальні новини, аналітика грантового ринку та поради для
              технологічних компаній, що шукають фінансування
            </p>
          </AnimatedSection>
        </div>
      </section>

      {loading ? (
        <section className="py-12 bg-background">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
            <div className="h-[300px] rounded-[20px] bg-gray-100 animate-pulse mb-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[320px] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="py-20 text-center text-muted-foreground text-[15px]">
          Новин ще немає
        </section>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <section className="py-8 sm:py-12 bg-background" aria-label="Вибрана стаття">
              <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
                <AnimatedSection>
                  <button
                    onClick={() => openArticle(featured)}
                    className="group relative overflow-hidden rounded-[20px] bg-navy w-full text-left hover:shadow-2xl transition-all duration-500 card-premium"
                    aria-label={`Читати: ${featured.title}`}
                  >
                    <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
                      <div className="relative h-[280px] sm:h-[320px] lg:h-auto overflow-hidden card-image-top">
                        <Image
                          src={featured.image}
                          alt={featured.title}
                          width={1344}
                          height={768}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy/30 hidden lg:block" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent lg:hidden" aria-hidden="true" />
                      </div>
                      <div className="relative p-8 sm:p-12 flex flex-col justify-center">
                        <div className="absolute inset-0 grid-pattern opacity-10" aria-hidden="true" />
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,170,0.06),transparent_70%)]" aria-hidden="true" />
                        <div className="relative">
                          <Badge className={`font-medium text-[12px] mb-4 rounded-[8px] ${categoryColors[featured.category] ?? "bg-white/10 text-white"}`}>
                            {featured.category}
                          </Badge>
                          <h2 className="text-[22px] sm:text-[28px] font-bold text-white mb-4 group-hover:text-emerald-accent transition-colors leading-tight">
                            {featured.title}
                          </h2>
                          <p className="text-white/35 leading-relaxed mb-6 text-[15px]">{featured.excerpt}</p>
                          <div className="flex items-center gap-1.5 text-[13px] text-white/25">
                            <Calendar size={13} aria-hidden="true" />
                            <time>{formatDate(featured.date)}</time>
                          </div>
                        </div>
                        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-emerald-accent/[0.08] flex items-center justify-center group-hover:bg-emerald-accent transition-colors duration-300" aria-hidden="true">
                          <ArrowUpRight size={17} className="text-emerald-accent group-hover:text-navy transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                  </button>
                </AnimatedSection>
              </div>
            </section>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <section className="py-10 sm:py-14 bg-surface" aria-label="Статті">
              <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
                <AnimatedSection className="mb-10">
                  <h2 className="text-[24px] sm:text-[30px] font-bold text-navy tracking-[-0.02em]">Останні публікації</h2>
                </AnimatedSection>
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
                  {rest.map((article) => (
                    <StaggerItem key={article.id}>
                      <button
                        onClick={() => openArticle(article)}
                        className="group h-full flex flex-col rounded-2xl bg-white border border-border hover:border-emerald-accent/15 transition-all duration-500 cursor-pointer w-full text-left image-card-premium overflow-hidden"
                        aria-label={`Читати: ${article.title}`}
                      >
                        <div className="relative h-[160px] overflow-hidden card-image-top">
                          <Image
                            src={article.image}
                            alt={article.title}
                            width={1152}
                            height={864}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
                          <div className="absolute top-3 left-3 z-10">
                            <Badge variant="secondary" className="font-medium text-[11px] rounded-[7px] bg-white/10 backdrop-blur-md border border-white/20 text-white">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-[16px] font-bold text-navy mb-2.5 group-hover:text-emerald-accent transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-[14px] text-muted-foreground leading-relaxed mb-5 flex-1">{article.excerpt}</p>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                              <Calendar size={12} aria-hidden="true" />
                              <time>{formatDate(article.date)}</time>
                            </div>
                            <ArrowUpRight size={14} className="text-muted-foreground/30 group-hover:text-emerald-accent transition-colors" aria-hidden="true" />
                          </div>
                        </div>
                      </button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </section>
          )}
        </>
      )}

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={closeArticle}
            role="dialog"
            aria-modal="true"
            aria-label={selectedArticle.title}
          >
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" aria-hidden="true" />
            <m.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedArticle.image && (
                <div className="relative h-[200px] sm:h-[240px] shrink-0 overflow-hidden">
                  <Image
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    width={1344}
                    height={768}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" aria-hidden="true" />
                  <button
                    onClick={closeArticle}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-[10px] bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Закрити"
                  >
                    <X size={17} className="text-foreground" />
                  </button>
                </div>
              )}

              <div className={`shrink-0 p-6 sm:p-8 border-b border-border/50 ${selectedArticle.image ? "-mt-8 relative z-10" : ""}`}>
                {!selectedArticle.image && (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge className={`font-medium text-[12px] mb-3 rounded-[8px] ${categoryColors[selectedArticle.category] ?? "bg-secondary text-secondary-foreground"}`}>
                        {selectedArticle.category}
                      </Badge>
                      <h2 className="text-xl sm:text-[22px] font-bold text-navy leading-tight">{selectedArticle.title}</h2>
                    </div>
                    <button onClick={closeArticle} className="w-9 h-9 rounded-[10px] bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0" aria-label="Закрити">
                      <X size={17} className="text-foreground" />
                    </button>
                  </div>
                )}
                {selectedArticle.image && (
                  <div>
                    <Badge className={`font-medium text-[12px] mb-3 rounded-[8px] ${categoryColors[selectedArticle.category] ?? "bg-secondary text-secondary-foreground"}`}>
                      {selectedArticle.category}
                    </Badge>
                    <h2 className="text-xl sm:text-[22px] font-bold text-navy leading-tight">{selectedArticle.title}</h2>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-4 text-[13px] text-muted-foreground">
                  <Calendar size={13} aria-hidden="true" />
                  <time>{formatDate(selectedArticle.date)}</time>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="prose prose-sm sm:prose max-w-none">
                  {selectedArticle.content.split("\n\n").map((paragraph, i) => {
                    if (paragraph.startsWith("—") || /^\d+\./.test(paragraph)) {
                      return (
                        <ul key={i} className="space-y-2 mb-5">
                          {paragraph.split("\n").map((line, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-[15px] text-foreground/75 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent shrink-0 mt-2" aria-hidden="true" />
                              <span>{line.replace(/^—\s*/, "").replace(/^\d+\.\s*/, "")}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={i} className="text-[15px] text-foreground/75 leading-relaxed mb-5">{paragraph}</p>
                    );
                  })}
                </div>
              </div>

              <div className="shrink-0 p-6 sm:p-8 border-t border-border/50 bg-surface">
                <p className="text-[14px] text-muted-foreground mb-3">Потрібна консультація щодо грантових можливостей?</p>
                <button
                  onClick={handleModalCTA}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-[14px] font-semibold rounded-[10px] hover:bg-navy-light transition-colors"
                >
                  Забронювати консультацію
                  <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
