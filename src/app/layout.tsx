import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { loadBusiness, getDefaultBusinessId } from '@/lib/config';
import './globals.css';

const business = loadBusiness(getDefaultBusinessId());

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${business.name} — ${business.tagline}`,
  description: business.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={
        {
          '--brand': business.theme.primary,
          '--brand-dark': business.theme.primaryDark,
          '--brand-accent': business.theme.accent,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
