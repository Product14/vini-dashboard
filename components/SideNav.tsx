'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Activity, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',             label: 'Account Health', icon: Activity      },
  { href: '/agent-issues', label: 'Agent Issues',   icon: AlertTriangle },
];

export default function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex-shrink-0 min-h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Header: logo + collapse toggle */}
      <div className={`flex items-center border-b border-slate-100 h-14 ${collapsed ? 'justify-center px-0' : 'px-4 justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src="/spyne-logo.png" alt="Spyne" width={26} height={26} className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-tight">Vini</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider leading-tight">Dashboard</p>
            </div>
          </div>
        )}
        {collapsed && (
          <Image src="/spyne-logo.png" alt="Spyne" width={24} height={24} className="flex-shrink-0" />
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 ${collapsed ? 'absolute left-[42px] top-4 bg-white border border-slate-200 shadow-sm z-10' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
              } ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
