import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wifi,
  WifiOff,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Download,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';
import { TOOLS_CATALOG, ToolDefinition } from '../../services/toolsCatalog';

interface HeaderProps {
  onNavigate: (tab: string, subTab?: string, initialTargetFormat?: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activeTab }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('philes-theme') as 'dark' | 'light' | null;
      if (saved) return saved;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync initial theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Keyboard shortcut '/' to search
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Close search dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Philes is PWA ready. To install, use "Install App" or your browser\'s address bar install icon.');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('philes-theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const filteredTools = searchQuery.trim()
    ? TOOLS_CATALOG.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.targetFormat && t.targetFormat.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleSelectTool = (tool: ToolDefinition) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (tool.viewTarget === 'pdf-tools') {
      onNavigate('pdf-tools', tool.viewSubTab);
    } else if (tool.viewTarget === 'devtools') {
      onNavigate('devtools', tool.viewSubTab);
    } else if (tool.viewTarget === 'archive') {
      onNavigate('archive', tool.viewSubTab);
    } else {
      // Home / Universal converter
      onNavigate('home', undefined, tool.targetFormat);
    }
  };

  return (
    <header className="h-[52px] border-b border-slate-200/60 dark:border-white/[0.08] bg-white/75 dark:bg-[#07090e]/75 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Left: Brandmark & Name */}
      <div
        className="flex items-center gap-2.5 cursor-pointer shrink-0"
        onClick={() => onNavigate('home')}
      >
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
          Philes
        </span>
      </div>

      {/* Center: Search tools input */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search tools... (Press / to search)"
            className="w-full h-8 pl-8 pr-8 bg-blue-50/70 dark:bg-[#15171e] hover:bg-blue-100/60 dark:hover:bg-[#181b24] focus:bg-white dark:focus:bg-[#181b24] border border-blue-200 dark:border-white/[0.08] focus:border-blue-500/50 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && filteredTools.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#14161f] border border-blue-200 dark:border-white/[0.1] rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-blue-50 dark:divide-white/[0.04] animate-in fade-in duration-100">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50/70 dark:hover:bg-white/[0.04] flex items-center justify-between text-xs transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {tool.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-blue-100 dark:border-transparent">
                      {tool.categoryLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {tool.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-blue-100/60 dark:hover:bg-white/[0.05] transition-colors"
            title="Install as native desktop utility application"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-blue-100/60 dark:hover:bg-white/[0.05] transition-colors"
          title={theme === 'dark' ? 'Switch to daylight mode' : 'Switch to dark linear theme'}
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Settings Icon */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-1.5 rounded-md transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-blue-100/60 dark:hover:bg-white/[0.05]'
          }`}
          title="Settings & Privacy"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
