import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MailCheck, 
  ListTodo, 
  FileSpreadsheet, 
  CalendarDays,
  Clock
} from 'lucide-react';
import { formatFullDisplayDate } from '../lib/storage';

export type TabType = 'dashboard' | 'gmail_list' | 'tasks' | 'my_work';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentDate: string;
  selectedCount: number;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentDate,
  pendingCount,
}) => {
  // Live minimal Bangladesh digital clock (Asia/Dhaka)
  const [bdTime, setBdTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeFormatted = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now);
        setBdTime(timeFormatted);
      } catch {
        const now = new Date();
        setBdTime(now.toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gmail_list', label: 'Gmail List', icon: MailCheck },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'my_work', label: 'My Work', icon: FileSpreadsheet },
  ];

  const formattedDate = formatFullDisplayDate(currentDate);

  return (
    <>
      {/* Top Header: Minimal Date, Bangladesh Time */}
      <header
        id="app-header"
        className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-[#e2e8e3] px-3.5 sm:px-6 lg:px-8 py-2.5 shadow-xs transition-colors"
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Minimal Date + Spaced Bangladesh Digital Clock */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#12160f] whitespace-nowrap">
              <CalendarDays className="w-3.5 h-3.5 text-[#0c7a4b] shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="h-3.5 w-px bg-[#d9e2db] shrink-0" />
            <div className="flex items-center gap-1.5 bg-[#f0f7f3] text-[#095c3a] border border-[#d2eadb] px-2 py-0.5 rounded-[6px] font-mono text-[11px] sm:text-xs font-bold shadow-2xs whitespace-nowrap">
              <Clock className="w-3 h-3 text-[#0c7a4b] shrink-0" />
              <span>{bdTime || '--:--:--'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Corporate Navigation Bar (4 clean tabs) */}
      <nav
        id="bottom-navigation"
        className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#e2e8e3] safe-area-bottom shadow-lg"
      >
        <div className="w-full max-w-xl mx-auto grid grid-cols-4 px-2 sm:px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-[10px] transition-all relative cursor-pointer group ${
                  isActive
                    ? 'text-[#095c3a] font-bold'
                    : 'text-[#7c8880] hover:text-[#12160f] font-semibold'
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isActive && (
                  <span className="absolute -top-2 w-6 h-[3px] rounded-full bg-[#0c7a4b]" />
                )}
                <div className="relative">
                  <Icon className={`w-[20px] h-[20px] transition-transform ${isActive ? 'scale-105 text-[#095c3a]' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-[#a3372c] text-[9px] font-bold text-white flex items-center justify-center border-2 border-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] mt-1 tracking-tight whitespace-nowrap leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
