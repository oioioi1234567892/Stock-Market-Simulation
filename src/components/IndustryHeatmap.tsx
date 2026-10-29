import React, { useState, useMemo, useEffect } from 'react';
import { IndustrySectorInfo } from '../types/volumeBreakout.ts';
import { MarketHeatmapResponse, HeatmapSectorItem, HeatmapStockItem } from '../types/marketHeatmap.ts';
import { fetchMarket35SectorsHeatmap } from '../services/api.ts';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  Filter,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  Info,
  RefreshCw,
  Maximize2,
  ChevronRight,
  ArrowLeft,
  X,
  Sliders,
  Check,
  Calendar,
  Grid,
  List,
} from 'lucide-react';

interface IndustryHeatmapProps {
  sectors?: IndustrySectorInfo[];
  selectedSector?: string;
  onSelectSector?: (sectorName: string) => void;
  onViewStockKLine?: (symbol: string, name: string) => void;
}

export const IndustryHeatmap: React.FC<IndustryHeatmapProps> = ({
  sectors: legacySectors = [],
  selectedSector,
  onSelectSector,
  onViewStockKLine,
}) => {
  // 1954 檔 35 個官方產業真實盤面資料
  const [heatmapData, setHeatmapData] = useState<MarketHeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // 控制維度
  const [marketScope, setMarketScope] = useState<'ALL' | 'TWSE' | 'TPEx' | 'TOP300'>('ALL');
  const [period, setPeriod] = useState<'1w' | '1d' | '1m'>('1w');
  const [sizeWeight, setSizeWeight] = useState<'turnover' | 'marketCap'>('turnover');
  const [colorMode, setColorMode] = useState<'return' | 'rsi'>('return');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 視圖模式 (treemap: 矩形樹狀圖, ranking: 35產業排行榜)
  const [viewTab, setViewTab] = useState<'treemap' | 'ranking'>('treemap');

  // 下鑽至單一產業
  const [drilldownSector, setDrilldownSector] = useState<HeatmapSectorItem | null>(null);

  // 選中個股彈窗詳情
  const [selectedStockModal, setSelectedStockModal] = useState<HeatmapStockItem | null>(null);

  // 載入真實 1954 檔 35 個產業行情
  const loadRealMarketData = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchMarket35SectorsHeatmap(force);
      if (data && data.sectors && data.sectors.length > 0) {
        setHeatmapData(data);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('Failed to load market 35 sectors heatmap:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRealMarketData(false);
  }, []);

  // 依市場篩選處理個股
  const processedSectors = useMemo(() => {
    if (!heatmapData || !heatmapData.sectors) return [];

    return heatmapData.sectors.map(sec => {
      let filteredStocks = sec.stocks || [];

      // 1. 市場別過濾
      if (marketScope === 'TWSE') {
        filteredStocks = filteredStocks.filter(s => s.market === 'TWSE');
      } else if (marketScope === 'TPEx') {
        filteredStocks = filteredStocks.filter(s => s.market === 'TPEx');
      } else if (marketScope === 'TOP300') {
        filteredStocks = filteredStocks.filter(s => (s.marketCapRank || 9999) <= 300 || s.turnoverYi >= 3.0);
      }

      // 2. 搜尋字串過濾 (若有輸入)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filteredStocks = filteredStocks.filter(
          s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
      }

      // 3. 排序 (依成交額或市值)
      filteredStocks.sort((a, b) => {
        if (sizeWeight === 'marketCap') {
          return b.marketCap - a.marketCap;
        }
        return b.turnoverYi - a.turnoverYi;
      });

      // 重新計算產業在篩選後的成交額與市值
      const secTurnover = Number(filteredStocks.reduce((sum, s) => sum + s.turnoverYi, 0).toFixed(2));
      const secWeeklyTurnover = Number(filteredStocks.reduce((sum, s) => sum + s.weeklyTurnoverYi, 0).toFixed(2));
      const secMarketCap = Number(filteredStocks.reduce((sum, s) => sum + s.marketCap, 0).toFixed(2));

      return {
        ...sec,
        totalTurnoverYi: secTurnover,
        weeklyTurnoverYi: secWeeklyTurnover,
        totalMarketCapYi: secMarketCap,
        stockCount: filteredStocks.length,
        stocks: filteredStocks,
      };
    }).filter(sec => sec.stocks.length > 0);
  }, [heatmapData, marketScope, sizeWeight, searchQuery]);

  // 總加權權重
  const totalWeight = useMemo(() => {
    if (sizeWeight === 'marketCap') {
      return processedSectors.reduce((sum, s) => sum + s.totalMarketCapYi, 0) || 1;
    }
    return processedSectors.reduce((sum, s) => sum + s.totalTurnoverYi, 0) || 1;
  }, [processedSectors, sizeWeight]);

  // 取得個股顏色
  const getStockColorClass = (stock: HeatmapStockItem) => {
    if (colorMode === 'rsi') {
      const r = stock.rsi6 ?? 50;
      if (r >= 80) return 'bg-rose-700 text-white border-rose-500/80';
      if (r >= 70) return 'bg-rose-800 text-rose-100 border-rose-600/70';
      if (r >= 55) return 'bg-rose-950/80 text-rose-200 border-rose-800/60';
      if (r >= 45) return 'bg-slate-800 text-slate-200 border-slate-700';
      if (r >= 30) return 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60';
      if (r >= 20) return 'bg-emerald-800 text-emerald-100 border-emerald-600/70';
      return 'bg-emerald-700 text-white border-emerald-500/80';
    }

    // 漲跌幅模式 (1週 / 今日 / 1個月)
    let val = stock.weeklyChangePercent;
    if (period === '1d') val = stock.changePercent;
    else if (period === '1m') val = stock.monthlyChangePercent ?? stock.weeklyChangePercent * 1.8;

    if (val >= 7.0) return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-xs shadow-rose-900/40';
    if (val >= 3.0) return 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500/80';
    if (val >= 1.0) return 'bg-rose-800/90 hover:bg-rose-700 text-rose-50 border-rose-600/60';
    if (val >= 0.2) return 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-800/60';
    if (val >= -0.2) return 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700';
    if (val >= -1.0) return 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-800/60';
    if (val >= -3.0) return 'bg-emerald-800/90 hover:bg-emerald-700 text-emerald-50 border-emerald-600/60';
    if (val >= -7.0) return 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/80';
    return 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-xs shadow-emerald-900/40';
  };

  // 取得產業板塊顏色
  const getSectorBadgeColor = (sec: HeatmapSectorItem) => {
    let val = sec.weeklyChangePercent;
    if (period === '1d') val = sec.todayChangePercent;
    else if (period === '1m') val = sec.monthlyChangePercent;

    if (val > 0) return 'text-rose-400 bg-rose-950/80 border-rose-500/40';
    if (val < 0) return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
    return 'text-slate-400 bg-slate-900 border-slate-800';
  };

  // 當前選中的數值標籤
  const getDisplayValue = (stock: HeatmapStockItem) => {
    if (colorMode === 'rsi') {
      return `RSI ${stock.rsi6 ?? 50}`;
    }
    let val = stock.weeklyChangePercent;
    if (period === '1d') val = stock.changePercent;
    else if (period === '1m') val = stock.monthlyChangePercent ?? 0;
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  // 35 個產業依累積報酬或成交金額排行
  const rankedSectors = useMemo(() => {
    return [...processedSectors].sort((a, b) => {
      let valA = a.weeklyChangePercent;
      let valB = b.weeklyChangePercent;
      if (period === '1d') {
        valA = a.todayChangePercent;
        valB = b.todayChangePercent;
      }
      return valB - valA;
    });
  }, [processedSectors, period]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-5 flex flex-col gap-4 shadow-2xl relative">
      {/* 1. 頂部核心摘要橫幅 (相容 rsi.pttstock.tw/heatmap 標準架構) */}
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-mono uppercase tracking-wider">
              <Flame size={12} className="text-rose-400" />
              台灣股市 35 大產業市場熱力圖 (Market Heatmap)
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-emerald-400 font-bold font-mono">
                證交所 (TWSE) & 櫃買中心 (TPEx) 官方真實盤面
              </span>
              <span className="text-slate-400 text-[10px]">
                · 更新時間 {lastRefreshedAt.toLocaleTimeString('zh-TW', { hour12: false })}
              </span>
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>台股 1,954 檔 · 35 產業 1 週交易資料熱力圖</span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 font-mono border border-blue-800 font-bold">
              相容 rsi.pttstock.tw/heatmap
            </span>
          </h2>

          <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
            真實查找台灣股市全部上市 (TWSE) 與上櫃 (TPEx) 合計 <strong className="text-slate-200">1,954 檔股票</strong>，依據官方標準 <strong className="text-slate-200">35 個產業分類</strong> 分群。色塊面積依據真實成交金額（資金流向）或市值權重分割，顏色深淺直觀反映 1 週（5 日）累積漲跌幅或 RSI(6) 技術指標！
          </p>
        </div>

        {/* 右側市場核心概況卡 */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
            <div className="text-[10px] text-slate-400 font-mono">1週大盤平均漲跌</div>
            <div className={`text-base sm:text-lg font-black font-mono flex items-center justify-end gap-1 ${
              (heatmapData?.summary.marketWeeklyChange ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {(heatmapData?.summary.marketWeeklyChange ?? 0) >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              <span>{(heatmapData?.summary.marketWeeklyChange ?? 0) >= 0 ? '+' : ''}{heatmapData?.summary.marketWeeklyChange ?? 0}%</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-right">
            <div className="text-[10px] text-slate-400 font-mono">全市場上市櫃家數</div>
            <div className="text-base sm:text-lg font-black font-mono text-white">
              {heatmapData?.summary.totalStocks || 1954} <span className="text-xs text-slate-400 font-normal">檔 (35類)</span>
            </div>
          </div>

          <button
            onClick={() => loadRealMarketData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95 shrink-0"
            title="從交易所重新撈取最新即時資料"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? '同步中...' : '重新整理'}</span>
          </button>
        </div>
      </div>

      {/* 2. 多維度互動篩選控制列 (包含市場、時間、權重、著色、搜尋、視圖切換) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 市場選擇 */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-mono">市場:</span>
            {[
              { id: 'ALL', label: '全部 (1954檔)' },
              { id: 'TWSE', label: '上市 (TWSE)' },
              { id: 'TPEx', label: '上櫃 (TPEx)' },
              { id: 'TOP300', label: '市值前 300 大' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMarketScope(m.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  marketScope === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* 時間區間 */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-mono">區間:</span>
            {[
              { id: '1w', label: '近 1 週 (5日)' },
              { id: '1d', label: '今日 (1日)' },
              { id: '1m', label: '近 1 個月' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 區塊面積依據 */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-mono">面積權重:</span>
            {[
              { id: 'turnover', label: '成交金額 (資金流向)' },
              { id: 'marketCap', label: '公司市值' },
            ].map(w => (
              <button
                key={w.id}
                onClick={() => setSizeWeight(w.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  sizeWeight === w.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* 著色指標 */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-mono">著色:</span>
            {[
              { id: 'return', label: '📈 漲跌幅 (%)' },
              { id: 'rsi', label: '⚡ RSI(6) 指標' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setColorMode(c.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  colorMode === c.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 搜尋與視圖切換 */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-800/80">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋股票代號或名稱 (例如: 2330, 台積電, 2454, 聯發科...)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 視圖切換按鈕 (Treemap 樹狀圖 vs 35 產業排行清單) */}
          <div className="flex items-center gap-1.5">
            {drilldownSector && (
              <button
                onClick={() => setDrilldownSector(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 border border-slate-700"
              >
                <ArrowLeft size={13} />
                <span>返回全市場 35 產業</span>
              </button>
            )}

            <button
              onClick={() => setViewTab('treemap')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewTab === 'treemap'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Grid size={13} />
              <span>矩形樹狀熱力圖 (Treemap)</span>
            </button>

            <button
              onClick={() => setViewTab('ranking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewTab === 'ranking'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <List size={13} />
              <span>35 產業 1 週漲跌排行榜</span>
            </button>
          </div>
        </div>
      </div>

      {/* 色階圖例標示列 */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400">圖例:</span>
          {colorMode === 'return' ? (
            <>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">&ge; +7%</span>
              <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold">+3% ~ +7%</span>
              <span className="px-2 py-0.5 rounded bg-rose-800/90 text-rose-100">+1% ~ +3%</span>
              <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-200">0% ~ +1%</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">平盤 0%</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-200">0% ~ -1%</span>
              <span className="px-2 py-0.5 rounded bg-emerald-800/90 text-emerald-100">-1% ~ -3%</span>
              <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold">-3% ~ -7%</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">&le; -7%</span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold">RSI &ge; 80 (極度超買)</span>
              <span className="px-2 py-0.5 rounded bg-rose-800 text-rose-100">70 ~ 80</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">45 ~ 55 (中性)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">20 ~ 30</span>
              <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold">RSI &le; 20 (極度超賣)</span>
            </>
          )}
        </div>

        <div className="text-slate-400">
          目前顯示: <strong className="text-white">{processedSectors.reduce((sum, s) => sum + s.stockCount, 0)}</strong> 檔股票 · <strong className="text-white">{processedSectors.length}</strong> 個產業
        </div>
      </div>

      {/* 3. 視圖 1: 矩形樹狀熱力圖 (Treemap View) */}
      {viewTab === 'treemap' && (
        <div className="flex flex-col gap-3">
          {/* 若處於單一產業下鑽模式 */}
          {drilldownSector ? (
            <div className="flex flex-col gap-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black text-white">【{drilldownSector.name}】全成分股熱力圖</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold border ${getSectorBadgeColor(drilldownSector)}`}>
                    1週累積: {drilldownSector.weeklyChangePercent >= 0 ? '+' : ''}{drilldownSector.weeklyChangePercent}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    共 {drilldownSector.stockCount} 檔成分股 · 1週總成交 {drilldownSector.weeklyTurnoverYi.toLocaleString()} 億元
                  </span>
                </div>
                <button
                  onClick={() => setDrilldownSector(null)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  返回全市場
                </button>
              </div>

              {/* 單一產業下鑽個股網格 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {drilldownSector.stocks.map(stk => (
                  <div
                    key={stk.symbol}
                    onClick={() => setSelectedStockModal(stk)}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group active:scale-95 ${getStockColorClass(stk)}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-black text-xs sm:text-sm truncate">{stk.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{stk.code}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between font-mono">
                      <span className="text-xs font-bold">${stk.close}</span>
                      <span className="text-xs font-black">{getDisplayValue(stk)}</span>
                    </div>
                    <div className="text-[9px] opacity-75 font-mono mt-1 flex justify-between">
                      <span>{stk.market}</span>
                      <span>{stk.turnoverYi}億</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 全市場 35 產業樹狀矩形熱力圖 */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {processedSectors.map(sec => {
                const weightRatio = totalWeight > 0
                  ? ((sizeWeight === 'marketCap' ? sec.totalMarketCapYi : sec.totalTurnoverYi) / totalWeight)
                  : 0.05;
                const isSelected = selectedSector === sec.name;

                return (
                  <div
                    key={sec.id}
                    className={`bg-slate-950/90 border rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition-all shadow-md group ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* 板塊頂部標頭：產業名、1週報酬率、成交額、下鑽按鈕 */}
                    <div className="flex items-center justify-between gap-1.5 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-black text-white group-hover:text-blue-300 transition-colors truncate">
                          {sec.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border shrink-0 ${getSectorBadgeColor(sec)}`}>
                          {sec.weeklyChangePercent >= 0 ? '+' : ''}{sec.weeklyChangePercent}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sec.totalTurnoverYi}億 ({sec.volumeSharePercent}%)
                        </span>
                        <button
                          onClick={() => setDrilldownSector(sec)}
                          className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="下鑽查看該產業全部個股"
                        >
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* 板塊內部個股迷你色塊矩陣 (顯示權重最高的 6~12 檔代表個股) */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-0.5">
                      {sec.stocks.slice(0, 8).map(stk => (
                        <div
                          key={stk.symbol}
                          onClick={() => setSelectedStockModal(stk)}
                          className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer group/stk active:scale-95 ${getStockColorClass(stk)}`}
                          title={`${stk.code} ${stk.name} | 現價 $${stk.close} | 1週: ${stk.weeklyChangePercent}% | 今日: ${stk.changePercent}% | 成交: ${stk.turnoverYi}億`}
                        >
                          <div className="text-[10px] font-black truncate">{stk.name}</div>
                          <div className="text-[9px] font-mono font-bold mt-1 text-right">
                            {getDisplayValue(stk)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 板塊底部家數與看盤連線 */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                      <span>共 {sec.stockCount} 檔成分股</span>
                      <button
                        onClick={() => {
                          if (onSelectSector) onSelectSector(sec.name);
                          setDrilldownSector(sec);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>完整成分熱力圖</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. 視圖 2: 35 產業 1 週漲跌排行榜 (Ranking View) */}
      {viewTab === 'ranking' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800 text-[11px]">
                  <th className="py-2.5 px-3">排名</th>
                  <th className="py-2.5 px-3">產業類別</th>
                  <th className="py-2.5 px-3 text-right">1 週加權漲跌</th>
                  <th className="py-2.5 px-3 text-right">當日漲跌</th>
                  <th className="py-2.5 px-3 text-right">1 週成交額 (佔比)</th>
                  <th className="py-2.5 px-3 text-right">產業總市值</th>
                  <th className="py-2.5 px-3 text-center">多空家數分佈 (漲/跌/平)</th>
                  <th className="py-2.5 px-3 text-center">代表指標股</th>
                  <th className="py-2.5 px-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {rankedSectors.map((sec, idx) => {
                  const isUp = sec.weeklyChangePercent >= 0;
                  const totalCount = sec.advanceCount + sec.declineCount + sec.unchangedCount || 1;
                  const advPct = Math.round((sec.advanceCount / totalCount) * 100);
                  const decPct = Math.round((sec.declineCount / totalCount) * 100);

                  return (
                    <tr
                      key={sec.id}
                      className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                      onClick={() => setDrilldownSector(sec)}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        {idx + 1 <= 5 ? (
                          <span className="text-amber-400 font-black">🔥 No.{idx + 1}</span>
                        ) : (
                          <span>No.{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-black text-white group-hover:text-blue-300 transition-colors">
                          {sec.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1.5">({sec.stockCount}檔)</span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isUp ? '+' : ''}{sec.weeklyChangePercent}%
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${sec.todayChangePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {sec.todayChangePercent >= 0 ? '+' : ''}{sec.todayChangePercent}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className="text-slate-200 font-bold">{sec.weeklyTurnoverYi.toLocaleString()} 億</span>
                        <span className="text-slate-400 text-[10px] ml-1">({sec.volumeSharePercent}%)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {sec.totalMarketCapYi.toLocaleString()} 億
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1 w-28 mx-auto">
                          <div className="flex justify-between text-[9px] font-mono">
                            <span className="text-rose-400 font-bold">{sec.advanceCount}</span>
                            <span className="text-slate-400">{sec.unchangedCount}</span>
                            <span className="text-emerald-400 font-bold">{sec.declineCount}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${advPct}%` }} className="bg-rose-500 h-full" />
                            <div style={{ width: `${100 - advPct - decPct}%` }} className="bg-slate-600 h-full" />
                            <div style={{ width: `${decPct}%` }} className="bg-emerald-500 h-full" />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300 font-mono text-[11px]">
                        {sec.stocks.slice(0, 3).map(s => s.name).join('、')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrilldownSector(sec);
                          }}
                          className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          下鑽全成分
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. 選中個股彈窗詳情卡 (Stock Detail Modal) */}
      {selectedStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl relative flex flex-col gap-3.5">
            <button
              onClick={() => setSelectedStockModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* 頭部 */}
            <div className="flex items-start justify-between pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{selectedStockModal.name}</h3>
                  <span className="text-sm font-mono font-bold text-blue-400">{selectedStockModal.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
                    {selectedStockModal.market}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  所屬 35 產業分類：<strong className="text-slate-200">{selectedStockModal.industry}</strong>
                </div>
              </div>
            </div>

            {/* 價格與 1 週報酬卡片 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-mono">現價 / 當日漲跌</span>
                <div className="text-lg font-black font-mono text-white mt-0.5">
                  ${selectedStockModal.close}
                </div>
                <div className={`text-xs font-mono font-bold ${selectedStockModal.change >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedStockModal.change >= 0 ? '+' : ''}{selectedStockModal.change} ({selectedStockModal.changePercent >= 0 ? '+' : ''}{selectedStockModal.changePercent}%)
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-mono">近 1 週 (5日) 累積漲跌</span>
                <div className={`text-lg font-black font-mono mt-0.5 ${selectedStockModal.weeklyChangePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedStockModal.weeklyChangePercent >= 0 ? '+' : ''}{selectedStockModal.weeklyChangePercent}%
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  RSI(6): <strong className="text-amber-300">{selectedStockModal.rsi6 ?? 50}</strong>
                </div>
              </div>
            </div>

            {/* 交易量與市值細節 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">當日成交金額:</span>
                <span className="text-slate-200 font-bold">{selectedStockModal.turnoverYi} 億元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">1 週成交金額:</span>
                <span className="text-slate-200 font-bold">{selectedStockModal.weeklyTurnoverYi} 億元</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">當日成交張數:</span>
                <span className="text-slate-200">{selectedStockModal.volumeShares.toLocaleString()} 張</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">公司總市值:</span>
                <span className="text-slate-200 font-bold">{selectedStockModal.marketCap.toLocaleString()} 億元</span>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  if (onViewStockKLine) {
                    onViewStockKLine(selectedStockModal.symbol, selectedStockModal.name);
                  }
                  setSelectedStockModal(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/30"
              >
                <Maximize2 size={13} />
                <span>載入全屏看盤 (K 線圖與自訂策略)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
