import React, { useState } from 'react';
import { Download, Monitor, ShieldCheck, Chrome, Terminal, AlertTriangle, ExternalLink, X } from 'lucide-react';

export default function SetupGuide({ onShowGuide, t }: { onShowGuide: () => void, t: any }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">{t.setupTitle}</h1>
        <p className="text-white/50">{t.setupSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Automation Server */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4 hover:border-indigo-500/50 transition-colors group">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Monitor size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.step1Title}</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {t.step1Desc}
          </p>
          <div className="pt-4">
            <a 
              href="/automation.zip"
              download
              className="w-full bg-white text-black py-2 rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              <Download size={14} /> {t.downloadServer}
            </a>
          </div>
        </div>

        {/* Step 2: Running the Server */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4 hover:border-emerald-500/50 transition-colors group">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Terminal size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.step2Title}</h3>
          <div className="text-sm text-white/60 space-y-2 font-mono bg-black/40 p-3 rounded border border-white/5">
            <p>{t.step2Desc1}</p>
            <p>{t.step2Desc2}</p>
            <p>{t.step2Desc3}</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle size={20} />
          <h3 className="font-bold uppercase tracking-widest text-sm">{t.browserPermission}</h3>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          {t.browserPermissionDesc}
        </p>
        <ul className="list-disc list-inside text-sm text-white/60 space-y-2 pl-2">
          <li>{t.permissionStep1}</li>
          <li>{t.permissionStep2}</li>
          <li>{t.permissionStep3}</li>
          <li>{t.permissionStep4}</li>
        </ul>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 text-indigo-400">
          <Chrome size={20} />
          <h3 className="font-bold uppercase tracking-widest text-sm">{t.step3Title}</h3>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          {t.step3Desc}
        </p>
        <div className="flex gap-4">
          <a 
            href="/extension.zip"
            download
            className="flex-1 bg-white/5 border border-white/10 py-2 rounded text-xs font-bold hover:bg-white/10 transition-colors text-center"
          >
            {t.downloadExtension}
          </a>
          <button 
            onClick={onShowGuide}
            className="flex-1 border border-white/10 py-2 rounded text-xs font-bold hover:bg-white/5 transition-colors"
          >
            {t.howToInstall}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-white/20 pt-8">
        <ShieldCheck size={14} />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">{t.securityProtocol}</span>
      </div>
    </div>
  );
}
