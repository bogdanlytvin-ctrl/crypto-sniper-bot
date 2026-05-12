import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Admin user
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: "admin@ohmygrant.com" } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: "admin@ohmygrant.com",
        passwordHash: await bcrypt.hash("ohmygrant2024", 10),
      },
    });
    console.log("Admin user created");
  }

  // Testimonials
  const testimonialsCount = await prisma.testimonial.count();
  if (testimonialsCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Махно Сергій Петрович",
          position: "CEO — MedAI Solutions",
          text: "Команда Oh My Grant допомогла нам залучити кошти через програму Horizon Europe. Професійний підхід на кожному етапі — від аудиту до перемоги. Рекомендуємо всім, хто шукає надійного партнера у грантовому консалтингу.",
          amount: "Залучено: €2 400 000",
          order: 0,
          active: true,
        },
        {
          name: "Ірина Бондаренко",
          position: "CEO — AgroSense Ukraine",
          text: "EIC Accelerator з першої спроби — саме те, на що ми навіть не сміли сподіватись. Oh My Grant перетворили складний процес на зрозумілі кроки і були поруч до самого кінця.",
          amount: "Залучено: €500 000",
          order: 1,
          active: true,
        },
        {
          name: "Дмитро Левченко",
          position: "CTO — GreenStorage Tech",
          text: "Найбільший грант в нашому портфелі. Без допомоги Oh My Grant ми б не впоралися з таким обсягом документації та вимог Innovation Fund. Дуже вдячні команді.",
          amount: "Залучено: €3 200 000",
          order: 2,
          active: true,
        },
      ],
    });
    console.log("Testimonials seeded");
  }

  // Cases
  const casesCount = await prisma.caseStudy.count();
  if (casesCount === 0) {
    await prisma.caseStudy.createMany({
      data: [
        {
          title: "AI-Platform для медичної діагностики",
          description: "Розробка AI-платформи для ранньої діагностики онкологічних захворювань. Формування міжнародного консорціуму з 5 партнерів з 4 країн ЄС.",
          tags: JSON.stringify(["Horizon Europe", "AI", "Healthcare", "Deep Tech"]),
          amount: "€2.4M",
          image: "/images/case-medical-ai.png",
          order: 0,
          active: true,
        },
        {
          title: "AgriTech IoT рішення для точного землеробства",
          description: "Розробка IoT-системи моніторингу сільськогосподарських угідь з використанням комп'ютерного зору та машинного навчання.",
          tags: JSON.stringify(["EIC", "IoT", "AgriTech", "ML"]),
          amount: "€500K",
          image: "/images/case-agritech.png",
          order: 1,
          active: true,
        },
        {
          title: "Cybersecurity Platform для критичної інфраструктури",
          description: "Створення платформи кібербезпеки нового покоління для захисту критичної інфраструктури. Проєкт реалізується у консорціумі з Німеччиною та Польщею.",
          tags: JSON.stringify(["Digital Europe", "Cybersecurity", "Infrastructure"]),
          amount: "€1.8M",
          image: "/images/case-cybersecurity.png",
          order: 2,
          active: true,
        },
        {
          title: "CleanTech: Система зберігання відновлюваної енергії",
          description: "Розробка інноваційної системи зберігання енергії на базі твердотільних батарей для сонячних та вітрових електростанцій.",
          tags: JSON.stringify(["Innovation Fund", "CleanTech", "Energy", "R&D"]),
          amount: "€3.2M",
          image: "/images/case-cleantech.png",
          order: 3,
          active: true,
        },
        {
          title: "EdTech платформа для дистанційної освіти",
          description: "Створення платформи адаптивного навчання для студентів з особливими освітніми потребами. Проєкт реалізується у партнерстві з університетами.",
          tags: JSON.stringify(["Erasmus+", "EdTech", "Education", "Social Impact"]),
          amount: "€180K",
          image: "/images/case-edtech.png",
          order: 4,
          active: true,
        },
        {
          title: "Biotech Research Consortium",
          description: "Масштабний дослідницький консорціум з розробки нових методів персоналізованої медицини. 8 партнерів з 6 країн Європи.",
          tags: JSON.stringify(["Horizon Europe", "Biotech", "Healthcare", "R&D"]),
          amount: "€6.0M",
          image: "/images/case-biotech.png",
          order: 5,
          active: true,
        },
      ],
    });
    console.log("Cases seeded");
  }

  // News
  const newsCount = await prisma.newsArticle.count();
  if (newsCount === 0) {
    await prisma.newsArticle.createMany({
      data: [
        {
          title: "Horizon Europe 2026: Нові можливості для українських tech-компаній",
          excerpt: "Огляд найактуальніших грантових програм Horizon Europe на 2026 рік, з особливим акцентом на можливості для українських технологічних компаній та стартапів.",
          category: "Horizon Europe",
          date: new Date("2026-04-28"),
          image: "/images/news-featured.png",
          active: true,
          content: "Програма Horizon Europe продовжує бути найбільшою програмою фінансування R&D в Європі. На 2026 рік заплановано значне збільшення бюджету для Українських учасників.\n\nКлючові зміни у 2026 році включають:\n\n— Розширення можливостей для Ukrainian entities у рамках Horizon Europe\n— Нові кластери з акцентом на цифрову трансформацію та кліматичну нейтральність\n— Спрощений процес подання для малого бізнесу\n— Додаткові кошти для відновлення та відбудови\n\nРекомендуємо починати підготовку заявки за 3-4 місяці до дедлайну подання. Наша команда допоможе вам обрати правильну програму та підготувати конкурентну заявку.",
        },
        {
          title: "EIC Accelerator: Як підготувати заявку, що переможе",
          excerpt: "Практичний гайд щодо підготовки заявки до EIC Accelerator, включаючи поради щодо pitch deck, фінансової моделі та відео-презентації.",
          category: "EIC",
          date: new Date("2026-04-20"),
          image: "/images/news-eic.png",
          active: true,
          content: "EIC Accelerator — це одна з найпрестижніших програм фінансування для інноваційних стартапів в Європі. У 2026 році програма пропонує гранти до €2.5M та інвестиції до €15M.\n\nКлючові елементи успішної заявки:\n\n1. Сильна pitch deck з чітким описом інновації\n2. Реалістична фінансова модель на 3-5 років\n3. Переконливе відео-презентація (3 хвилини)\n4. Доказ технологічної готовності (TRL 5+)\n5. Чітка стратегія виходу на ринок\n\nНаш досвід показує, що заявки, підготовлені професійними консультантами, мають на 40% вищі шанси на успіх.",
        },
        {
          title: "Успішний кейс: Як AgroSense отримали €500K від EIC",
          excerpt: "Детальний розбір кейсу нашого клієнта AgroSense, який успішно отримав грант EIC Accelerator з першої спроби.",
          category: "Кейс",
          date: new Date("2026-04-15"),
          image: "/images/news-success.png",
          active: true,
          content: "AgroSense Ukraine — український стартап, що розробляє IoT-систему для точного землеробства. Компанія звернулася до нас у вересні 2025 року з метою залучити фінансування через EIC Accelerator.\n\nНаш підхід:\n— Повний аудит проєкту та технології\n— Оптимізація pitch deck та фінансової моделі\n— Підготовка відео-презентації\n— Супровід на етапі інтерв'ю\n\nРезультат: €500K гранту отримано з першої спроби. Проєкт визнаний одним з найкращих у кластері AgriFood.",
        },
        {
          title: "Тренди грантового фінансування 2026",
          excerpt: "Аналіз головних трендів у сфері міжнародного грантового фінансування на 2026 рік та прогнози для технологічного сектору.",
          category: "Аналітика",
          date: new Date("2026-04-08"),
          image: "/images/news-trends.png",
          active: true,
          content: "Ринок грантового фінансування в Європі стрімко зростає. Ось головні тренди 2026 року:\n\n1. Збільшення фінансування AI та ML проєктів\n2. Зростання інтересу до CleanTech та кліматичних технологій\n3. Нові програми підтримки Deep Tech стартапів\n4. Розширення програм для українських компаній\n5. Фокус на цифровий суверенітет та кібербезпеку\n\nПрогнозований обсяг грантового фінансування для українського tech-сектору в 2026 році — понад €200M.",
        },
        {
          title: "Innovation Fund: Нові можливості для CleanTech стартапів",
          excerpt: "Огляд програми Innovation Fund та практичні рекомендації для CleanTech компаній, що планують подати заявку.",
          category: "Гранти",
          date: new Date("2026-04-02"),
          image: "/images/news-cleantech.png",
          active: true,
          content: "Innovation Fund — одна з найбільших програм фінансування кліматичних інновацій в Європі. Бюджет на 2026 рік складає понад €40 млрд.\n\nДля кого:\n— CleanTech стартапи та SME\n— Проєкти зменшення викидів CO2\n— Інновації в енергетиці та промисловості\n— Проєкти зеленого водню\n\nРозмір фінансування: від €2.5M до €300M на проєкт.",
        },
        {
          title: "Як формується успішний консорціум для Horizon Europe",
          excerpt: "Поради щодо формування міжнародних консорціумів, розподілу бюджетів та управління партнерствами.",
          category: "Аналітика",
          date: new Date("2026-03-25"),
          image: "/images/news-consortium.png",
          active: true,
          content: "Формування консорціуму — один з найважливіших етапів підготовки заявки до Horizon Europe. Від якості партнерів залежить успіх всього проєкту.\n\nКлючові принципи:\n— 3-7 партнерів з різних країн ЄС\n— Чіткий розподіл ролей та бюджету\n— Комплементарна експертиза партнерів\n— Координатор з досвідом управління міжнародними проєктами\n\nНаш досвід: ми сформували понад 30 успішних консорціумів з партнерами з 15+ країн Європи.",
        },
        {
          title: "Oh My Grant відкриває новий офіс у Києві",
          excerpt: "Розширення команди та відкриття нового офісу для кращого обслуговування клієнтів та партнерів в Україні.",
          category: "Новини",
          date: new Date("2026-03-18"),
          image: "/images/news-office.png",
          active: true,
          content: "Ми раді повідомити про відкриття нашого нового офісу в центрі Києва. Новий простір дозволить нам розширити команду та надавати ще якісніші послуги.\n\nНовий офіс включає:\n— Сучасний конференц-зал для воркшопів\n— Окремі зони для роботи над заявками\n— Простір для проведення тренінгів\n\nЗапрошуємо вас на офіційне відкриття!",
        },
      ],
    });
    console.log("News seeded");
  }

  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
