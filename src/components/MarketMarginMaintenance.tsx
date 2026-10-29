import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MarketMarginSummary, DailyMarketMarginPoint } from '../types/stock.ts';
import { fetchMarketMarginMaintenance } from '../services/api.ts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Scale,
  Activity,
  Layers,
  Calendar,
  Zap,
  Users,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

interface MarketMarginMaintenanceProps {
  onSelectStock?: (symbol: string, name: string) => void;
}

type TimeRange = '1mo' | '3mo' | '6mo' | '1y' | '2y';

export const MarketMarginMaintenance: React.FC<MarketMarginMaintenanceProps> = () => {
  const [data, setData] = useState<MarketMarginSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [error, setError] = useState<string | null>(null);

  // Section anchor references for fast mobile navigation
  const marginSectionRef = useRef<HTMLDivElement>(null);
  const retailSectionRef = useRef<HTMLDivElement>(null);

  // Mobile collapsible state for trader playbook guide
  const [isTraderGuideOpen, setIsTraderGuideOpen] = useState<boolean>(false);

  // Hover / Touch tracking for interactive crosshair on margin maintenance chart
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  // Hover / Touch tracking for interactive crosshair on retail sentiment chart
  const [activeRetailIndex, setActiveRetailIndex] = useState<number | null>(null);
  const retailChartSvgRef = useRef<SVGSVGElement>(null);

  const loadData = useCallback(async (range: TimeRange, forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await fetchMarketMarginMaintenance(range, forceRefresh);
      if (res && res.series && res.series.length > 0) {
        setData(res);
        setActiveIndex(null);
        setActiveRetailIndex(null);
      } else {
        setError('未能取得大盤融資與散戶多空比資料，請稍候重試');
      }
    } catch (e: any) {
      console.error('Failed to load margin & retail sentiment data:', e);
      setError('連線失敗，請檢查網路連線');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange, loadData]);

  // Active point for Margin Chart
  const activePoint: DailyMarketMarginPoint | null = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) return null;
    if (activeIndex !== null && data.series[activeIndex]) {
      return data.series[activeIndex];
    }
    return data.series[data.series.length - 1];
  }, [data, activeIndex]);

  // Active point for Retail Sentiment Chart
  const activeRetailPoint: DailyMarketMarginPoint | null = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) return null;
    if (activeRetailIndex !== null && data.series[activeRetailIndex]) {
      return data.series[activeRetailIndex];
    }
    return data.series[data.series.length - 1];
  }, [data, activeRetailIndex]);

  // Chart metrics for Margin Maintenance Chart
  const chartMetrics = useMemo(() => {
    if (!data || !data.series || data.series.length < 2) return null;

    const series = data.series;
    const count = series.length;

    const taiexValues = series.map(s => s.taiexClose);
    const minTaiex = Math.min(...taiexValues);
    const maxTaiex = Math.max(...taiexValues);
    const taiexPadding = (maxTaiex - minTaiex) * 0.08 || 500;
    const yTaiexMin = Math.max(0, Math.floor((minTaiex - taiexPadding) / 500) * 500);
    const yTaiexMax = Math.ceil((maxTaiex + taiexPadding) / 500) * 500;

    const ratioValues = series.map(s => s.marginMaintenanceRatio);
    const minRatio = Math.min(...ratioValues);
    const maxRatio = Math.max(...ratioValues);
    const yRatioMin = Math.min(125, Math.floor((minRatio - 4) / 5) * 5);
    const yRatioMax = Math.max(180, Math.ceil((maxRatio + 4) / 5) * 5);

    return {
      count,
      yTaiexMin,
      yTaiexMax,
      yRatioMin,
      yRatioMax,
      minTaiex,
      maxTaiex,
      minRatio,
      maxRatio,
    };
  }, [data]);

  // Chart metrics for Retail Sentiment Chart (加權指數 vs 小台散戶多空比)
  const retailChartMetrics = useMemo(() => {
    if (!data || !data.series || data.series.length < 2) return null;

    const series = data.series;
    const count = series.length;

    const taiexValues = series.map(s => s.taiexClose);
    const minTaiex = Math.min(...taiexValues);
    const maxTaiex = Math.max(...taiexValues);
    const taiexPadding = (maxTaiex - minTaiex) * 0.08 || 500;
    const yTaiexMin = Math.max(0, Math.floor((minTaiex - taiexPadding) / 500) * 500);
    const yTaiexMax = Math.ceil((maxTaiex + taiexPadding) / 500) * 500;

    // Centered Retail Ratio Y-axis around 0%
    const retailRatios = series.map(s => s.retailRatio || 0);
    const maxAbsRatio = Math.max(35, Math.ceil(Math.max(...retailRatios.map(v => Math.abs(v))) / 5) * 5 + 5);
    const yRetailMin = -maxAbsRatio;
    const yRetailMax = maxAbsRatio;

    return {
      count,
      yTaiexMin,
      yTaiexMax,
      yRetailMin,
      yRetailMax,
      maxAbsRatio,
      minTaiex,
      maxTaiex,
    };
  }, [data]);

  // Pointer tracking for Margin chart (optimized for mobile touch scrubbing)
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !data || !data.series || data.series.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const paddingLeft = 48;
    const paddingRight = 44;
    const plotWidth = width - paddingLeft - paddingRight;
    if (plotWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, (offsetX - paddingLeft) / plotWidth));
    const targetIdx = Math.round(ratio * (data.series.length - 1));
    setActiveIndex(Math.max(0, Math.min(data.series.length - 1, targetIdx)));
  };

  const handlePointerLeave = () => {
    setActiveIndex(null);
  };

  // Pointer tracking for Retail Sentiment chart (optimized for mobile touch scrubbing)
  const handleRetailPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!retailChartSvgRef.current || !data || !data.series || data.series.length === 0) return;
    const rect = retailChartSvgRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const paddingLeft = 48;
    const paddingRight = 44;
    const plotWidth = width - paddingLeft - paddingRight;
    if (plotWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, (offsetX - paddingLeft) / plotWidth));
    const targetIdx = Math.round(ratio * (data.series.length - 1));
    setActiveRetailIndex(Math.max(0, Math.min(data.series.length - 1, targetIdx)));
  };

  const handleRetailPointerLeave = () => {
    setActiveRetailIndex(null);
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 animate-fadeIn pb-16 sm:pb-6">
      {/* 1. Header Banner & Live Market Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Scale size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold text-slate-100 tracking-tight">
                  大盤融資維持率 & 小台散戶多空比
                </h1>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Activity size={10} />
                  <span>實時雙指標</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Yahoo Finance 加權指數 (^TWII) · 期交所 (TAIFEX) 官方小台未平倉籌碼
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap pt-1 lg:pt-0">
            {data && (
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-slate-800">
                更新：{data.latestDate}
              </span>
            )}
            <button
              onClick={() => loadData(timeRange, true)}
              disabled={isRefreshing || isLoading}
              className="text-[11px] sm:text-xs flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? '更新中...' : '重新整理'}</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Cards Grid (4 Columns) */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 mt-2.5 sm:mt-3.5">
            {/* KPI 1: 台灣加權指數 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                加權指數 (^TWII)
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-2xl font-black font-mono tracking-tight text-slate-100">
                  {data.currentTaiex.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </div>
                <div className={`text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.taiexChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {data.taiexChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>{data.taiexChange >= 0 ? `+${data.taiexChange}` : data.taiexChange}</span>
                  <span>({data.taiexChangePct >= 0 ? `+${data.taiexChangePct}%` : `${data.taiexChangePct}%`})</span>
                </div>
              </div>
            </div>

            {/* KPI 2: 大盤融資維持率 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>融資維持率</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500">基準 166.7%</span>
              </span>
              <div className="mt-1">
                <div className={`text-base sm:text-2xl font-black font-mono tracking-tight ${
                  data.currentMaintenanceRatio < 130
                    ? 'text-rose-400'
                    : data.currentMaintenanceRatio < 140
                    ? 'text-amber-400'
                    : data.currentMaintenanceRatio > 170
                    ? 'text-purple-400'
                    : 'text-emerald-400'
                }`}>
                  {data.currentMaintenanceRatio.toFixed(1)}%
                </div>
                <div className={`text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.ratioChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>前日比：</span>
                  <span>{data.ratioChange >= 0 ? `+${data.ratioChange}%` : `${data.ratioChange}%`}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: 小台散戶多空比 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-purple-400" />
                  <span>小台散戶多空比</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500">反指標</span>
              </span>
              <div className="mt-1">
                <div className={`text-base sm:text-2xl font-black font-mono tracking-tight flex items-baseline gap-1 ${
                  data.latestRetailRatio > 15
                    ? 'text-rose-400'
                    : data.latestRetailRatio > 0
                    ? 'text-amber-400'
                    : data.latestRetailRatio < -15
                    ? 'text-emerald-400'
                    : 'text-blue-400'
                }`}>
                  <span>{data.latestRetailRatio > 0 ? `+${data.latestRetailRatio}%` : `${data.latestRetailRatio}%`}</span>
                  <span className="text-[10px] font-sans font-bold text-slate-400">
                    {data.latestRetailRatio > 15 ? '偏多' : data.latestRetailRatio < -15 ? '軋空' : '盤整'}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 flex items-center justify-between mt-0.5">
                  <span>淨單：</span>
                  <span className={`font-bold ${data.latestRetailNet >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {data.latestRetailNet >= 0 ? `+${data.latestRetailNet.toLocaleString()}口` : `${data.latestRetailNet.toLocaleString()}口`}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: 全市場融資餘額 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>融資餘額</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500">集中市場</span>
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-2xl font-black font-mono tracking-tight text-slate-100">
                  {data.currentMarginBalance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-1">億</span>
                </div>
                <div className={`text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.marginBalanceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>日變動：</span>
                  <span>{data.marginBalanceChange >= 0 ? `+${data.marginBalanceChange}億` : `${data.marginBalanceChange}億`}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Maintenance Ratio Level & Thermometer Visual Banner */}
      {data && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>大盤融資維持率水位刻度</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              當前：<strong className="text-slate-100 font-bold">{data.currentMaintenanceRatio.toFixed(1)}%</strong>
            </span>
          </div>

          {/* Color bar thermometer */}
          <div className="relative pt-5 pb-1">
            {/* Pointer Pin indicator */}
            {(() => {
              const clampedRatio = Math.max(120, Math.min(180, data.currentMaintenanceRatio));
              const leftPct = ((clampedRatio - 120) / (180 - 120)) * 100;
              return (
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-10"
                  style={{ left: `${leftPct}%` }}
                >
                  <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black font-mono bg-white text-slate-950 shadow-md whitespace-nowrap">
                    {data.currentMaintenanceRatio.toFixed(1)}%
                  </span>
                  <div className="w-0 h-0 border-x-3.5 border-x-transparent border-t-3.5 border-t-white" />
                </div>
              );
            })()}

            {/* Segmented Risk Bar */}
            <div className="h-2.5 sm:h-3 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800 shadow-inner">
              <div className="h-full bg-linear-to-r from-red-600 to-rose-600" style={{ width: '16.7%' }} title="< 130% 斷頭多殺多風暴區" />
              <div className="h-full bg-linear-to-r from-rose-500 to-amber-500" style={{ width: '16.7%' }} title="130% ~ 140% 融資追繳警戒區" />
              <div className="h-full bg-linear-to-r from-amber-500 to-blue-500" style={{ width: '33.3%' }} title="140% ~ 160% 降槓桿健康整理區" />
              <div className="h-full bg-linear-to-r from-blue-500 to-emerald-500" style={{ width: '16.7%' }} title="160% ~ 170% 強勢多頭推升區" />
              <div className="h-full bg-linear-to-r from-emerald-500 to-purple-600" style={{ width: '16.6%' }} title="> 170% 融資過熱超買警戒區" />
            </div>

            {/* Ticks and Zone Labels */}
            <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-400 mt-1 font-mono px-0.5">
              <span className="text-rose-400 font-bold">120% 斷頭</span>
              <span className="text-amber-400 font-bold">130%</span>
              <span className="text-amber-300">140% 追繳</span>
              <span className="text-blue-400">160% 基準</span>
              <span className="text-purple-400 font-bold">170% 過熱</span>
              <span className="text-slate-400">180%+</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dual-Axis Interactive Chart Section (台灣加權指數 vs 大盤融資維持率) */}
      <div
        ref={marginSectionRef}
        className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xl flex flex-col gap-2 sm:gap-2.5"
      >
        {/* Top Chart Controls & Timeframe Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Layers size={15} className="text-blue-400 shrink-0" />
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-100 tracking-tight">
                加權指數 & 大盤融資維持率
              </h3>
            </div>

            {/* Mobile Fast Jump to Retail Chart */}
            <button
              onClick={() => retailSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="sm:hidden text-[10px] font-semibold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-2 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer"
            >
              <span>散戶多空比</span>
              <ArrowDown size={11} />
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 self-start sm:self-auto shadow-inner">
            {(['1mo', '3mo', '6mo', '1y', '2y'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '1mo' ? '1月' : r === '3mo' ? '3月' : r === '6mo' ? '6月' : r === '1y' ? '1年' : '2年'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend: Horizontal scrollable strip on mobile */}
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs overflow-x-auto no-scrollbar bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">加權指數 [左]</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">融資維持率 [右]</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-rose-500 inline-block" />
            <span>130% 斷頭</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-amber-500 inline-block" />
            <span>140% 追繳</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-purple-500 inline-block" />
            <span>170% 過熱</span>
          </div>
        </div>

        {/* Active Inspection Crosshair Inspector Banner (Streamlined Compact HUD) */}
        {activePoint && (
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5 flex-wrap text-[11px] sm:text-xs shadow-xs">
            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              <Calendar size={11} className="text-slate-400" />
              <span className="font-mono font-bold text-slate-200">{activePoint.date}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 mr-1">加權:</span>
                <span className="font-mono font-bold text-blue-400">
                  {activePoint.taiexClose.toLocaleString()}
                </span>
                <span className={`font-mono text-[10px] ml-1 ${activePoint.taiexChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ({activePoint.taiexChange >= 0 ? `+${activePoint.taiexChange}` : activePoint.taiexChange})
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">維持率:</span>
                <span className={`font-mono font-bold ${
                  activePoint.marginMaintenanceRatio < 130
                    ? 'text-rose-400'
                    : activePoint.marginMaintenanceRatio < 140
                    ? 'text-amber-400'
                    : activePoint.marginMaintenanceRatio > 170
                    ? 'text-purple-400'
                    : 'text-amber-300'
                }`}>
                  {activePoint.marginMaintenanceRatio.toFixed(1)}%
                </span>
              </div>
              <div className="hidden xs:block">
                <span className="text-slate-400 mr-1">融資:</span>
                <span className="font-mono text-slate-200">{activePoint.marginBalance.toFixed(1)}億</span>
              </div>
            </div>
          </div>
        )}

        {/* Dual-Axis SVG Chart: Maintenance Ratio (Height optimized for mobile) */}
        <div className="relative w-full overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5 select-none">
          {isLoading ? (
            <div className="h-52 sm:h-72 lg:h-88 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={20} className="animate-spin text-blue-500" />
              <span className="text-xs">載入加權指數與維持率中...</span>
            </div>
          ) : error ? (
            <div className="h-52 sm:h-72 lg:h-88 flex flex-col items-center justify-center gap-2 text-rose-400 p-4 text-center">
              <AlertTriangle size={20} />
              <span className="text-xs">{error}</span>
            </div>
          ) : chartMetrics && data && data.series.length > 1 ? (
            <div className="w-full">
              <svg
                ref={chartSvgRef}
                viewBox="0 0 900 340"
                className="w-full h-52 sm:h-72 lg:h-88 touch-none"
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch (_) {}
                  handlePointerMove(e);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch (_) {}
                }}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerLeave}
              >
                <defs>
                  <linearGradient id="taiexGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="dangerZoneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {(() => {
                  const { count, yTaiexMin, yTaiexMax, yRatioMin, yRatioMax } = chartMetrics;
                  const series = data.series;
                  const pLeft = 48;
                  const pRight = 44;
                  const pTop = 24;
                  const pBottom = 28;
                  const svgW = 900;
                  const svgH = 340;
                  const plotW = svgW - pLeft - pRight;
                  const plotH = svgH - pTop - pBottom;

                  const getX = (idx: number) => pLeft + (idx / (count - 1)) * plotW;
                  const getYTaiex = (val: number) => {
                    const ratio = (val - yTaiexMin) / (yTaiexMax - yTaiexMin || 1);
                    return pTop + plotH - ratio * plotH;
                  };
                  const getYRatio = (val: number) => {
                    const ratio = (val - yRatioMin) / (yRatioMax - yRatioMin || 1);
                    return pTop + plotH - ratio * plotH;
                  };

                  let taiexLineD = '';
                  let taiexAreaD = '';
                  let ratioLineD = '';

                  series.forEach((pt, i) => {
                    const x = getX(i);
                    const yT = getYTaiex(pt.taiexClose);
                    const yR = getYRatio(pt.marginMaintenanceRatio);

                    if (i === 0) {
                      taiexLineD = `M ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      taiexAreaD = `M ${x.toFixed(1)} ${pTop + plotH} L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      ratioLineD = `M ${x.toFixed(1)} ${yR.toFixed(1)}`;
                    } else {
                      taiexLineD += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      taiexAreaD += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      ratioLineD += ` L ${x.toFixed(1)} ${yR.toFixed(1)}`;
                    }
                  });

                  taiexAreaD += ` L ${pLeft + plotW} ${pTop + plotH} Z`;

                  const y130 = getYRatio(130);
                  const y140 = getYRatio(140);
                  const y160 = getYRatio(160);
                  const y170 = getYRatio(170);

                  const horizontalGrids = [0.25, 0.5, 0.75].map(ratio => {
                    const y = pTop + plotH * (1 - ratio);
                    const valTaiex = yTaiexMin + (yTaiexMax - yTaiexMin) * ratio;
                    const valRatio = yRatioMin + (yRatioMax - yRatioMin) * ratio;
                    return { y, valTaiex, valRatio };
                  });

                  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(r => {
                    const idx = Math.min(count - 1, Math.round(r * (count - 1)));
                    return { x: getX(idx), date: series[idx].date };
                  });

                  const curIdx = activeIndex !== null ? activeIndex : count - 1;
                  const activeX = getX(curIdx);
                  const activeYTaiex = getYTaiex(series[curIdx].taiexClose);
                  const activeYRatio = getYRatio(series[curIdx].marginMaintenanceRatio);

                  return (
                    <g>
                      {y130 < pTop + plotH && (
                        <rect
                          x={pLeft}
                          y={y130}
                          width={plotW}
                          height={Math.max(0, pTop + plotH - y130)}
                          fill="url(#dangerZoneGradient)"
                        />
                      )}

                      {horizontalGrids.map((g, i) => (
                        <g key={i}>
                          <line
                            x1={pLeft}
                            y1={g.y}
                            x2={pLeft + plotW}
                            y2={g.y}
                            stroke="#1e293b"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        </g>
                      ))}

                      {/* 130% Alert Line */}
                      {y130 >= pTop && y130 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y130}
                            x2={pLeft + plotW}
                            y2={y130}
                            stroke="#f43f5e"
                            strokeWidth="1.2"
                            strokeDasharray="5 3"
                            opacity="0.85"
                          />
                          <text x={pLeft + 4} y={y130 - 3} fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            130% 斷頭線
                          </text>
                        </g>
                      )}

                      {/* 140% Warning Line */}
                      {y140 >= pTop && y140 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y140}
                            x2={pLeft + plotW}
                            y2={y140}
                            stroke="#f59e0b"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.8"
                          />
                          <text x={pLeft + 4} y={y140 - 3} fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                            140% 追繳線
                          </text>
                        </g>
                      )}

                      {/* 160% Benchmark line */}
                      {y160 >= pTop && y160 <= pTop + plotH && (
                        <line
                          x1={pLeft}
                          y1={y160}
                          x2={pLeft + plotW}
                          y2={y160}
                          stroke="#38bdf8"
                          strokeWidth="1"
                          strokeDasharray="2 4"
                          opacity="0.5"
                        />
                      )}

                      {/* 170% Overheated line */}
                      {y170 >= pTop && y170 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y170}
                            x2={pLeft + plotW}
                            y2={y170}
                            stroke="#c084fc"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.8"
                          />
                          <text x={pLeft + 4} y={y170 - 3} fill="#c084fc" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                            170% 過熱線
                          </text>
                        </g>
                      )}

                      {/* Left Y-axis labels: TAIEX */}
                      <text x={pLeft - 5} y={pTop + 4} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMax.toLocaleString()}
                      </text>
                      {horizontalGrids.map((g, i) => (
                        <text key={i} x={pLeft - 5} y={g.y + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                          {Math.round(g.valTaiex).toLocaleString()}
                        </text>
                      ))}
                      <text x={pLeft - 5} y={pTop + plotH} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMin.toLocaleString()}
                      </text>

                      {/* Right Y-axis labels: Ratio % */}
                      <text x={pLeft + plotW + 5} y={pTop + 4} textAnchor="start" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yRatioMax}%
                      </text>
                      {horizontalGrids.map((g, i) => (
                        <text key={i} x={pLeft + plotW + 5} y={g.y + 3} textAnchor="start" fill="#64748b" fontSize="8" fontFamily="monospace">
                          {g.valRatio.toFixed(0)}%
                        </text>
                      ))}
                      <text x={pLeft + plotW + 5} y={pTop + plotH} textAnchor="start" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yRatioMin}%
                      </text>

                      {/* Path 1: TAIEX Area & Line (Blue) */}
                      <path d={taiexAreaD} fill="url(#taiexGradient)" />
                      <path d={taiexLineD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Path 2: Margin Ratio Line (Amber) */}
                      <path d={ratioLineD} fill="none" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

                      {/* X-axis baseline */}
                      <line x1={pLeft} y1={pTop + plotH} x2={pLeft + plotW} y2={pTop + plotH} stroke="#334155" strokeWidth="1" />

                      {/* X-axis date labels */}
                      {xTicks.map((t, i) => (
                        <text
                          key={i}
                          x={t.x}
                          y={pTop + plotH + 16}
                          textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                          fill="#64748b"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          {t.date.slice(5)}
                        </text>
                      ))}

                      {/* Active Tracking Crosshair Line */}
                      <line
                        x1={activeX}
                        y1={pTop}
                        x2={activeX}
                        y2={pTop + plotH}
                        stroke="#94a3b8"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.9"
                      />

                      {/* Active Dots on Paths */}
                      <circle cx={activeX} cy={activeYTaiex} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx={activeX} cy={activeYRatio} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.8" />

                      {/* Floating In-Chart Tooltip Capsule */}
                      <g transform={`translate(${Math.max(pLeft + 50, Math.min(pLeft + plotW - 50, activeX))}, ${pTop + 10})`}>
                        <rect x="-46" y="-9" width="92" height="18" rx="4" fill="#0f172a" fillOpacity="0.92" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" textAnchor="middle" fill="#f8fafc" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                          {series[curIdx].taiexClose.toLocaleString()} / {series[curIdx].marginMaintenanceRatio.toFixed(1)}%
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>
              <div className="text-[9px] text-slate-500 text-center py-0.5 sm:hidden font-mono">
                👆 左右觸控拖動圖表檢視歷史點位
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. NEW SECTION: 台灣加權指數 & 小台指散戶多空比 · 同步雙軸走勢圖 */}
      <div
        ref={retailSectionRef}
        className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xl flex flex-col gap-2 sm:gap-2.5"
      >
        {/* Header & Signal Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Users size={15} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-100 tracking-tight">
                    加權指數 & 小台散戶多空比
                  </h3>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    期交所官方真實籌碼
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Fast Jump to Margin Chart */}
            <button
              onClick={() => marginSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="sm:hidden text-[10px] font-semibold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 px-2 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer"
            >
              <span>維持率走勢</span>
              <ArrowUp size={11} />
            </button>
          </div>

          {/* Trader Signal Badge */}
          {data && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold border flex items-center gap-1 ${
                data.retailSignal === 'EXTREME_BULLISH'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : data.retailSignal === 'BULLISH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : data.retailSignal === 'BEARISH'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : data.retailSignal === 'EXTREME_BEARISH'
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400 animate-pulse'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                <Compass size={12} />
                <span>{data.retailSignalLabel}</span>
              </span>
            </div>
          )}
        </div>

        {/* Legend: Horizontal scrollable strip on mobile */}
        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs overflow-x-auto no-scrollbar bg-slate-950/70 border border-slate-800/80 px-2.5 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">加權指數 [左]</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2 bg-rose-500/80 rounded-xs inline-block" />
            <span className="text-slate-300 font-medium">散戶偏多 [正值/誘多]</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2 bg-emerald-500/80 rounded-xs inline-block" />
            <span className="text-slate-300 font-medium">散戶偏空 [負值/軋空]</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-slate-400 inline-block" />
            <span>0% 中軸線</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-rose-500 inline-block" />
            <span>+20% 偏多套牢</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <span className="w-2.5 border-b border-dashed border-emerald-500 inline-block" />
            <span>-20% 主力軋空</span>
          </div>
        </div>

        {/* Active Inspection Crosshair Inspector Banner (Streamlined Compact HUD) */}
        {activeRetailPoint && (
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5 flex-wrap text-[11px] sm:text-xs shadow-xs">
            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              <Calendar size={11} className="text-slate-400" />
              <span className="font-mono font-bold text-slate-200">{activeRetailPoint.date}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 mr-1">加權:</span>
                <span className="font-mono font-bold text-blue-400">
                  {activeRetailPoint.taiexClose.toLocaleString()}
                </span>
                <span className={`font-mono text-[10px] ml-1 ${activeRetailPoint.taiexChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ({activeRetailPoint.taiexChange >= 0 ? `+${activeRetailPoint.taiexChange}` : activeRetailPoint.taiexChange})
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">散戶比:</span>
                <span className={`font-mono font-black ${
                  activeRetailPoint.retailRatio > 20
                    ? 'text-rose-400'
                    : activeRetailPoint.retailRatio > 0
                    ? 'text-amber-400'
                    : activeRetailPoint.retailRatio < -20
                    ? 'text-emerald-400'
                    : 'text-blue-400'
                }`}>
                  {activeRetailPoint.retailRatio > 0 ? `+${activeRetailPoint.retailRatio}%` : `${activeRetailPoint.retailRatio}%`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">淨部位:</span>
                <span className={`font-mono font-bold ${activeRetailPoint.retailNet >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeRetailPoint.retailNet >= 0 ? `+${activeRetailPoint.retailNet.toLocaleString()}口` : `${activeRetailPoint.retailNet.toLocaleString()}口`}
                </span>
              </div>
              <div className="hidden md:block text-slate-400 text-[10px] font-mono">
                <span>(多 {activeRetailPoint.retailLong.toLocaleString()} / 空 {activeRetailPoint.retailShort.toLocaleString()})</span>
              </div>
            </div>
          </div>
        )}

        {/* Dual-Axis SVG Chart: Retail Sentiment vs TAIEX (Height optimized for mobile) */}
        <div className="relative w-full overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-lg p-0.5 select-none">
          {isLoading ? (
            <div className="h-52 sm:h-72 lg:h-88 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={20} className="animate-spin text-purple-500" />
              <span className="text-xs">載入加權指數與散戶多空比中...</span>
            </div>
          ) : error ? (
            <div className="h-52 sm:h-72 lg:h-88 flex flex-col items-center justify-center gap-2 text-rose-400 p-4 text-center">
              <AlertTriangle size={20} />
              <span className="text-xs">{error}</span>
            </div>
          ) : retailChartMetrics && data && data.series.length > 1 ? (
            <div className="w-full">
              <svg
                ref={retailChartSvgRef}
                viewBox="0 0 900 340"
                className="w-full h-52 sm:h-72 lg:h-88 touch-none"
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch (_) {}
                  handleRetailPointerMove(e);
                }}
                onPointerMove={handleRetailPointerMove}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch (_) {}
                }}
                onPointerLeave={handleRetailPointerLeave}
                onPointerCancel={handleRetailPointerLeave}
              >
                <defs>
                  <linearGradient id="retailTaiexGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="retailBullishBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="retailBearishBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {(() => {
                  const { count, yTaiexMin, yTaiexMax, yRetailMin, yRetailMax, maxAbsRatio } = retailChartMetrics;
                  const series = data.series;
                  const pLeft = 48;
                  const pRight = 44;
                  const pTop = 24;
                  const pBottom = 28;
                  const svgW = 900;
                  const svgH = 340;
                  const plotW = svgW - pLeft - pRight;
                  const plotH = svgH - pTop - pBottom;

                  const getX = (idx: number) => pLeft + (idx / (count - 1)) * plotW;
                  const getYTaiex = (val: number) => {
                    const ratio = (val - yTaiexMin) / (yTaiexMax - yTaiexMin || 1);
                    return pTop + plotH - ratio * plotH;
                  };
                  const getYRetail = (val: number) => {
                    const ratio = (val - yRetailMin) / (yRetailMax - yRetailMin || 1);
                    return pTop + plotH - ratio * plotH;
                  };

                  const y0 = getYRetail(0);
                  const yPlus20 = getYRetail(20);
                  const yMinus20 = getYRetail(-20);

                  let taiexLineD = '';
                  let taiexAreaD = '';
                  let retailSplineD = '';

                  series.forEach((pt, i) => {
                    const x = getX(i);
                    const yT = getYTaiex(pt.taiexClose);
                    const yR = getYRetail(pt.retailRatio || 0);

                    if (i === 0) {
                      taiexLineD = `M ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      taiexAreaD = `M ${x.toFixed(1)} ${pTop + plotH} L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      retailSplineD = `M ${x.toFixed(1)} ${yR.toFixed(1)}`;
                    } else {
                      taiexLineD += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      taiexAreaD += ` L ${x.toFixed(1)} ${yT.toFixed(1)}`;
                      retailSplineD += ` L ${x.toFixed(1)} ${yR.toFixed(1)}`;
                    }
                  });

                  taiexAreaD += ` L ${pLeft + plotW} ${pTop + plotH} Z`;

                  const barWidth = Math.max(2, Math.min(9, (plotW / count) * 0.72));

                  const retailTicks = [
                    { val: maxAbsRatio, y: getYRetail(maxAbsRatio) },
                    { val: 20, y: yPlus20 },
                    { val: 0, y: y0 },
                    { val: -20, y: yMinus20 },
                    { val: -maxAbsRatio, y: getYRetail(-maxAbsRatio) },
                  ];

                  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(r => {
                    const idx = Math.min(count - 1, Math.round(r * (count - 1)));
                    return { x: getX(idx), date: series[idx].date };
                  });

                  const curIdx = activeRetailIndex !== null ? activeRetailIndex : count - 1;
                  const activeX = getX(curIdx);
                  const activeYTaiex = getYTaiex(series[curIdx].taiexClose);
                  const activeYRetail = getYRetail(series[curIdx].retailRatio || 0);

                  return (
                    <g>
                      {/* Grid Lines */}
                      {retailTicks.map((t, i) => (
                        <g key={i}>
                          <line
                            x1={pLeft}
                            y1={t.y}
                            x2={pLeft + plotW}
                            y2={t.y}
                            stroke={t.val === 0 ? '#475569' : '#1e293b'}
                            strokeWidth={t.val === 0 ? '1.5' : '1'}
                            strokeDasharray={t.val === 0 ? 'none' : '4 4'}
                          />
                        </g>
                      ))}

                      {/* +20% Warning Line (Rose) */}
                      {yPlus20 >= pTop && yPlus20 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={yPlus20}
                            x2={pLeft + plotW}
                            y2={yPlus20}
                            stroke="#f43f5e"
                            strokeWidth="1.1"
                            strokeDasharray="5 3"
                            opacity="0.8"
                          />
                          <text x={pLeft + 4} y={yPlus20 - 3} fill="#f43f5e" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                            +20% 偏多套牢
                          </text>
                        </g>
                      )}

                      {/* 0% Line text */}
                      <text x={pLeft + 4} y={y0 - 3} fill="#94a3b8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                        0% 多空分界
                      </text>

                      {/* -20% Squeeze Line (Emerald) */}
                      {yMinus20 >= pTop && yMinus20 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={yMinus20}
                            x2={pLeft + plotW}
                            y2={yMinus20}
                            stroke="#10b981"
                            strokeWidth="1.1"
                            strokeDasharray="5 3"
                            opacity="0.8"
                          />
                          <text x={pLeft + 4} y={yMinus20 - 3} fill="#10b981" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                            -20% 主力軋空
                          </text>
                        </g>
                      )}

                      {/* Left Y-axis labels: TAIEX */}
                      <text x={pLeft - 5} y={pTop + 4} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMax.toLocaleString()}
                      </text>
                      <text x={pLeft - 5} y={y0 + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                        {Math.round((yTaiexMax + yTaiexMin) / 2).toLocaleString()}
                      </text>
                      <text x={pLeft - 5} y={pTop + plotH} textAnchor="end" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMin.toLocaleString()}
                      </text>

                      {/* Right Y-axis labels: Retail % */}
                      {retailTicks.map((t, i) => (
                        <text
                          key={i}
                          x={pLeft + plotW + 5}
                          y={t.y + 3}
                          textAnchor="start"
                          fill={t.val > 0 ? '#f43f5e' : t.val < 0 ? '#10b981' : '#94a3b8'}
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {t.val > 0 ? `+${t.val}%` : `${t.val}%`}
                        </text>
                      ))}

                      {/* Retail Long/Short Ratio Histogram Bars */}
                      {series.map((pt, i) => {
                        const x = getX(i) - barWidth / 2;
                        const ratio = pt.retailRatio || 0;
                        const yVal = getYRetail(ratio);
                        const isPositive = ratio >= 0;
                        const barY = isPositive ? yVal : y0;
                        const barH = Math.max(1, Math.abs(yVal - y0));

                        return (
                          <rect
                            key={i}
                            x={x}
                            y={barY}
                            width={barWidth}
                            height={barH}
                            fill={isPositive ? 'url(#retailBullishBarGrad)' : 'url(#retailBearishBarGrad)'}
                            rx="1"
                          />
                        );
                      })}

                      {/* Path 1: TAIEX Area & Line (Blue) */}
                      <path d={taiexAreaD} fill="url(#retailTaiexGradient)" />
                      <path d={taiexLineD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Path 2: Retail Ratio Curve Line (Purple / Violet) */}
                      <path d={retailSplineD} fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

                      {/* X-axis baseline */}
                      <line x1={pLeft} y1={pTop + plotH} x2={pLeft + plotW} y2={pTop + plotH} stroke="#334155" strokeWidth="1" />

                      {/* X-axis date labels */}
                      {xTicks.map((t, i) => (
                        <text
                          key={i}
                          x={t.x}
                          y={pTop + plotH + 16}
                          textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                          fill="#64748b"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          {t.date.slice(5)}
                        </text>
                      ))}

                      {/* Active Tracking Crosshair Line */}
                      <line
                        x1={activeX}
                        y1={pTop}
                        x2={activeX}
                        y2={pTop + plotH}
                        stroke="#94a3b8"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.9"
                      />

                      {/* Active Dots on Paths */}
                      <circle cx={activeX} cy={activeYTaiex} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx={activeX} cy={activeYRetail} r="4.5" fill="#c084fc" stroke="#ffffff" strokeWidth="1.8" />

                      {/* Floating In-Chart Tooltip Capsule */}
                      <g transform={`translate(${Math.max(pLeft + 50, Math.min(pLeft + plotW - 50, activeX))}, ${pTop + 10})`}>
                        <rect x="-48" y="-9" width="96" height="18" rx="4" fill="#0f172a" fillOpacity="0.92" stroke="#334155" strokeWidth="0.8" />
                        <text x="0" y="3.5" textAnchor="middle" fill="#f8fafc" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                          {series[curIdx].taiexClose.toLocaleString()} / {series[curIdx].retailRatio > 0 ? `+${series[curIdx].retailRatio}%` : `${series[curIdx].retailRatio}%`}
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>
              <div className="text-[9px] text-slate-500 text-center py-0.5 sm:hidden font-mono">
                👆 左右觸控拖動圖表檢視散戶籌碼多空
              </div>
            </div>
          ) : null}
        </div>

        {/* 頂級操盤手小台散戶多空比實戰解碼指南 (Mobile Collapsible Accordion) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 sm:p-3 mt-0.5">
          <button
            onClick={() => setIsTraderGuideOpen(prev => !prev)}
            className="w-full flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-200 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Compass size={13} className="text-purple-400" />
              <span>操盤手小台籌碼實戰操作指引 · 反指標解碼</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="sm:hidden">{isTraderGuideOpen ? '收合' : '點擊展開'}</span>
              {isTraderGuideOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>

          {/* Collapsible Content */}
          <div className={`${isTraderGuideOpen ? 'block' : 'hidden sm:block'} mt-2 pt-2 border-t border-slate-800/80`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs leading-relaxed">
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-2 sm:p-2.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                  <ArrowUpRight size={12} />
                  <span>① 主力強勢軋空 (多空比 &lt; -20%)</span>
                </span>
                <p className="text-slate-300 text-[10px] sm:text-[11px] mt-1">
                  當散戶多空比跌破 <strong>-20% 以下</strong>，代表散戶沿路摸頂放空被套。只要散戶不停損、多空比未由負轉正，主力便會維持強勢軋空噴出，切忌盲目摸頂猜高！
                </p>
              </div>

              <div className="bg-slate-900/80 border border-rose-500/30 rounded-lg p-2 sm:p-2.5">
                <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px]">
                  <ArrowDownRight size={12} />
                  <span>② 主力誘多殺多 (多空比 &gt; +20%)</span>
                </span>
                <p className="text-slate-300 text-[10px] sm:text-[11px] mt-1">
                  指數遇阻回檔，散戶多空比卻逆勢飆破 <strong>+20%</strong>，代表散戶盲目抄底接刀。此時主力籌碼占優，極易摜破月線進行「誘多殺多雙斷頭」，切忌盲目開槓桿攤平！
                </p>
              </div>

              <div className="bg-slate-900/80 border border-blue-500/30 rounded-lg p-2 sm:p-2.5">
                <span className="font-bold text-blue-400 flex items-center gap-1 text-[11px]">
                  <BarChart2 size={12} />
                  <span>③ 反向背離轉折預警</span>
                </span>
                <p className="text-slate-300 text-[10px] sm:text-[11px] mt-1">
                  若指數創波段新高，但<strong>小台散戶多空比由負轉正急速攀升</strong>（散戶追價作多），常為主力高檔調節警訊；反之，若指數破底但散戶比轉負收斂，常為黃金大底先兆！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
