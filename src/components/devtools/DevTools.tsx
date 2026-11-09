import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Binary,
  KeyRound,
  GitCompare,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  Upload,
  Scale,
  ArrowLeftRight
} from 'lucide-react';
import { DevToolsService, DiffLine } from '../../services/devToolsService';
import { UNIT_CATEGORIES, UnitConverterService } from '../../services/unitConverterService';

export type DevTab = 'json' | 'code' | 'base64' | 'hashes' | 'diff' | 'unit';

interface DevToolsProps {
  initialTab?: string;
}

export const DevTools: React.FC<DevToolsProps> = ({ initialTab = 'json' }) => {
  const getTabAndCategory = (tabStr: string): { tab: DevTab; category?: string } => {
    if (tabStr.startsWith('unit')) {
      const parts = tabStr.split('-');
      const cat = parts[1] || 'length';
      return { tab: 'unit', category: cat };
    }
    return { tab: (tabStr as DevTab) || 'json' };
  };

  const parsed = getTabAndCategory(initialTab);
  const [activeTab, setActiveTab] = useState<DevTab>(parsed.tab);
  const [unitCategory, setUnitCategory] = useState<string>(parsed.category || 'length');
  const [unitValue, setUnitValue] = useState<number>(1);

  const currentCat = UNIT_CATEGORIES.find((c) => c.id === unitCategory) || UNIT_CATEGORIES[0];
  const [fromUnit, setFromUnit] = useState<string>(currentCat.units[0]?.id || 'm');
  const [toUnit, setToUnit] = useState<string>(currentCat.units[1]?.id || 'ft');

  React.useEffect(() => {
    if (initialTab) {
      const p = getTabAndCategory(initialTab);
      setActiveTab(p.tab);
      if (p.category) {
        setUnitCategory(p.category);
        const c = UNIT_CATEGORIES.find((cat) => cat.id === p.category) || UNIT_CATEGORIES[0];
        setFromUnit(c.units[0]?.id || '');
        setToUnit(c.units[1]?.id || c.units[0]?.id || '');
      }
    }
  }, [initialTab]);
  const [copied, setCopied] = useState<string | null>(null);

  // JSON state
  const [jsonInput, setJsonInput] = useState('{"name":"Philes","version":"1.0.0","offline":true,"features":["pdf","image","spreadsheet","security"]}');
  const [jsonResult, setJsonResult] = useState<{ formatted: string; isValid: boolean; error?: string }>({
    formatted: '',
    isValid: true,
  });

  // Code Formatter state
  const [codeType, setCodeType] = useState<'xml' | 'html' | 'css' | 'js'>('xml');
  const [codeInput, setCodeInput] = useState('<note><to>User</to><from>Philes</from><heading>Zero Cloud</heading><body>Local execution strictly enforced.</body></note>');
  const [codeOutput, setCodeOutput] = useState('');

  // Base64 / URL state
  const [b64Mode, setB64Mode] = useState<'b64_encode' | 'b64_decode' | 'url_encode' | 'url_decode'>('b64_encode');
  const [textTransformInput, setTextTransformInput] = useState('Philes universal offline toolkit');
  const [textTransformOutput, setTextTransformOutput] = useState('');

  // Hashes state
  const [hashInput, setHashInput] = useState('Philes Secure Local Converter');
  const [hashes, setHashes] = useState<{ sha1: string; sha256: string; sha512: string; md5: string } | null>(null);

  // Diff state
  const [diffOrig, setDiffOrig] = useState('function processData() {\n  console.log("old method");\n  return true;\n}');
  const [diffMod, setDiffMod] = useState('function processData() {\n  console.log("new offline method");\n  validateSignature();\n  return true;\n}');
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFormatJson = (indent: number) => {
    const res = DevToolsService.formatJson(jsonInput, indent);
    setJsonResult(res);
  };

  const handleFormatCode = () => {
    if (codeType === 'xml' || codeType === 'html') {
      setCodeOutput(DevToolsService.formatXml(codeInput));
    } else if (codeType === 'css') {
      setCodeOutput(DevToolsService.formatCss(codeInput));
    } else {
      setCodeOutput(DevToolsService.formatJs(codeInput));
    }
  };

  const handleTransform = () => {
    try {
      if (b64Mode === 'b64_encode') {
        setTextTransformOutput(DevToolsService.encodeBase64(textTransformInput));
      } else if (b64Mode === 'b64_decode') {
        setTextTransformOutput(DevToolsService.decodeBase64(textTransformInput));
      } else if (b64Mode === 'url_encode') {
        setTextTransformOutput(DevToolsService.encodeUrl(textTransformInput));
      } else {
        setTextTransformOutput(DevToolsService.decodeUrl(textTransformInput));
      }
    } catch (err: any) {
      setTextTransformOutput(`Error: ${err.message}`);
    }
  };

  const handleGenerateHashes = async () => {
    const res = await DevToolsService.generateHashes(hashInput);
    setHashes(res);
  };

  const handleHashFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const buffer = await file.arrayBuffer();
      const res = await DevToolsService.generateHashes(buffer);
      setHashes(res);
    }
  };

  const handleComputeDiff = () => {
    const lines = DevToolsService.computeDiff(diffOrig, diffMod);
    setDiffLines(lines);
  };

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Developer Tools
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          High-performance client-side formatters, validators, cryptographic hashers, and text diffing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        {[
          { id: 'json', label: 'JSON Formatter & Validator', icon: Code2 },
          { id: 'code', label: 'XML / HTML / CSS / JS Formatter', icon: FileCode },
          { id: 'base64', label: 'Base64 & URL Encoders', icon: Binary },
          { id: 'hashes', label: 'Cryptographic Hash Suite', icon: KeyRound },
          { id: 'diff', label: 'Text Difference / Compare', icon: GitCompare },
          { id: 'unit', label: 'Unit & Measurement Converters', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DevTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: JSON Formatter */}
      {activeTab === 'json' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14161f] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFormatJson(2)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
              >
                Beautify (2 Spaces)
              </button>
              <button
                onClick={() => handleFormatJson(4)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                4 Spaces
              </button>
              <button
                onClick={() => handleFormatJson(0)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Minify Compact
              </button>
            </div>
            {jsonResult.formatted && (
              <button
                onClick={() => copyToClipboard(jsonResult.formatted, 'json-out')}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
              >
                {copied === 'json-out' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'json-out' ? 'Copied' : 'Copy Result'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Raw JSON Input</span>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste JSON here..."
                rows={16}
                className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none selectable-text"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Formatted Output</span>
                {jsonResult.error && (
                  <span className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Syntax Error
                  </span>
                )}
              </div>
              <textarea
                value={jsonResult.error ? jsonResult.error : jsonResult.formatted || jsonInput}
                readOnly
                rows={16}
                className={`w-full bg-slate-50 dark:bg-[#14161f] border rounded-2xl p-4 text-xs font-mono resize-none selectable-text ${
                  jsonResult.error ? 'border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-300' : 'border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-slate-200'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Formatter */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14161f] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2">
              {(['xml', 'html', 'css', 'js'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeType(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${
                    codeType === lang ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
              <button
                onClick={handleFormatCode}
                className="ml-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Format Code
              </button>
            </div>
            {codeOutput && (
              <button
                onClick={() => copyToClipboard(codeOutput, 'code-out')}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
              >
                {copied === 'code-out' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'code-out' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code to beautify..."
              rows={16}
              className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none selectable-text"
            />
            <textarea
              value={codeOutput || 'Click Format Code above'}
              readOnly
              rows={16}
              className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 resize-none selectable-text"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Base64 & URL */}
      {activeTab === 'base64' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14161f] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'b64_encode', label: 'Base64 Encode' },
                { id: 'b64_decode', label: 'Base64 Decode' },
                { id: 'url_encode', label: 'URL Encode' },
                { id: 'url_decode', label: 'URL Decode' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setB64Mode(m.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    b64Mode === m.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                onClick={handleTransform}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                Transform
              </button>
            </div>
            {textTransformOutput && (
              <button
                onClick={() => copyToClipboard(textTransformOutput, 'b64-out')}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
              >
                {copied === 'b64-out' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'b64-out' ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={textTransformInput}
              onChange={(e) => setTextTransformInput(e.target.value)}
              placeholder="Input text..."
              rows={14}
              className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none selectable-text"
            />
            <textarea
              value={textTransformOutput}
              readOnly
              placeholder="Output will appear here..."
              rows={14}
              className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 resize-none selectable-text"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Hashes */}
      {activeTab === 'hashes' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Calculate SHA-256, SHA-512, SHA-1, and MD5
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="hash-file"
                  onChange={handleHashFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="hash-file"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Hash File Binary</span>
                </label>
                <button
                  onClick={handleGenerateHashes}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                >
                  Compute Hashes
                </button>
              </div>
            </div>

            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Type or paste text to hash..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-white/[0.1] rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none selectable-text"
            />

            {hashes && (
              <div className="space-y-3 pt-2">
                {[
                  { name: 'SHA-256', val: hashes.sha256 },
                  { name: 'SHA-512', val: hashes.sha512 },
                  { name: 'SHA-1', val: hashes.sha1 },
                  { name: 'MD5', val: hashes.md5 },
                ].map((h) => (
                  <div key={h.name} className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-white/[0.06] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{h.name}</span>
                      <button
                        onClick={() => copyToClipboard(h.val, h.name)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white flex items-center gap-1"
                      >
                        {copied === h.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === h.name ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">{h.val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Text Diff */}
      {activeTab === 'diff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#14161f] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Line-by-Line Difference Comparison
            </span>
            <button
              onClick={handleComputeDiff}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Differences
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Original Text</span>
              <textarea
                value={diffOrig}
                onChange={(e) => setDiffOrig(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 selectable-text"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Modified Text</span>
              <textarea
                value={diffMod}
                onChange={(e) => setDiffMod(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 selectable-text"
              />
            </div>
          </div>

          {diffLines.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#14161f] overflow-hidden shadow-sm dark:shadow-none">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] text-xs font-semibold text-slate-500 dark:text-slate-400">
                Diff Result View
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono text-xs max-h-96 overflow-auto">
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-1 flex items-center gap-3 ${
                      line.type === 'added'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : line.type === 'removed'
                        ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-6 text-slate-400 select-none text-[10px]">
                      {line.leftLineNumber || line.rightLineNumber || ''}
                    </span>
                    <span className="w-4 select-none font-bold">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="selectable-text whitespace-pre-wrap">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Unit & Measurement Converters */}
      {activeTab === 'unit' && (
        <div className="space-y-6">
          {/* Category Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-[#14161f] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
            {UNIT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setUnitCategory(cat.id);
                  setFromUnit(cat.units[0]?.id || '');
                  setToUnit(cat.units[1]?.id || cat.units[0]?.id || '');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  unitCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-50 dark:bg-[#181b26] text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 dark:border-white/[0.06]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Interactive Bidirectional Converter Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* From input */}
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  From ({currentCat.units.find((u) => u.id === fromUnit)?.name || ''})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={unitValue}
                    onChange={(e) => setUnitValue(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-11 px-3.5 bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.1] rounded-xl text-base font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="h-11 px-3 bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none shadow-sm"
                  >
                    {currentCat.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={() => {
                  const temp = fromUnit;
                  setFromUnit(toUnit);
                  setToUnit(temp);
                }}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-white/[0.15] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 shadow-sm mt-5 md:mt-0"
                title="Swap units"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              {/* To output */}
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  To ({currentCat.units.find((u) => u.id === toUnit)?.name || ''})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={UnitConverterService.convert(unitValue, fromUnit, toUnit, unitCategory).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    className="flex-1 h-11 px-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-base font-bold text-blue-700 dark:text-blue-300 shadow-sm"
                  />
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="h-11 px-3 bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none shadow-sm"
                  >
                    {currentCat.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Conversion Matrix */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                1 {currentCat.units.find((u) => u.id === fromUnit)?.name} equals:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {currentCat.units.map((u) => {
                  const val = UnitConverterService.convert(1, fromUnit, u.id, unitCategory);
                  return (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181b26] border border-slate-200/70 dark:border-white/[0.04] text-xs"
                    >
                      <p className="text-[11px] text-slate-500">{u.name}</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {val < 0.00001 ? val.toExponential(4) : val.toLocaleString(undefined, { maximumFractionDigits: 4 })} {u.symbol}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
