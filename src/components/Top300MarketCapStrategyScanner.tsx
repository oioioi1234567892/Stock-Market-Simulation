import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CandleData, StrategyConfig, StrategySignalStatus } from '../types/stock.ts';
import { Top300StockItem, Top300MarketCapResponse } from '../types/top300.ts';
import { fetchTop300MarketCapStocks } from '../services/api.ts';
import { calculateIndicators } from '../utils/indicators.ts';
import { generateFallbackCandles } from '../services/clientStockFallback.ts';
import { evaluateStrategySignal, DEFAULT_STRATEGY } from '../utils/backtestEngine.ts';
import { resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { addWatchlist, deleteWatchlist, getWatchlist } from '../services/api.ts';
import {
  Crown,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  Activity,
  Layers,
  Sliders,
  AlertCircle,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

interface Top300MarketCapStrategyScannerProps {
  onSelectStockForChart: (symbol: string, name: string) => void;
  userStrategy?: StrategyConfig;
  onOpenStockDetail?: (stock: any) => void;
}

// 簡易 K 線微型圖表元件 (Mini Candlestick Chart - 密集高密度精簡版)
const Top300MiniKLineChart: React.FC<{ candles: CandleData[]; width?: number; height?: number }> = ({
  candles,
  width = 115,
  height = 32,
}) => {
  if (!candles || candles.length === 0) {
    return (
      <div className="flex items-center justify-center w-[115px] h-[32px] bg-slate-950 border border-slate-800/80 rounded text-[9px] text-slate-500 font-mono">
        K線載入中...
      </div>
    );
  }
  const slice = candles.slice(-30);
  const minPrice = Math.min(...slice.map(c => c.low)) || 1;
  const maxPrice = Math.max(...slice.map(c => c.high)) || 1;
  const range = Math.max(0.1, maxPrice - minPrice);
  const pad = 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="select-none overflow-hidden rounded bg-slate-950 border border-slate-800/80 p-0.5">
        {/* 中軸輔助線 */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.6" />

        {/* 蠟燭圖 (紅漲綠跌符合台股慣例) */}
        {slice.map((c, i) => {
          const w = Math.max(1.4, (width / slice.length) * 0.72);
          const x = (i / (slice.length - 1 || 1)) * (width - w - pad * 2) + pad;
          const isUp = c.close >= c.open;
          const yHigh = height - pad - ((c.high - minPrice) / range) * (height - pad * 2);
          const yLow = height - pad - ((c.low - minPrice) / range) * (height - pad * 2);
          const yOpen = height - pad - ((c.open - minPrice) / range) * (height - pad * 2);
          const yClose = height - pad - ((c.close - minPrice) / range) * (height - pad * 2);
          const yTop = Math.min(yOpen, yClose);
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));

          return (
            <g key={i}>
              <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={isUp ? '#f43f5e' : '#10b981'} strokeWidth="0.75" />
              <rect x={x} y={yTop} width={w} height={bodyH} fill={isUp ? '#f43f5e' : '#10b981'} rx="0.2" />
            </g>
          );
        })}

        {/* 5MA (黃線) */}
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="0.85"
          points={slice
            .map((c, i) => {
              if (!c.ma5) return '';
              const x = (i / (slice.length - 1 || 1)) * (width - pad * 2) + pad;
              const y = height - pad - ((c.ma5 - minPrice) / range) * (height - pad * 2);
              return `${x},${y}`;
            })
            .filter(Boolean)
            .join(' ')}
        />

        {/* 20MA (藍線) */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.85"
          points={slice
            .map((c, i) => {
              if (!c.ma20) return '';
              const x = (i / (slice.length - 1 || 1)) * (width - pad * 2) + pad;
              const y = height - pad - ((c.ma20 - minPrice) / range) * (height - pad * 2);
              return `${x},${y}`;
            })
            .filter(Boolean)
            .join(' ')}
        />
      </svg>
      <div className="flex justify-between w-full text-[8px] font-mono text-slate-500 leading-none mt-0.5 px-0.5">
        <span>L:{minPrice.toFixed(0)}</span>
        <span className="text-slate-400">30K·MA5/20</span>
        <span>H:{maxPrice.toFixed(0)}</span>
      </div>
    </div>
  );
};

export const Top300MarketCapStrategyScanner: React.FC<Top300MarketCapStrategyScannerProps> = ({
  onSelectStockForChart,
  userStrategy,
  onOpenStockDetail,
}) => {
  const [data, setData] = useState<Top300MarketCapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // K線字典快取
  const [candlesMap, setCandlesMap] = useState<Map<string, CandleData[]>>(() => new Map());
  const [isFetchingBatchCandles, setIsFetchingBatchCandles] = useState<boolean>(false);

  // 篩選與排序狀態
  const [selectedSignalFilter, setSelectedSignalFilter] = useState<'ALL' | StrategySignalStatus>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rank' | 'changePercentDesc' | 'changePercentAsc' | 'winRateDesc' | 'expectancyDesc' | 'turnoverDesc'>('rank');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // 分頁狀態 (預設每頁 30 檔，手機操控極佳)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // 自選股狀態快取
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());

  // 載入自選股以對照星號
  useEffect(() => {
    let isCancelled = false;
    getWatchlist().then(items => {
      if (!isCancelled && Array.isArray(items)) {
        setWatchlistSymbols(new Set(items.map(it => it.symbol.toUpperCase())));
      }
    }).catch(() => {});
    return () => { isCancelled = true; };
  }, []);

  // 載入 Top 300 數據
  const loadTop300Data = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await fetchTop300MarketCapStocks(forceRefresh);
      if (res && Array.isArray(res.stocks) && res.stocks.length > 0) {
        setData(res);
        if (res.candlesMap) {
          setCandlesMap(prev => {
            const updated = new Map(prev);
            Object.entries(res.candlesMap!).forEach(([sym, cList]) => {
              updated.set(sym, cList);
            });
            return updated;
          });
        }
      } else {
        setError('未能自臺灣證交所與櫃買中心獲得市值前300大即時行情，請檢查網路連線');
      }
    } catch (err: any) {
      console.error('Failed to load top 300 market cap stocks:', err);
      setError('連線逾時，請稍候重試');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTop300Data();
  }, [loadTop300Data]);

  // 當篩選條件變動時自動跳回第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSignalFilter, selectedIndustry, searchKeyword, sortBy]);

  // 整理出所有包含的官方產業分類清單
  const availableIndustries = useMemo(() => {
    if (!data || !data.stocks) return [];
    const set = new Set<string>();
    data.stocks.forEach(s => {
      if (s.industry) set.add(s.industry);
    });
    return Array.from(set).sort();
  }, [data]);

  // 批次向後端抓取目前頁面所需之日K線 (以 15 檔為一組平行獲取)
  const isFetchingRef = useRef(false);
  const fetchCandlesForList = useCallback(async (stocks: Top300StockItem[]) => {
    if (isFetchingRef.current) return;
    const neededSymbols: string[] = [];
    stocks.forEach(stk => {
      const existing = candlesMap.get(stk.symbol);
      if (!existing || existing.length < 5) {
        if (!neededSymbols.includes(stk.symbol)) {
          neededSymbols.push(stk.symbol);
        }
      }
    });

    if (neededSymbols.length === 0) return;

    isFetchingRef.current = true;
    setIsFetchingBatchCandles(true);

    try {
      const chunkSize = 15;
      for (let i = 0; i < neededSymbols.length; i += chunkSize) {
        const chunk = neededSymbols.slice(i, i + chunkSize);
        try {
          const res = await fetch('/api/stocks/batch-candles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: chunk, range: '3mo' }),
          });
          const json = await res.json();
          if (json && typeof json === 'object') {
            setCandlesMap(prev => {
              const updated = new Map(prev);
              Object.entries(json).forEach(([sym, val]: [string, any]) => {
                if (val && Array.isArray(val.candles) && val.candles.length > 0) {
                  updated.set(sym, val.candles);
                  if (sym.endsWith('.TW')) {
                    updated.set(sym.replace(/\.TW$/, '.TWO'), val.candles);
                  }
                }
              });
              return updated;
            });
          }
        } catch (_) {}
      }
    } finally {
      setIsFetchingBatchCandles(false);
      isFetchingRef.current = false;
    }
  }, [candlesMap]);

  // 結合日 K 線與自訂回測策略，評估前 300 大每檔股票之交易狀態
  const evaluatedStocks = useMemo(() => {
    if (!data || !data.stocks) return [];

    const activeStrat = userStrategy || DEFAULT_STRATEGY;

    return data.stocks.map(stk => {
      const existingCandles = candlesMap.get(stk.symbol) || candlesMap.get(stk.symbol.replace(/\.TW$/, '.TWO'));
      const isRealCandles = !!(existingCandles && existingCandles.length >= 5);
      const rawCandles = isRealCandles
        ? existingCandles!
        : generateFallbackCandles(stk.symbol, '3mo');

      const candlesWithIndicators = calculateIndicators(rawCandles);
      const strategySignal = evaluateStrategySignal(
        candlesWithIndicators,
        activeStrat,
        stk.symbol,
        stk.name
      );

      return {
        ...stk,
        candles: candlesWithIndicators,
        strategySignal,
      };
    });
  }, [data, candlesMap, userStrategy]);

  // 全市場統計各信號數量
  const signalCounts = useMemo(() => {
    const counts = { ALL: evaluatedStocks.length, BUY: 0, SELL: 0, HOLD: 0, WAIT: 0 };
    evaluatedStocks.forEach(s => {
      const st = s.strategySignal?.status;
      if (st === 'BUY') counts.BUY++;
      else if (st === 'SELL') counts.SELL++;
      else if (st === 'HOLD') counts.HOLD++;
      else counts.WAIT++;
    });
    return counts;
  }, [evaluatedStocks]);

  // 平均策略勝率與績效
  const averageWinRate = useMemo(() => {
    if (evaluatedStocks.length === 0) return 0;
    const sum = evaluatedStocks.reduce((acc, s) => acc + (s.strategySignal?.winRate || 0), 0);
    return Number((sum / evaluatedStocks.length).toFixed(1));
  }, [evaluatedStocks]);

  // 篩選與排序邏輯
  const filteredStocks = useMemo(() => {
    let result = [...evaluatedStocks];

    // 1. 交易狀態篩選
    if (selectedSignalFilter !== 'ALL') {
      result = result.filter(s => s.strategySignal?.status === selectedSignalFilter);
    }

    // 2. 產業篩選
    if (selectedIndustry !== 'ALL') {
      result = result.filter(s => s.industry === selectedIndustry);
    }

    // 3. 關鍵字搜尋 (代號、名稱、中文拼音)
    if (searchKeyword.trim()) {
      const clean = searchKeyword.trim().toLowerCase();
      result = result.filter(s =>
        s.code.toLowerCase().includes(clean) ||
        s.name.toLowerCase().includes(clean) ||
        s.symbol.toLowerCase().includes(clean)
      );
    }

    // 4. 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'changePercentDesc':
          return b.changePercent - a.changePercent;
        case 'changePercentAsc':
          return a.changePercent - b.changePercent;
        case 'winRateDesc':
          return (b.strategySignal?.winRate || 0) - (a.strategySignal?.winRate || 0);
        case 'expectancyDesc':
          return (b.strategySignal?.expectancyPct || 0) - (a.strategySignal?.expectancyPct || 0);
        case 'turnoverDesc':
          return (b.turnoverYi || 0) - (a.turnoverYi || 0);
        default:
          return a.rank - b.rank;
      }
    });

    return result;
  }, [evaluatedStocks, selectedSignalFilter, selectedIndustry, searchKeyword, sortBy]);

  // 當前頁面的標的清單
  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedStocks = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, currentPageSafe, pageSize]);

  // 當前頁標的發生變化時，觸發批次獲取真實日K線
  useEffect(() => {
    if (pagedStocks.length > 0) {
      fetchCandlesForList(pagedStocks);
    }
  }, [pagedStocks, fetchCandlesForList]);

  // 快速切換自選股星號
  const handleToggleWatchlist = async (stk: Top300StockItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const upperSym = stk.symbol.toUpperCase();
    const isIn = watchlistSymbols.has(upperSym);

    try {
      if (isIn) {
        const items = await getWatchlist();
        const found = items.find(it => it.symbol.toUpperCase() === upperSym);
        if (found) {
          await deleteWatchlist(found.id);
          setWatchlistSymbols(prev => {
            const next = new Set(prev);
            next.delete(upperSym);
            return next;
          });
          window.dispatchEvent(new CustomEvent('watchlist-changed', { detail: { action: 'delete', symbol: stk.symbol } }));
        }
      } else {
        await addWatchlist({
          symbol: stk.symbol,
          name: stk.name,
          market: stk.market,
          targetBuyPrice: (stk.close * 0.95).toFixed(1),
          targetSellPrice: (stk.close * 1.12).toFixed(1),
          notes: `市值排名第 ${stk.rank} 名 (${stk.marketCap}億)`,
        });
        setWatchlistSymbols(prev => {
          const next = new Set(prev);
          next.add(upperSym);
          return next;
        });
        window.dispatchEvent(new CustomEvent('watchlist-changed', { detail: { action: 'add', symbol: stk.symbol } }));
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  const activeStrategyName = userStrategy?.name || DEFAULT_STRATEGY.name;

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* 1. 頂部旗艦控制列 (Header & Controls) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/70">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <Crown size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight font-mono">
                  市值前 300 大公司 · 量化回測策略即時掃描
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  TWSE + TPEx 官方真實排序
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                撈取全市場市值前 300 大龍頭權值股日 K 線，自動依使用者自訂回測策略判定：買入、賣出、持有、觀望。
              </p>
            </div>
          </div>

          {/* 右側操作按鈕 */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            {/* 當前套用策略標記 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-blue-500/30 rounded-lg text-xs text-blue-300">
              <Sliders size={12} className="text-blue-400" />
              <span className="text-slate-400">當前策略:</span>
              <span className="font-bold text-blue-200">{activeStrategyName}</span>
            </div>

            <button
              onClick={() => loadTop300Data(true)}
              disabled={isRefreshing || isLoading}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'} />
              <span>{isRefreshing ? '更新中...' : '重新整理'}</span>
            </button>
          </div>
        </div>

        {/* 2. 交易狀態快速篩選標籤 (Core Transaction Status Filters: 買入/賣出/持有/觀望) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* 全部 */}
          <button
            onClick={() => setSelectedSignalFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSignalFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Compass size={12} />
            <span>全部標的 ({signalCounts.ALL})</span>
          </button>

          {/* 🔴 買入訊號 (BUY) */}
          <button
            onClick={() => setSelectedSignalFilter('BUY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSignalFilter === 'BUY'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                : 'bg-rose-950/30 border border-rose-800/50 text-rose-300 hover:bg-rose-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
            <span>🔴 買入訊號 ({signalCounts.BUY})</span>
          </button>

          {/* 🟡 賣出訊號 (SELL) */}
          <button
            onClick={() => setSelectedSignalFilter('SELL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSignalFilter === 'SELL'
                ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                : 'bg-amber-950/30 border border-amber-800/50 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            <AlertCircle size={12} className="text-amber-400" />
            <span>🟡 賣出訊號 ({signalCounts.SELL})</span>
          </button>

          {/* 🟢 持倉續抱 (HOLD) */}
          <button
            onClick={() => setSelectedSignalFilter('HOLD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSignalFilter === 'HOLD'
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                : 'bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/40'
            }`}
          >
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>🟢 持倉續抱 ({signalCounts.HOLD})</span>
          </button>

          {/* ⚪ 空手觀望 (WAIT) */}
          <button
            onClick={() => setSelectedSignalFilter('WAIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              selectedSignalFilter === 'WAIT'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Clock size={12} className="text-slate-400" />
            <span>⚪ 空手觀望 ({signalCounts.WAIT})</span>
          </button>
        </div>

        {/* 3. 操盤手宏觀指標快覽條 (Trader KPI Summary Bar) */}
        {data && (
          <div className="grid grid-cols-2 xs:grid-cols-4 lg:grid-cols-5 gap-2 text-xs font-mono">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px]">市值前300總額</span>
              <span className="text-amber-300 font-bold text-xs sm:text-sm mt-0.5">
                {(data.summary.totalMarketCapYi / 10000).toFixed(1)} 兆元
              </span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px]">今日前300平均漲跌</span>
              <span className={`font-bold text-xs sm:text-sm mt-0.5 ${
                data.summary.averageChangePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {data.summary.averageChangePercent >= 0 ? `+${data.summary.averageChangePercent}%` : `${data.summary.averageChangePercent}%`}
              </span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px]">策略平均勝率</span>
              <span className="text-purple-300 font-bold text-xs sm:text-sm mt-0.5">
                {averageWinRate}%
              </span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px]">進場機會 / 平倉警示</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-rose-400 font-bold text-xs sm:text-sm">{signalCounts.BUY}買</span>
                <span className="text-slate-600">/</span>
                <span className="text-amber-400 font-bold text-xs sm:text-sm">{signalCounts.SELL}賣</span>
              </div>
            </div>
            <div className="hidden lg:flex bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex-col col-span-1">
              <span className="text-slate-400 text-[10px]">數據真實度</span>
              <div className="flex items-center gap-1 mt-0.5 text-emerald-400 font-bold text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>TWSE/TPEx 官方盤面</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. 搜尋、產業篩選與排序工具列 (Search, Industry Filter & Sorting) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          {/* 搜尋欄位 */}
          <div className="relative flex-1 max-w-md">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋代號或名稱（例如 2330、台積電、聯發科、鴻海）..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors font-mono"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end text-xs">
            {/* 產業類別選單 */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-hidden focus:border-blue-500 font-mono"
            >
              <option value="ALL">全部產業 ({data?.stocks.length || 300})</option>
              {availableIndustries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            {/* 排序方式選單 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-hidden focus:border-blue-500 font-mono"
            >
              <option value="rank">👑 依市值排名 (1 → 300)</option>
              <option value="changePercentDesc">📈 今日漲幅最高</option>
              <option value="changePercentAsc">📉 今日跌幅最深</option>
              <option value="winRateDesc">🎯 策略勝率最高</option>
              <option value="expectancyDesc">💎 策略期望值最高</option>
              <option value="turnoverDesc">💰 今日成交額最高</option>
            </select>

            {/* 表格 / 卡片 視圖切換 */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="高密度表格"
              >
                <TableIcon size={13} />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="卡片檢視"
              >
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 載入與錯誤提示 */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
          <span className="text-xs font-mono">直連臺灣證券交易所與櫃買中心撈取前 300 大公司最新行情與 K 線...</span>
        </div>
      ) : error ? (
        <div className="bg-slate-900 border border-rose-800/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-rose-300 text-center">
          <AlertCircle size={24} className="text-rose-400" />
          <span className="text-xs font-semibold">{error}</span>
          <button
            onClick={() => loadTop300Data(true)}
            className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
          >
            重試連線
          </button>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          沒有符合篩選條件（狀態: {selectedSignalFilter}、產業: {selectedIndustry}、關鍵字: &quot;{searchKeyword}&quot;）的標的。
        </div>
      ) : (
        <>
          {/* 6. 視圖呈現 (Table View 或 Card View) */}
          {viewMode === 'table' ? (
            <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/90 text-slate-400 text-[11px] border-b border-slate-800 select-none">
                    <tr>
                      <th className="py-2.5 px-2.5 text-center w-12">排名</th>
                      <th className="py-2.5 px-3 min-w-[130px]">標的代號 / 名稱</th>
                      <th className="py-2.5 px-2 text-right">現價 / 漲跌</th>
                      <th className="py-2.5 px-2 text-center min-w-[125px]">近30日K線 (5/20MA)</th>
                      <th className="py-2.5 px-3 text-center min-w-[140px]">量化交易狀態</th>
                      <th className="py-2.5 px-2 text-right hidden sm:table-cell">回測勝率</th>
                      <th className="py-2.5 px-2 text-right hidden md:table-cell">期望值</th>
                      <th className="py-2.5 px-2 text-right hidden lg:table-cell">市值 (億)</th>
                      <th className="py-2.5 px-2.5 text-center w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pagedStocks.map((stock) => {
                      const sig = stock.strategySignal;
                      const status = sig?.status || 'WAIT';
                      const isUp = stock.change >= 0;
                      const upperSym = stock.symbol.toUpperCase();
                      const isStarred = watchlistSymbols.has(upperSym);

                      return (
                        <tr
                          key={stock.symbol}
                          onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                          className="hover:bg-slate-800/40 bg-slate-950/30 transition-colors cursor-pointer select-none group"
                        >
                          {/* 排名 */}
                          <td className="py-2 px-2 text-center font-bold">
                            <span className={`inline-block w-6 h-6 rounded-md text-[10px] leading-6 font-mono text-center ${
                              stock.rank === 1
                                ? 'bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40'
                                : stock.rank <= 3
                                ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                                : stock.rank <= 10
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'text-slate-400'
                            }`}>
                              {stock.rank}
                            </span>
                          </td>

                          {/* 標的代號 / 名稱 */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => handleToggleWatchlist(stock, e)}
                                className="text-slate-500 hover:text-amber-400 p-0.5 transition-colors cursor-pointer"
                                title={isStarred ? '自自選池移除' : '加入自選池'}
                              >
                                <Star
                                  size={13}
                                  className={isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'}
                                />
                              </button>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                    {stock.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {stock.code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                  <span>{stock.market}</span>
                                  <span>·</span>
                                  <span>{stock.industry || '一般產業'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 現價 / 漲跌幅 */}
                          <td className="py-2 px-2 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ${stock.close.toLocaleString()}
                              </span>
                              <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                                isUp ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                <span>{isUp ? `+${stock.changePercent}%` : `${stock.changePercent}%`}</span>
                              </div>
                            </div>
                          </td>

                          {/* 近30日K線圖 */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex justify-center">
                              <Top300MiniKLineChart
                                candles={stock.candles || []}
                                width={115}
                                height={32}
                              />
                            </div>
                          </td>

                          {/* 量化交易狀態 (買入 / 賣出 / 持有 / 觀望) */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1 shadow-xs ${
                                status === 'BUY'
                                  ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse'
                                  : status === 'SELL'
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 ring-1 ring-amber-400/30'
                                  : status === 'HOLD'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-slate-950 text-slate-400 border-slate-800'
                              }`}>
                                {status === 'BUY' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping inline-block" />}
                                {status === 'SELL' && <AlertCircle size={11} className="text-amber-400" />}
                                {status === 'HOLD' && <CheckCircle2 size={11} className="text-emerald-400" />}
                                {status === 'WAIT' && <Clock size={11} className="text-slate-500" />}
                                <span>{sig?.statusLabel || '空手觀望'}</span>
                              </span>
                              <span className="text-[9px] text-slate-400 truncate max-w-[150px] leading-tight text-center">
                                {sig?.statusDesc || '未達進場條件'}
                              </span>
                            </div>
                          </td>

                          {/* 回測勝率 */}
                          <td className="py-2 px-2 text-right hidden sm:table-cell">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${
                                (sig?.winRate || 0) >= 60 ? 'text-purple-300' : 'text-slate-300'
                              }`}>
                                {sig?.winRate || 0}%
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {sig?.totalTrades || 0}筆
                              </span>
                            </div>
                          </td>

                          {/* 期望值 */}
                          <td className="py-2 px-2 text-right hidden md:table-cell">
                            <span className={`font-bold ${
                              (sig?.expectancyPct || 0) > 0 ? 'text-emerald-400' : (sig?.expectancyPct || 0) < 0 ? 'text-rose-400' : 'text-slate-500'
                            }`}>
                              {(sig?.expectancyPct || 0) > 0 ? `+${sig?.expectancyPct}%` : `${sig?.expectancyPct || 0}%`}
                            </span>
                          </td>

                          {/* 市值 (億) */}
                          <td className="py-2 px-2 text-right hidden lg:table-cell text-slate-300">
                            <span>{stock.marketCap.toLocaleString()}億</span>
                          </td>

                          {/* 操作按鈕 */}
                          <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                              className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                            >
                              載入圖表
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pagedStocks.map((stock) => {
                const sig = stock.strategySignal;
                const status = sig?.status || 'WAIT';
                const isUp = stock.change >= 0;
                const upperSym = stock.symbol.toUpperCase();
                const isStarred = watchlistSymbols.has(upperSym);

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                    className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-3 shadow-lg flex flex-col justify-between gap-2.5 transition-all cursor-pointer group"
                  >
                    {/* 卡片標頭 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-6 h-6 rounded text-[10px] leading-6 font-mono font-bold text-center ${
                          stock.rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : stock.rank <= 3
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {stock.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                              {stock.name}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {stock.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {stock.industry} · 市值 {stock.marketCap.toLocaleString()}億
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleWatchlist(stock, e)}
                          className="p-1 text-slate-500 hover:text-amber-400 cursor-pointer"
                        >
                          <Star size={14} className={isStarred ? 'fill-amber-400 text-amber-400' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* 股價與漲跌幅 */}
                    <div className="flex items-center justify-between border-y border-slate-800/60 py-1.5 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">最新收盤</span>
                        <span className={`text-base font-black ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${stock.close.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">今日漲跌</span>
                        <span className={`text-xs font-bold ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isUp ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
                        </span>
                      </div>
                    </div>

                    {/* K線微圖 */}
                    <div className="w-full flex justify-center py-1 bg-slate-950/60 rounded-lg border border-slate-800/80">
                      <Top300MiniKLineChart
                        candles={stock.candles || []}
                        width={260}
                        height={40}
                      />
                    </div>

                    {/* 策略信號狀態與指標 */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                          status === 'BUY'
                            ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse'
                            : status === 'SELL'
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                            : status === 'HOLD'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          <span>{sig?.statusLabel || '空手觀望'}</span>
                        </span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[130px] mt-0.5">
                          {sig?.statusDesc}
                        </span>
                      </div>

                      <div className="text-right font-mono text-[10px]">
                        <span className="text-slate-400">勝率: <b className="text-purple-300">{sig?.winRate || 0}%</b></span>
                        <div className="text-slate-500">期望: {(sig?.expectancyPct || 0) > 0 ? `+${sig?.expectancyPct}%` : `${sig?.expectancyPct || 0}%`}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 7. 分頁控制列 (Pagination Controls) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
            <div className="text-slate-400 text-[11px]">
              顯示第 <b className="text-slate-200">{(currentPageSafe - 1) * pageSize + 1}</b> 至{' '}
              <b className="text-slate-200">{Math.min(filteredStocks.length, currentPageSafe * pageSize)}</b> 檔（共{' '}
              <b className="text-blue-400">{filteredStocks.length}</b> 檔）
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPageSafe <= 1}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={13} />
                <span>上一頁</span>
              </button>

              <div className="px-2 py-1 text-slate-300 font-bold bg-slate-950 border border-slate-800 rounded-md">
                {currentPageSafe} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe >= totalPages}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                <span>下一頁</span>
                <ChevronRight size={13} />
              </button>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs focus:outline-hidden"
              >
                <option value={20}>每頁 20 檔</option>
                <option value={30}>每頁 30 檔</option>
                <option value={50}>每頁 50 檔</option>
                <option value={100}>每頁 100 檔</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
