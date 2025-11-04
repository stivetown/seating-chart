import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vibe Deck',
  description: 'Swipe your way to the perfect plan with friends',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <div className="min-h-screen flex flex-col">
            {/* Brand Bar */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-lg shadow-indigo-500/5 px-4 py-3 sticky top-0 z-50">
              <div className="container mx-auto flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">Vibe Deck</h1>
                <div className="text-sm text-gray-600 font-medium">Swipe • Sync • Plan</div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
