// frontend/src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { DemoUserProvider } from '@/lib/demo-user';

export const metadata: Metadata = {
  title: 'Karshakan Lens - Kuttanad Polder Early Warning',
  description: 'Community-verified early warning platform for Kuttanad paddy and duck farmers. PostGIS hydrology, DBSCAN spatial clustering, and KAU remedies.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#15803d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col antialiased">
        <DemoUserProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </DemoUserProvider>
      </body>
    </html>
  );
}
