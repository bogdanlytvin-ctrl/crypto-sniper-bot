import type { Translations } from "./uk";

export const en: Translations = {
  nav: {
    home: "Home",
    about: "About Us",
    cases: "Cases",
    news: "News",
    contacts: "Contacts",
    login: "Log-in",
    bookMeeting: "Book a Meeting",
  },
  hero: {
    badge: "Grant Consulting",
    title: "Non-repayable Innovative Financing Solutions",
    subtitle: "Free Project Audit",
    description:
      "Find out how well your project meets grant program requirements and what level of funding you can expect.",
    cta: "Book a Meeting",
    ctaSecondary: "Our Cases",
    trust1: "Confidentiality",
    trust2: "30 min free",
    trust3: "No obligations",
  },
  stats: {
    label: "Results",
    clients: "80+ Active Clients",
    clientsDesc: "Businesses, startups, market players and other companies that already trust us",
    funding: "Raised €15,000,000+",
    fundingDesc: "Total funding raised for our clients through European programs",
    guarantee: "Results Guarantee",
    guaranteeDesc: "Guaranteed funding or refund",
  },
  process: {
    label: "How We Work?",
    title: "How We Work?",
    description: "Transparent and structured process",
    steps: [
      {
        title: "Introduction & Audit",
        description:
          "We thoroughly examine your project, team, technologies, and market. We conduct a readiness audit and identify the most promising grant programs.",
      },
      {
        title: "Strategic Program Search",
        description:
          "We develop a customized funding strategy with a roadmap, list of target programs, and timelines.",
      },
      {
        title: "Documents Preparation",
        description:
          "We create a competitive application — pitch deck, business plan, financial model, description of innovation potential, and implementation plan.",
      },
      {
        title: "Submission & Support to Victory",
        description:
          "We submit the application and support you through all stages: from expert evaluation to signing the grant agreement.",
      },
      {
        title: "Reporting & Compliance",
        description:
          "We manage reporting and ensure full compliance with grant program requirements after receiving funding.",
      },
    ],
  },
  consultation: {
    title: "Find the Right Grants for Your Project?",
    description:
      "Free audit and consultation on grant opportunities for your business",
    cta: "Book a Meeting",
  },
  industries: {
    label: "Industries",
    title: "Industries We Secure Funding For",
    tags: [
      "Deep Tech",
      "Military Tech",
      "Manufacturing 4.0",
      "Energy & Green Tech",
      "Healthcare & MedTech",
      "Non-profit & Charity",
      "Agriculture & FoodTech",
      "Cyber Security",
      "EdTech & Human Capital",
      "Dual-use Innovations",
      "Infrastructure & Recovery",
      "Smart City & Logistics",
      "BioTech & Pharma",
      "AI & Automation",
    ],
    cta: "Book a Meeting",
  },
  testimonials: {
    label: "Testimonials",
    title: "What Our Clients Say:",
    items: [
      {
        name: "Serhii Petrovych Makhtno",
        position: "CEO — Company Name",
        text: "The Oh My Grant team helped us raise €340,000 through the Horizon Europe program. Professional approach at every stage — from audit to victory. We recommend them to anyone looking for a reliable partner in grant consulting.",
        amount: "Raised: €340,000",
      },
    ],
  },
  guarantee: {
    title: "Results Guarantee Under Contract",
    description:
      "We are confident in the quality of our services, which is why we offer a legally binding results guarantee. If your project does not receive funding — we will refund your money or continue working for free.",
    points: [
      "Legal guarantee in the contract",
      "Refund or free continuation of work",
      "Transparent KPIs and control stages",
    ],
  },
  finalCta: {
    title: "Oh My Grant",
    subtitle: "Outsourced Grant Management Department",
    description:
      "Leave grant management to the professionals. We become your external department for securing funding — from strategy to reporting.",
    cta1: "Book a Meeting",
    cta2: "Find a Grant",
  },
  footer: {
    brand: "Social Networks",
    brandDescription:
      "Consulting agency specializing in securing international funding and grant support.",
    navigation: "Navigation",
    company: "Company",
    contacts: "Contacts",
    rights: "© 2026 Oh My Grant. All rights reserved.",
    policies: "Policies / Rights",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
  },
  contact: {
    label: "Contacts",
    title: "Get in Touch",
    description:
      "Ready to discuss your project? Fill out the form and we will contact you within 24 hours",
    name: "Your Name",
    email: "Email",
    company: "Company",
    message: "Message",
    submit: "Send Message",
    success: "Thank you for your message!",
    successDesc: "We will contact you within 24 hours",
  },
  about: {
    label: "About Us",
    heroTitle: "We Help Innovations Get Funding",
    heroDescription:
      "Oh My Grant is a team of international grant consulting experts helping technology companies and startups secure funding from leading European programs.",
    missionTitle: "Our Mission",
    missionText1:
      "We believe that Ukrainian technology companies have enormous potential for the global market. Our mission is to make international funding accessible for innovative projects that are changing the world.",
    missionText2:
      "Founded in Kyiv, our team combines deep expertise in European grant programs with an understanding of the needs of the local tech sector.",
  },
  cases: {
    label: "Cases",
    heroTitle: "Projects That Received Funding",
    heroDescription: "Real success stories of our clients",
  },
  news: {
    label: "News",
    heroTitle: "Industry Insights & News",
    heroDescription: "Latest news and analytics from the grant market",
  },
  packages: {
    label: "Packages",
    title: "Choose the Package That Fits You",
    subtitle: "Transparent terms, no hidden fees. Exact quote — after a free audit.",
    note: "All prices are indicative and depend on project complexity and program. Final cost is determined after a free project audit.",
    plans: [
      {
        name: "Small Grant",
        range: "Grants from €20,000 to €100,000",
        price: "from €2,500",
        priceNote: "fixed support fee",
        description: "Perfect for startups and small companies securing grant funding for the first time via EIC or EUREKA.",
        popular: false,
        steps: [
          "Introduction & project audit",
          "Strategic program search",
          "Document preparation",
          "Submission & support",
          "Basic reporting",
        ],
        cta: "Get Started",
      },
      {
        name: "Large Grant",
        range: "Grants from €100,000 to €2,000,000",
        price: "from €6,000",
        priceNote: "fixed support fee",
        description: "For tech companies scaling through major European programs. Full-cycle grant support.",
        popular: true,
        steps: [
          "Full audit & strategy",
          "Optimal program search",
          "Complete documentation package",
          "Support to victory",
          "Full reporting & compliance",
        ],
        cta: "Book a Meeting",
      },
      {
        name: "Consortium",
        range: "Grants from €2,000,000+",
        price: "from €15,000",
        priceNote: "fixed support fee",
        description: "For large-scale international Horizon Europe projects with European consortium formation.",
        popular: false,
        steps: [
          "Consortium audit & strategy",
          "EU partner search",
          "Consortium agreement preparation",
          "Full submission management",
          "Compliance & reporting",
        ],
        cta: "Discuss Project",
      },
    ],
  },
};
