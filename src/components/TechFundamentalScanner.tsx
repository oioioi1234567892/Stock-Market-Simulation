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

  // 篩選狀態 (所選產業板塊)
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

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
