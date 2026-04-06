'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',              label: 'Account Health', icon: Activity       },
  { href: '/agent-issues',  label: 'Agent Issues',   icon: AlertTriangle  },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-52 flex-shrink-0 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo / wordmark */}
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-800 tracking-tight">Vini</p>
        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Dashboard</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
