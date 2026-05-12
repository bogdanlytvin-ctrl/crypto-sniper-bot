"use client";

import {
  Target,
  Lightbulb,
  Shield,
  Globe,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/AnimatedSection";

const values = [
  {
    icon: Target,
    title: "Орієнтація на результат",
    description:
      "Ми працюємо на результат, а не на процес. Кожна наша дія спрямована на те, щоб ваш проєкт отримав фінансування. Наш успіх вимірюється вашими досягненнями та залученими коштами.",
  },
  {
    icon: Lightbulb,
    title: "Експертиза та інновації",
    description:
      "Наші спеціалісти мають глибокі знання міжнародних грантових програм та технологічних трендів. Ми постійно вдосконалюємо наші підходи та адаптуємося до змін у грантовому ландшафті.",
  },
  {
    icon: Shield,
    title: "Конфіденційність",
    description:
      "Ми гарантуємо повну конфіденційність всієї інформації про ваш проєкт. Ваші ідеї, технології та бізнес-плани підлягають суворій захисту відповідно до міжнародних стандартів.",
  },
  {
    icon: Globe,
    title: "Міжнародний підхід",
    description:
      "Ми розуміємо специфіку європейських грантових програм та працюємо з екосистемою Horizon Europe, EIC, Innovation Fund та іншими міжнародними ініціативами.",
  },
];

const team = [
  {
    name: "Олександр Коваленко",
    position: "CEO & Founder",
    bio: "10+ років досвіду у грантовому консалтингу. Екс-оцінювач Horizon Europe.",
    initials: "ОК",
  },
  {
    name: "Марія Шевченко",
    position: "Head of Grant Advisory",
    bio: "Спеціаліст з грантових стратегій для Deep Tech та інноваційних проєктів.",
    initials: "МШ",
  },
  {
    name: "Дмитро Бондаренко",
    position: "Consortium Manager",
    bio: "Управляє міжнародними консорціумами. 30+ успішних партнерств.",
    initials: "ДБ",
  },
  {
    name: "Анна Литвиненко",
    position: "Documentation Lead",
    bio: "Створює переконливі pitch decks та бізнес-плани для грантових заявок.",
    initials: "АЛ",
  },
  {
    name: "Ігор Ткаченко",
    position: "EU Programs Expert",
    bio: "Експерт з програм ЄС. Глибокі знання Horizon Europe та Digital Europe.",
    initials: "ІТ",
  },
  {
    name: "Олена Грищенко",
    position: "Financial Modeling Lead",
    bio: "Розробляє фінансові моделі та бюджети для грантових проєктів.",
    initials: "ОГ",
  },
];

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-background overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-accent/[0.03] rounded-full blur-[150px]" aria-hidden="true" />
        <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center max-w-[700px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
              Про нас
            </div>
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-navy tracking-[-0.03em] mb-6 leading-[1.1]">
              Ми допомагаємо{" "}
              <span className="text-gradient">інноваціям</span>
              <br />
              отримувати фінансування
            </h1>
            <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed">
              Oh My Grant — це команда експертів з міжнародного грантового
              консалтингу, яка допомагає технологічним компаніям та стартапам
              залучати фінансування від провідних європейських програм.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24 bg-background" aria-label="Наша місія">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection direction="right">
              <div className="space-y-6">
                <h2 className="text-[28px] sm:text-[36px] font-bold text-navy tracking-[-0.02em]">
                  Наша місія
                </h2>
                <p className="text-[16px] text-muted-foreground leading-relaxed">
                  Ми віримо, що українські технологічні компанії мають величезний
                  потенціал для глобального ринку. Наша місія — зробити
                  міжнародне фінансування доступним для інноваційних проєктів,
                  які змінюють світ.
                </p>
                <p className="text-[16px] text-muted-foreground leading-relaxed">
                  Заснована у Києві, наша команда поєднує глибоку експертизу у
                  європейських грантових програмах з розумінням потреб місцевого
                  tech-сектору. Ми працюємо з компаніями на всіх стадіях — від
                  ранніх стартапів до зрілих технологічних підприємств.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {[
                    "Україна",
                    "ЄС",
                    "Horizon Europe",
                    "EIC Accelerator",
                    "Innovation Fund",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3.5 py-1.5 rounded-[8px] bg-surface text-[13px] font-medium text-foreground/50 border border-border/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="left" delay={0.2}>
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden image-card-premium">
                  <Image
                    src="/images/about-team.png"
                    alt="Командна співпраця в Oh My Grant"
                    width={1344}
                    height={768}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" aria-hidden="true" />
                  {/* Corner accent */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-emerald-accent/40 rounded-tl-lg" aria-hidden="true" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-emerald-accent/40 rounded-br-lg" aria-hidden="true" />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 sm:bottom-6 sm:-right-6 bg-white rounded-[14px] shadow-lg border border-border p-4 card-premium">
                  <div className="text-2xl font-bold text-emerald-accent">
                    4+
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    роки досвіду
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28 bg-surface" aria-label="Цінності">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-accent/[0.08] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
              Цінності
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-navy tracking-[-0.02em] mb-5 leading-tight">
              Наші принципи
            </h2>
            <p className="text-muted-foreground text-[17px] max-w-[560px] mx-auto">
              Фундамент, на якому побудована наша робота з кожним клієнтом
            </p>
          </AnimatedSection>

          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            staggerDelay={0.1}
          >
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <div className="group p-7 sm:p-8 rounded-2xl bg-white border border-border hover:border-emerald-accent/15 hover:shadow-md transition-all duration-500 card-premium h-full">
                  <div className="w-10 h-10 rounded-[10px] bg-emerald-accent/[0.08] flex items-center justify-center mb-5 group-hover:bg-emerald-accent transition-all duration-300">
                    <value.icon
                      size={18}
                      className="text-emerald-accent group-hover:text-navy transition-colors duration-300"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-[17px] font-bold text-navy mb-2.5">
                    {value.title}
                  </h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28 bg-navy relative overflow-hidden" aria-label="Команда">
        {/* Background pattern */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 dot-pattern opacity-15" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-accent/[0.03] rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-emerald-accent text-[12px] font-semibold uppercase tracking-wider mb-5">
              Команда
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-white tracking-[-0.02em] mb-5 leading-tight">
              Наші експерти
            </h2>
            <p className="text-white/30 text-[17px] max-w-[560px] mx-auto">
              Досвідчена команда професіоналів з міжнародного грантового
              консалтингу
            </p>
          </AnimatedSection>

          <StaggerContainer
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            staggerDelay={0.08}
          >
            {team.map((member) => (
              <StaggerItem key={member.name}>
                <div className="group p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-emerald-accent/15 transition-all duration-500 gradient-border-hover">
                  <div className="flex items-start gap-4 mb-5">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-emerald-accent/20 to-emerald-accent/5 flex items-center justify-center shrink-0 border border-emerald-accent/10 group-hover:from-emerald-accent group-hover:to-emerald-accent/80 transition-all duration-300">
                      <span className="text-emerald-accent font-bold text-[14px] group-hover:text-navy transition-colors duration-300">
                        {member.initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-[15px] leading-tight">
                        {member.name}
                      </h3>
                      <p className="text-[13px] text-emerald-accent font-medium mt-1">
                        {member.position}
                      </p>
                    </div>
                    <a
                      href="#"
                      className="w-9 h-9 rounded-[10px] bg-white/[0.05] hover:bg-emerald-accent/15 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`LinkedIn профіль ${member.name}`}
                    >
                      <Linkedin
                        size={14}
                        className="text-white/30 hover:text-emerald-accent transition-colors"
                        aria-hidden="true"
                      />
                    </a>
                  </div>
                  <p className="text-[14px] text-white/30 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
