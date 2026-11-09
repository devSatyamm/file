import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TOOLS_CATALOG, ToolDefinition } from '../../services/toolsCatalog';
import { ToolCard } from './ToolCard';

interface AllToolsPageProps {
  onNavigate: (tab: string, subTab?: string, initialTargetFormat?: string) => void;
}

export const AllToolsPage: React.FC<AllToolsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: `All Tools (${TOOLS_CATALOG.length})` },
    { id: 'popular', label: 'Popular' },
    { id: 'convertToPdf', label: 'Convert to PDF' },
    { id: 'convertFromPdf', label: 'Convert from PDF' },
    { id: 'pdf', label: 'PDF Tools' },
    { id: 'image', label: 'Image Converters' },
    { id: 'video', label: 'Video Converters' },
    { id: 'audio', label: 'Audio Converters' },
    { id: 'document', label: 'Documents & E-Books' },
    { id: 'spreadsheet', label: 'Spreadsheets & Data' },
    { id: 'archive', label: 'Archives & ZIP' },
    { id: 'compressor', label: 'Compressors' },
    { id: 'utility', label: 'Editing & Utilities' },
    { id: 'unit', label: 'Unit Converters' },
    { id: 'developer', label: 'Developer Tools' },
  ];

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory =
      activeCategory === 'all' ||
      tool.category === activeCategory ||
      (activeCategory === 'popular' && tool.category === 'popular') ||
      (activeCategory === 'pdf' && (tool.category === 'popular' && tool.id.includes('pdf')));
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.targetFormat && tool.targetFormat.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleLaunchTool = (tool: ToolDefinition) => {
    if (tool.viewTarget === 'pdf-tools') {
      onNavigate('pdf-tools', tool.viewSubTab);
    } else if (tool.viewTarget === 'devtools') {
      onNavigate('devtools', tool.viewSubTab);
    } else if (tool.viewTarget === 'archive') {
      onNavigate('archive', tool.viewSubTab);
    } else {
      onNavigate('home', undefined, tool.targetFormat);
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-8 py-6 px-3 sm:px-6">
      {/* Title & Filter Bar */}
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            All File Tools
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Genuine 100% offline client-side conversions, PDF manipulation, compression, and developer utilities.
          </p>
        </div>

        {/* Search input & counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by format, tool name, or capability..."
              className="w-full h-9 pl-9 pr-4 bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] focus:border-blue-500/50 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-sm dark:shadow-none transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredTools.length} tools
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tool Cards (5 columns on desktop) */}
      {filteredTools.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          No tools found matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={handleLaunchTool} />
          ))}
        </div>
      )}
    </div>
  );
};
