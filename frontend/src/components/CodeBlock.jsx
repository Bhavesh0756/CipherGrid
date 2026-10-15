import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CodeBlock = ({ code = '', language = '', maxHeight = 'max-h-48', className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className={`relative group code-block overflow-hidden ${maxHeight} ${className}`}>
      {/* Language tag */}
      {language && (
        <div className="absolute top-0 left-0 px-2 py-0.5 bg-sky-500/10 border-b border-r border-[#1a2844] rounded-br text-[10px] font-mono-code text-sky-400/80 uppercase tracking-wider z-10">
          {language}
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>

      {/* Code content */}
      <pre className={`p-3 overflow-auto font-mono-code text-[11px] text-slate-300 leading-relaxed ${language ? 'pt-6' : ''} ${maxHeight} whitespace-pre-wrap break-all`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
