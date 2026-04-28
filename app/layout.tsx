import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'திருக்குறள் உரை · Thirukkural Wisdom',
  description: 'Ask Kural anything about life. Ancient Tamil wisdom for modern living.  குறளிடம் கேளுங்கள் கேளுங்கள்.',
  keywords: 'thirukkural, tamil, valluvar, wisdom, philosophy, திருக்குறள்',
  openGraph: {
    title: 'திருக்குறள் உரை · Thirukkural Wisdom',
    description: 'Ask Kural anything about life. Ancient Tamil wisdom for modern living.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ta">
      <body>{children}</body>
    </html>
  );
}
