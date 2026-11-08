import React from 'react';
import { ShieldCheck, Cpu, Heart, ExternalLink, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string, subTab?: string, initialTargetFormat?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-white/[0.08] bg-white/60 dark:bg-[#090a0f]/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-[1180px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: Brand & Mission (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                FileForge
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Offline PWA
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Universal zero-upload file conversion suite. Every tool processes documents, images, spreadsheets, and media 100% locally in your browser memory for uncompromising privacy and speed.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero server uploads • Works without internet connection</span>
            </div>
          </div>

          {/* Column 2: Quick Tools (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tool Suites
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate?.('all-tools')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  All 187 Tools Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('pdf-tools')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  PDF Toolkit (Merge, Split, Protect)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('all-tools', undefined, 'pdf')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Images to PDF Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('devtools', 'unit-length')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Offline Unit Converter
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy &amp; Security Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Lead Developer Profile (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              Lead Developer &amp; Architect
            </h4>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  SM
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Satyam Mishra
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Full-Stack Engineer &amp; System Architect
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-wrap gap-2">
                {/* GitHub */}
                <a
                  href="https://github.com/devsatyamm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-200/70 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>devsatyamm</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/in/satyamofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 text-[#0a66c2] dark:text-[#38bdf8] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>satyamofficial</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/developersatyam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>developersatyam</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Designed &amp; built by</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Satyam Mishra</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>100% Offline PWA</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for privacy
            </span>
            <span>© {new Date().getFullYear()} FileForge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

