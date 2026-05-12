"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionSkeleton } from "@/components/Skeletons";

/* -------------------------------------------------------------------------- */
/*  Lazy-loaded home sections                                                 */
/* -------------------------------------------------------------------------- */
const StatsSection = lazy(
  () =>
    import("@/components/home/StatsSection").then(
      (mod) => ({ default: mod.StatsSection })
    )
);
const ProcessSection = lazy(
  () =>
    import("@/components/home/ProcessSection").then(
      (mod) => ({ default: mod.ProcessSection })
    )
);
const ConsultationSection = lazy(
  () =>
    import("@/components/home/ConsultationSection").then(
      (mod) => ({ default: mod.ConsultationSection })
    )
);
const IndustriesSection = lazy(
  () =>
    import("@/components/home/IndustriesSection").then(
      (mod) => ({ default: mod.IndustriesSection })
    )
);
const TestimonialsSection = lazy(
  () =>
    import("@/components/home/TestimonialsSection").then(
      (mod) => ({ default: mod.TestimonialsSection })
    )
);
const ServicesSection = lazy(
  () =>
    import("@/components/home/ServicesSection").then(
      (mod) => ({ default: mod.ServicesSection })
    )
);
const GuaranteeSection = lazy(
  () =>
    import("@/components/home/GuaranteeSection").then(
      (mod) => ({ default: mod.GuaranteeSection })
    )
);
const PricingSection = lazy(
  () =>
    import("@/components/home/PricingSection").then(
      (mod) => ({ default: mod.PricingSection })
    )
);
const FinalCtaSection = lazy(
  () =>
    import("@/components/home/FinalCtaSection").then(
      (mod) => ({ default: mod.FinalCtaSection })
    )
);
const ContactSection = lazy(
  () =>
    import("@/components/home/ContactSection").then(
      (mod) => ({ default: mod.ContactSection })
    )
);

/* -------------------------------------------------------------------------- */
/*  Lazy-loaded inner pages                                                    */
/* -------------------------------------------------------------------------- */
const AboutPage = lazy(
  () =>
    import("@/components/about/AboutPage").then(
      (mod) => ({ default: mod.AboutPage })
    )
);
const CasesPage = lazy(
  () =>
    import("@/components/cases/CasesPage").then(
      (mod) => ({ default: mod.CasesPage })
    )
);
const NewsPage = lazy(
  () =>
    import("@/components/news/NewsPage").then(
      (mod) => ({ default: mod.NewsPage })
    )
);

/* -------------------------------------------------------------------------- */
/*  Shared CTA section (reused after inner pages)                              */
/* -------------------------------------------------------------------------- */
const CTASection = lazy(
  () =>
    import("@/components/home/CTASection").then(
      (mod) => ({ default: mod.CTASection })
    )
);

/* -------------------------------------------------------------------------- */
/*  Page transition variants (stable, defined outside component)               */
/* -------------------------------------------------------------------------- */
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/* -------------------------------------------------------------------------- */
/*  App component                                                              */
/* -------------------------------------------------------------------------- */
export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <m.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <HeroSection onNavigate={handleNavigate} />
            <Suspense fallback={<SectionSkeleton />}>
              <StatsSection />
              <ProcessSection />
              <ServicesSection />
              <ConsultationSection />
              <IndustriesSection />
              <TestimonialsSection />
              <GuaranteeSection />
              <PricingSection />
              <FinalCtaSection />
              <ContactSection />
            </Suspense>
          </m.div>
        );

      case "about":
        return (
          <m.div
            key="about"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<SectionSkeleton />}>
              <AboutPage />
              <CTASection onNavigate={handleNavigate} />
            </Suspense>
          </m.div>
        );

      case "cases":
        return (
          <m.div
            key="cases"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<SectionSkeleton />}>
              <CasesPage />
              <CTASection onNavigate={handleNavigate} />
            </Suspense>
          </m.div>
        );

      case "news":
        return (
          <m.div
            key="news"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<SectionSkeleton />}>
              <NewsPage />
              <CTASection onNavigate={handleNavigate} />
            </Suspense>
          </m.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
