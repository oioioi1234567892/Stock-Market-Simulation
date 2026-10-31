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
      {/* 1. 頂部簡約控制列 */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-black text-slate-100 font-mono tracking-tight">
            熱力圖 TOP 5 產業 · 策略選股
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            更新時間 {lastUpdated.toLocaleTimeString('zh-TW', { hour12: false })}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* 2 大主功能分頁切換列 */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMainTab('strategyScreen')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeMainTab === 'strategyScreen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={12} className={activeMainTab === 'strategyScreen' ? 'text-amber-300' : 'text-amber-400'} />
              <span>五大動能產業</span>
            </button>
            <button
              onClick={() => setActiveMainTab('heatmap')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeMainTab === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={12} className="text-rose-400" />
              <span>35大產業熱力圖</span>
            </button>
          </div>

          <button
            onClick={handleTriggerStrategyScan}
            disabled={isScanning}
            className="px-3 py-1 bg-linear-to-r from-rose-600 via-amber-600 to-purple-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            {isScanning ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>篩選中...</span>
              </>
            ) : (
              <>
                <Play size={11} className="fill-white" />
                <span>重新篩選</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 篩選實時進度條 */}
      {isScanning && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono mb-1">
            <span>
              {scanStep === 1 && '依熱力圖一周加權漲跌篩選前 5 大產業...'}
              {scanStep === 2 && '撈取前 5 大產業全成分股日K與技術指標...'}
              {scanStep === 3 && '依自訂策略執行回測篩選...'}
              {scanStep === 4 && '計算關鍵財務指標...'}
            </span>
            <span className="font-bold text-blue-400">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div
              className="bg-linear-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 分頁 1: 🔥 五大熱門產業 · 自訂策略選股 & 企業生命週期分析                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'strategyScreen' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Top 5 近期熱門產業看板 (量化表格呈現) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-800/70">
              <div className="flex items-center gap-1.5">
                <TableIcon size={14} className="text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black text-slate-100 tracking-tight font-mono">
                  熱力圖 TOP 5 動能產業排行表
                </h3>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  (點選列可聯動篩選下方成分股日K)
                </span>
              </div>
              {selectedSector !== 'ALL' && (
                <button
                  onClick={() => setSelectedSector('ALL')}
                  className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 font-semibold cursor-pointer transition-all"
                >
                  重設全部產業
                </button>
              )}
            </div>

            {/* 產業排行榜表格 (無須橫向卷軸，全寬高密度響應式) */}
            <div className="w-full overflow-hidden rounded-lg border border-slate-800/90 bg-slate-950/70">
              <table className="w-full text-left text-xs font-mono table-fixed sm:table-auto">
                <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2 sm:px-3 w-[44%] sm:w-auto">產業名稱</th>
                    <th className="py-2 px-1 text-center hidden sm:table-cell sm:w-16">檔數</th>
                    <th className="py-2 px-1 sm:px-2 text-right w-[18%] sm:w-20">佔比</th>
                    <th className="py-2 px-1.5 sm:px-2 text-right w-[20%] sm:w-24">1周漲跌</th>
                    <th className="py-2 px-2 text-right hidden md:table-cell sm:w-24">5日成交額</th>
                    <th className="py-2 px-1 sm:px-2 text-center w-[18%] sm:w-28">5日量能</th>
                    <th className="py-2 px-2 text-center hidden sm:table-cell sm:w-16">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scanResult.top5Sectors.map(sec => {
                    const isSelected = selectedSector === sec.sector;
                    const isCumulativeUp = sec.fiveDayCumulativeChange >= 0;
                    const startDate = sec.recent5Sessions?.[0]?.date || 'T-4';
                    const endDate = sec.recent5Sessions?.[sec.recent5Sessions.length - 1]?.date || '今日';

                    return (
                      <tr
                        key={sec.sector}
                        onClick={() => setSelectedSector(prev => (prev === sec.sector ? 'ALL' : sec.sector))}
                        className={`transition-colors cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-blue-950/75 border-l-3 border-blue-500 hover:bg-blue-950/90'
                            : 'hover:bg-slate-800/40 bg-slate-950/40'
                        }`}
                      >
                        {/* 排名 + 產業名稱 + 行動端檔數 */}
                        <td className="py-2 px-2 sm:px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`inline-flex items-center justify-center shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded text-[9px] sm:text-[10px] font-bold ${
                              sec.rank === 1
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                : sec.rank === 2
                                ? 'bg-slate-700/50 text-slate-200 border border-slate-600/40'
                                : sec.rank === 3
                                ? 'bg-amber-700/25 text-amber-400 border border-amber-700/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sec.rank}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className={`font-black text-xs sm:text-sm truncate ${
                                isSelected ? 'text-blue-300' : 'text-slate-100 group-hover:text-blue-300'
                              }`}>
                                {sec.sector}
                              </span>
                              <span className="text-[9px] text-slate-500 sm:hidden">
                                {sec.stocksCount}檔
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 成分股檔數 (桌機專屬欄) */}
                        <td className="py-2 px-1 text-center hidden sm:table-cell">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {sec.stocksCount} 檔
                          </span>
                        </td>

                        {/* 成交量佔比 */}
                        <td className="py-2 px-1 sm:px-2 text-right">
                          <span className="font-bold text-xs text-blue-400">
                            {sec.volumeSharePercent}%
                          </span>
                        </td>

                        {/* 1周加權漲跌 */}
                        <td className="py-2 px-1.5 sm:px-2 text-right">
                          <span className={`font-black text-xs sm:text-sm ${
                            isCumulativeUp ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isCumulativeUp ? '+' : ''}{sec.fiveDayCumulativeChange}%
                          </span>
                        </td>

                        {/* 5日總成交額 (桌機/平板欄) */}
                        <td className="py-2 px-2 text-right hidden md:table-cell text-slate-300">
                          {sec.fiveDayTotalTurnover ? `${sec.fiveDayTotalTurnover.toLocaleString()}億` : '-'}
                        </td>

                        {/* 5日量能迷你走勢圖 (緊湊寬度，完美適配手機無卷軸) */}
                        <td className="py-1.5 px-1 sm:px-2 text-center">
                          {sec.recent5Sessions && sec.recent5Sessions.length > 0 ? (
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-end gap-0.5 sm:gap-1 h-4 sm:h-5 w-12 sm:w-20 bg-slate-900/90 p-0.5 rounded border border-slate-800/80">
                                {sec.recent5Sessions.map((s, sIdx) => {
                                  const maxVol = Math.max(...sec.recent5Sessions.map(x => x.turnoverAmount)) || 1;
                                  const heightPct = Math.max(22, Math.round((s.turnoverAmount / maxVol) * 100));
                                  const isUpDay = s.changePercent >= 0;
                                  return (
                                    <div
                                      key={sIdx}
                                      className="flex-1 flex flex-col items-center h-full justify-end"
                                      title={`${s.date}: ${s.turnoverAmount}億, ${isUpDay ? '+' : ''}${s.changePercent}%`}
                                    >
                                      <div
                                        style={{ height: `${heightPct}%` }}
                                        className={`w-full rounded-xs transition-all ${
                                          isUpDay ? 'bg-rose-500' : 'bg-emerald-500'
                                        }`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-[7px] sm:text-[8px] text-slate-500 font-mono hidden sm:inline mt-0.5">
                                {startDate} → {endDate}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-center block text-[10px]">-</span>
                          )}
                        </td>

                        {/* 篩選操作按鈕 (桌機欄) */}
                        <td className="py-2 px-2 text-center hidden sm:table-cell">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                          }`}>
                            {isSelected ? '已選取' : '篩選'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
