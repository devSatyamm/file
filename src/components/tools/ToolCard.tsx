import React from 'react';
import { ToolDefinition } from '../../services/toolsCatalog';
import { ToolCardBadge } from '../common/ToolCardBadge';
import { ArrowUpRight } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: (tool: ToolDefinition) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div
      onClick={() => onClick(tool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(tool);
        }
      }}
      className="group relative bg-white/70 dark:bg-[#0c0f18]/65 backdrop-blur-xl hover:bg-white/85 dark:hover:bg-[#101422]/80 border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px]"
    >
      <div>
        {/* Top: Icon Badge & subtle arrow */}
        <div className="flex items-start justify-between">
          <ToolCardBadge id={tool.id} />
          <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-blue-500 transition-all duration-150">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[17px] text-slate-800 dark:text-slate-100 mt-4 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
          {tool.description}
        </p>
      </div>

      {/* Subtle bottom meta */}
      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span className="font-medium">{tool.categoryLabel}</span>
        {tool.targetFormat && (
          <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400">
            to {tool.targetFormat}
          </span>
        )}
      </div>
    </div>
  );
};

