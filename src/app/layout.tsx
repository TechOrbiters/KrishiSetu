import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { FarmerStoreProvider } from '@/lib/store/farmerStore';
import { AppInitializer } from '@/components/AppInitializer';

export const metadata: Metadata = {
  title: 'KrishiSetu | किसान का अपना डिजिटल बाज़ार',
  description:
    'KrishiSetu — किसानों को सीधे खरीदारों से जोड़ने वाला स्मार्ट डिजिटल बाज़ार। बेहतर दाम, आसान बिक्री, स्मार्ट डिलीवरी।',
  keywords: ['krishisetu', 'kisan', 'farmer', 'agri market', 'digital mandi', 'krishi', 'agriculture'],
  authors: [{ name: 'KrishiSetu Team' }],
  openGraph: {
    title: 'KrishiSetu | किसान का अपना डिजिटल बाज़ार',
    description: 'किसानों को सीधे खरीदारों से जोड़ने वाला स्मार्ट डिजिटल बाज़ार।',
    type: 'website',
    locale: 'hi_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KrishiSetu',
    description: 'किसान का अपना डिजिटल बाज़ार',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body suppressHydrationWarning>
        <AppInitializer />
        <LanguageProvider>
          <FarmerStoreProvider>{children}</FarmerStoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
