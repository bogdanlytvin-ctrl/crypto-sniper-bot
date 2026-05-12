"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Send, CheckCircle2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/AnimatedSection";

interface SiteConfig {
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  calendly?: string;
}

const DEFAULTS: SiteConfig = {
  email: "hello@ohmygrant.com",
  phone: "+38 (044) 123-45-67",
  address: "Київ, Україна",
  linkedin: "#",
  calendly: "#",
};

export function ContactSection() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULTS);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });

  useEffect(() => {
    fetch("/api/public/config")
      .then((r) => r.json())
      .then((data: SiteConfig) => setConfig({ ...DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id.replace("contact-", "")]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Помилка надсилання");
        return;
      }
      setIsSubmitted(true);
      setFormData({ name: "", email: "", company: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      setError("Помилка з'єднання. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const contactItems = [
    { icon: Mail, label: "Email", value: config.email || DEFAULTS.email!, href: `mailto:${config.email || DEFAULTS.email}` },
    { icon: Phone, label: "Телефон", value: config.phone || DEFAULTS.phone!, href: `tel:${(config.phone || "").replace(/\D/g, "")}` },
    { icon: MapPin, label: "Адреса", value: config.address || DEFAULTS.address!, href: "#" },
    { icon: Linkedin, label: "LinkedIn", value: "Oh My Grant", href: config.linkedin && config.linkedin !== "#" ? config.linkedin : "#" },
  ];

  return (
    <section id="contact" className="py-24 sm:py-32 bg-surface relative overflow-hidden" aria-label="Контакти">
      <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />

      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
        <AnimatedSection className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
            Контакти
          </div>
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-navy tracking-[-0.02em] mb-5 leading-tight">
            Зв&apos;яжіться з нами
          </h2>
          <p className="text-muted-foreground text-[17px] max-w-[560px] mx-auto leading-relaxed">
            Готові обговорити ваш проєкт? Заповніть форму і ми зв&apos;яжемося з вами протягом 24 годин
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Contact Form */}
          <AnimatedSection direction="right" className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-border p-7 sm:p-9 shadow-sm">
              {isSubmitted ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                  role="status"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-accent/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={32} className="text-emerald-accent" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">Дякуємо за ваше повідомлення!</h3>
                  <p className="text-muted-foreground text-[15px]">Ми зв&apos;яжемося з вами протягом 24 годин</p>
                </m.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-[13px] font-medium text-foreground/80 mb-2">
                        Ваше ім&apos;я *
                      </label>
                      <Input id="contact-name" placeholder="Іван Петренко" required autoComplete="name" value={formData.name} onChange={handleChange} disabled={isLoading} className="h-12 bg-surface border-border focus:border-emerald-accent focus:ring-emerald-accent/20 rounded-[10px] text-[15px]" />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-[13px] font-medium text-foreground/80 mb-2">
                        Email *
                      </label>
                      <Input id="contact-email" type="email" placeholder="ivan@company.com" required autoComplete="email" value={formData.email} onChange={handleChange} disabled={isLoading} className="h-12 bg-surface border-border focus:border-emerald-accent focus:ring-emerald-accent/20 rounded-[10px] text-[15px]" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-company" className="block text-[13px] font-medium text-foreground/80 mb-2">
                      Компанія
                    </label>
                    <Input id="contact-company" placeholder="Назва вашої компанії" autoComplete="organization" value={formData.company} onChange={handleChange} disabled={isLoading} className="h-12 bg-surface border-border focus:border-emerald-accent focus:ring-emerald-accent/20 rounded-[10px] text-[15px]" />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-[13px] font-medium text-foreground/80 mb-2">
                      Повідомлення *
                    </label>
                    <Textarea id="contact-message" placeholder="Розкажіть про ваш проєкт та фінансові потреби..." required rows={5} value={formData.message} onChange={handleChange} disabled={isLoading} className="bg-surface border-border focus:border-emerald-accent focus:ring-emerald-accent/20 resize-none rounded-[10px] text-[15px]" />
                  </div>

                  {error && (
                    <p className="text-red-500 text-[13px] bg-red-50 rounded-[10px] py-2.5 px-4">{error}</p>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full h-12 bg-navy hover:bg-navy-light text-white font-semibold rounded-[10px] transition-all duration-300 group text-[15px] disabled:opacity-60">
                    {isLoading ? "Надсилання..." : "Надіслати повідомлення"}
                    {!isLoading && <Send size={15} className="ml-2 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />}
                  </Button>

                  <p className="text-[12px] text-muted-foreground/60 text-center">
                    Натискаючи кнопку, ви погоджуєтесь з політикою конфіденційності
                  </p>
                </form>
              )}
            </div>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection direction="left" delay={0.2} className="lg:col-span-2">
            <div className="space-y-4">
              <StaggerContainer className="space-y-4" staggerDelay={0.08}>
                {contactItems.map((item) => (
                  <StaggerItem key={item.label}>
                    <a href={item.href} className="flex items-center gap-4 p-4 rounded-[14px] bg-white border border-border hover:border-emerald-accent/15 hover:shadow-md transition-all duration-300 group">
                      <div className="w-10 h-10 rounded-[10px] bg-emerald-accent/[0.08] flex items-center justify-center shrink-0 group-hover:bg-emerald-accent transition-colors duration-300">
                        <item.icon size={18} className="text-emerald-accent group-hover:text-navy transition-colors duration-300" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-muted-foreground mb-0.5">{item.label}</div>
                        <div className="text-[14px] font-semibold text-navy group-hover:text-emerald-accent transition-colors flex items-center gap-1 truncate">
                          {item.value}
                          <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                        </div>
                      </div>
                    </a>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Calendly card */}
              <div className="p-6 rounded-[16px] bg-navy text-white">
                <h4 className="font-bold text-[16px] mb-2">Забронюйте дзвінок</h4>
                <p className="text-[14px] text-white/35 mb-5 leading-relaxed">
                  Оберіть зручний час для 30-хвилинної консультації з нашими експертами щодо грантових можливостей.
                </p>
                <a
                  href={config.calendly && config.calendly !== "#" ? config.calendly : "#"}
                  target={config.calendly && config.calendly !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-accent text-navy text-[14px] font-semibold rounded-[10px] hover:bg-emerald-accent/90 transition-colors group"
                >
                  Calendly
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
