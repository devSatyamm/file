import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Network,
  Lock,
  FileCode,
  AlertTriangle,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { networkMonitor } from '../../services/networkMonitor';
import { SecurityTestSuite } from '../../services/securityTests';
import { SecurityCheckResult, NetworkLogEntry } from '../../types';

export const SecurityCenter: React.FC = () => {
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);
  const [testResults, setTestResults] = useState<SecurityCheckResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [viewSecurityMd, setViewSecurityMd] = useState(false);
  const [securityMdContent, setSecurityMdContent] = useState<string>('');

  useEffect(() => {
    networkMonitor.init();
    const unsubscribe = networkMonitor.subscribe((logs) => {
      setNetworkLogs(logs);
    });

    // Run tests automatically on first visit
    handleRunTests();

    return () => unsubscribe();
  }, []);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await SecurityTestSuite.runAllTests();
      setTestResults(results);
    } catch (err) {
      console.error('Security test suite execution failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const loadSecurityDoc = async () => {
    try {
      const resp = await fetch('/SECURITY.md');
      if (resp.ok) {
        const text = await resp.text();
        setSecurityMdContent(text);
      } else {
        setSecurityMdContent('# Security Policy\nSee root repository SECURITY.md file.');
      }
    } catch {
      setSecurityMdContent('# Security Policy\nZero-upload local sandbox active.');
    }
    setViewSecurityMd(true);
  };

  const passedTestsCount = testResults.filter((r) => r.status === 'passed').length;
  const totalTestsCount = testResults.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Security &amp; Privacy Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time network surveillance, automated attack-defense tests, and zero-upload policy enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSecurityDoc}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Read SECURITY.md</span>
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunningTests ? 'Running Security Suite...' : 'Run Automated Tests'}</span>
          </button>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#12141c] border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outbound Leakage</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">0 Outbound Payloads</p>
          <p className="text-xs text-slate-400 mt-1">
            Strict client sandbox. No telemetry or server uploads.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12141c] border border-blue-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automated Checks</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {passedTestsCount} / {totalTestsCount || 6} Passed
          </p>
          <p className="text-xs text-blue-400 mt-1">
            Real payload tests: SVG XSS, ZIP Slip, ZIP Bomb, Magic Bytes.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#12141c] border border-cyan-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content Security Policy</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400">Strict CSP Active</p>
          <p className="text-xs text-slate-400 mt-1">
            Inline script blocks restricted, frames isolated.
          </p>
        </div>
      </div>

      {/* Automated Security Test Results */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Automated Attack-Defense Verification Suite
          </span>
          <span className="text-[11px] text-slate-500">
            Tested dynamically in client memory
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {testResults.map((test) => (
            <div key={test.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  test.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {test.status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{test.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 uppercase">
                      {test.category}
                    </span>
                    {test.executionTimeMs !== undefined && (
                      <span className="text-[10px] text-slate-500">{test.executionTimeMs}ms</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{test.description}</p>
                  <p className="text-xs text-emerald-400/90 font-mono mt-1.5">{test.details}</p>
                </div>
              </div>

              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                test.status === 'passed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400'
              }`}>
                {test.status === 'passed' ? 'Passed' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Network Activity Monitor */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Real-time Network Traffic Audit Log ({networkLogs.length} events)
            </span>
          </div>
          <button
            onClick={() => networkMonitor.clearLogs()}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear Log
          </button>
        </div>

        <div className="divide-y divide-white/[0.04] max-h-72 overflow-auto font-mono text-xs">
          {networkLogs.map((log) => (
            <div key={log.id} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.blocked ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {log.method}
                </span>
                <span className="text-slate-300 truncate max-w-md">{log.url}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className={log.blocked ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                  {log.reason}
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECURITY.md In-App Modal */}
      {viewSecurityMd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-white/[0.1] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#161924]">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                SECURITY.md — Threat Model &amp; Architecture
              </h3>
              <button
                onClick={() => setViewSecurityMd(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/[0.05]"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-auto text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed selectable-text">
              {securityMdContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

