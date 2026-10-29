import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CandleData, StrategyConfig } from '../types/stock.ts';
import { calculateIndicators } from '../utils/indicators.ts';
import { generateFallbackCandles } from '../services/clientStockFallback.ts';
import { evaluateStrategySignal, DEFAULT_STRATEGY } from '../utils/backtestEngine.ts';
import { TopSectorVolumeInfo, IndustrySectorInfo } from '../types/volumeBreakout.ts';
import { isSectorMatch } from '../utils/corporateLifecycleEngine.ts';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  Sparkles,
  Maximize2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Table,
  LayoutGrid,
} from 'lucide-react';

interface TopSectorStocksKLineViewerProps {
  top5Sectors: TopSectorVolumeInfo[];
  allSectors: IndustrySectorInfo[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  onSelectStockForChart: (symbol: string, name: string) => void;
  userStrategy?: StrategyConfig;
  candlesMap?: Map<string, CandleData[]>;
  onOpenStockDetail?: (stock: any) => void;
}

// 簡易 K 線微型圖表元件 (Mini Candlestick Chart - 密集高密度精簡版)
const MiniKLineChart: React.FC<{ candles: CandleData[]; width?: number; height?: number }> = ({
  candles,
  width = 105,
  height = 28,
}) => {
  if (!candles || candles.length === 0) {
    return <span className="text-[9px] text-slate-500 font-mono">載入中...</span>;
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

        {/* 蠟燭圖 */}
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
              <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={isUp ? '#f43f5e' : '#10b981'} strokeWidth="0.7" />
              <rect x={x} y={yTop} width={w} height={bodyH} fill={isUp ? '#f43f5e' : '#10b981'} rx="0.2" />
            </g>
          );
        })}

        {/* 5MA (黃線) */}
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="0.8"
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
          strokeWidth="0.8"
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
      <div className="flex justify-between w-full text-[7px] font-mono text-slate-500 leading-none mt-0.5 px-0.5">
        <span>L:{minPrice.toFixed(0)}</span>
        <span className="text-slate-400">30K·MA5/20</span>
        <span>H:{maxPrice.toFixed(0)}</span>
      </div>
    </div>
  );
};

