import React, { useState } from 'react';
import { RefreshCcw, Terminal as TerminalIcon, Eye, Code, FileText, Clock, Radio } from 'lucide-react';
import { LogEntry } from '../types';
import Modal from './ui/Modal';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  executingId: string | null;
  lastResponse?: any;
}

const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose, logs, executingId, lastResponse }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'response'>('console');

  React.useEffect(() => {
    if (scrollRef.current && activeTab === 'console') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // Auto-switch to response tab when execution finishes and we have a response
  React.useEffect(() => {
    if (!executingId && lastResponse && activeTab === 'console') {
      setActiveTab('response');
    }
  }, [executingId, lastResponse]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={executingId === 'bulk' ? "Batch Execution Runtime" : "Execution Inspector"}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col h-[500px]">
        {/* Tab Headers */}
        <div className="flex items-center gap-1 mb-4 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'console' ? 'bg-white/10 text-white border border-white/10' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
          >
            <TerminalIcon size={12} />
            Console
          </button>
          {lastResponse && (
            <button
              onClick={() => setActiveTab('response')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'response' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            >
              <Eye size={12} />
              Response Data
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-[#050505] border border-white/10 rounded-sm shadow-inner overflow-hidden flex flex-col">
          {activeTab === 'console' ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02] text-white/40 text-[10px] font-mono">
                <TerminalIcon size={12} />
                <span>/bin/automation_runner --verbose</span>
              </div>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 font-mono text-[11px]"
              >
                {logs.length === 0 && (
                  <div className="text-white/10 italic">Initializing kernel...</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={`break-words flex gap-3 ${log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-red-400' :
                      log.type === 'info' ? 'text-blue-400 font-bold' : 'text-white/40'
                    }`}>
                    <span className="opacity-20 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="shrink-0 opacity-40">$</span>
                    <span className="whitespace-pre-wrap">{log.msg}</span>
                  </div>
                ))}
                {executingId && (
                  <div className="flex items-center gap-3 text-blue-400/60 pt-3 mt-3 border-t border-white/5 animate-pulse">
                    <RefreshCcw size={12} className="animate-spin" />
                    <span className="tracking-[0.2em] uppercase text-[9px] font-black italic">Awaiting response body stream...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              {/* API Header Info */}
              <div className="grid grid-cols-4 border-b border-white/5 bg-white/[0.01]">
                <div className="p-4 border-r border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lastResponse.status < 300 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                    <span className={`text-base font-black ${lastResponse.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {lastResponse.status}
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">{lastResponse.statusText}</span>
                  </div>
                </div>
                <div className="p-4 border-r border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Time</span>
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock size={14} className="text-white/20" />
                    <span className="text-base font-black tracking-tight">{lastResponse.duration}</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">ms</span>
                  </div>
                </div>
                <div className="p-4 border-r border-white/5 flex flex-col gap-1">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Size</span>
                  <div className="flex items-center gap-2 text-white/80">
                    <FileText size={14} className="text-white/20" />
                    <span className="text-base font-black tracking-tight">
                      {lastResponse.data ? (JSON.stringify(lastResponse.data).length / 1024).toFixed(2) : '0.00'}
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">KB</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Type</span>
                  <div className="flex items-center gap-2 text-white/80">
                    <Radio size={14} className="text-white/20" />
                    <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                      {typeof lastResponse.data === 'object' ? 'JSON' : 'HTML/TEXT'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-auto p-0 bg-black/40">
                <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-[#080808] text-white/40">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                    <Code size={12} className="text-blue-500" />
                    Parsed Body Content
                  </div>
                </div>
                <div className="p-6 font-mono text-[11px] leading-relaxed">
                  {typeof lastResponse.data === 'object' ? (
                    <pre className="text-blue-300 bg-blue-500/[0.02] p-4 rounded border border-blue-500/10">
                      {JSON.stringify(lastResponse.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-white/60 bg-white/[0.01] p-4 rounded border border-white/5 whitespace-pre-wrap break-all italic">
                      {lastResponse.data}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Terminal;
