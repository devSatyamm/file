import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { HomePage } from './components/home/HomePage';
import { AllToolsPage } from './components/tools/AllToolsPage';
import { Settings } from './components/settings/Settings';
import { PdfToolkit } from './components/pdf/PdfToolkit';
import { DevTools } from './components/devtools/DevTools';
import { ArchiveManager } from './components/archive/ArchiveManager';
import { Footer } from './components/common/Footer';
import { networkMonitor } from './services/networkMonitor';
import { Home, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';
import bgDark from './assets/bg-dark.jpg';
import bgLight from './assets/bg-light.jpg';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [presetTargetFormat, setPresetTargetFormat] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    // Initialize zero-leak network monitor on boot
    networkMonitor.init();

    // Dynamically react to theme class changes on <html>
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (tab: string, subTab?: string, initialTargetFormat?: string) => {
    setActiveTab(tab);
    setActiveSubTab(subTab);
    if (initialTargetFormat) {
      setPresetTargetFormat(initialTargetFormat);
    } else {
      setPresetTargetFormat(null);
    }
    // Scroll viewport to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-600/30 selection:text-blue-900 dark:selection:text-blue-200 transition-colors duration-200 overflow-x-hidden">
      {/* Dynamic Ambient Fullscreen Wallpaper */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out"
        style={{
          backgroundImage: `url(${isDark ? bgDark : bgLight})`,
        }}
      />

      {/* Main Interactive App Container */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen bg-transparent">
        {/* Slim, Premium Header */}
        <Header activeTab={activeTab} onNavigate={handleNavigate} />

        {/* Main Layout Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Simplified Desktop Sidebar */}
          <div className="hidden md:flex flex-col">
            <Sidebar activeTab={activeTab} onNavigate={(tab) => handleNavigate(tab)} />
          </div>

          {/* Dynamic Viewport Container */}
          <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {activeTab === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                presetTargetFormat={presetTargetFormat}
              />
            )}

            {activeTab === 'all-tools' && (
              <AllToolsPage onNavigate={handleNavigate} />
            )}

            {activeTab === 'settings' && (
              <Settings />
            )}

            {activeTab === 'pdf-tools' && (
              <div className="max-w-[1120px] mx-auto py-4 px-2 sm:px-4">
                <PdfToolkit initialMode={activeSubTab as any} />
              </div>
            )}

            {activeTab === 'devtools' && (
              <div className="max-w-[1120px] mx-auto py-4 px-2 sm:px-4">
                <DevTools initialTab={activeSubTab as any} />
              </div>
            )}

            {activeTab === 'archive' && (
              <div className="max-w-[1120px] mx-auto py-4 px-2 sm:px-4">
                <ArchiveManager initialTab={activeSubTab as any} />
              </div>
            )}
          </div>

          {/* Persistent Global Footer */}
          <Footer onNavigate={handleNavigate} />
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation */}
      <div className="md:hidden border-t border-slate-200/60 dark:border-white/[0.08] bg-white/80 dark:bg-[#07090e]/80 backdrop-blur-xl px-4 py-2 flex items-center justify-around z-30 transition-colors duration-200">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'all-tools', label: 'All Tools', icon: LayoutGrid },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export default App;
