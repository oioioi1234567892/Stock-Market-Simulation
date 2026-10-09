import React, { useState } from 'react';
import { AiStockFinancialAnalysis } from '../types/aiFinancialAnalysis.ts';
import {
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Award,
  Zap,
  BarChart3,
  Percent,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  LineChart,
  CheckCircle2,
  Cpu,
  Layers,
  FileSpreadsheet,
  Compass,
} from 'lucide-react';

interface AiFinancialReportModalProps {
  stock: AiStockFinancialAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectStockForChart: (symbol: string, name: string) => void;
  onRefreshAnalysis: (symbol: string) => Promise<void>;
  isRefreshing?: boolean;
}

export const AiFinancialReportModal: React.FC<AiFinancialReportModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSelectStockForChart,
  onRefreshAnalysis,
  isRefreshing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'profit' | 'capital' | 'risk'>('all');

  if (!isOpen || !stock) return null;

  const isUp = stock.changePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles size={16} className="text-blue-400" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {stock.name} <span className="font-mono text-sm text-slate-400">({stock.code})</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {stock.sector}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${stock.competitivenessBadgeClass}`}>
                  {stock.competitivenessLabel}
                </span>
                {stock.source === 'gemini' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Gemini 3.8
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                現價: <strong className="text-slate-200">${stock.currentPrice}</strong> · 漲跌幅:{' '}
                <strong className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                  {isUp ? '+' : ''}{stock.changePercent}%
                </strong> · {stock.peerRankText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefreshAnalysis(stock.symbol)}
              disabled={isRefreshing}
              title="重新調用 AI Agent 進行最新財報推算"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
              <span className="hidden sm:inline">重新推算</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Executive Summary Banner */}
          <div className="bg-linear-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-900/40 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  AI Agent 首席財報分析師・操盤手投資評級
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${stock.traderVerdictBadgeClass}`}>
                  {stock.traderVerdictLabel}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-w-2xl font-medium">
                {stock.traderSummary}
              </p>
            </div>

            <button
              onClick={() => {
                onSelectStockForChart(stock.symbol, stock.name);
                onClose();
              }}
              className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            >
              <LineChart size={14} />
              <span>載入即時 K 線圖</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 4 Score Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
            {/* 1. 產業競爭力 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Award size={13} className="text-amber-400" />
                <span>產業賽道競爭力</span>
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">
                {stock.competitivenessScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 truncate">{stock.competitivenessLabel}</span>
            </div>

            {/* 2. 獲利能力 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Percent size={13} className="text-emerald-400" />
                <span>獲利品質評分</span>
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-1">
                {stock.profitabilityScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">毛利 {stock.grossMarginLatest}% · 營益 {stock.operatingMarginLatest}%</span>
            </div>

            {/* 3. 資產報酬率 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Zap size={13} className="text-cyan-400" />
                <span>資本回報效率</span>
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-1">
                {stock.assetReturnScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">ROE {stock.roeLatest}% · ROIC {stock.roicLatest}%</span>
            </div>

            {/* 4. 負債健康度 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-blue-400" />
                <span>負債健康安全度</span>
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-300 mt-1">
                {stock.debtHealthScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">負債比 {stock.debtRatioLatest}% · FCF {stock.freeCashFlowLatest}億</span>
            </div>
          </div>

          {/* Section 1: 產業橫向競爭力對比與護城河 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
                <Award size={15} className="text-amber-400" />
                <span>1. 產業賽道橫向對比與技術護城河 (Moat & Industry Rank)</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                {stock.peerRankText}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.competitivenessMoat}
            </p>
          </div>

          {/* Section 2: 獲利能力深度剖析 (Profitability) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
                <Percent size={15} className="text-emerald-400" />
                <span>2. 獲利能力深度剖析 (Profitability & Margins)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                評分: {stock.profitabilityScore}分
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">最新毛利率</span>
                <span className="text-sm font-bold text-emerald-400">{stock.grossMarginLatest}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">營業利益率</span>
                <span className="text-sm font-bold text-blue-400">{stock.operatingMarginLatest}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">TTM 每股盈餘</span>
                <span className="text-sm font-bold text-amber-300">${stock.ttmEps}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.profitabilityAnalysis}
            </p>
          </div>

          {/* Section 3: 資產報酬率與資本回報 (ROA / ROE / ROIC) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
                <Zap size={15} className="text-cyan-400" />
                <span>3. 資產報酬率與資本回報 (ROA / ROE / ROIC Efficiency)</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                評分: {stock.assetReturnScore}分
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">年化 ROE</span>
                <span className="text-sm font-bold text-cyan-300">{stock.roeLatest}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">ROIC 資本回報</span>
                <span className="text-sm font-bold text-indigo-300">{stock.roicLatest}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">推估 ROA</span>
                <span className="text-sm font-bold text-purple-300">{stock.estimatedRoa}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.assetReturnAnalysis}
            </p>
          </div>

          {/* Section 4: 營收增長率趨勢 (Revenue Growth Momentum) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
                <TrendingUp size={15} className="text-amber-400" />
                <span>4. 營收增長率趨勢與訂單動能 (Revenue Growth)</span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                評分: {stock.revenueGrowthScore}分
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 py-1 text-center font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">最新季營收年增率 (YoY)</span>
                <span className={`text-sm font-bold ${stock.revenueLatestYoY >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.revenueLatestYoY >= 0 ? '+' : ''}{stock.revenueLatestYoY}%
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">次年度市場預估獲利增長</span>
                <span className="text-sm font-bold text-blue-300">+{stock.expectedGrowthRate}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.revenueGrowthAnalysis}
            </p>
          </div>

          {/* Section 5: 負債健康度與現金流抗風險力 (Debt Health & Cash Flow) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
                <ShieldCheck size={15} className="text-blue-400" />
                <span>5. 負債結構與現金流抗風險力 (Debt Health & Cash Flow)</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${stock.debtHealthBadgeClass}`}>
                {stock.debtHealthStatusLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 py-1 text-center font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">最新負債比率</span>
                <span className={`text-sm font-bold ${stock.debtRatioLatest > 60 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {stock.debtRatioLatest}%
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">單季自由現金流 (FCF)</span>
                <span className={`text-sm font-bold ${stock.freeCashFlowLatest >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.freeCashFlowLatest >= 0 ? '+' : ''}{stock.freeCashFlowLatest} 億元
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.debtHealthAnalysis}
            </p>
          </div>

          {/* Section 6: 最新法說會精華與未來展望 (Earnings Call Highlights & Guidance) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs sm:text-sm">
                <FileSpreadsheet size={15} className="text-indigo-400" />
                <span>6. 最新法說會核心要點與財測展望 (Earnings Call & Guidance)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-mono">
                {stock.earningsCallDate || '最新季度法說會'}
              </span>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
              <strong className="text-indigo-300 block mb-1">🎙️ 管理階層營運重點回顧：</strong>
              {stock.earningsCallSummary || `${stock.name}管理階層於法說會指出，高階產能供不應求，在手訂單能見度充沛，產能稼動率維持高檔運行。`}
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
              <strong className="text-emerald-300 block mb-1">📈 未來季度財測指引展望：</strong>
              {stock.earningsCallGuidance || `展望後續季度，營收預期持續季增，毛利率受惠產品組合與技術良率精進將守穩高檔，全年展望維持強勁雙位數擴張。`}
            </div>
          </div>

          {/* Section 7: 全球宏觀市場方向結合與未來機遇 (Global Macro Context & Opportunities) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs sm:text-sm">
                <Compass size={15} className="text-cyan-400" />
                <span>7. 結合全球市場宏觀方向・核心未來機遇 (Global Macro & Opportunities)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-mono">
                全球市場方向
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              {stock.globalMarketContext || `美股四大科技巨頭資本支出持續上修，聯準會降息循環降低科技融資成本。台灣關鍵供應鏈具備全球不可替代的製造與算力核心樞紐地位。`}
            </p>
            {stock.futureOpportunities && stock.futureOpportunities.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-cyan-400 block font-mono">🌟 操盤手戰略成長機遇：</span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {stock.futureOpportunities.map((opp, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 font-mono text-[10px] font-bold shrink-0 mt-0.5 border border-cyan-800/50">
                        OP-{idx + 1}
                      </span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section 8: 未來三大關鍵風險雷達 (Future Key Risks) */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs sm:text-sm">
                <AlertTriangle size={15} className="text-rose-400" />
                <span>8. 操盤手核心監控・未來實質風險 (Downside Risks)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/60 font-mono">
                風險警訊
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {stock.futureRisks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="px-1.5 py-0.2 rounded bg-rose-900/50 text-rose-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    0{idx + 1}
                  </span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1 pt-2 border-t border-rose-900/30 text-[11px] text-amber-300/90 flex items-center gap-1.5 font-mono">
              <ShieldAlert size={13} className="text-amber-400 shrink-0" />
              <span><strong>警戒監控線：</strong>{stock.riskWarningSign}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            推算生成時間: {new Date(stock.generatedAt).toLocaleString('zh-TW', { hour12: false })} · 模型: {stock.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Analyst Engine'}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onSelectStockForChart(stock.symbol, stock.name);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LineChart size={14} />
              <span>前往互動 K 線圖</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
