import React, { useState } from 'react';
import { generatePythonScript } from '../utils/pythonExporter.ts';
import { StrategyConfig } from '../types/stock.ts';
import { Copy, Check, Download, Terminal, X } from 'lucide-react';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  stockName: string;
  strategy?: StrategyConfig;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({
  isOpen,
  onClose,
  symbol,
  stockName,
  strategy,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const defaultStrategy: StrategyConfig = strategy || {
    name: '台股海龜30日突破與動態風控策略',
    entryLogic: 'AND',
    exitLogic: 'OR',
    entryConditions: [
      { id: '1', type: 'checkBreakout30dHigh', name: '突破過去30日最高價', description: '突破30日高點', enabled: true },
      { id: '2', type: 'checkCloseAboveMa20', name: '站上MA20月線', description: '收盤站上月線', enabled: true },
    ],
    exitConditions: [
      { id: 'e1', type: 'checkCloseBelowMa20', name: '跌破MA20', description: '收盤跌破月線', enabled: true },
    ],
    atrInitialStopMultiplier: 2.0,
    atrTrailingStopMultiplier: 3.0,
    initialCapital: 1000000,
    positionSizing: 'ALL_IN',
    transactionFeePct: 0.1425,
    taxPct: 0.3,
  };

  const scriptContent = generatePythonScript(symbol, stockName, defaultStrategy);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taiwan_quant_${symbol.replace('.', '_')}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-yellow-400" />
            <h3 className="font-bold text-slate-100 text-sm sm:text-base">
              Python / Plotly Dash 量化分析腳本匯出
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-yellow-950/30 border-b border-yellow-800/40 text-xs text-yellow-300 flex items-center justify-between">
          <span>
            本 Python 腳本已預先載入 <strong>{symbol} ({stockName})</strong> 的完整回測邏輯、KD/MACD 計算與 Plotly 互動式圖表繪製，可直接在 本機 Python、Jupyter Notebook 或 Google Colab 執行。
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md flex items-center gap-1 transition-colors text-xs"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? '已複製' : '複製程式碼'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-semibold rounded-md flex items-center gap-1 transition-colors text-xs"
            >
              <Download size={13} />
              <span>下載 .py 檔案</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {scriptContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>依賴套件: pip install yfinance pandas plotly numpy</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
