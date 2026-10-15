import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CodeBlock = ({ code, language = 'text', maxHeight = 'max-h-60', title = null }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof code === 'string' ? code : JSON.stringify(code, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCode = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  return (
    <div className="relative rounded-lg bg-[#070d19] border border-slate-800 text-xs font-mono-code overflow-hidden shadow-inner">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-slate-400">
          <span className="text-[11px] font-medium tracking-wide uppercase">{title}</span>
          <span className="text-[10px] text-slate-500">{language}</span>
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors z-10"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className={`p-3.5 overflow-x-auto overflow-y-auto ${maxHeight} text-slate-300 leading-relaxed`}>
        <code>{formattedCode}</code>
      </pre>
    </div>
  );
};
