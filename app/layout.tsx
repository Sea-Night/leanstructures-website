import type { Metadata } from 'next';
import { Roboto, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

const fraunces = Fraunces({
  variable: '--font-editorial',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-eng-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'LEAN structures — Structural Engineering Consultancy',
  description:
    'LEAN structures is a structural engineering consultancy in Monmouthshire, finding clean, efficient and sustainable design solutions across masonry, steel, timber, and heritage structures.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${roboto.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
