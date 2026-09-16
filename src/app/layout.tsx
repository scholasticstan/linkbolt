import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: { default: 'LinkBolt', template: '%s · LinkBolt' },
  description: 'Short links with honest analytics, custom slugs, QR codes and an API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-dim">
          LinkBolt · built by <a href="https://github.com/scholasticstan" className="text-muted hover:text-ink">Stanley Alu</a> · open source
        </footer>
      </body>
    </html>
  );
}
