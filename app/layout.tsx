import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './settings/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fast-Map',
  description: 'リアルタイムの交通情報を活用した最適なルート検索サービス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ThemeProvider>
          <LocationProvider>
            {children}
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 