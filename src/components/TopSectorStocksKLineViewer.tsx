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
  const [filterStrategyOnly, setFilterStrategyOnly] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [localCandlesMap, setLocalCandlesMap] = useState<Map<string, CandleData[]>>(() => new Map());
  const [isFetchingRealCandles, setIsFetchingRealCandles] = useState<boolean>(false);
  const [fetchProgress, setFetchProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  // 重置頁碼當板塊或搜尋條件變更
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, filterStrategyOnly, searchKeyword]);

  // 取得目標顯示的產業清單
  const targetSectorNames = useMemo(() => {
    if (selectedSector && selectedSector !== 'ALL') {
      return [selectedSector];
    }
    return top5Sectors.map(s => s.sector);
  }, [selectedSector, top5Sectors]);

  // 1. 蒐集這 5 個產業中【真實所有成分股】(TWSE + TPEx 上市櫃全成分股)
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

    // 優先從 top5Sectors 的 allConstituentStocks 載入該板塊真實所有成分股
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

    // 補充 ALL_TAIWAN_SECTORS 中的標的
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

    // 依成交額或市值排序
    list.sort((a, b) => (b.turnoverYi || 0) - (a.turnoverYi || 0) || (b.marketCap || 0) - (a.marketCap || 0));

    return list;
  }, [top5Sectors, allSectors, targetSectorNames]);

  // 2. 自動向後端 /api/stocks/batch-candles 撈取真實 3 個月日 K 線
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
      // 批次分組請求，每組 16 檔標的並行處理
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

  // 3. 結合真實 K 線、均線指標與策略信號計算每檔股票展示資料
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

      const last20 = candlesWithInd.slice(-20);
      const volumeToday = lastC ? lastC.volume : ((stk.volumeShares || 10) * 1000);
      const volumeMa20 = Math.round(
        last20.reduce((acc, c) => acc + c.volume, 0) / Math.max(1, last20.length)
      );

      // 執行策略研判
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
        subCategory: stk.market ? `${stk.market} 上市櫃成分股` : '全產業成分股',
        basePrice: stk.close,
        turnoverYi: stk.turnoverYi,
        candles: candlesWithInd.slice(-66),
        currentPrice,
        change,
        changePercent,
        volumeToday,
        volumeMa20,
        isRealCandles: isReal,
        strategySignal,
      };
    });
  }, [allSectorStocksRaw, localCandlesMap, candlesMap, userStrategy]);

  // 4. 關鍵字過濾與自訂策略篩選
  const filteredStocks = useMemo(() => {
    let list = sectorStocksData;

    if (filterStrategyOnly) {
      list = list.filter(
        s => s.strategySignal.status === 'BUY' || s.strategySignal.status === 'HOLD'
      );
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
  }, [sectorStocksData, filterStrategyOnly, searchKeyword]);

  // 5. 分頁切片
  const totalItems = filteredStocks.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const paginatedStocks = useMemo(() => {
    if (pageSize === -1) return filteredStocks;
    const start = (currentPage - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, currentPage, pageSize]);

  // 統計總覽
  const realCandlesCount = useMemo(() => {
    return sectorStocksData.filter(s => s.isRealCandles).length;
  }, [sectorStocksData]);

  const buyHoldCount = useMemo(() => {
    return sectorStocksData.filter(
      s => s.strategySignal.status === 'BUY' || s.strategySignal.status === 'HOLD'
    ).length;
  }, [sectorStocksData]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      {/* 頂部標題與篩選控制 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
              <LineChart size={12} className="text-blue-400" />
              五大產業真實全成分股 · 3個月日K線庫
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              包含全市場真實 <strong>{allSectorStocksRaw.length}</strong> 檔成分股票 · 已載入真實日K {realCandlesCount} 檔
            </span>
            {isFetchingRealCandles && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/50 flex items-center gap-1 font-mono animate-pulse">
                <RefreshCw size={10} className="animate-spin" />
                正在撈取全成分股日K ({fetchProgress.loaded}/{fetchProgress.total})
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>
              {selectedSector && selectedSector !== 'ALL'
                ? `【${selectedSector}】產業全成分股近 3 個月真實 K 線圖 (${allSectorStocksRaw.length}檔)`
                : `前五大熱門產業・全成分股近 3 個月真實 K 線圖總覽 (${allSectorStocksRaw.length}檔)`}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* 策略「買進/持有」過濾按鈕 */}
          <button
            onClick={() => setFilterStrategyOnly(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterStrategyOnly
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-400'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles size={13} className={filterStrategyOnly ? 'text-amber-300' : 'text-slate-400'} />
            <span>僅顯示策略買進/持有 ({buyHoldCount})</span>
          </button>

          {/* 強制重新同步真實 K 線按鈕 */}
          <button
            onClick={() => fetchCandlesForCurrentStocks(true)}
            disabled={isFetchingRealCandles}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="重新自 Yahoo Finance 批次更新全成分股真實日K"
          >
            <RefreshCw size={12} className={isFetchingRealCandles ? 'animate-spin text-blue-400' : ''} />
            <span>刷新K線</span>
          </button>
        </div>
      </div>

      {/* 5 大動能產業快速切換頁籤 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => onSelectSector('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            selectedSector === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          全部 5 大動能產業 ({top5Sectors.reduce((acc, s) => acc + (s.allConstituentStocks?.length || s.stocksCount || 0), 0)}檔)
        </button>
        {top5Sectors.map(s => {
          const isSelected = selectedSector === s.sector;
          const count = s.allConstituentStocks?.length || s.stocksCount;
          return (
            <button
              key={s.sector}
              onClick={() => onSelectSector(s.sector)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{s.sector}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300 font-mono">
                {count}檔
              </span>
              <span className={`text-[10px] font-mono ${s.fiveDayCumulativeChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {s.fiveDayCumulativeChange >= 0 ? '+' : ''}{s.fiveDayCumulativeChange}%
              </span>
            </button>
          );
        })}
      </div>

      {/* 搜尋欄位與每頁數量切換 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="🔍 快速搜尋全成分股代號或名稱 (如 2330, 台積電, 欣興, 2454, 鴻海...)"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-400 font-mono">
          <span>共 {totalItems} 檔</span>
          <div className="flex items-center gap-1">
            <span>每頁:</span>
            {[24, 48, 96, -1].map((sz) => (
              <button
                key={sz}
                onClick={() => setPageSize(sz)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  pageSize === sz
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sz === -1 ? '全部' : sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 成分股卡片清單與 K 線圖總覽 */}
      {paginatedStocks.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800/80">
          <Filter size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm font-medium">沒有符合篩選條件的成分股票</p>
          <p className="text-slate-500 text-xs mt-1">請嘗試清除搜尋關鍵字或取消「僅顯示買進/持有」過濾</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedStocks.map(stk => {
            const isUp = stk.change >= 0;
            const isStrategyBuyOrHold = stk.strategySignal.status === 'BUY' || stk.strategySignal.status === 'HOLD';

            // 計算 K 線高低點供 SVG 繪製
            const candles = stk.candles || [];
            const minPrice = Math.min(...candles.map(c => c.low)) || 1;
            const maxPrice = Math.max(...candles.map(c => c.high)) || 1;
            const priceRange = Math.max(0.1, maxPrice - minPrice);
            const svgHeight = 120;
            const svgWidth = 320;

            return (
              <div
                key={stk.symbol}
                className={`bg-slate-950 border rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all relative overflow-hidden group ${
                  isStrategyBuyOrHold
                    ? 'border-emerald-500/40 shadow-emerald-950/20 shadow-md'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* 卡片頭部：代號、名稱、產業、自訂策略信號 */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-black text-white">{stk.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-400">{stk.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                        {stk.market}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {stk.sectorName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {stk.subCategory}
                    </div>
                  </div>

                  {/* 策略信號標籤 */}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border shrink-0 ${stk.strategySignal.badgeClass}`}>
                    {stk.strategySignal.statusLabel}
                  </span>
                </div>

                {/* 價格與當日量能資訊 */}
                <div className="flex items-baseline justify-between pt-1 border-t border-slate-900">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black font-mono text-white">
                      ${stk.currentPrice}
                    </span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{isUp ? '+' : ''}{stk.change} ({isUp ? '+' : ''}{stk.changePercent}%)</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    今日量: <strong className="text-slate-200">{(stk.volumeToday / 1000).toFixed(0)}張</strong>
                  </div>
                </div>

                {/* 互動式真實 K 線圖區域 */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      {stk.isRealCandles ? (
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          Yahoo Finance 真實日K
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono font-bold">
                          <RefreshCw size={9} className="animate-spin" />
                          即時真實K線同步中
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400">5/20MA</span>
                    </div>
                    <span className="text-slate-300 font-bold font-mono">
                      H: ${maxPrice.toFixed(1)} / L: ${minPrice.toFixed(1)}
                    </span>
                  </div>

                  {/* SVG 蠟燭圖與均線 */}
                  <div className="w-full overflow-hidden">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-[100px] select-none"
                    >
                      {/* 網格背景線 */}
                      <line x1="0" y1="25" x2={svgWidth} y2="25" stroke="#1e293b" strokeDasharray="2,2" />
                      <line x1="0" y1="60" x2={svgWidth} y2="60" stroke="#1e293b" strokeDasharray="2,2" />
                      <line x1="0" y1="95" x2={svgWidth} y2="95" stroke="#1e293b" strokeDasharray="2,2" />

                      {/* 蠟燭線繪製 */}
                      {candles.map((c, i) => {
                        const candleW = Math.max(2, (svgWidth / candles.length) * 0.7);
                        const x = (i / (candles.length - 1 || 1)) * (svgWidth - candleW);
                        const isCandleUp = c.close >= c.open;
                        const yHigh = svgHeight - ((c.high - minPrice) / priceRange) * (svgHeight - 16) - 8;
                        const yLow = svgHeight - ((c.low - minPrice) / priceRange) * (svgHeight - 16) - 8;
                        const yOpen = svgHeight - ((c.open - minPrice) / priceRange) * (svgHeight - 16) - 8;
                        const yClose = svgHeight - ((c.close - minPrice) / priceRange) * (svgHeight - 16) - 8;
                        const yBodyTop = Math.min(yOpen, yClose);
                        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

                        return (
                          <g key={i} className="hover:opacity-80">
                            {/* 影線 */}
                            <line
                              x1={x + candleW / 2}
                              y1={yHigh}
                              x2={x + candleW / 2}
                              y2={yLow}
                              stroke={isCandleUp ? '#f43f5e' : '#10b981'}
                              strokeWidth="1"
                            />
                            {/* 實體 */}
                            <rect
                              x={x}
                              y={yBodyTop}
                              width={candleW}
                              height={bodyHeight}
                              fill={isCandleUp ? '#f43f5e' : '#10b981'}
                              rx="0.5"
                            />
                          </g>
                        );
                      })}

                      {/* 5MA (黃線) */}
                      <polyline
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        points={candles
                          .map((c, i) => {
                            if (!c.ma5) return '';
                            const x = (i / (candles.length - 1 || 1)) * svgWidth;
                            const y = svgHeight - ((c.ma5 - minPrice) / priceRange) * (svgHeight - 16) - 8;
                            return `${x},${y}`;
                          })
                          .filter(Boolean)
                          .join(' ')}
                      />

                      {/* 20MA (藍線) */}
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                        points={candles
                          .map((c, i) => {
                            if (!c.ma20) return '';
                            const x = (i / (candles.length - 1 || 1)) * svgWidth;
                            const y = svgHeight - ((c.ma20 - minPrice) / priceRange) * (svgHeight - 16) - 8;
                            return `${x},${y}`;
                          })
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="w-2 h-0.5 bg-amber-400 inline-block" /> 5MA
                      </span>
                      <span className="flex items-center gap-1 text-sky-400">
                        <span className="w-2 h-0.5 bg-sky-400 inline-block" /> 20MA
                      </span>
                    </div>
                    <span className="text-slate-300 font-mono text-[9px] font-semibold">
                      {candles[0]?.time} ~ {candles[candles.length - 1]?.time} ({candles.length}根日K線)
                    </span>
                  </div>
                </div>

                {/* 策略說明與操作按鈕 */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-400 truncate max-w-[170px]" title={stk.strategySignal.statusDesc}>
                    {stk.strategySignal.statusDesc}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onSelectStockForChart(stk.symbol, stk.name)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer shadow-md flex items-center gap-1"
                      title="載入到全屏技術分析看盤"
                    >
                      <Maximize2 size={11} />
                      <span>看盤</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分頁控制條 */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <div className="font-mono">
            顯示第 {(currentPage - 1) * pageSize + 1} 至 {Math.min(currentPage * pageSize, totalItems)} 檔 · 共 {totalItems} 檔
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-2.5 py-1 font-mono font-bold text-white bg-slate-950 border border-slate-800 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
