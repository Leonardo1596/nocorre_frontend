
"use client"

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Timer, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { AppProvider } from '@/contexts/AppContext';
import { GpsProvider } from '@/contexts/GpsContext';
import { ShiftProvider } from '@/contexts/ShiftContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    let handle: PluginListenerHandle;

    const addListener = async () => {
      handle = await App.addListener('backButton', () => {
        if (pathname !== '/') {
          router.back();
        }
      });
    };
    addListener();

    return () => {
      if (handle) {
        handle.remove();
      }
    };
  }, [pathname, router]);

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
    <GpsProvider>
      <ShiftProvider>
        <AppProvider>
          <div className="min-h-screen bg-background flex flex-col pb-24 text-foreground selection:bg-primary/20">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 w-full glass-dock border-x-0 border-t-0 px-4 sm:px-6 py-3 transition-all">
              <div className="max-w-md mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <span className="font-headline font-black text-sm tracking-tight">NC</span>
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  </div>
                  <div>
                    <h1 className="font-headline font-black text-lg tracking-tight leading-none text-foreground flex items-center gap-1.5">
                      NoCorre
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-medium tracking-wide">Inteligência no Volante</p>
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-secondary/80 border border-border hover:border-primary/40 transition-colors"
                >
                  <span className="text-xs font-semibold max-w-[90px] truncate text-foreground/80">
                    {user?.name?.split(' ')[0] || 'Motorista'}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
                    {(user?.name?.[0] || 'M').toUpperCase()}
                  </div>
                </Link>
              </div>
            </header>
            
            <main className="flex-1 overflow-x-hidden">
              {children}
            </main>

            {/* Bottom Dock Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3 pointer-events-none">
              <nav className="max-w-md mx-auto glass-dock rounded-3xl p-1.5 shadow-2xl pointer-events-auto flex items-center justify-around">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={cn(
                        "relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300 min-h-[48px]",
                        isActive 
                          ? "text-primary font-bold" 
                          : "text-muted-foreground hover:text-foreground active:scale-95"
                      )}
                    >
                      {isActive && (
                        <span className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20 animate-in fade-in zoom-in-95 duration-200" />
                      )}
                      <item.icon className={cn("w-5 h-5 relative z-10 transition-transform duration-200", isActive && "scale-110 text-primary")} />
                      <span className={cn(
                        "text-[10px] relative z-10 tracking-tight mt-1 transition-colors",
                        isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </AppProvider>
      </ShiftProvider>
    </GpsProvider>
  );
}
