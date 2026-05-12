"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, m, useInView } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

const STEP_IMAGES = [
  "/images/process-audit.png",
  "/images/process-search.png",
  "/images/process-docs.png",
  "/images/process-submit.png",
  "/images/process-report.png",
];

const AUTO_ADVANCE_INTERVAL = 10000;

export function ProcessSection() {
  const { translations } = useLanguage();
  const { title, steps } = translations.process;
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  const goToStep = useCallback((index: number) => {
    setActiveStep(index);
  }, []);

  // Auto-advance only when section is in view
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, AUTO_ADVANCE_INTERVAL);

    return () => clearInterval(interval);
  }, [steps.length, isInView]);

  const currentStep = steps[activeStep];
  const currentImage = STEP_IMAGES[activeStep];

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-white"
      aria-label={title}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Section Title */}
        <AnimatedSection className="mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
        </AnimatedSection>

        {/* Step Content Area */}
        <AnimatedSection delay={0.15}>
          <div className="relative min-h-[340px] sm:min-h-[300px]">
            <AnimatePresence mode="wait">
              <m.div
                key={activeStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{
                  duration: 0.45,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              >
                {/* Text side */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {activeStep + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-900 leading-snug">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-base sm:text-[17px] leading-relaxed pl-16">
                    {currentStep.description}
                  </p>
                </div>

                {/* Image side with subtle float animation */}
                <m.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-full aspect-[4/3] lg:aspect-[3/2] rounded-2xl overflow-hidden bg-gray-50"
                >
                  <Image
                    src={currentImage}
                    alt={currentStep.title}
                    fill
                    className="object-cover"
                    priority={activeStep === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </m.div>
              </m.div>
            </AnimatePresence>
          </div>
        </AnimatedSection>

        {/* Step Navigation */}
        <AnimatedSection delay={0.3} className="mt-10 sm:mt-14">
          <div className="flex items-center justify-center gap-0">
            {steps.map((_, index) => {
              const isLast = index === steps.length - 1;
              return (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => goToStep(index)}
                    className={`
                      flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer
                      ${
                        index === activeStep
                          ? "w-10 h-10 bg-gray-800 shadow-md shadow-gray-800/20"
                          : "w-9 h-9 bg-gray-200 hover:bg-gray-300"
                      }
                    `}
                    aria-label={`${title} - ${steps[index].title}`}
                    aria-current={index === activeStep ? "step" : undefined}
                  >
                    <span
                      className={`text-sm font-semibold transition-colors duration-300 ${
                        index === activeStep ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </button>
                  {!isLast && (
                    <div
                      className={`
                        w-8 sm:w-12 lg:w-16 h-[2px] mx-1 rounded-full transition-colors duration-500
                        ${
                          index < activeStep
                            ? "bg-gray-800"
                            : "bg-gray-200"
                        }
                      `}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
