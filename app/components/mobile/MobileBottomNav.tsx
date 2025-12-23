'use client';

import { Home, Search, Heart, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { listSaved } from '@/lib/saved';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);
  const supabase = getSupabase();

  useEffect(() => {
    // Load saved count
    function refreshSavedCount() {
      try {
        setSavedCount(listSaved().length);
      } catch (error) {
        console.error('Error loading saved count:', error);
      }
    }

    refreshSavedCount();

    // Listen for storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'thg_saved_v1') {
        refreshSavedCount();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refreshSavedCount);
    
    const interval = setInterval(refreshSavedCount, 3000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refreshSavedCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/property-listing/', icon: Search, label: 'Search' },
    { href: '/saved', icon: Heart, label: 'Saved' },
    { href: '/my-dashboard', icon: User, label: 'Profile' }
  ];

  // Don't show on certain pages (like login, registration)
  const hideOnPaths = ['/login', '/registration', '/buyer-form'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 lg:hidden z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 relative transition-all active:scale-95 touch-manipulation ${
                isActive ? 'text-[#1e40af]' : 'text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                {item.label === 'Saved' && savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#1e40af] text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {savedCount > 99 ? '99+' : savedCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#1e40af] rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}






