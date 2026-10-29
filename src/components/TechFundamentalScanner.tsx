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
  LayoutGrid,
  Table as TableIcon,
  Award,
  ArrowUpRight,
  Sliders,
  Check,
  Info,
} from 'lucide-react';
import {
  TopSectorVolumeInfo,
  VolumeBreakoutScanResult,
  IndustrySectorInfo,
  StrategyFilteredStock,
  CorporateLifeCyclePhase,
} from '../types/volumeBreakout.ts';
import { CandleData, StrategyConfig } from '../types/stock.ts';
import { runVolumeBreakoutScan } from '../utils/aiVolumeBreakoutEngine.ts';
import { filterTop5SectorStocksByStrategy, isSectorMatch } from '../utils/corporateLifecycleEngine.ts';
import { DEFAULT_STRATEGY, DEFAULT_ENTRY_CONDITIONS, DEFAULT_EXIT_CONDITIONS } from '../utils/backtestEngine.ts';
import { loadStrategyFromCookie } from '../utils/cookieStorage.ts';
import { StrategyStockDetailModal } from './StrategyStockDetailModal.tsx';
import { IndustryHeatmap } from './IndustryHeatmap.tsx';
import { TopSectorStocksKLineViewer } from './TopSectorStocksKLineViewer.tsx';
import { fetchVolumeBreakoutScan } from '../services/api.ts';

interface TechFundamentalScannerProps {
  onSelectStockForChart: (symbol: string, name: string) => void;
  userStrategy?: StrategyConfig;
}

