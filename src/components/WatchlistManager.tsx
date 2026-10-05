import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WatchlistItem, StrategyConfig, CandleData, StockStrategySignal, StrategySignalStatus } from '../types/stock.ts';
import { getWatchlist, addWatchlist, deleteWatchlist, getBacktestRecords, deleteBacktest, fetchBatchCandles, BatchCandlesItem } from '../services/api.ts';
import { POPULAR_TAIWAN_STOCKS } from '../data/taiwanStocks.ts';
import { runBacktest, evaluateStrategySignal, DEFAULT_STRATEGY } from '../utils/backtestEngine.ts';
import { Plus, Trash2, Bookmark, History, Search, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, Filter, TrendingUp, TrendingDown, Clock, ShieldCheck, Zap } from 'lucide-react';

interface WatchlistManagerProps {
  currentSymbol: string;
  onSelectStock: (symbol: string, name: string) => void;
  user?: any;
  onOpenAuth?: () => void;
  activeStrategy?: StrategyConfig;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  currentSymbol,
  onSelectStock,
  user,
  onOpenAuth,
  activeStrategy,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'backtestHistory'>('watchlist');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [backtestRecords, setBacktestRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Market and Strategy Data for Watchlist items
  const [stockDataMap, setStockDataMap] = useState<Record<string, BatchCandlesItem>>({});
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BUY' | 'HOLD' | 'SELL' | 'WAIT'>('ALL');

  // Add stock dialog state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStockToAdd, setSelectedStockToAdd] = useState<{ symbol: string; name: string; market: string } | null>(null);
  const [targetBuy, setTargetBuy] = useState<string>('');
  const [targetSell, setTargetSell] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Load Watchlist
  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Backtests
  const loadBacktests = async () => {
    try {
      const records = await getBacktestRecords();
      setBacktestRecords(records);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWatchlist();
    loadBacktests();
  }, []);

  // Batch fetch candles & quotes whenever watchlist changes
  const fetchWatchlistData = useCallback(async () => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map(w => w.symbol);
    setIsDataLoading(true);
    try {
      const data = await fetchBatchCandles(symbols);
      setStockDataMap(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load batch watchlist quotes/candles:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    fetchWatchlistData();
  }, [fetchWatchlistData]);

  // Compute strategy stance (BUY, HOLD, SELL, WAIT) for each stock
  const effectiveStrategy = activeStrategy || DEFAULT_STRATEGY;

  const signalsMap = useMemo(() => {
    const map: Record<string, StockStrategySignal> = {};
    watchlist.forEach(item => {
      const data = stockDataMap[item.symbol];
      if (data && data.candles && data.candles.length >= 35) {
        map[item.symbol] = evaluateStrategySignal(data.candles, effectiveStrategy, item.symbol, item.name);
      } else {
        map[item.symbol] = {
          status: 'WAIT',
          statusLabel: '空手觀望',
          statusDesc: '載入歷史行情中...',
          badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
          winRate: 0,
          expectancyPct: 0,
          expectancyAmount: 0,
          maxDrawdownPct: 0,
          totalTrades: 0,
          profitFactor: 0,
          totalReturnPct: 0,
        };
      }
    });
    return map;
  }, [watchlist, stockDataMap, effectiveStrategy]);

  // Count distribution across BUY, HOLD, SELL, WAIT
  const counts = useMemo(() => {
    let buy = 0, hold = 0, sell = 0, wait = 0;
    watchlist.forEach(w => {
      const s = signalsMap[w.symbol]?.status;
      if (s === 'BUY') buy++;
      else if (s === 'HOLD') hold++;
      else if (s === 'SELL') sell++;
      else wait++;
    });
    return { buy, hold, sell, wait, total: watchlist.length };
  }, [watchlist, signalsMap]);

  // Filtered watchlist based on statusFilter
  const filteredWatchlist = useMemo(() => {
    if (statusFilter === 'ALL') return watchlist;
    return watchlist.filter(w => signalsMap[w.symbol]?.status === statusFilter);
  }, [watchlist, signalsMap, statusFilter]);

  // Handle Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockToAdd) return;

    try {
      const res = await addWatchlist({
        symbol: selectedStockToAdd.symbol,
        name: selectedStockToAdd.name,
        market: selectedStockToAdd.market,
        targetBuyPrice: targetBuy || undefined,
        targetSellPrice: targetSell || undefined,
        notes: notes || undefined,
      });
      if (res.item) {
        setWatchlist(prev => [res.item, ...prev.filter(i => i.symbol !== res.item.symbol)]);
      }
      setIsAdding(false);
      resetAddForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetAddForm = () => {
    setSelectedStockToAdd(null);
    setSearchQuery('');
    setTargetBuy('');
    setTargetSell('');
    setNotes('');
  };

  // Handle Delete Watchlist item
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setWatchlist(prev => prev.filter(item => item.id !== id));
      return;
    }
    try {
      await deleteWatchlist(id);
      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Backtest record
  const handleDeleteBacktest = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteBacktest(id);
      setBacktestRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered popular suggestions when adding
  const searchResults = searchQuery
    ? POPULAR_TAIWAN_STOCKS.filter(
        s => s.code.includes(searchQuery) || s.name.includes(searchQuery) || s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_TAIWAN_STOCKS.slice(0, 8);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col text-slate-200">
      {/* Header Tabs */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'watchlist' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark size={14} />
            <span>自選投資組合 ({watchlist.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('backtestHistory');
              if (user) loadBacktests();
            }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'backtestHistory' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} />
            <span>PostgreSQL 回測紀錄 ({backtestRecords.length})</span>
          </button>
        </div>

        {activeTab === 'watchlist' && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWatchlistData}
              disabled={isDataLoading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              title="重新掃描最新即時行情與策略狀態"
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin text-blue-400' : ''} />
              <span className="hidden sm:inline">即時掃描</span>
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>新增自選股</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3">
        {activeTab === 'watchlist' ? (
          <div className="flex flex-col gap-3">
            {!user && onOpenAuth && (
              <div className="p-2.5 bg-blue-950/30 border border-blue-800/40 rounded-lg text-xs text-blue-300 flex items-center justify-between">
                <span>目前為本機高效存儲模式。登入 Google 帳號可開啟自選股多裝置同步與雲端備份。</span>
                <button
                  onClick={onOpenAuth}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition-colors shrink-0 ml-2"
                >
                  立即登入
                </button>
              </div>
            )}

            {/* Status Filter Pills: ALL, BUY, HOLD, SELL, WAIT */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold shrink-0">
                <Sparkles size={14} className="text-yellow-400" />
                <span>策略篩選:</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                    statusFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                  }`}
                >
                  全部 ({counts.total})
                </button>
                <button
                  onClick={() => setStatusFilter('BUY')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'BUY'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-red-300 hover:text-red-200 bg-red-950/40 border border-red-800/50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                  <span>買入 ({counts.buy})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('HOLD')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'HOLD'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-800/50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>持有 ({counts.hold})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('SELL')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'SELL'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-800/50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  <span>賣出 ({counts.sell})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('WAIT')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                    statusFilter === 'WAIT'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                  <span>觀望 ({counts.wait})</span>
                </button>
              </div>
            </div>

            {/* Watchlist Horizontal Strips with Live Prices & Quantitative Metrics */}
            <div className="flex flex-col gap-2">
              {filteredWatchlist.map(item => {
                const isSelected = item.symbol === currentSymbol;
                const quote = stockDataMap[item.symbol]?.quote;
                const signal = signalsMap[item.symbol] || {
                  status: 'WAIT',
                  statusLabel: '空手觀望',
                  statusDesc: '靜待訊號',
                  badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
                  winRate: 0,
                  expectancyPct: 0,
                  expectancyAmount: 0,
                  maxDrawdownPct: 0,
                  totalTrades: 0,
                  profitFactor: 0,
                  totalReturnPct: 0,
                };

                const isUp = (quote?.change ?? 0) > 0;
                const isDown = (quote?.change ?? 0) < 0;
                const priceColor = isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-slate-200';

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectStock(item.symbol, item.name)}
                    className={`p-2.5 sm:px-4 sm:py-3 rounded-xl border cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 active:scale-[0.995]'
                    }`}
                  >
                    {/* 1. 左側：股票名稱、代號與策略狀態標籤 */}
                    <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 min-w-0 md:min-w-[240px]">
                      <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                        <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                          {item.symbol}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white shadow-xs shrink-0">
                            觀測中
                          </span>
                        )}
                      </div>

                      {/* 策略狀態 Badge */}
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${signal.badgeClass}`}>
                        {signal.status === 'BUY' && (
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                        )}
                        {signal.status === 'HOLD' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        )}
                        {signal.status === 'SELL' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                        {signal.status === 'WAIT' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                        )}
                        <span>{signal.statusLabel}</span>
                      </div>
                    </div>

                    {/* 2. 中間：即時股價與漲跌 (橫排) */}
                    <div className="flex items-baseline justify-between md:justify-start gap-2.5 min-w-0 md:min-w-[170px]">
                      {quote ? (
                        <>
                          <span className={`text-base sm:text-lg font-black font-mono tracking-tight ${priceColor}`}>
                            ${quote.price.toFixed(2)}
                          </span>
                          <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${priceColor}`}>
                            {isUp ? '▲' : isDown ? '▼' : ''} {quote.change >= 0 ? `+${quote.change.toFixed(2)}` : quote.change.toFixed(2)} ({quote.changePercent >= 0 ? `+${quote.changePercent.toFixed(2)}%` : `${quote.changePercent.toFixed(2)}%`})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono text-slate-400 animate-pulse">報價連線中...</span>
                      )}
                    </div>

                    {/* 3. 右側：操盤手核心 3 大量化回測數據 (勝率 / 期望值 / 最大回測) 橫條化 */}
                    <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 flex-1">
                      <div className="flex items-center gap-3 sm:gap-4 bg-slate-900/80 border border-slate-800/90 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 w-full md:w-auto justify-around md:justify-start">
                        {/* 策略勝率 */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-400 font-sans">勝率:</span>
                          <span className={`font-bold ${
                            signal.totalTrades > 0
                              ? signal.winRate >= 60 ? 'text-emerald-400' : signal.winRate >= 50 ? 'text-amber-300' : 'text-slate-300'
                              : 'text-slate-500'
                          }`}>
                            {signal.totalTrades > 0 ? `${signal.winRate.toFixed(1)}%` : '--'}
                          </span>
                        </div>

                        <div className="w-px h-3 bg-slate-800"></div>

                        {/* 期望值 (EV) */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-400 font-sans">期望值:</span>
                          <span className={`font-bold ${
                            signal.totalTrades > 0
                              ? signal.expectancyPct > 0 ? 'text-red-400' : signal.expectancyPct < 0 ? 'text-emerald-400' : 'text-slate-300'
                              : 'text-slate-500'
                          }`}>
                            {signal.totalTrades > 0 ? `${signal.expectancyPct >= 0 ? '+' : ''}${signal.expectancyPct.toFixed(2)}%` : '--'}
                          </span>
                        </div>

                        <div className="w-px h-3 bg-slate-800"></div>

                        {/* 最大回測 (MDD) */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-slate-400 font-sans">最大回測:</span>
                          <span className={`font-bold ${
                            signal.totalTrades > 0
                              ? signal.maxDrawdownPct > 15 ? 'text-rose-400' : 'text-amber-300'
                              : 'text-slate-500'
                          }`}>
                            {signal.totalTrades > 0 ? `-${Math.abs(signal.maxDrawdownPct).toFixed(2)}%` : '--'}
                          </span>
                        </div>
                      </div>

                      {/* 刪除按鈕 */}
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                        title="自清單移除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredWatchlist.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
                  <span>在此篩選條件下無自選股</span>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="text-blue-400 hover:underline mt-1"
                  >
                    查看全部自選股
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Backtest History Tab */
          <div className="flex flex-col gap-2">
            {backtestRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <History size={28} className="text-slate-600" />
                <p>尚未儲存任何回測紀錄。在策略回測區完成計算後，點擊「儲存回測紀錄」即可收錄於此。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backtestRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => onSelectStock(rec.symbol, rec.stockName)}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg flex flex-col justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{rec.stockName}</span>
                          <span className="text-xs font-mono text-slate-400">{rec.symbol}</span>
                        </div>
                        <span className="text-xs text-blue-400 font-medium block mt-0.5">
                          {rec.strategyName}
                        </span>
                        <span className="text-[11px] text-slate-500">{rec.dateRange}</span>
                      </div>

                      <button
                        onClick={e => handleDeleteBacktest(rec.id, e)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono mt-3 pt-2.5 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block">交易次數</span>
                        <strong className="text-slate-200">{rec.totalTrades}次</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">勝率</span>
                        <strong className="text-red-400">{rec.winRate}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">總報酬</span>
                        <strong className="text-red-400">{rec.totalReturn}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">期望值</span>
                        <strong className="text-slate-200">{rec.expectancy}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Stock Dialog Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-sm">新增自選股至投資組合</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">搜尋台股代號或名稱</label>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="輸入例如 2330、鴻海、0050"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto mt-1 border border-slate-800 rounded-lg bg-slate-950/60 divide-y divide-slate-800/60">
                  {searchResults.map(stock => {
                    const isPicked = selectedStockToAdd?.symbol === stock.symbol;
                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => setSelectedStockToAdd(stock)}
                        className={`p-2 text-xs flex items-center justify-between cursor-pointer ${
                          isPicked ? 'bg-blue-900/40 text-blue-200 font-semibold' : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{stock.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{stock.symbol}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1 py-0.5 rounded">
                          {stock.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedStockToAdd && (
                <div className="text-xs bg-blue-950/30 p-2 rounded border border-blue-900/50 text-blue-200">
                  已選定: <strong>{selectedStockToAdd.name} ({selectedStockToAdd.symbol})</strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">目標買進價 (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="例如 980"
                    value={targetBuy}
                    onChange={e => setTargetBuy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">目標停利價 (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="例如 1200"
                    value={targetSell}
                    onChange={e => setTargetSell(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">操盤備忘筆記</label>
                <input
                  type="text"
                  placeholder="例如: 季線附近逢低分批布局"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!selectedStockToAdd}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                >
                  加入自選組合
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
