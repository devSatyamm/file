import React from 'react';

interface ToolCardBadgeProps {
  id: string;
  size?: number;
}

export const ToolCardBadge: React.FC<ToolCardBadgeProps> = ({ id, size = 48 }) => {
  // 1. Merge PDF: Red/coral badge with inward pointing arrows
  if (id === 'merge-pdf') {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5l6 6" />
          <path d="M11 5v6H5" />
          <path d="M19 19l-6-6" />
          <path d="M13 19v-6h6" />
        </svg>
      </div>
    );
  }

  // 2. Split PDF: Red/coral badge with outward pointing arrows
  if (id === 'split-pdf') {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 4h6v6" />
          <path d="M11 13l9-9" />
          <path d="M10 20H4v-6" />
          <path d="M13 11l-9 9" />
        </svg>
      </div>
    );
  }

  // 3. Compressors: Emerald green badge with 4 inward corner arrows
  if (id.includes('compress')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8V4h4" />
          <path d="M4 4l5 5" />
          <path d="M20 8V4h-4" />
          <path d="M20 4l-5 5" />
          <path d="M4 16v4h4" />
          <path d="M4 20l5-5" />
          <path d="M20 16v4h-4" />
          <path d="M20 20l-5-5" />
        </svg>
      </div>
    );
  }

  // 4. PDF to Word: Blue dual badge with "W"
  if (id === 'pdf-to-word' || id === 'pdf-to-docx') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#2b579a] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm">
          W
        </div>
      </div>
    );
  }

  // 5. PDF to PowerPoint: Orange dual badge with "P"
  if (id === 'pdf-to-powerpoint' || id === 'pdf-to-pptx') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/70 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#d24726] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm">
          P
        </div>
      </div>
    );
  }

  // 6. PDF to Excel: Green dual badge with "X"
  if (id === 'pdf-to-excel' || id === 'pdf-to-xlsx') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#217346] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm">
          X
        </div>
      </div>
    );
  }

  // 7. Word to PDF: Blue "W"
  if (id === 'word-to-pdf' || id === 'docx-to-pdf' || id === 'doc-to-pdf') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-[#2b579a] dark:text-blue-300 font-extrabold text-[15px]">
          W
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#2b579a] flex items-center justify-center text-white shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
      </div>
    );
  }

  // 8. PowerPoint to PDF: Orange "P"
  if (id === 'powerpoint-to-pdf' || id === 'pptx-to-pdf') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/60 border border-orange-200 dark:border-orange-700 flex items-center justify-center text-[#d24726] dark:text-orange-300 font-extrabold text-[15px]">
          P
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#d24726] flex items-center justify-center text-white shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
      </div>
    );
  }

  // 9. Excel to PDF: Green "X"
  if (id === 'excel-to-pdf' || id === 'xlsx-to-pdf' || id === 'csv-to-pdf') {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-[#217346] dark:text-emerald-300 font-extrabold text-[15px]">
          X
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-[#217346] flex items-center justify-center text-white shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 7l10 10m0-6v6h-6" />
          </svg>
        </div>
      </div>
    );
  }

  // 10. Edit PDF & Annotate
  if (id === 'edit-pdf' || id === 'watermark-pdf' || id === 'annotate-pdf') {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
          <path d="M12 8v8" />
          <path d="M9 8h6" />
          <path d="M9 16h6" />
          <path d="M16 16l4 4" />
        </svg>
      </div>
    );
  }

  // 11. Image to PDF
  if (id.includes('to-pdf') && (id.includes('jpg') || id.includes('png') || id.includes('webp') || id.includes('svg') || id.includes('image') || id.includes('bmp') || id.includes('tiff') || id.includes('heic'))) {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-bold text-[10px]">
          PDF
        </div>
      </div>
    );
  }

  // 12. PDF to Images
  if (id.startsWith('pdf-to-jpg') || id.startsWith('pdf-to-png') || id.startsWith('pdf-to-images')) {
    return (
      <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200">
        <div className="absolute top-0 left-0 w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm font-bold text-[10px]">
          PDF
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      </div>
    );
  }

  // 13. Unit Converters
  if (id.includes('converter') && (id.includes('length') || id.includes('weight') || id.includes('temperature') || id.includes('storage') || id.includes('area') || id.includes('volume') || id.includes('speed') || id.includes('time') || id.includes('pressure') || id.includes('energy') || id.includes('unit'))) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
        </svg>
      </div>
    );
  }

  // 14. Video Tools & Converters
  if (id.includes('video') || id.includes('mp4') || id.includes('webm') || id.includes('mov') || id.includes('mkv') || id.includes('avi') || id.includes('wmv') || id.includes('flv') || id.includes('3gp') || id.includes('ogv')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
    );
  }

  // 15. Audio Tools & Converters
  if (id.includes('audio') || id.includes('mp3') || id.includes('wav') || id.includes('aac') || id.includes('ogg') || id.includes('flac') || id.includes('m4a') || id.includes('wma') || id.includes('opus')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    );
  }

  // 16. E-Books
  if (id.includes('epub') || id.includes('mobi') || id.includes('rtf')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
    );
  }

  // 17. Image Tools & Converters (PNG, JPG, WebP, SVG, BMP, ICO, HEIC, TIFF)
  if (id.includes('jpg') || id.includes('png') || id.includes('webp') || id.includes('svg') || id.includes('bmp') || id.includes('ico') || id.includes('heic') || id.includes('tiff') || id.includes('image') || id.includes('gif')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  // 18. Spreadsheets & CSV
  if (id.includes('csv') || id.includes('xlsx') || id.includes('xls') || id.includes('sheet')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      </div>
    );
  }

  // 19. Archives & ZIP
  if (id.includes('zip') || id.includes('archive') || id.includes('tar') || id.includes('gz') || id.includes('7z') || id.includes('rar')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </div>
    );
  }

  // 20. Developer Tools & Code
  if (id.includes('json') || id.includes('xml') || id.includes('html') || id.includes('base64') || id.includes('hash') || id.includes('diff') || id.includes('jwt')) {
    return (
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
    );
  }

  // Default fallback badge
  return (
    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
};
