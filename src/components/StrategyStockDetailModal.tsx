import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Compass,
  Calendar,
  Layers,
  LineChart,
  Activity,
  ArrowUpRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { StrategyFilteredStock } from '../types/volumeBreakout.ts';

interface StrategyStockDetailModalProps {
  stock: StrategyFilteredStock | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectStockForChart: (symbol: string, name: string) => void;
}

export const StrategyStockDetailModal: React.FC<StrategyStockDetailModalProps> = ({
  stock,
  isOpen,
  onClose,
  onSelectStockForChart,
}) => {
  if (!isOpen || !stock) return null;

  const isUp = stock.change >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {stock.name} ({stock.code})
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300">
                  {stock.symbol}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {stock.sector} · {stock.subCategory}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg sm:text-xl font-black font-mono text-white">
                  ${stock.currentPrice}
                </span>
                <span className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUp ? '+' : ''}{stock.change} ({isUp ? '+' : ''}{stock.changePercent}%)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* 1. 使用者自訂策略判定結果 */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity size={14} className="text-blue-400" />
                <span>使用者自訂策略信號研判</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${stock.signalBadgeClass}`}>
                {stock.signalLabel}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {stock.signalDesc}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">持股狀態</span>
                <span className="text-xs font-bold text-slate-200">
                  {stock.signalStatus === 'BUY' ? '今日買入第1天' : `已持股 ${stock.holdingDays || 0} 天`}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">未實現損益</span>
                <span className={`text-xs font-bold ${
                  (stock.unrealizedReturnPct || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {(stock.unrealizedReturnPct || 0) >= 0 ? '+' : ''}{stock.unrealizedReturnPct || 0}%
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">策略勝率</span>
                <span className="text-xs font-bold text-amber-300">
                  {stock.winRate}%
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">每筆期望值</span>
                <span className="text-xs font-bold text-emerald-400">
                  +{stock.expectancyPct}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. 三大關鍵財務指標 (ROE, ROA, 毛利率) */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" />
              <span>三大核心財務指標（ROE · ROA · 毛利率）</span>
            </span>

            <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
              {/* ROE */}
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-2.5 flex flex-col">
                <span className="text-[11px] text-amber-400 font-bold">ROE (股東權益報酬)</span>
                <span className="text-lg sm:text-2xl font-black text-white mt-1">
                  {stock.roe}%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {stock.roe >= 15 ? '🔥 超標極佳' : stock.roe >= 10 ? '穩健優質' : '一般水準'}
                </span>
              </div>

              {/* ROA */}
              <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-2.5 flex flex-col">
                <span className="text-[11px] text-blue-400 font-bold">ROA (資產報酬率)</span>
                <span className="text-lg sm:text-2xl font-black text-white mt-1">
                  {stock.roa}%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {stock.roa >= 8 ? '🔥 資產效率卓越' : stock.roa >= 5 ? '良好配置' : '可控範圍'}
                </span>
              </div>

              {/* 毛利率 Gross Margin */}
              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col">
                <span className="text-[11px] text-emerald-400 font-bold">毛利率 (Gross Margin)</span>
                <span className="text-lg sm:text-2xl font-black text-white mt-1">
                  {stock.grossMargin}%
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {stock.grossMargin >= 30 ? '🔥 定價壁壘強' : stock.grossMargin >= 20 ? '具附加價值' : '標準代工'}
                </span>
              </div>
            </div>

            {/* 補充財務指標 */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1 font-mono">
              <span>營業利益率：<strong className="text-slate-200">{stock.operatingMargin}%</strong></span>
              <span>營收年增率：<strong className="text-slate-200">{stock.revenueYoY >= 0 ? '+' : ''}{stock.revenueYoY}%</strong></span>
              <span>負債比率：<strong className="text-slate-200">{stock.debtRatio}%</strong></span>
              <span>TTM EPS：<strong className="text-slate-200">${stock.eps}</strong></span>
            </div>
          </div>

          {/* 3. 企業生命週期研判診斷書 */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                <span>企業生命週期量化診斷</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${stock.lifeCycleBadgeClass}`}>
                {stock.lifeCycleLabel}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs leading-relaxed flex flex-col gap-1.5">
              <div className="text-amber-300 font-semibold flex items-center gap-1">
                <Info size={13} />
                <span>診斷依據分析：</span>
              </div>
              <p className="text-slate-200 font-mono">
                {stock.lifeCycleReason}
              </p>
              <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                {stock.lifeCycleDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            關閉視窗
          </button>

          <button
            onClick={() => {
              onSelectStockForChart(stock.symbol, stock.name);
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LineChart size={14} />
            <span>載入互動 K 線圖與量化回測 →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
