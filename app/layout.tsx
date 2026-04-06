import type { Metadata } from 'next';
import './globals.css';
import SideNav from '@/components/SideNav';

export const metadata: Metadata = {
  title: 'Vini Dashboard',
  description: 'Vini AI Agent dashboards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 min-h-screen flex">
        <SideNav />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
