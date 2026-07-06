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
  metadataBase: new URL('https://leanstructures.co.uk'),
  title: {
    default: 'LEAN structures — Structural Engineering Consultancy',
    template: '%s — LEAN structures',
  },
  description:
    'Structural engineering consultancy in Monmouthshire, South East Wales. Everyday domestic work — extensions, loft conversions, structural calculations, party wall — alongside specialist timber, Passivhaus, natural materials and heritage engineering.',
  openGraph: {
    title: 'LEAN structures — Structural Engineering Consultancy',
    description:
      'Structural engineering consultancy in Monmouthshire, South East Wales. Everyday domestic work — extensions, loft conversions, structural calculations, party wall — alongside specialist timber, Passivhaus, natural materials and heritage engineering.',
    url: '/',
    siteName: 'LEAN structures',
    locale: 'en_GB',
    type: 'website',
  },
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
