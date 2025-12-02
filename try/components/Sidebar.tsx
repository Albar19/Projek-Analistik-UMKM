'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Package,
  MessageSquare,
  Database,
  Settings,
  Menu,
  X,
  Bot,
  FileText,
  LogOut,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analisis AI', href: '/analisis', icon: Bot },
  { name: 'Prediksi', href: '/prediksi', icon: TrendingUp },
  { name: 'Stok & Produk', href: '/stok', icon: Package },
  { name: 'Konsultasi AI', href: '/konsultasi', icon: MessageSquare },
  { name: 'Manajemen Data', href: '/data', icon: Database },
  { name: 'Laporan', href: '/laporan', icon: FileText },
  { name: 'Pengaturan', href: '/pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  // Hide sidebar on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold">SalesAI</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & Logout */}
          <div className="px-4 py-4 border-t border-slate-700">
            {status === 'loading' ? (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded animate-pulse mb-1 w-20" />
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-24" />
                </div>
              </div>
            ) : session?.user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {session.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-3 px-4 py-3 mt-2 w-full rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User size={20} />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
