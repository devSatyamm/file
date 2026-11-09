import React from 'react';
import {
  Home,
  LayoutGrid,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'all-tools',
      label: 'All Tools',
      icon: LayoutGrid,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-56 border-r border-slate-200/60 dark:border-white/[0.08] bg-white/60 dark:bg-[#07090e]/60 backdrop-blur-xl flex flex-col justify-between shrink-0 select-none py-3 px-2 transition-colors duration-200">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100/90 dark:bg-blue-600/15 text-blue-700 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-blue-100/50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
