import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from './sw-register';
import { InstallHint } from './install-hint';
import { OfflineIndicator } from './offline-indicator';

export const metadata: Metadata = {
  title: 'FTOS — польовий довідник техніка FPV',
  description:
    'Діагностика по симптому й карта підключення FPV, прив’язані до пінауту конкретної плати. Працює офлайн.',
  manifest: '/manifest.webmanifest',
  applicationName: 'FTOS',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FTOS' },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#101d15',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // вмикає env(safe-area-inset-*) для «чубчиків»/home-indicator у PWA
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <OfflineIndicator />
        <InstallHint />
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
