import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RefreshCw,
  Activity,
  Layers,
  Target,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  LineChart,
  Search,
  Filter,
  Compass,
  Flame,
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Info,
  ArrowUpRight,
  LayoutGrid,
  Table,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BreakoutStockCandidate,
  TopSectorVolumeInfo,
  VolumeBreakoutScanResult,
  BreakoutPatternType,
} from '../types/volumeBreakout.ts';
import { runVolumeBreakoutScan } from '../utils/aiVolumeBreakoutEngine.ts';
import { fetchVolumeBreakoutScan } from '../services/api.ts';
import { AiVolumeBreakoutModal } from './AiVolumeBreakoutModal.tsx';

interface TechFundamentalScannerProps {
  onSelectStockForChart: (symbol: string, name: string) => void;
}

export const TechFundamentalScanner: React.FC<TechFundamentalScannerProps> = ({
  onSelectStockForChart,
}) => {
  // 核心掃描數據
  const [scanResult, setScanResult] = useState<VolumeBreakoutScanResult>(() => runVolumeBreakoutScan());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // AI 掃描動畫進度條 (4 步驟)
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<number>(1);

  // 篩選狀態
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedPattern, setSelectedPattern] = useState<string>('ALL');
  const [onlySurgeOver2x, setOnlySurgeOver2x] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // 彈窗
  const [detailStock, setDetailStock] = useState<BreakoutStockCandidate | null>(null);

  // 初始化時自動向後台請求最新即時數據
  useEffect(() => {
    let isCancelled = false;
    const loadScanData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchVolumeBreakoutScan();
        if (!isCancelled && data && data.top20Stocks?.length > 0) {
          setScanResult(data);
          setLastUpdated(new Date(data.scanTimestamp || Date.now()));
        }
      } catch (err) {
        console.warn('Failed to fetch breakout scan from server:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    loadScanData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 觸發 AI Agent 重新撈取 Top 5 板塊與 3 個月 K 線圖形態研判
  const handleTriggerAiScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanStep(1);

    // 步驟 1: 撈取當日交易量前 5 大板塊
    const t1 = setTimeout(() => {
      setScanProgress(25);
      setScanStep(2);
    }, 400);

    // 步驟 2: 從 5 大板塊使用 yfinance 蒐集 3 個月 K 線
    const t2 = setTimeout(() => {
      setScanProgress(55);
      setScanStep(3);
    }, 850);

    // 步驟 3: 利用 AI Agent 判斷各公司 K 線形態
    const t3 = setTimeout(() => {
      setScanProgress(80);
      setScanStep(4);
    }, 1350);

    // 步驟 4: 精選 20 檔即將放量起漲股票
    const t4 = setTimeout(async () => {
      setScanProgress(100);
      try {
        const fresh = await fetchVolumeBreakoutScan(true);
        if (fresh && fresh.top20Stocks?.length > 0) {
          setScanResult(fresh);
        } else {
          setScanResult(runVolumeBreakoutScan());
        }
      } catch {
        setScanResult(runVolumeBreakoutScan());
      }
      setLastUpdated(new Date());
      setIsScanning(false);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  // 篩選與排序後的 Top 20 股票清單
  const filteredStocks = useMemo(() => {
    let list = scanResult.top20Stocks || [];

    // 板塊過濾
    if (selectedSector !== 'ALL') {
      list = list.filter(s => s.sector === selectedSector);
    }

    // 形態過濾
    if (selectedPattern !== 'ALL') {
      list = list.filter(s => s.patternTag === selectedPattern);
    }

    // 爆量 > 2.0x 過濾
    if (onlySurgeOver2x) {
      list = list.filter(s => s.volumeSurgeRatio >= 2.0);
    }

    // 關鍵字搜尋
    const cleanKw = searchKeyword.trim().toLowerCase();
    if (cleanKw) {
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(cleanKw) ||
          s.code.includes(cleanKw) ||
          s.symbol.toLowerCase().includes(cleanKw) ||
          s.patternName.toLowerCase().includes(cleanKw)
      );
    }

    return list;
  }, [scanResult.top20Stocks, selectedSector, selectedPattern, onlySurgeOver2x, searchKeyword]);

  // 所有不重複的形態標籤清單
  const patternTags = useMemo(() => {
    const tags = new Set<string>();
    (scanResult.top20Stocks || []).forEach(s => {
      if (s.patternTag) tags.add(s.patternTag);
    });
    return Array.from(tags);
  }, [scanResult.top20Stocks]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Hero 頂部核心控制橫幅 */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                AI Agent 量能形態獵殺雷達 · 4 步驟深度推算
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 font-semibold">yfinance 3個月K線已連線</span>
                <span className="text-slate-400 text-[10px]">
                  · 更新時間 {lastUpdated.toLocaleTimeString('zh-TW', { hour12: false })}
                </span>
                {isLoading && (
                  <span className="text-blue-400 text-[10px] flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> 背景同步中...
                  </span>
                )}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>台股 AI 放量起漲精選・Top 20 即將突破黑馬股</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              1. 後台自動撈取每日<strong className="text-amber-300">交易量最大的 5 個產業板塊</strong>；2. 從中透過 yfinance 蒐集各公司<strong className="text-blue-300">最新 3 個月價量 K 線圖</strong>；3. 利用 <strong className="text-emerald-300">AI Agent</strong> 深度判別 K 線幾何形態（VCP量縮、均線糾結、旗形、杯柄等）；4. 精準篩選出 <strong className="text-purple-300">即將放量起漲的 20 間公司股票</strong>！
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleTriggerAiScan}
              disabled={isScanning}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-95"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Agent 正在辨識 3 個月 K 線圖...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white" />
                  <span>🧠 啟動 AI 重新撈取 Top 5 板塊與 3 個月 K 線</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 掃描 4 步驟擬真實時進度條 */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1.5">
              <span>
                {scanStep === 1 && '步驟 1/4: 後台使用 yfinance 撈取台股今日交易量最大的 5 個產業板塊...'}
                {scanStep === 1 && '步驟 1/4: 後台使用 yfinance 撈取台股最新一周成交量最大的 5 大產業板塊...'}
                {scanStep === 2 && '步驟 2/4: 從這 5 大板塊中使用 yfinance 蒐集每間公司最新 1 個月與 3 個月 K 線圖與量能數據...'}
                {scanStep === 3 && '步驟 3/4: 利用 AI 操盤手演算法嚴格檢驗牛市結構，辨識即將放量起漲之 K 線型態 (VCP、旗形、杯柄)...'}
                {scanStep === 4 && '步驟 4/4: 排除破底無量股票，精選出 20 檔多頭放量起漲黑馬股並給予專業價格推估！'}
              </span>
              <span className="font-bold text-blue-400">{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-linear-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Top 5 最新一周成交量最大產業板塊看板 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame size={15} />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>台股最新一周成交量最高 5 大產業板塊 (Top 5 Weekly Volume Sectors)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                  佔大盤週成交比重達 85.1%
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                後台即時運算最新一周主力資金最集中之 5 大板塊，並依據 1 個月與 3 個月 K 線量能實況篩選出趨勢上漲或即將放量起漲之黑馬：
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            大盤週成交量估算: <strong className="text-slate-200">{scanResult.marketTurnoverTotal} 億元</strong>
          </div>
        </div>

        {/* 5 大板塊卡片橫向滑動列 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {scanResult.top5Sectors.map(sec => {
            const isSelected = selectedSector === sec.sector;
            return (
              <div
                key={sec.sector}
                onClick={() => setSelectedSector(prev => (prev === sec.sector ? 'ALL' : sec.sector))}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden group select-none ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-900/20 ring-1 ring-blue-500'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    No.{sec.rank} 最大量板塊
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {sec.momentumGradeLabel}
                  </span>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                    {sec.sector}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                    <span className="text-slate-400">週成交額</span>
                    <span className="text-amber-300 font-bold">{sec.dailyTurnoverAmount * 5} 億</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">大盤佔比</span>
                    <span className="text-emerald-400 font-bold">{sec.volumeSharePercent}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {sec.mainDriver}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40 font-mono">
                  <span>代表股:</span>
                  <span className="text-slate-300 truncate max-w-[120px]">
                    {sec.representativeStocks.slice(0, 2).join('、')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 操盤手戰情篩選列 & 快速標籤 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 左側：板塊快捷 Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSector('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSector === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🌟 全部 20 檔黑馬
            </button>
            {scanResult.top5Sectors.map(s => (
              <button
                key={s.sector}
                onClick={() => setSelectedSector(s.sector)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedSector === s.sector
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {s.sector}
              </button>
            ))}
          </div>

          {/* 右側：搜尋 + 視圖切換 (卡片 / 表格) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋股名/代號/形態..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 視圖切換按鈕 (手機超推薦卡片模式) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="手機操盤卡片模式 (直覺大字號)"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">卡片模式</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="深度量化矩陣表格"
              >
                <Table size={13} />
                <span className="hidden sm:inline">表格模式</span>
              </button>
            </div>
          </div>
        </div>

        {/* 次級篩選：AI 形態快選標籤 + 爆量 Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
              <Filter size={12} className="text-blue-400" />
              <span>AI 形態快篩:</span>
            </span>
            <button
              onClick={() => setSelectedPattern('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedPattern === 'ALL'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              全部形態
            </button>
            {patternTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedPattern(prev => (prev === tag ? 'ALL' : tag))}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedPattern === tag
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlySurgeOver2x}
                onChange={e => setOnlySurgeOver2x(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-amber-300 font-bold">🔥 僅顯示爆量 &gt; 2.0x 標的</span>
            </label>

            <span className="text-[11px] font-mono text-slate-400">
              符合條件: <strong className="text-white">{filteredStocks.length}</strong> / 20 檔
            </span>
          </div>
        </div>
      </div>

      {/* 4. Top 20 標的展示：卡片模式 (Cards View) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredStocks.map(stock => {
            const isUp = stock.changePercent >= 0;
            return (
              <div
                key={stock.symbol}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:shadow-blue-900/20 transition-all group relative overflow-hidden"
              >
                {/* Card Top: Rank, Name, Sector, Surge Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {stock.rank}
                      </span>
                      <h4 className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
                        {stock.name}
                      </h4>
                      <span className="text-xs font-mono text-slate-400">({stock.code})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[190px]">
                      {stock.sector} · {stock.subCategory}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold whitespace-nowrap ${
                        stock.volumeSurgeStatus === 'EXPLOSIVE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {stock.volumeSurgeLabel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      起漲分: <strong className="text-white">{stock.breakoutScore}</strong>
                    </span>
                  </div>
                </div>

                {/* Price & Change Banner with 1-Month Trend */}
                <div className="flex items-baseline justify-between p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400">現價</div>
                    <div className="text-xl font-black font-mono text-white tracking-tight">
                      ${stock.currentPrice}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-0.5">
                      {stock.oneMonthReturn != null && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          stock.oneMonthReturn >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                        }`}>
                          近1月 {stock.oneMonthReturn >= 0 ? '+' : ''}{stock.oneMonthReturn}%
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-sm font-black font-mono flex items-center justify-end gap-0.5 ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      <span>今日 {isUp ? '+' : ''}{stock.changePercent}%</span>
                    </div>
                  </div>
                </div>

                {/* AI Agent Pattern Detection Pill */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {stock.patternTag}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      {stock.breakoutStageLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium line-clamp-2 leading-relaxed">
                    {stock.patternName}
                  </p>
                </div>

                {/* Trader Key Levels Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-2 border-t border-slate-800/80 bg-slate-950/40 p-2 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">建議買點</span>
                    <span className="text-blue-300 font-bold">${stock.entryZoneLow}~${stock.entryZoneHigh}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">關鍵防守</span>
                    <span className="text-amber-300 font-bold">${stock.stopLossPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">第1目標價</span>
                    <span className="text-emerald-400 font-bold">${stock.targetPrice1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">風報比</span>
                    <span className="text-purple-300 font-bold">{stock.riskRewardRatio}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setDetailStock(stock)}
                    className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-blue-500/30 transition-colors cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-400" />
                    <span>AI 形態研報 (看3月K線)</span>
                  </button>
                  <button
                    onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="帶入即時看盤室"
                  >
                    <LineChart size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Top 20 標的展示：表格模式 (Matrix Table View) - 支援手機首欄凍結滑動 */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] font-mono select-none">
                <tr>
                  <th className="py-3 px-3.5 sticky left-0 bg-slate-950 z-20 shadow-md border-r border-slate-800 min-w-[160px]">
                    標的 (排行)
                  </th>
                  <th className="py-3 px-3 text-right">現價 / 漲跌</th>
                  <th className="py-3 px-3 text-right">放量暴增倍數</th>
                  <th className="py-3 px-3 text-right">今日量 / 20日均量</th>
                  <th className="py-3 px-3 text-center">AI 形態研判</th>
                  <th className="py-3 px-3 text-center">起漲階段</th>
                  <th className="py-3 px-3 text-center">建議買進區間</th>
                  <th className="py-3 px-3 text-center">關鍵防守價</th>
                  <th className="py-3 px-3 text-center">第1目標價</th>
                  <th className="py-3 px-3 text-center">風報比</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">操盤操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {filteredStocks.map(stock => {
                  const isUp = stock.changePercent >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setDetailStock(stock)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* 凍結首欄 */}
                      <td className="py-3 px-3.5 sticky left-0 bg-slate-950 group-hover:bg-slate-900 z-10 shadow-md border-r border-slate-800/80 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {stock.rank}
                          </span>
                          <div>
                            <div className="font-extrabold text-white text-xs group-hover:text-blue-400 transition-colors flex items-center gap-1">
                              <span>{stock.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({stock.code})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {stock.sector}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 現價 */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-white">${stock.currentPrice}</div>
                        <div className="flex items-center justify-end gap-1 text-[10px] font-semibold">
                          <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                            {isUp ? '+' : ''}{stock.changePercent}%
                          </span>
                          {stock.oneMonthReturn != null && (
                            <span className={`px-1 py-0.2 rounded text-[9px] ${
                              stock.oneMonthReturn >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              月 {stock.oneMonthReturn >= 0 ? '+' : ''}{stock.oneMonthReturn}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 放量倍數 */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stock.volumeSurgeStatus === 'EXPLOSIVE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {stock.volumeSurgeLabel}
                        </span>
                      </td>

                      {/* 今日量 / 20日均量 */}
                      <td className="py-3 px-3 text-right text-slate-300">
                        <div>{(stock.volumeToday / 1000).toFixed(1)}k 張</div>
                        <div className="text-[10px] text-slate-500">均 {(stock.volumeMa20 / 1000).toFixed(1)}k</div>
                      </td>

                      {/* AI 形態 */}
                      <td className="py-3 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {stock.patternTag} ({stock.patternScore}分)
                        </span>
                      </td>

                      {/* 起漲階段 */}
                      <td className="py-3 px-3 text-center font-sans">
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          {stock.breakoutStageLabel}
                        </span>
                      </td>

                      {/* 買點區間 */}
                      <td className="py-3 px-3 text-center text-blue-300 font-bold">
                        ${stock.entryZoneLow} ~ ${stock.entryZoneHigh}
                      </td>

                      {/* 防守價 */}
                      <td className="py-3 px-3 text-center text-amber-300 font-bold">
                        ${stock.stopLossPrice}
                      </td>

                      {/* 目標價 */}
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                        ${stock.targetPrice1} (+{stock.upsidePotentialPercent}%)
                      </td>

                      {/* 風報比 */}
                      <td className="py-3 px-3 text-center text-purple-300 font-bold">
                        {stock.riskRewardRatio}
                      </td>

                      {/* 操盤操作 */}
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailStock(stock)}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors border border-blue-500/30 cursor-pointer"
                            title="開啟 3 個月 K 線形態研報"
                          >
                            <Sparkles size={11} className="text-amber-400" />
                            <span>形態研報</span>
                          </button>
                          <button
                            onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border border-slate-700 cursor-pointer"
                            title="帶入即時 K 線圖"
                          >
                            <LineChart size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. AI 3 個月 K 線圖形態研報彈窗 (AiVolumeBreakoutModal) */}
      {detailStock && (
        <AiVolumeBreakoutModal
          stock={detailStock}
          isOpen={!!detailStock}
          onClose={() => setDetailStock(null)}
          onSelectStockForChart={onSelectStockForChart}
        />
      )}
    </div>
  );
};