export const TopSectorStocksKLineViewer: React.FC<TopSectorStocksKLineViewerProps> = ({
  top5Sectors,
  allSectors,
  selectedSector,
  onSelectSector,
  onSelectStockForChart,
  userStrategy,
  candlesMap,
  onOpenStockDetail,
}) => {
  // 檢視模式：預設為表格呈現 (table)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedSignalFilter, setSelectedSignalFilter] = useState<'ALL' | 'BUY' | 'HOLD' | 'WAIT' | 'SELL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [localCandlesMap, setLocalCandlesMap] = useState<Map<string, CandleData[]>>(() => new Map());
  const [isFetchingRealCandles, setIsFetchingRealCandles] = useState<boolean>(false);
  const [fetchProgress, setFetchProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  // 重置頁碼當條件變更
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, selectedSignalFilter, searchKeyword]);

  // 目標產業清單
  const targetSectorNames = useMemo(() => {
    if (selectedSector && selectedSector !== 'ALL') {
      return [selectedSector];
    }
    return top5Sectors.map(s => s.sector);
  }, [selectedSector, top5Sectors]);

  // 1. 蒐集這 5 個產業中【全市場真實所有成分股】(TWSE + TPEx 上市櫃全成分股)
  const allSectorStocksRaw = useMemo(() => {
    const list: {
      sectorName: string;
      code: string;
      name: string;
      symbol: string;
      market?: 'TWSE' | 'TPEx';
      close: number;
      change: number;
      changePercent: number;
      volumeShares?: number;
      turnoverYi?: number;
      marketCap?: number;
    }[] = [];

    const seen = new Set<string>();

    top5Sectors.forEach(topSec => {
      const isMatched = targetSectorNames.some(t => isSectorMatch(t, topSec.sector));
      if (isMatched && topSec.allConstituentStocks && topSec.allConstituentStocks.length > 0) {
        topSec.allConstituentStocks.forEach(stk => {
          if (!seen.has(stk.symbol)) {
            seen.add(stk.symbol);
            list.push({
              sectorName: topSec.sector,
              code: stk.code,
              name: stk.name,
              symbol: stk.symbol,
              market: stk.market,
              close: stk.close,
              change: stk.change,
              changePercent: stk.changePercent,
              volumeShares: stk.volumeShares,
              turnoverYi: stk.turnoverYi,
              marketCap: stk.marketCap,
            });
          }
        });
      }
    });

    allSectors.forEach(sec => {
      const matchedTarget = targetSectorNames.find(t => isSectorMatch(t, sec.sectorName));
      if (matchedTarget) {
        (sec.memberStocks || []).forEach(stk => {
          if (!seen.has(stk.symbol)) {
            seen.add(stk.symbol);
            list.push({
              sectorName: matchedTarget,
              code: stk.code,
              name: stk.name,
              symbol: stk.symbol,
              market: 'TWSE',
              close: stk.basePrice,
              change: 0,
              changePercent: 0,
            });
          }
        });
      }
    });

    list.sort((a, b) => (b.turnoverYi || 0) - (a.turnoverYi || 0) || (b.marketCap || 0) - (a.marketCap || 0));
    return list;
  }, [top5Sectors, allSectors, targetSectorNames]);

  // 2. 自動向後端 /api/stocks/batch-candles 撈取真實日 K 線
  const isFetchingRef = useRef(false);
  const fetchCandlesForCurrentStocks = async (force: boolean = false) => {
    if (isFetchingRef.current && !force) return;

    const neededSymbols: string[] = [];
    allSectorStocksRaw.forEach(stk => {
      const inProp = candlesMap?.get(stk.symbol) || candlesMap?.get(stk.symbol.replace(/\.TW$/, '.TWO'));
      const inLocal = localCandlesMap.get(stk.symbol) || localCandlesMap.get(stk.symbol.replace(/\.TW$/, '.TWO'));
      if ((!inProp || inProp.length < 5) && (!inLocal || inLocal.length < 5)) {
        if (!neededSymbols.includes(stk.symbol)) {
          neededSymbols.push(stk.symbol);
        }
      }
    });

    if (neededSymbols.length === 0) {
      setFetchProgress({ loaded: allSectorStocksRaw.length, total: allSectorStocksRaw.length });
      return;
    }

    isFetchingRef.current = true;
    setIsFetchingRealCandles(true);
    setFetchProgress({ loaded: allSectorStocksRaw.length - neededSymbols.length, total: allSectorStocksRaw.length });

    try {
      const chunkSize = 16;
      for (let i = 0; i < neededSymbols.length; i += chunkSize) {
        const chunk = neededSymbols.slice(i, i + chunkSize);
        try {
          const res = await fetch('/api/stocks/batch-candles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: chunk, range: '3mo' }),
          });
          const data = await res.json();
          if (data && typeof data === 'object') {
            setLocalCandlesMap(prev => {
              const updated = new Map(prev);
              Object.entries(data).forEach(([sym, val]: [string, any]) => {
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
        } catch (err) {
          console.warn('Batch fetch chunk failed:', err);
        }
        setFetchProgress(prev => ({
          loaded: Math.min(allSectorStocksRaw.length, prev.loaded + chunk.length),
          total: allSectorStocksRaw.length,
        }));
      }
    } finally {
      setIsFetchingRealCandles(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchCandlesForCurrentStocks();
  }, [allSectorStocksRaw]);

  // 3. 結合真實 K 線、指標與自訂策略評估信號
  const sectorStocksData = useMemo(() => {
    return allSectorStocksRaw.map(stk => {
      const existing =
        localCandlesMap.get(stk.symbol) ||
        localCandlesMap.get(stk.symbol.replace(/\.TW$/, '.TWO')) ||
        candlesMap?.get(stk.symbol) ||
        candlesMap?.get(stk.symbol.replace(/\.TW$/, '.TWO'));

      const isReal = !!(existing && existing.length >= 5);
      const rawCandles = isReal
        ? existing!
        : generateFallbackCandles(stk.symbol, '3mo');
      const candlesWithInd = calculateIndicators(rawCandles);

      const lastC = candlesWithInd[candlesWithInd.length - 1];
      const prevC = candlesWithInd.length > 1 ? candlesWithInd[candlesWithInd.length - 2] : lastC;
      const currentPrice = lastC ? lastC.close : stk.close;
      const prevClose = prevC ? prevC.close : currentPrice;
      const change = Number((currentPrice - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

      const volumeToday = lastC ? lastC.volume : ((stk.volumeShares || 10) * 1000);

      // 執行策略信號評估
      const strategySignal = evaluateStrategySignal(
        candlesWithInd,
        userStrategy || DEFAULT_STRATEGY,
        stk.symbol,
        stk.name
      );

      return {
        sectorName: stk.sectorName,
        code: stk.code,
        name: stk.name,
        symbol: stk.symbol,
        market: stk.market || 'TWSE',
        subCategory: stk.market ? `${stk.market} 上市櫃` : '成分股',
        basePrice: stk.close,
        turnoverYi: stk.turnoverYi,
        candles: candlesWithInd.slice(-66),
        currentPrice,
        change,
        changePercent,
        volumeToday,
        isRealCandles: isReal,
        strategySignal,
      };
    });
  }, [allSectorStocksRaw, localCandlesMap, candlesMap, userStrategy]);

  // 4. 關鍵字與策略信號篩選 (買進、持有、觀望、賣出)
  const filteredStocks = useMemo(() => {
    let list = sectorStocksData;

    if (selectedSignalFilter !== 'ALL') {
      list = list.filter(s => s.strategySignal.status === selectedSignalFilter);
    }

    const kw = searchKeyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        s =>
          s.code.includes(kw) ||
          s.name.toLowerCase().includes(kw) ||
          s.symbol.toLowerCase().includes(kw) ||
          s.sectorName.toLowerCase().includes(kw)
      );
    }

    return list;
  }, [sectorStocksData, selectedSignalFilter, searchKeyword]);

  // 5. 分頁切片
  const totalItems = filteredStocks.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const paginatedStocks = useMemo(() => {
    if (pageSize === -1) return filteredStocks;
    const start = (currentPage - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, currentPage, pageSize]);

  // 信號統計
  const signalCounts = useMemo(() => {
    let buy = 0;
    let hold = 0;
    let wait = 0;
    let sell = 0;
    sectorStocksData.forEach(s => {
      const st = s.strategySignal.status;
      if (st === 'BUY') buy++;
      else if (st === 'HOLD') hold++;
      else if (st === 'SELL') sell++;
      else wait++;
    });
    return { buy, hold, wait, sell, total: sectorStocksData.length };
  }, [sectorStocksData]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-xl">
      {/* 頂部標題與控制列 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
              <Table size={11} className="text-blue-400" />
              五大熱門產業全成分股 · 策略即時選股表格
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              涵蓋 <strong>{allSectorStocksRaw.length}</strong> 檔 · 買進 <span className="text-rose-400 font-bold">{signalCounts.buy}</span> · 持有 <span className="text-emerald-400 font-bold">{signalCounts.hold}</span> · 觀望 <span className="text-slate-400">{signalCounts.wait}</span> · 賣出 <span className="text-amber-400">{signalCounts.sell}</span>
            </span>
            {isFetchingRealCandles && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-600/50 flex items-center gap-1 font-mono animate-pulse">
                <RefreshCw size={9} className="animate-spin" />
                更新日K ({fetchProgress.loaded}/{fetchProgress.total})
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            <span>
              {selectedSector && selectedSector !== 'ALL'
                ? `【${selectedSector}】全成分股看盤表 (${allSectorStocksRaw.length}檔)`
                : `前五大熱門產業・全成分股看盤表 (${allSectorStocksRaw.length}檔)`}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* 視圖切換 (表格 / 卡片) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table size={11} />
              <span>表格</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={11} />
              <span>卡片</span>
            </button>
          </div>

          {/* 刷新 K 線 */}
          <button
            onClick={() => fetchCandlesForCurrentStocks(true)}
            disabled={isFetchingRealCandles}
            className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="重新自 Yahoo Finance 更新真實日K"
          >
            <RefreshCw size={11} className={isFetchingRealCandles ? 'animate-spin text-blue-400' : ''} />
            <span>刷新K線</span>
          </button>
        </div>
      </div>

      {/* 5 大熱門產業頁籤快速切換 */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-xs">
        <button
          onClick={() => onSelectSector('ALL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
            selectedSector === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          全部 5 大產業 ({top5Sectors.reduce((acc, s) => acc + (s.allConstituentStocks?.length || s.stocksCount || 0), 0)}檔)
        </button>
        {top5Sectors.map(s => {
          const isSelected = selectedSector === s.sector;
          const count = s.allConstituentStocks?.length || s.stocksCount;
          return (
            <button
              key={s.sector}
              onClick={() => onSelectSector(s.sector)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{s.sector}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900/80 text-slate-300 font-mono">
                {count}檔
              </span>
              <span className={`text-[10px] font-mono font-bold ${s.fiveDayCumulativeChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {s.fiveDayCumulativeChange >= 0 ? '+' : ''}{s.fiveDayCumulativeChange}%
              </span>
            </button>
          );
        })}
      </div>

      {/* 策略訊號快選按鈕列 (買進、持有、觀望、賣出) 與搜尋 */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap bg-slate-950/70 p-1.5 sm:p-2 rounded-lg border border-slate-800/80 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-400 font-medium mr-0.5 flex items-center gap-1">
            <Filter size={11} className="text-blue-400" />
            <span>訊號:</span>
          </span>

          <button
            onClick={() => setSelectedSignalFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
              selectedSignalFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            全部 ({signalCounts.total})
          </button>

          <button
            onClick={() => setSelectedSignalFilter(prev => prev === 'BUY' ? 'ALL' : 'BUY')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedSignalFilter === 'BUY'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-900 text-rose-400 hover:text-white border border-rose-500/30'
            }`}
          >
            <span>🔥 買進</span>
            <span className="text-[9px] px-1 py-0 rounded-full bg-slate-950 text-rose-300 font-mono font-bold">
              {signalCounts.buy}
            </span>
          </button>

          <button
            onClick={() => setSelectedSignalFilter(prev => prev === 'HOLD' ? 'ALL' : 'HOLD')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedSignalFilter === 'HOLD'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 text-emerald-400 hover:text-white border border-emerald-500/30'
            }`}
          >
            <span>💎 持有</span>
            <span className="text-[9px] px-1 py-0 rounded-full bg-slate-950 text-emerald-300 font-mono font-bold">
              {signalCounts.hold}
            </span>
          </button>

          <button
            onClick={() => setSelectedSignalFilter(prev => prev === 'WAIT' ? 'ALL' : 'WAIT')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedSignalFilter === 'WAIT'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⏳ 觀望</span>
            <span className="text-[9px] px-1 py-0 rounded-full bg-slate-950 text-slate-300 font-mono font-bold">
              {signalCounts.wait}
            </span>
          </button>

          <button
            onClick={() => setSelectedSignalFilter(prev => prev === 'SELL' ? 'ALL' : 'SELL')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedSignalFilter === 'SELL'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 text-amber-400 hover:text-white border border-amber-500/30'
            }`}
          >
            <span>⛔ 賣出</span>
            <span className="text-[9px] px-1 py-0 rounded-full bg-slate-950 text-amber-300 font-mono font-bold">
              {signalCounts.sell}
            </span>
          </button>
        </div>

        {/* 搜尋與每頁數量切換 */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋代號或名稱..."
              className="w-full pl-6.5 pr-2 py-0.5 text-[11px] bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
            <span>每頁:</span>
            {[25, 50, 100, -1].map((sz) => (
              <button
                key={sz}
                onClick={() => setPageSize(sz)}
                className={`px-1.5 py-0.2 rounded font-bold cursor-pointer transition-all ${
                  pageSize === sz
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sz === -1 ? '全' : sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 核心表格呈現 (Table View) - 高密度、緊湊排列、極小化空白                    */}
      {/* 欄位: 股票名稱(代號)｜產業｜股價｜今日成交量｜策略訊號｜簡易K線｜看盤按鈕    */}
      {/* ========================================================================= */}
      {paginatedStocks.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-slate-800/80">
          <Filter size={24} className="mx-auto text-slate-600 mb-1.5" />
          <p className="text-slate-400 text-xs font-medium">沒有符合條件的成分股票</p>
          <p className="text-slate-500 text-[11px] mt-0.5">請調整策略訊號篩選或清除關鍵字搜尋</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/90 shadow-inner">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 font-mono tracking-normal sticky top-0 z-20 border-b border-slate-800">
              <tr>
                <th className="py-1.5 px-2.5 whitespace-nowrap sticky left-0 z-30 bg-slate-950 border-r border-slate-800/60 shadow-xs">
                  股票名稱 (代號)
                </th>
                <th className="py-1.5 px-2 whitespace-nowrap">產業</th>
                <th className="py-1.5 px-2 text-right whitespace-nowrap">股價</th>
                <th className="py-1.5 px-2 text-right whitespace-nowrap">今日成交量</th>
                <th className="py-1.5 px-2 text-center whitespace-nowrap">策略訊號 (買進/持有/觀望/賣出)</th>
                <th className="py-1.5 px-2 text-center whitespace-nowrap">簡易K線 (30日·MA5/20)</th>
                <th className="py-1.5 px-2 text-center whitespace-nowrap">看盤按鈕</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-sans">
              {paginatedStocks.map((stk) => {
                const isUp = stk.change >= 0;
                const status = stk.strategySignal.status;

                return (
                  <tr
                    key={stk.symbol}
                    onClick={() => onSelectStockForChart(stk.symbol, stk.name)}
                    className="hover:bg-blue-950/25 transition-colors group cursor-pointer even:bg-slate-900/20"
                  >
                    {/* 1. 股票名稱(代號) - 密集單行排列 + 凍結首欄 */}
                    <td className="py-1.5 px-2.5 whitespace-nowrap sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 border-r border-slate-800/60 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs group-hover:text-blue-300 transition-colors">
                          {stk.name}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-blue-400">
                          {stk.code}
                        </span>
                        <span className="text-[9px] px-1 py-0 rounded font-mono bg-slate-900 text-slate-400 border border-slate-800/80">
                          {stk.market}
                        </span>
                      </div>
                    </td>

                    {/* 2. 產業 */}
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        {stk.sectorName}
                      </span>
                    </td>

                    {/* 3. 股價與漲跌 (緊湊並列) */}
                    <td className="py-1.5 px-2 text-right whitespace-nowrap font-mono">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-xs font-bold text-white">
                          ${stk.currentPrice}
                        </span>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          <span>{isUp ? '+' : ''}{stk.changePercent}%</span>
                        </span>
                      </div>
                      <div className={`text-[9px] leading-none ${isUp ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                        {isUp ? '+' : ''}{stk.change}
                      </div>
                    </td>

                    {/* 4. 今日成交量 */}
                    <td className="py-1.5 px-2 text-right whitespace-nowrap font-mono">
                      <span className="text-xs font-bold text-slate-200">
                        {Math.round(stk.volumeToday / 1000).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 ml-0.5">張</span>
                    </td>

                    {/* 5. 策略訊號(買進、持有、觀望、賣出) */}
                    <td className="py-1 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                          status === 'BUY'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : status === 'HOLD'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : status === 'SELL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                        }`} title={stk.strategySignal.statusDesc}>
                          {status === 'BUY' && '🔥 買進'}
                          {status === 'HOLD' && '💎 持有'}
                          {status === 'SELL' && '⛔ 賣出'}
                          {status === 'WAIT' && '⏳ 觀望'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px] hidden sm:inline-block" title={stk.strategySignal.statusDesc}>
                          {stk.strategySignal.statusDesc}
                        </span>
                      </div>
                    </td>

                    {/* 6. 簡易 K 線 (高密度微縮版) */}
                    <td className="py-1 px-1.5 text-center whitespace-nowrap">
                      <MiniKLineChart candles={stk.candles} width={105} height={28} />
                    </td>

                    {/* 7. 看盤按鈕 */}
                    <td className="py-1 px-2 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStockForChart(stk.symbol, stk.name);
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 mx-auto active:scale-95"
                        title={`載入 ${stk.name} (${stk.code}) 到主技術分析圖表`}
                      >
                        <Maximize2 size={10} />
                        <span>看盤</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* 卡片模式 (Cards View 備用) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedStocks.map(stk => {
            const isUp = stk.change >= 0;
            const status = stk.strategySignal.status;
            return (
              <div
                key={stk.symbol}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-black text-white">{stk.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-400">({stk.code})</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {stk.sectorName}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${stk.strategySignal.badgeClass}`}>
                    {stk.strategySignal.statusLabel}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-slate-900">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black font-mono text-white">${stk.currentPrice}</span>
                    <span className={`text-xs font-mono font-bold ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isUp ? '+' : ''}{stk.change} ({isUp ? '+' : ''}{stk.changePercent}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    量: {Math.round(stk.volumeToday / 1000).toLocaleString()}張
                  </div>
                </div>

                <div className="w-full flex justify-center py-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                  <MiniKLineChart candles={stk.candles} width={280} height={60} />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {stk.strategySignal.statusDesc}
                  </span>
                  <button
                    onClick={() => onSelectStockForChart(stk.symbol, stk.name)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 size={11} />
                    <span>看盤</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分頁導航控制條 */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 gap-1.5">
          <div className="font-mono">
            顯示第 {(currentPage - 1) * pageSize + 1} 至 {Math.min(currentPage * pageSize, totalItems)} 檔 · 共 {totalItems} 檔成分股
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="上一頁"
            >
              <ChevronLeft size={13} />
            </button>

            <span className="px-2 py-0.5 font-mono font-bold text-white bg-slate-950 border border-slate-800 rounded-md text-[11px]">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="下一頁"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
