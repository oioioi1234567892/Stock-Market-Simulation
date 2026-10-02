import React from 'react';
import { StockQuote } from '../types/stock.ts';
import { TrendingUp, TrendingDown, Star, ShieldCheck, Zap } from 'lucide-react';

interface StockSummaryProps {
  quote: StockQuote | null;
  isLoading?: boolean;
  isInWatchlist?: boolean;
  onToggleWatchlist?: () => void;
  onOpenRiskCalc?: () => void;
  onOpenDepth?: () => void;
}

export const StockSummary: React.FC<StockSummaryProps> = ({
  quote,
  isLoading = false,
  isInWatchlist = false,
  onToggleWatchlist,
  onOpenDepth,
}) => {
  if (isLoading || !quote) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse flex items-center justify-between">
        <div className="h-10 w-48 bg-slate-800 rounded"></div>
        <div className="h-10 w-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const isUp = quote.change >= 0;
  const priceColor = isUp ? 'text-red-400' : 'text-emerald-400';
  const bgColor = isUp ? 'bg-red-950/30 border-red-900/50' : 'bg-emerald-950/30 border-emerald-900/50';

  // Calculate day range amplitude
  const amplitude =
    quote.previousClose > 0
      ? (((quote.high - quote.low) / quote.previousClose) * 100).toFixed(2)
      : '0.00';

  // Taiwan 10% daily price limits (漲跌停價)
  const upperLimit = Number((quote.previousClose * 1.1).toFixed(2));
  const lowerLimit = Number((quote.previousClose * 0.9).toFixed(2));
  const isLimitUp = quote.price >= upperLimit * 0.999;
  const isLimitDown = quote.price <= lowerLimit * 1.001;

  // Volume in "張" (1 lot = 1000 shares)
  const volumeLots = Math.round(quote.volume / 1000).toLocaleString();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-3">
      {/* Top Main Row: Name, Symbol, Star, Actions, Live Price, Change */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{quote.name}</h1>
            <span className="text-xs sm:text-sm font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {quote.symbol}
            </span>
          </div>

          {/* Quick Watchlist Star Button */}
          {onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                isInWatchlist
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={isInWatchlist ? '已在自選股 (點擊移除)' : '加入自選監控'}
            >
              <Star size={14} className={isInWatchlist ? 'fill-amber-400 text-amber-400' : ''} />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isInWatchlist ? '已自選' : '加自選'}
              </span>
            </button>
          )}

          {/* Five Depth Quick Trigger */}
          {onOpenDepth && (
            <button
              onClick={onOpenDepth}
              className="p-1.5 px-2 rounded-lg bg-blue-950/40 border border-blue-700/50 hover:border-blue-500 text-blue-300 text-[11px] font-medium flex items-center gap-1 transition-all sm:hidden"
              title="查看五檔委買賣盤口"
            >
              <Zap size={14} className="text-blue-400" />
              <span>五檔盤口</span>
            </button>
          )}

          {/* Limit Up / Down Indicator */}
          {isLimitUp && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
              漲停鎖死 +10%
            </span>
          )}
          {isLimitDown && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
              跌停鎖死 -10%
            </span>
          )}
        </div>

        {/* Live Price Block */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${priceColor}`}>
              {quote.price.toFixed(2)}
            </div>
          </div>

          <div className={`flex flex-col items-end px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold ${bgColor}`}>
            <div className={`flex items-center gap-0.5 ${priceColor}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{isUp ? `+${quote.change.toFixed(2)}` : quote.change.toFixed(2)}</span>
            </div>
            <span className={priceColor}>
              {isUp ? `+${quote.changePercent.toFixed(2)}%` : `${quote.changePercent.toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Quote Statistics Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono pt-2.5 border-t border-slate-800/80 text-slate-300">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">成交量</span>
          <span className="font-semibold text-slate-100">{volumeLots} <span className="text-[10px] text-slate-400">張</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">最高 / 最低</span>
          <span className="font-semibold text-slate-100">
            <span className="text-red-400">{quote.high}</span> / <span className="text-emerald-400">{quote.low}</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">開盤價</span>
          <span className="font-semibold text-slate-100">{quote.open}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">昨日收盤</span>
          <span className="font-semibold text-slate-100">{quote.previousClose}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">當日振幅</span>
          <span className="font-semibold text-slate-100">{amplitude}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 font-sans">漲跌停限制 (10%)</span>
          <span className="text-[11px]">
            <span className="text-red-400 font-bold">{upperLimit.toFixed(1)}</span> / <span className="text-emerald-400 font-bold">{lowerLimit.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
