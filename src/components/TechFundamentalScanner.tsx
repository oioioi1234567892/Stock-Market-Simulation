import React, { useState, useMemo, useEffect } from 'react';
import {
  TechSector,
  QuarterFinancial,
  TAIWAN_TECH_STOCKS_DATABASE,
} from '../data/techFinancialsData.ts';
import {
  AnalyzedTechStock,
  runTechFundamentalScan,
} from '../utils/fundamentalAnalysisEngine.ts';
import {
  fetchBatchQuotes,
  BatchQuoteItem,
  syncTechMarketFinancials,
  fetchAiStockAnalysis,
  fetchAiBatchAnalysis,
} from '../services/api.ts';
import {
  MarketFinancialProgress,
  calculateMarketFinancialProgress,
} from '../utils/marketFinancialCalendar.ts';
import {
  AiStockFinancialAnalysis,
  AiCompetitivenessRating,
} from '../types/aiFinancialAnalysis.ts';
import { AiFinancialReportModal } from './AiFinancialReportModal.tsx';
import {
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info,
  DollarSign,
  BarChart3,
  Percent,
  Compass,
  FileSpreadsheet,
  X,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  LineChart,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  Zap,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface TechFundamentalScannerProps {
  onSelectStockForChart: (symbol: string, name: string) => void;
}

export const TechFundamentalScanner: React.FC<TechFundamentalScannerProps> = ({
  onSelectStockForChart,
}) => {
  // Scan State
  const [hasScanned, setHasScanned] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(4);
  const [scanProgress, setScanProgress] = useState<number>(100);

  // Filter States
  const [selectedSector, setSelectedSector] = useState<TechSector | 'ALL'>('ALL');
  const [selectedCompetitiveness, setSelectedCompetitiveness] = useState<AiCompetitivenessRating | 'ALL'>('ALL');
  const [minGrowthFilter, setMinGrowthFilter] = useState<boolean>(false);

  // Table Sorting and Metric View Mode States
  const [sortField, setSortField] = useState<
    | 'rank'
    | 'currentPrice'
    | 'changePercent'
    | 'competitivenessScore'
    | 'profitabilityScore'
    | 'assetReturnScore'
    | 'revenueGrowthScore'
    | 'debtHealthScore'
    | 'grossMargin'
    | 'roe'
    | 'roic'
    | 'expectedGrowthRate'
  >('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [metricGroup, setMetricGroup] = useState<'ALL' | 'PROFITABILITY' | 'GROWTH_DEBT'>('ALL');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const defaultDesc = [
        'competitivenessScore',
        'profitabilityScore',
        'assetReturnScore',
        'revenueGrowthScore',
        'debtHealthScore',
        'grossMargin',
        'roe',
        'roic',
        'expectedGrowthRate',
        'changePercent',
      ].includes(field);
      setSortOrder(defaultDesc ? 'desc' : 'asc');
    }
  };

  // AI Deep Report Modal State
  const [detailStock, setDetailStock] = useState<AnalyzedTechStock | null>(null);
  const [isRefreshingDetail, setIsRefreshingDetail] = useState<boolean>(false);

  // Market Financial Reporting Calendar & Dynamic 8-Quarter Progress (後台自動校準)
  const [marketProgress, setMarketProgress] = useState<MarketFinancialProgress>(() => calculateMarketFinancialProgress());
  const [isSyncingFinancials, setIsSyncingFinancials] = useState<boolean>(true);

  // Live Yahoo Finance Quotes State
  const [liveQuotes, setLiveQuotes] = useState<Record<string, BatchQuoteItem>>({});
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // AI Batch Analysis Cache State
  const [aiBatchMap, setAiBatchMap] = useState<Record<string, AiStockFinancialAnalysis>>({});

  // Full analyzed results (Initialized with current market progress)
  const [analyzedList, setAnalyzedList] = useState<AnalyzedTechStock[]>(() =>
    runTechFundamentalScan(undefined, calculateMarketFinancialProgress())
  );

  // Automatic real-time financial calendar, quote & AI batch analysis on mount & polling
  useEffect(() => {
    let isMounted = true;

    const autoSync = async () => {
      try {
        setIsFetchingLive(true);
        setIsSyncingFinancials(true);

        const [marketRes, aiBatch] = await Promise.all([
          syncTechMarketFinancials(),
          fetchAiBatchAnalysis(),
        ]);

        if (isMounted) {
          if (marketRes.progress) {
            setMarketProgress(marketRes.progress);
          }
          if (marketRes.quotes && Object.keys(marketRes.quotes).length > 0) {
            setLiveQuotes(marketRes.quotes);
          }
          if (aiBatch && Object.keys(aiBatch).length > 0) {
            setAiBatchMap(aiBatch);
          }
          setLastUpdated(new Date(marketRes.timestamp || Date.now()));
          setAnalyzedList(runTechFundamentalScan(marketRes.quotes, marketRes.progress, aiBatch));
        }
      } catch (err) {
        console.warn('Auto-sync market financials & AI analysis error:', err);
      } finally {
        if (isMounted) {
          setIsFetchingLive(false);
          setIsSyncingFinancials(false);
        }
      }
    };

    autoSync();
    // Auto-refresh quotes every 30 seconds
    const intervalId = setInterval(autoSync, 30000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Trigger AI Agent Scan Animation & Refresh Live Data & AI Analysis
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(15);

    let freshQuotes = liveQuotes;
    let freshProgress = marketProgress;
    let freshAiBatch = aiBatchMap;

    try {
      const [marketRes, aiBatch] = await Promise.all([
        syncTechMarketFinancials(),
        fetchAiBatchAnalysis(),
      ]);

      if (marketRes) {
        if (marketRes.progress) {
          freshProgress = marketRes.progress;
          setMarketProgress(marketRes.progress);
        }
        if (marketRes.quotes && Object.keys(marketRes.quotes).length > 0) {
          freshQuotes = marketRes.quotes;
          setLiveQuotes(marketRes.quotes);
        }
        setLastUpdated(new Date(marketRes.timestamp || Date.now()));
      }
      if (aiBatch && Object.keys(aiBatch).length > 0) {
        freshAiBatch = aiBatch;
        setAiBatchMap(aiBatch);
      }
    } catch (e) {
      console.warn('Manual scan fetch error:', e);
    }

    setTimeout(() => {
      setScanStep(2);
      setScanProgress(45);
    }, 350);

    setTimeout(() => {
      setScanStep(3);
      setScanProgress(75);
    }, 700);

    setTimeout(() => {
      setScanStep(4);
      setScanProgress(100);
      const results = runTechFundamentalScan(freshQuotes, freshProgress, freshAiBatch);
      setAnalyzedList(results);
      setIsScanning(false);
      setHasScanned(true);
    }, 1100);
  };

  // Re-generate AI Analysis for a specific stock in Modal
  const handleRefreshSingleStockAnalysis = async (symbol: string) => {
    setIsRefreshingDetail(true);
    try {
      const updated = await fetchAiStockAnalysis(symbol, true);
      setAiBatchMap(prev => ({ ...prev, [symbol]: updated }));

      // Update in analyzedList
      setAnalyzedList(prev =>
        prev.map(item => {
          if (item.symbol === symbol) {
            return {
              ...item,
              aiAnalysis: updated,
            };
          }
          return item;
        })
      );

      // Update detailStock
      if (detailStock && detailStock.symbol === symbol) {
        setDetailStock(prev => (prev ? { ...prev, aiAnalysis: updated } : null));
      }
    } catch (err) {
      console.warn('Refresh single stock analysis error:', err);
    } finally {
      setIsRefreshingDetail(false);
    }
  };

  // Filtered & Sorted List (Table Presentation with Real-time Sorting)
  const filteredList = useMemo(() => {
    const list = analyzedList.filter(stock => {
      // Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return false;
      // Competitiveness filter
      if (selectedCompetitiveness !== 'ALL' && stock.aiAnalysis?.competitivenessRating !== selectedCompetitiveness) {
        return false;
      }
      // High growth only filter
      if (minGrowthFilter && (stock.aiAnalysis?.revenueGrowthScore ?? 0) < 80) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'rank':
          valA = a.rank;
          valB = b.rank;
          break;
        case 'currentPrice':
          valA = a.currentPrice;
          valB = b.currentPrice;
          break;
        case 'changePercent':
          valA = a.changePercent;
          valB = b.changePercent;
          break;
        case 'competitivenessScore':
          valA = a.aiAnalysis?.competitivenessScore ?? 0;
          valB = b.aiAnalysis?.competitivenessScore ?? 0;
          break;
        case 'profitabilityScore':
          valA = a.aiAnalysis?.profitabilityScore ?? 0;
          valB = b.aiAnalysis?.profitabilityScore ?? 0;
          break;
        case 'assetReturnScore':
          valA = a.aiAnalysis?.assetReturnScore ?? 0;
          valB = b.aiAnalysis?.assetReturnScore ?? 0;
          break;
        case 'revenueGrowthScore':
          valA = a.aiAnalysis?.revenueGrowthScore ?? 0;
          valB = b.aiAnalysis?.revenueGrowthScore ?? 0;
          break;
        case 'debtHealthScore':
          valA = a.aiAnalysis?.debtHealthScore ?? 0;
          valB = b.aiAnalysis?.debtHealthScore ?? 0;
          break;
        case 'grossMargin':
          valA = a.quarters[0]?.grossMargin ?? 0;
          valB = b.quarters[0]?.grossMargin ?? 0;
          break;
        case 'roe':
          valA = a.quarters[0]?.roe ?? 0;
          valB = b.quarters[0]?.roe ?? 0;
          break;
        case 'roic':
          valA = a.quarters[0]?.roic ?? 0;
          valB = b.quarters[0]?.roic ?? 0;
          break;
        case 'expectedGrowthRate':
          valA = a.expectedGrowthRate;
          valB = b.expectedGrowthRate;
          break;
        default:
          valA = a.rank;
          valB = b.rank;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [analyzedList, selectedSector, selectedCompetitiveness, minGrowthFilter, sortField, sortOrder]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = analyzedList.length;
    const topTierCount = analyzedList.filter(s => s.aiAnalysis?.competitivenessRating === 'TOP_TIER').length;
    const strongMoatCount = analyzedList.filter(s => s.aiAnalysis?.competitivenessRating === 'STRONG_MOAT').length;
    const avgProfitScore = Math.round(
      analyzedList.reduce((acc, s) => acc + (s.aiAnalysis?.profitabilityScore ?? 75), 0) / (total || 1)
    );
    const avgGrossMargin = (
      analyzedList.reduce((acc, s) => acc + (s.quarters[0]?.grossMargin ?? 0), 0) / (total || 1)
    ).toFixed(1);
    const avgExpectedGrowth = (
      analyzedList.reduce((acc, s) => acc + s.expectedGrowthRate, 0) / (total || 1)
    ).toFixed(1);
    const avgRoe = (
      analyzedList.reduce((acc, s) => acc + (s.quarters[0]?.roe ?? 0), 0) / (total || 1)
    ).toFixed(1);
    const avgDebtRatio = (
      analyzedList.reduce((acc, s) => acc + (s.quarters[0]?.debtRatio ?? 0), 0) / (total || 1)
    ).toFixed(1);

    return {
      total,
      topTierCount,
      strongMoatCount,
      avgProfitScore,
      avgGrossMargin,
      avgExpectedGrowth,
      avgRoe,
      avgDebtRatio,
    };
  }, [analyzedList]);

  // Sector list for tabs
  const sectors: { id: TechSector | 'ALL'; label: string; count: number }[] = [
    { id: 'ALL', label: '全部推薦 (Top 20)', count: analyzedList.length },
    { id: '晶圓代工', label: '晶圓代工', count: analyzedList.filter(s => s.sector === '晶圓代工').length },
    { id: '先進封裝', label: '先進封裝CoWoS', count: analyzedList.filter(s => s.sector === '先進封裝').length },
    { id: 'IC設計/晶片', label: 'IC與AI晶片', count: analyzedList.filter(s => s.sector === 'IC設計/晶片').length },
    { id: 'AI伺服器/代工', label: 'AI伺服器/代工', count: analyzedList.filter(s => s.sector === 'AI伺服器/代工').length },
    { id: '散熱模組', label: '散熱模組', count: analyzedList.filter(s => s.sector === '散熱模組').length },
    { id: '電源/BBU', label: '電源/綠能BBU', count: analyzedList.filter(s => s.sector === '電源/BBU').length },
    { id: 'ABF載板/PCB', label: 'ABF載板/PCB', count: analyzedList.filter(s => s.sector === 'ABF載板/PCB').length },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hero Header & AI Agent Control Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                AI Agent 專業財報分析師・後台自動推算 ({marketProgress.currentQuarter} 最新校準)
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 font-semibold">即時連線推算</span>
                {lastUpdated && (
                  <span className="text-slate-400 text-[10px]">
                    · 最新報價 {lastUpdated.toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
                {(isFetchingLive || isSyncingFinancials) && (
                  <span className="text-blue-400 text-[10px] flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> 背景同步中...
                  </span>
                )}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>台灣科技股 7 大板塊・AI 深度財報競爭力診斷 (Top 20)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              由後台 <strong className="text-blue-300">AI Agent 專業財報分析師</strong> 深度推算全體科技股之連續 8 季財報序列。全面剖析<strong className="text-emerald-300">獲利能力</strong>、<strong className="text-cyan-300">資產報酬率 (ROA/ROE/ROIC)</strong>、<strong className="text-amber-300">營收增長率</strong>與<strong className="text-blue-300">負債健康度</strong>，橫向對比相關產業同儕評判技術護城河與未來三大核心下行風險，即時輔助操盤決策。
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Agent 正在深入推算 8 季財報...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white" />
                  <span>🧠 啟動 AI Agent 全量深入推算</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Progressive Scan Indicator */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-1.5">
              <span>
                {scanStep === 1 && '步驟 1/4: 檢索台股科技股 7 大類群最近 8 季度完整營收、毛利與獲利序列...'}
                {scanStep === 2 && '步驟 2/4: AI Agent 深入精算獲利能力 (毛利/營益/EPS)、資產報酬率 (ROA/ROE/ROIC)...'}
                {scanStep === 3 && '步驟 3/4: 橫向對比同板塊競爭對手，精準判定技術護城河、市占定價權與競爭力評級...'}
                {scanStep === 4 && '步驟 4/4: 診斷負債健康度與現金流抗風險力，排查未來三大實質下行風險...'}
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

      {/* KPI Summary Cards (AI Financial Health & Competitiveness) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">精選追蹤標的</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">
            20 <span className="text-xs text-slate-400 font-sans font-normal">檔精選</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">跨 7 大科技關鍵賽道</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            產業頂級統治力
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-300 mt-1">
            {stats.topTierCount} <span className="text-xs text-slate-400 font-sans font-normal">檔</span>
          </div>
          <span className="text-[10px] text-amber-400/80 mt-0.5">同板塊技術獨佔龍頭</span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            領先強勢護城河
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-300 mt-1">
            {stats.strongMoatCount} <span className="text-xs text-slate-400 font-sans font-normal">檔</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5">高議價權與供應鏈份額</span>
        </div>

        <div className="bg-slate-900/80 border border-purple-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-purple-400">平均最新毛利率</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-purple-300 mt-1">
            {stats.avgGrossMargin}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">高毛利技術定價壁壘</span>
        </div>

        <div className="bg-slate-900/80 border border-cyan-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-cyan-400">平均年化 ROE</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-300 mt-1">
            {stats.avgRoe}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">股東權益資本回報效率</span>
        </div>

        <div className="bg-slate-900/80 border border-blue-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-blue-400">平均負債比率</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-300 mt-1">
            {stats.avgDebtRatio}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">資產結構財務安全警戒</span>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col gap-2.5 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        {/* Sector Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
          {sectors.map(sec => {
            const isSelected = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{sec.label}</span>
                {sec.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sec.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Second Filter Row: AI Competitiveness Filter, Growth Toggle, View Mode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Competitiveness Rating Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] px-1.5 font-medium flex items-center gap-1">
                <Award size={11} className="text-amber-400" />
                <span>AI競爭力:</span>
              </span>
              <button
                onClick={() => setSelectedCompetitiveness('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCompetitiveness === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedCompetitiveness('TOP_TIER')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCompetitiveness === 'TOP_TIER' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                🌟 頂級統治力
              </button>
              <button
                onClick={() => setSelectedCompetitiveness('STRONG_MOAT')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCompetitiveness === 'STRONG_MOAT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                🟢 領先強勢
              </button>
              <button
                onClick={() => setSelectedCompetitiveness('PEER_AVERAGE')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCompetitiveness === 'PEER_AVERAGE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                🟡 同業持平
              </button>
            </div>

            {/* High Growth Toggle */}
            <button
              onClick={() => setMinGrowthFilter(!minGrowthFilter)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                minGrowthFilter
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame size={13} className={minGrowthFilter ? 'text-amber-400' : ''} />
              <span>僅看高成長動能 (動能分≥80)</span>
            </button>
          </div>

          {/* Table Metrics Group (操盤指標切換) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <span>共</span>
              <span className="font-mono text-blue-400 font-bold">{filteredList.length}</span>
              <span>檔標的</span>
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs shadow-inner">
              <button
                onClick={() => setMetricGroup('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metricGroup === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="全方位檢視 AI 競爭力、獲利、資產報酬、營收與風險"
              >
                AI 綜合全覽
              </button>
              <button
                onClick={() => setMetricGroup('PROFITABILITY')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metricGroup === 'PROFITABILITY'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="聚焦毛利率、營益率、ROE、ROIC與資本回報"
              >
                獲利與資本回報
              </button>
              <button
                onClick={() => setMetricGroup('GROWTH_DEBT')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  metricGroup === 'GROWTH_DEBT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="聚焦營收成長 YoY、負債比率與現金流抗風險力"
              >
                營收動能與負債健康
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Results View */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Info size={32} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">查無符合條件的科技股標的</p>
          <p className="text-xs text-slate-500">請嘗試調整產業類別或 AI 競爭力篩選條件。</p>
          <button
            onClick={() => {
              setSelectedSector('ALL');
              setSelectedCompetitiveness('ALL');
              setMinGrowthFilter(false);
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg mt-2 cursor-pointer"
          >
            重置所有篩選
          </button>
        </div>
      ) : (
        /* PROFESSIONAL TRADING TABLE FOR MOBILE & DESKTOP */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {/* Mobile Swipe Hint Banner */}
          <div className="sm:hidden px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-blue-400" />
              點擊任一標的查看 <strong>AI 深度分析研報</strong>
            </span>
            <span className="text-[10px] text-slate-500">可左右滑動檢視更多數據 ➔</span>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] tracking-wider uppercase select-none">
                <tr>
                  {/* Rank Column */}
                  <th
                    onClick={() => handleSort('rank')}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors w-12"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>排名</span>
                      {sortField === 'rank' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Stock Name & Symbol Column */}
                  <th className="py-3 px-3 min-w-[150px]">
                    <div className="flex items-center gap-1.5">
                      <span>科技標的 / 產業賽道</span>
                    </div>
                  </th>

                  {/* Current Price Column */}
                  <th
                    onClick={() => handleSort('currentPrice')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[75px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>現價</span>
                      {sortField === 'currentPrice' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Change Percent Column */}
                  <th
                    onClick={() => handleSort('changePercent')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[75px]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>漲跌幅</span>
                      {sortField === 'changePercent' ? (
                        sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* AI Competitiveness Columns */}
                  {(metricGroup === 'ALL' || metricGroup === 'PROFITABILITY') && (
                    <>
                      <th
                        onClick={() => handleSort('competitivenessScore')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors min-w-[140px]"
                        title="AI 產業競爭力評級與同業賽道對比"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Award size={12} className="text-amber-400" />
                          <span>AI 產業競爭力</span>
                          {sortField === 'competitivenessScore' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('grossMargin')}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[85px]"
                        title="最新單季毛利率"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-purple-300">最新毛利</span>
                          {sortField === 'grossMargin' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('roe')}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[75px]"
                        title="當季年化股東權益報酬率 ROE"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-cyan-300">ROE</span>
                          {sortField === 'roe' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('roic')}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[75px]"
                        title="資本回報率 ROIC"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-emerald-300">ROIC</span>
                          {sortField === 'roic' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                    </>
                  )}

                  {/* Growth & Debt Health Columns */}
                  {(metricGroup === 'ALL' || metricGroup === 'GROWTH_DEBT') && (
                    <>
                      <th
                        onClick={() => handleSort('revenueGrowthScore')}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[85px]"
                        title="營收年增率動能"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-amber-400">營收YoY</span>
                          {sortField === 'revenueGrowthScore' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('expectedGrowthRate')}
                        className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors min-w-[90px]"
                        title="市場預估次年度獲利成長率"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>預期成長</span>
                          {sortField === 'expectedGrowthRate' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('debtHealthScore')}
                        className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors min-w-[110px]"
                        title="負債比率結構與財務安全評等"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <ShieldCheck size={12} className="text-blue-400" />
                          <span>負債健康度</span>
                          {sortField === 'debtHealthScore' ? (
                            sortOrder === 'asc' ? <ArrowUp size={11} className="text-blue-400" /> : <ArrowDown size={11} className="text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="text-slate-600 opacity-60" />
                          )}
                        </div>
                      </th>
                    </>
                  )}

                  {/* Core Future Risks Column */}
                  {metricGroup === 'ALL' && (
                    <th className="py-3 px-3 min-w-[160px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={12} className="text-rose-400" />
                        <span>未來主要風險</span>
                      </div>
                    </th>
                  )}

                  {/* Action Column */}
                  <th className="py-3 px-3 text-center min-w-[110px]">
                    <span>AI 研報 / 看盤</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredList.map(stock => {
                  const ai = stock.aiAnalysis;
                  const isUp = stock.change > 0;
                  const isDown = stock.change < 0;

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setDetailStock(stock)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            stock.rank === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : stock.rank === 2
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                              : stock.rank === 3
                              ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                              : 'text-slate-400'
                          }`}
                        >
                          {stock.rank}
                        </span>
                      </td>

                      {/* Stock Name & Symbol */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors text-xs sm:text-sm">
                              {stock.name}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              {stock.code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                              {stock.sector}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                            {stock.subCategory}
                          </span>
                        </div>
                      </td>

                      {/* Current Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-100 text-xs sm:text-sm">
                        ${stock.currentPrice}
                      </td>

                      {/* Change Percent */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isUp
                              ? 'text-rose-400'
                              : isDown
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp size={11} />
                          ) : isDown ? (
                            <TrendingDown size={11} />
                          ) : null}
                          <span>
                            {isUp ? '+' : ''}
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>

                      {/* AI Competitiveness & Profitability */}
                      {(metricGroup === 'ALL' || metricGroup === 'PROFITABILITY') && (
                        <>
                          <td className="py-3 px-3 text-center font-sans">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                                  ai?.competitivenessBadgeClass || 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {ai?.competitivenessLabel || '領先強勢'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                評分: {ai?.competitivenessScore ?? 80}分
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-purple-300 font-semibold">
                            {stock.quarters[0]?.grossMargin}%
                          </td>
                          <td className="py-3 px-3 text-right text-cyan-300 font-semibold">
                            {stock.quarters[0]?.roe}%
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-300 font-bold">
                            {stock.quarters[0]?.roic}%
                          </td>
                        </>
                      )}

                      {/* Growth & Debt Health */}
                      {(metricGroup === 'ALL' || metricGroup === 'GROWTH_DEBT') && (
                        <>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-semibold ${
                                (stock.quarters[0]?.revenueYoY ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {(stock.quarters[0]?.revenueYoY ?? 0) >= 0 ? '+' : ''}
                              {stock.quarters[0]?.revenueYoY}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-amber-300 font-bold">
                            +{stock.expectedGrowthRate}%
                          </td>
                          <td className="py-3 px-3 text-center font-sans">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                                  ai?.debtHealthBadgeClass || 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {ai?.debtHealthStatusLabel || '財務安全'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                負債 {stock.quarters[0]?.debtRatio}%
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Core Future Risks */}
                      {metricGroup === 'ALL' && (
                        <td className="py-3 px-3 font-sans max-w-[220px]">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 truncate" title={ai?.futureRisks?.[0] || '景氣循環波動'}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            <span className="truncate">{ai?.futureRisks?.[0] || '全球終端景氣循環與地緣政治關稅波動'}</span>
                          </div>
                        </td>
                      )}

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailStock(stock)}
                            className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors border border-blue-500/30 cursor-pointer"
                            title="開啟 AI Agent 專業研報"
                          >
                            <Sparkles size={11} className="text-amber-400" />
                            <span>AI 研報</span>
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

      {/* AI Deep Financial Analysis Modal */}
      {detailStock && (
        <AiFinancialReportModal
          stock={detailStock.aiAnalysis}
          isOpen={!!detailStock}
          onClose={() => setDetailStock(null)}
          onSelectStockForChart={onSelectStockForChart}
          onRefreshAnalysis={handleRefreshSingleStockAnalysis}
          isRefreshing={isRefreshingDetail}
        />
      )}
    </div>
  );
};
