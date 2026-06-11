import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from './sw-register';

export const metadata: Metadata = {
  title: 'FTOS — польовий довідник техніка FPV',
  description:
    'Діагностика по симптому й карта підключення FPV, прив’язані до пінауту конкретної плати. Працює офлайн.',
  manifest: '/manifest.webmanifest',
  applicationName: 'FTOS',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FTOS' },
};

export const viewport: Viewport = {
  themeColor: '#101d15',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
