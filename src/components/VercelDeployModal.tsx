import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Server, ShieldCheck, Terminal, X, Zap } from 'lucide-react';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gitCommands = `# 1. 初始化 Git 並推送到您的 GitHub 儲存庫
git init
git add .
git commit -m "feat: deploy Taiwan Stocks Quant Pro to Vercel"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taiwan-stocks-quant.git
git push -u origin main`;

  const cliCommands = `# 透過 Vercel 官方 CLI 終端指令一鍵部署
npm install -g vercel
vercel

# 正式上線發布至生產環境
vercel --prod`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              ▲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Vercel 雲端部署架構已就緒</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                已自動轉化為 Vite 前端靜態加速 + Vercel Serverless API 架構
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature Checks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">vercel.json</div>
              <div className="text-[10px] text-slate-400">路由自動重定向</div>
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2">
            <Server size={16} className="text-blue-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">api/index.ts</div>
              <div className="text-[10px] text-slate-400">無伺服器函式</div>
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2">
            <Globe size={16} className="text-purple-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">Edge Network</div>
              <div className="text-[10px] text-slate-400">全球 CDN 快取</div>
            </div>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2">
            <Zap size={16} className="text-yellow-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-200">/api/health</div>
              <div className="text-[10px] text-slate-400">健康監控接口</div>
            </div>
          </div>
        </div>

        {/* Deployment Method 1: GitHub & Vercel Dashboard */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center text-[11px]">1</span>
              <span>方法一：GitHub 連動部署（最推薦，支援自動 CI/CD）</span>
            </div>
            <button
              onClick={() => copyText('git', gitCommands)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'git' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedKey === 'git' ? '已複製' : '複製 Git 指令'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            將此專案推送到您的 GitHub，再於 Vercel 控制台點擊「Import Project」，Vercel 會讀取根目錄的 <code className="text-blue-300 font-mono">vercel.json</code> 自動完成建置與路由映射。
          </p>
          <pre className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
            {gitCommands}
          </pre>
        </div>

        {/* Deployment Method 2: Vercel CLI */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal size={14} className="text-amber-400" />
              <span>方法二：Vercel CLI 終端指令部署</span>
            </div>
            <button
              onClick={() => copyText('cli', cliCommands)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedKey === 'cli' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedKey === 'cli' ? '已複製' : '複製 CLI 指令'}</span>
            </button>
          </div>
          <pre className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
            {cliCommands}
          </pre>
        </div>

        {/* Vercel Preset Settings Summary */}
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-xs flex flex-col gap-1.5 font-mono text-slate-400">
          <div className="font-sans font-semibold text-slate-300">Vercel 自動辨識之建置參數：</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div>• Framework: <strong className="text-slate-200">Vite</strong></div>
            <div>• Build Command: <strong className="text-slate-200">vite build</strong></div>
            <div>• Output Dir: <strong className="text-slate-200">dist</strong></div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">
            詳情請參閱根目錄的 VERCEL_DEPLOYMENT.md 文件
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              關閉
            </button>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-white text-black hover:bg-slate-200 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>前往 Vercel 匯入</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
