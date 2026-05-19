"use client"

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Timer, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Ganhos', href: '/' },
    { icon: Timer, label: 'No Corre', href: '/shift' },
    { icon: History, label: 'Histórico', href: '/history' },
    { icon: Settings, label: 'Ajustes', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 glass-morphism">
        <span className="font-headline font-bold text-xl text-primary">NoCorre</span>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          {useAuth().user?.name?.[0] || 'U'}
        </div>
      </header>
      
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-border px-4 py-2 flex items-center justify-around z-50">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all p-2 rounded-xl",
              pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