export const TechFundamentalScanner: React.FC<TechFundamentalScannerProps> = ({
  onSelectStockForChart,
  userStrategy,
}) => {
  // 核心量價掃描數據 (最近 5 筆量價矩陣與前 5 大熱門產業)
  const [scanResult, setScanResult] = useState<VolumeBreakoutScanResult>(() => runVolumeBreakoutScan());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 主頁面導航分頁 (1: 🔥 五大動能產業 · 自訂策略選股 & 近3個月K線圖, 2: 🗺️ 35大產業全市場熱力圖)
  const [activeMainTab, setActiveMainTab] = useState<'strategyScreen' | 'heatmap'>('strategyScreen');

  // 使用者自訂回測策略 (優先使用 prop，否則讀取 cookie 或預設)
  const currentStrategy = useMemo<StrategyConfig>(() => {
    return userStrategy || loadStrategyFromCookie(DEFAULT_ENTRY_CONDITIONS, DEFAULT_EXIT_CONDITIONS) || DEFAULT_STRATEGY;
  }, [userStrategy]);

  // 動態掃描進度動畫狀態
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStep, setScanStep] = useState<number>(1);

  // 篩選狀態
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<'ALL' | 'BUY' | 'HOLD'>('ALL');
  const [selectedLifecycle, setSelectedLifecycle] = useState<'ALL' | CorporateLifeCyclePhase>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // 彈窗
  const [detailStock, setDetailStock] = useState<StrategyFilteredStock | null>(null);

  // 真實日 K 線字典快取 (由後端 Yahoo Finance 抓取提供)
  const [candlesMapState, setCandlesMapState] = useState<Map<string, CandleData[]>>(() => new Map());

  // 執行自訂策略篩選前 5 大產業股票
  const [strategyStocks, setStrategyStocks] = useState<StrategyFilteredStock[]>(() => {
    return filterTop5SectorStocksByStrategy(scanResult.top5Sectors, currentStrategy);
  });

  // 初次載入：即刻向後台 Yahoo Finance / 交易所 OpenAPI 撈取最新真實數據
  useEffect(() => {
    let isCancelled = false;
    async function initRealData() {
      setIsScanning(true);
      setScanProgress(20);
      setScanStep(1);
      try {
        setScanProgress(45);
        setScanStep(2);
        const realData = await fetchVolumeBreakoutScan('momentum');
        if (!isCancelled && realData) {
          setScanProgress(75);
          setScanStep(3);
          setScanResult(realData);
          const realMap = new Map<string, CandleData[]>();
          if (realData.candlesMap) {
            Object.entries(realData.candlesMap).forEach(([sym, cList]) => {
              realMap.set(sym, cList);
            });
            setCandlesMapState(realMap);
          }
          setScanProgress(90);
          setScanStep(4);
          const matched = filterTop5SectorStocksByStrategy(realData.top5Sectors, currentStrategy, realMap);
          setStrategyStocks(matched);
          setLastUpdated(new Date(realData.scanTimestamp || Date.now()));
        }
      } catch (err) {
        console.warn('Real data scan error:', err);
      } finally {
        if (!isCancelled) {
          setScanProgress(100);
          setIsScanning(false);
        }
      }
    }
    initRealData();
    return () => { isCancelled = true; };
  }, [currentStrategy]);

  // 重新觸發掃描 (強制向 Yahoo Finance 與交易所抓取最新即時資料)
  const handleTriggerStrategyScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(10);
    setScanStep(1);

    try {
      setScanProgress(40);
      setScanStep(2);
      const freshScan = await fetchVolumeBreakoutScan('momentum', true);
      setScanProgress(70);
      setScanStep(3);
      setScanResult(freshScan);

      const realMap = new Map<string, CandleData[]>();
      if (freshScan.candlesMap) {
        Object.entries(freshScan.candlesMap).forEach(([sym, cList]) => {
          realMap.set(sym, cList);
        });
        setCandlesMapState(realMap);
      }

      setScanProgress(90);
      setScanStep(4);
      const matched = filterTop5SectorStocksByStrategy(freshScan.top5Sectors, currentStrategy, realMap);
      setStrategyStocks(matched);
      setLastUpdated(new Date(freshScan.scanTimestamp || Date.now()));
    } catch (err) {
      console.error('Trigger real scan error:', err);
    } finally {
      setScanProgress(100);
      setIsScanning(false);
    }
  };

  // 篩選後的標的清單
  const filteredStocks = useMemo(() => {
    let list = strategyStocks;

    // 板塊過濾
    if (selectedSector !== 'ALL') {
      list = list.filter(s => isSectorMatch(s.sector, selectedSector));
    }

    // 策略訊號過濾 (全部 / 買進 / 續抱)
    if (selectedSignal !== 'ALL') {
      list = list.filter(s => s.signalStatus === selectedSignal);
    }

    // 企業生命週期過濾 (成長期 / 成熟期 / 擴張初期 / 轉型期 / 衰退期)
    if (selectedLifecycle !== 'ALL') {
      list = list.filter(s => s.lifeCycle === selectedLifecycle);
    }

    // 關鍵字搜尋
    const cleanKw = searchKeyword.trim().toLowerCase();
    if (cleanKw) {
      list = list.filter(
        s =>
          s.name.toLowerCase().includes(cleanKw) ||
          s.code.includes(cleanKw) ||
          s.symbol.toLowerCase().includes(cleanKw) ||
          s.subCategory.toLowerCase().includes(cleanKw) ||
          s.lifeCycleLabel.toLowerCase().includes(cleanKw)
      );
    }

    return list;
  }, [strategyStocks, selectedSector, selectedSignal, selectedLifecycle, searchKeyword]);

  // 生命週期統計計數
  const lifecycleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      GROWTH: 0,
      MATURE: 0,
      STARTUP: 0,
      TRANSITION: 0,
      DECLINE: 0,
    };
    strategyStocks.forEach(s => {
      counts[s.lifeCycle] = (counts[s.lifeCycle] || 0) + 1;
    });
    return counts;
  }, [strategyStocks]);

  // 訊號統計計數
  const signalCounts = useMemo(() => {
    let buy = 0;
    let hold = 0;
    strategyStocks.forEach(s => {
      if (s.signalStatus === 'BUY') buy++;
      else if (s.signalStatus === 'HOLD') hold++;
    });
    return { buy, hold, total: strategyStocks.length };
  }, [strategyStocks]);

  // 使用者自訂策略中啟用的進出場條件簡述
  const activeStrategySummary = useMemo(() => {
    const enabledEntries = (currentStrategy.entryConditions || [])
      .filter(c => c.enabled)
      .map(c => c.name);
    const enabledExits = (currentStrategy.exitConditions || [])
      .filter(c => c.enabled)
      .map(c => c.name);
    return {
      name: currentStrategy.name || '自訂量化回測策略',
      entries: enabledEntries.length > 0 ? enabledEntries : ['周月金叉 (MA5>MA20)', '突破過去30日最高價', '股價站上MA20'],
      exits: enabledExits.length > 0 ? enabledExits : ['周月死叉 (MA5<MA20)'],
      atrInitialStop: currentStrategy.atrInitialStopMultiplier,
      atrTrailingStop: currentStrategy.atrTrailingStopMultiplier,
    };
  }, [currentStrategy]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Hero 頂部核心控制橫幅 */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={11} className="text-rose-400" />
                熱力圖一周加權漲跌 TOP 5 · 自訂策略選股 & 企業生命週期分析
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 font-semibold font-mono">
                  {scanResult.isRealData ? '🟢 TWSE/TPEx 全市場熱力圖真實數據源' : '🟢 盤面連線中'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono">
                  {scanResult.dataSource || '臺灣證券交易所 (TWSE) & 證券櫃檯買賣中心 (TPEx) 一周交易熱力圖'}
                </span>
                <span className="text-slate-400 text-[10px]">
                  · 更新時間 {lastUpdated.toLocaleTimeString('zh-TW', { hour12: false })}
                </span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>熱力圖一周加權漲跌前五大產業 · 使用者自訂策略選股</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              單看 35 大產業熱力圖中「一周加權漲跌幅 (Weekly Change %)」由強至弱挑選前 5 大熱門產業板塊 → 撈取全成分股真實 K 線 → 依照使用者自訂回測策略找到標示買進或持有的股票 → 查找 ROE、ROA、毛利率並判定企業生命週期！
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleTriggerStrategyScan}
              disabled={isScanning}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-linear-to-r from-rose-600 via-amber-600 to-purple-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-95"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>正在以自訂策略篩選一周漲幅前五大產業股票...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white" />
                  <span>🚀 重新依一周加權漲跌篩選前五大產業</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5 步驟篩選實時進度條 */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1.5">
              <span>
                {scanStep === 1 && '步驟 1/4: 單看熱力圖中一周加權漲跌挑選出前 5 大強勢產業板塊...'}
                {scanStep === 2 && '步驟 2/4: 撈取前 5 大產業中所有成分股票的真實 K 線並計算完整技術指標...'}
                {scanStep === 3 && '步驟 3/4: 依照使用者自訂策略條件執行回測，篩選出標示買進 (BUY) 或持有 (HOLD) 的股票...'}
                {scanStep === 4 && '步驟 4/4: 查找標示買進/持有標的之 ROE、ROA、毛利率，並判斷企業所處生命週期階段！'}
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

        {/* 2 大主功能分頁切換列 */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveMainTab('strategyScreen')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainTab === 'strategyScreen'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Flame size={14} className={activeMainTab === 'strategyScreen' ? 'text-amber-300' : 'text-amber-400'} />
            <span>🔥 五大動能產業 · 自訂策略選股 & 近3個月K線圖</span>
          </button>
          <button
            onClick={() => setActiveMainTab('heatmap')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainTab === 'heatmap'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400'
                : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers size={14} className={activeMainTab === 'heatmap' ? 'text-rose-400' : 'text-rose-400'} />
            <span>🗺️ 35大產業全市場熱力圖 (1954檔 · 1週交易)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 分頁 1: 🔥 五大熱門產業 · 自訂策略選股 & 企業生命週期分析                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'strategyScreen' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Top 5 近期熱門產業看板 (單純看熱力圖中一周加權漲跌挑選) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <TrendingUp size={15} />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 flex-wrap">
                    <span>🏆 依熱力圖「一周加權漲跌」前 5 大產業板塊</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-950 text-rose-300 font-mono border border-rose-800/60 font-bold">
                      一周漲幅領先榜
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    直接依一周加權漲跌挑選前五大強勢產業（{scanResult.top5Sectors.map(s => `${s.sector} ${s.fiveDayCumulativeChange >= 0 ? '+' : ''}${s.fiveDayCumulativeChange}%`).join('、')}），並套用自訂策略判定「買進」或「持倉續抱」標的：
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                前五大產業1週總成交: <strong className="text-slate-200">{scanResult.top5Sectors.reduce((sum, s) => sum + s.fiveDayTotalTurnover, 0).toLocaleString()} 億元</strong>
              </div>
            </div>

            {/* 5 大板塊卡片橫向列 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {scanResult.top5Sectors.map(sec => {
                const isSelected = selectedSector === sec.sector;
                const isCumulativeUp = sec.fiveDayCumulativeChange >= 0;
                const startDate = sec.recent5Sessions?.[0]?.date || 'T-4';
                const endDate = sec.recent5Sessions?.[sec.recent5Sessions.length - 1]?.date || '今日';

                return (
                  <div
                    key={sec.sector}
                    onClick={() => setSelectedSector(prev => (prev === sec.sector ? 'ALL' : sec.sector))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group select-none ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-900/30 ring-1 ring-blue-500'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-800 text-rose-400 border border-slate-700">
                        🏆 漲幅 No.{sec.rank}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {sec.volumeSharePercent}% 佔比
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs sm:text-sm font-black text-white group-hover:text-blue-300 transition-colors">
                          {sec.sector}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-mono">
                          {sec.stocksCount} 檔成分股
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono mt-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-slate-400">一周加權漲跌</span>
                        <span className={`font-black text-sm ${isCumulativeUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isCumulativeUp ? '+' : ''}{sec.fiveDayCumulativeChange}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-400">
                        <span>近5筆總成交</span>
                        <span className="text-amber-300 font-bold">{sec.fiveDayTotalTurnover.toLocaleString()} 億</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                        <span>日成交額</span>
                        <span className="text-slate-200">
                          {sec.dailyTurnoverAmount.toLocaleString()} 億 ({sec.sectorChangePercent >= 0 ? '+' : ''}{sec.sectorChangePercent}%)
                        </span>
                      </div>
                    </div>

                    {/* 5 筆量能走勢圖 */}
                    {sec.recent5Sessions && sec.recent5Sessions.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1 font-mono">
                          <span>最近5筆實質量能:</span>
                          <span className="text-slate-400">{startDate} → {endDate}</span>
                        </div>
                        <div className="flex items-end gap-1 h-7 w-full bg-slate-900/80 p-1 rounded border border-slate-800/80">
                          {sec.recent5Sessions.map((s, sIdx) => {
                            const maxVol = Math.max(...sec.recent5Sessions.map(x => x.turnoverAmount)) || 1;
                            const heightPct = Math.max(22, Math.round((s.turnoverAmount / maxVol) * 100));
                            const isUpDay = s.changePercent >= 0;
                            return (
                              <div
                                key={sIdx}
                                className="flex-1 flex flex-col items-center h-full justify-end group/bar relative"
                                title={`${s.date} (${s.sessionLabel}): ${s.turnoverAmount}億元, ${isUpDay ? '+' : ''}${s.changePercent}%`}
                              >
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full rounded-xs transition-all ${
                                    isUpDay ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono mt-1 px-0.5">
                          {sec.recent5Sessions.map((s, sIdx) => (
                            <span key={sIdx} className="truncate">{s.date}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40 font-mono">
                      <span>指標股:</span>
                      <span className="text-slate-300 truncate max-w-[130px]">
                        {sec.representativeStocks.slice(0, 2).join('、')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 查找五大動能產業中所有的股票代號與K線圖 */}
          <TopSectorStocksKLineViewer
            top5Sectors={scanResult.top5Sectors}
            allSectors={scanResult.allIndustrySectors}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            onSelectStockForChart={onSelectStockForChart}
            userStrategy={currentStrategy}
            candlesMap={candlesMapState}
            onOpenStockDetail={(stk) => setDetailStock(stk)}
          />

          {/* CSS selector 3: 自訂策略篩選前五大產業股票清單 & 企業生命週期研判 */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 flex flex-col gap-3.5 shadow-xl">
            {/* 1. 當前套用之使用者自訂策略條件摘要橫幅 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Sliders size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      當前套用回測策略：<strong className="text-blue-400">{activeStrategySummary.name}</strong>
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      僅篩選標示「買進」或「持倉續抱」標的
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>
                      <strong className="text-slate-300">進場條件:</strong> {activeStrategySummary.entries.join(' + ')}
                    </span>
                    <span>
                      <strong className="text-slate-300">出場條件:</strong> {activeStrategySummary.exits.join(' / ')}
                      {activeStrategySummary.atrInitialStop > 0 && ` (停損 ${activeStrategySummary.atrInitialStop}x ATR)`}
                      {activeStrategySummary.atrTrailingStop > 0 && ` (移動停利 ${activeStrategySummary.atrTrailingStop}x ATR)`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono self-end sm:self-auto shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  符合策略買進/持有: <strong className="text-emerald-400">{strategyStocks.length}</strong> 檔
                </span>
              </div>
            </div>

            {/* 2. 操盤手篩選控制列 (產業切換、買進/續抱切換、生命週期切換、搜尋與視圖切換) */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Row 1: 產業與搜尋 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* 產業 Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setSelectedSector('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedSector === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    🌟 全部 5 大熱門產業 ({strategyStocks.length}檔)
                  </button>
                  {scanResult.top5Sectors.map(s => {
                    const count = strategyStocks.filter(x => isSectorMatch(x.sector, s.sector)).length;
                    const isSelected = selectedSector === s.sector || (selectedSector !== 'ALL' && isSectorMatch(selectedSector, s.sector));
                    return (
                      <button
                        key={s.sector}
                        onClick={() => setSelectedSector(isSelected ? 'ALL' : s.sector)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{s.sector}</span>
                        <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-900/80 text-slate-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 搜尋與視圖模式 */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-52">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜尋股名/代號/生命週期..."
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        viewMode === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid size={13} />
                      <span className="hidden sm:inline">卡片</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <TableIcon size={13} />
                      <span className="hidden sm:inline">表格</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: 策略訊號切換 (買進 / 持倉) + 企業生命週期切換 (成長期 / 成熟期 / 擴張期 / 轉型期) */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
                {/* 策略訊號篩選 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                    <Activity size={12} className="text-blue-400" />
                    <span>策略訊號:</span>
                  </span>
                  <button
                    onClick={() => setSelectedSignal('ALL')}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedSignal === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
                    }`}
                  >
                    全部買進/續抱 ({signalCounts.total})
                  </button>
                  <button
                    onClick={() => setSelectedSignal(prev => (prev === 'BUY' ? 'ALL' : 'BUY'))}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedSignal === 'BUY'
                        ? 'bg-rose-500 text-white font-bold shadow-xs'
                        : 'text-rose-400 hover:text-white bg-slate-950 border border-rose-500/30'
                    }`}
                  >
                    <span>🔥 買進訊號 (BUY)</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-rose-300">
                      {signalCounts.buy}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedSignal(prev => (prev === 'HOLD' ? 'ALL' : 'HOLD'))}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedSignal === 'HOLD'
                        ? 'bg-emerald-500 text-white font-bold shadow-xs'
                        : 'text-emerald-400 hover:text-white bg-slate-950 border border-emerald-500/30'
                    }`}
                  >
                    <span>💎 持倉續抱 (HOLD)</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-emerald-300">
                      {signalCounts.hold}
                    </span>
                  </button>
                </div>

                {/* 企業生命週期快選 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                    <Sparkles size={12} className="text-purple-400" />
                    <span>企業生命週期:</span>
                  </span>
                  <button
                    onClick={() => setSelectedLifecycle('ALL')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedLifecycle === 'ALL'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800'
                    }`}
                  >
                    全部階段
                  </button>
                  <button
                    onClick={() => setSelectedLifecycle(prev => (prev === 'GROWTH' ? 'ALL' : 'GROWTH'))}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedLifecycle === 'GROWTH'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-emerald-400 hover:text-white bg-slate-950 border border-emerald-500/30'
                    }`}
                  >
                    <span>🚀 成長期</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-emerald-300">
                      {lifecycleCounts.GROWTH}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedLifecycle(prev => (prev === 'MATURE' ? 'ALL' : 'MATURE'))}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedLifecycle === 'MATURE'
                        ? 'bg-blue-500 text-white font-bold shadow-xs'
                        : 'text-blue-400 hover:text-white bg-slate-950 border border-blue-500/30'
                    }`}
                  >
                    <span>💎 成熟期</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-blue-300">
                      {lifecycleCounts.MATURE}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedLifecycle(prev => (prev === 'STARTUP' ? 'ALL' : 'STARTUP'))}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedLifecycle === 'STARTUP'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-amber-400 hover:text-white bg-slate-950 border border-amber-500/30'
                    }`}
                  >
                    <span>🌱 擴張初期</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-amber-300">
                      {lifecycleCounts.STARTUP}
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedLifecycle(prev => (prev === 'TRANSITION' ? 'ALL' : 'TRANSITION'))}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedLifecycle === 'TRANSITION'
                        ? 'bg-purple-500 text-white font-bold shadow-xs'
                        : 'text-purple-400 hover:text-white bg-slate-950 border border-purple-500/30'
                    }`}
                  >
                    <span>🔄 轉型期</span>
                    <span className="text-[9px] px-1 py-0.1 rounded-full bg-slate-900 text-purple-300">
                      {lifecycleCounts.TRANSITION}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. 股票標的展示：卡片模式 (Cards View) */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
                {filteredStocks.map(stock => {
                  const isUp = stock.change >= 0;

                  return (
                    <div
                      key={stock.symbol}
                      className="bg-slate-950/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:shadow-blue-900/20 transition-all group relative overflow-hidden"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {stock.sector}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${stock.signalBadgeClass}`}>
                            {stock.signalLabel}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2 mt-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-base sm:text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                                {stock.name}
                              </h4>
                              <span className="text-xs font-mono text-slate-400">({stock.code})</span>
                            </div>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {stock.subCategory}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black font-mono text-white">
                              ${stock.currentPrice}
                            </div>
                            <div className={`text-xs font-bold font-mono flex items-center justify-end gap-0.5 ${
                              isUp ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {isUp ? '+' : ''}{stock.change} ({isUp ? '+' : ''}{stock.changePercent}%)
                            </div>
                          </div>
                        </div>

                        {/* 策略持股狀態 */}
                        <div className="mt-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] leading-snug">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">
                              {stock.signalStatus === 'BUY' ? '觸發買進' : `已持股 ${stock.holdingDays || 0} 天`}
                            </span>
                            <span className={`font-bold ${
                              (stock.unrealizedReturnPct || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              未實現 {(stock.unrealizedReturnPct || 0) >= 0 ? '+' : ''}{stock.unrealizedReturnPct || 0}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 mt-1 border-t border-slate-800/80 font-mono">
                            <span>勝率: <strong className="text-amber-300">{stock.winRate}%</strong></span>
                            <span>期望值: <strong className="text-emerald-400">+{stock.expectancyPct}%</strong></span>
                            <span>最大回撤: <strong className="text-rose-400">-{stock.maxDrawdownPct}%</strong></span>
                          </div>
                        </div>

                        {/* 三大關鍵財務指標 (ROE · ROA · 毛利率) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-bold">
                            <span>關鍵財務指標 (三大核心)</span>
                            <span className="text-slate-500 font-mono">營收YoY: {stock.revenueYoY >= 0 ? '+' : ''}{stock.revenueYoY}%</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-amber-500/20">
                              <span className="text-[9px] text-amber-400 block font-semibold">ROE</span>
                              <span className="text-xs font-black text-white">{stock.roe}%</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-blue-500/20">
                              <span className="text-[9px] text-blue-400 block font-semibold">ROA</span>
                              <span className="text-xs font-black text-white">{stock.roa}%</span>
                            </div>
                            <div className="bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                              <span className="text-[9px] text-emerald-400 block font-semibold">毛利率</span>
                              <span className="text-xs font-black text-white">{stock.grossMargin}%</span>
                            </div>
                          </div>
                        </div>

                        {/* 企業生命週期研判標籤 */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] text-slate-400">企業生命週期：</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${stock.lifeCycleBadgeClass}`}>
                              {stock.lifeCycleLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {stock.lifeCycleReason}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setDetailStock(stock)}
                          className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Info size={12} />
                          <span>詳細診斷</span>
                        </button>

                        <button
                          onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                          className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        >
                          <LineChart size={12} />
                          <span>K線看盤</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 表格模式 (Table View) */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 mt-2">
                <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
                  <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 font-mono">
                    <tr>
                      <th className="py-2.5 px-3">股票代號/名稱</th>
                      <th className="py-2.5 px-3">所屬熱門板塊</th>
                      <th className="py-2.5 px-3 text-right">現價 / 漲跌</th>
                      <th className="py-2.5 px-3 text-center">自訂策略信號</th>
                      <th className="py-2.5 px-3 text-right">策略勝率 / 損益</th>
                      <th className="py-2.5 px-3 text-right">ROE</th>
                      <th className="py-2.5 px-3 text-right">ROA</th>
                      <th className="py-2.5 px-3 text-right">毛利率</th>
                      <th className="py-2.5 px-3 text-center">企業生命週期</th>
                      <th className="py-2.5 px-3 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono bg-slate-900/40">
                    {filteredStocks.map(stock => {
                      const isUp = stock.change >= 0;
                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{stock.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({stock.code})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{stock.subCategory}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
                              {stock.sector}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            <div className="text-white">${stock.currentPrice}</div>
                            <div className={`text-[10px] ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isUp ? '+' : ''}{stock.changePercent}%
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stock.signalBadgeClass}`}>
                              {stock.signalLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="text-amber-300 font-bold">{stock.winRate}%</div>
                            <div className={`text-[10px] ${(stock.unrealizedReturnPct || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              未實現 {(stock.unrealizedReturnPct || 0) >= 0 ? '+' : ''}{stock.unrealizedReturnPct || 0}%
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                            {stock.roe}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-400">
                            {stock.roa}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                            {stock.grossMargin}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stock.lifeCycleBadgeClass}`}>
                              {stock.lifeCycleLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setDetailStock(stock)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                              >
                                診斷
                              </button>
                              <button
                                onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded cursor-pointer shadow-xs"
                              >
                                看盤
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 分頁 2: 🗺️ 40 大產業實際熱力圖 (Heatmap)                                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'heatmap' && (
        <IndustryHeatmap
          sectors={scanResult.allIndustrySectors}
          selectedSector={selectedSector}
          onSelectSector={(secName) => {
            setSelectedSector(secName);
            setActiveMainTab('strategyScreen');
          }}
          onViewStockKLine={onSelectStockForChart}
        />
      )}

      {/* 詳細診斷彈窗 */}
      <StrategyStockDetailModal
        stock={detailStock}
        isOpen={!!detailStock}
        onClose={() => setDetailStock(null)}
        onSelectStockForChart={onSelectStockForChart}
      />
    </div>
  );
};
