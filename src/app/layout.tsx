import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { FarmerStoreProvider } from '@/lib/store/farmerStore';

export const metadata: Metadata = {
  title: 'KRISHISETU | आपका अपना बाजार',
  description: 'KRISHISETU Farmer Platform — Predict, Recommend, Match, Sell, Transport, Deliver, Earn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body>
        <LanguageProvider>
          <FarmerStoreProvider>{children}</FarmerStoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
