import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vini Account Health',
  description: 'RAG health dashboard for live Vini rooftops',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 min-h-screen">{children}</body>
    </html>
  );
}
