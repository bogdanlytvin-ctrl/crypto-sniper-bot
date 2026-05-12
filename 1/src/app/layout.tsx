import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MotionProvider } from "@/components/MotionProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1120",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ohmygrant.com"),
  title: "Oh My Grant — Грантовий консалтинг для технологічних компаній",
  description:
    "Консалтингова агенція у сфері залучення міжнародного фінансування та грантового супроводу для технологічних компаній та стартапів. Комплексний супровід від пошуку можливостей до подання заявки.",
  keywords: [
    "гранти",
    "консалтинг",
    "фінансування",
    "стартапи",
    "Horizon Europe",
    "технологічні компанії",
    "бізнес-план",
    "pitch deck",
  ],
  authors: [{ name: "Oh My Grant" }],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Oh My Grant — Грантовий консалтинг",
    description:
      "Залучаємо міжнародне фінансування для технологічних компаній та стартапів",
    type: "website",
    locale: "uk_UA",
    siteName: "Oh My Grant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oh My Grant — Грантовий консалтинг",
    description:
      "Залучаємо міжнародне фінансування для технологічних компаній та стартапів",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <MotionProvider>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
