import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MarketMarginSummary, DailyMarketMarginPoint, LeverageRiskLevel } from '../types/stock.ts';
import { fetchMarketMarginMaintenance } from '../services/api.ts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Scale,
  Flame,
  Activity,
  Layers,
  HelpCircle,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Sliders,
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

  // Hover / Touch tracking for interactive crosshair on dual-axis chart
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  // Stress test custom slider for interactive simulation
  const [customDropPoints, setCustomDropPoints] = useState<number>(1000);

  const loadData = useCallback(async (range: TimeRange, forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await fetchMarketMarginMaintenance(range, forceRefresh);
      if (res && res.series && res.series.length > 0) {
        setData(res);
        setActiveIndex(null);
      } else {
        setError('未能取得大盤融資維持率資料，請稍候重試');
      }
    } catch (e: any) {
      console.error('Failed to load margin maintenance data:', e);
      setError('連線失敗，請檢查網路連線');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange, loadData]);

  // Active point for tooltip (defaults to latest point if not hovering)
  const activePoint: DailyMarketMarginPoint | null = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) return null;
    if (activeIndex !== null && data.series[activeIndex]) {
      return data.series[activeIndex];
    }
    return data.series[data.series.length - 1];
  }, [data, activeIndex]);

  // Chart dimension & coordinate calculations
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
    // Y-axis for margin maintenance ratio: pin bottom at least around 125% so 130% danger zone is clearly visible
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

  // Interactive Touch & Pointer Tracking
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !data || !data.series || data.series.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const offsetX = clientX - rect.left;
    const width = rect.width;

    const paddingLeft = 52;
    const paddingRight = 48;
    const plotWidth = width - paddingLeft - paddingRight;

    if (plotWidth <= 0) return;

    const ratio = Math.max(0, Math.min(1, (offsetX - paddingLeft) / plotWidth));
    const targetIdx = Math.round(ratio * (data.series.length - 1));
    setActiveIndex(Math.max(0, Math.min(data.series.length - 1, targetIdx)));
  };

  const handlePointerLeave = () => {
    setActiveIndex(null);
  };

  // Helper for risk badge style
  const getRiskStyle = (level: LeverageRiskLevel) => {
    switch (level) {
      case 'PANIC_BOTTOM':
        return {
          bg: 'bg-rose-500/20',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          pill: 'bg-rose-600 text-white',
          name: '斷頭多殺多風暴區',
          stars: '★★★★★ (極度超跌)',
        };
      case 'MARGIN_CALL_WARNING':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          pill: 'bg-amber-500 text-slate-950 font-bold',
          name: '融資追繳風暴警戒',
          stars: '★★★★☆ (高壓警戒)',
        };
      case 'HEALTHY_DELEVERAGING':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          pill: 'bg-blue-600 text-white',
          name: '健康降槓桿整理',
          stars: '★★☆☆☆ (中性安全)',
        };
      case 'BULL_EXPANSION':
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          pill: 'bg-emerald-600 text-white',
          name: '強勢多頭獲利推升',
          stars: '★☆☆☆☆ (健康多頭)',
        };
      case 'OVERHEATED_DANGER':
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/50',
          text: 'text-purple-400',
          pill: 'bg-purple-600 text-white',
          name: '融資過熱超買警戒',
          stars: '★★★☆☆ (過熱浮額)',
        };
    }
  };

  // Custom stress test calculation
  const simulatedCustomRatio = useMemo(() => {
    if (!data) return 0;
    const currentPrice = data.currentTaiex;
    const targetPrice = Math.max(1000, currentPrice - customDropPoints);
    const dropPct = (customDropPoints / currentPrice);
    // simulated ratio drops proportionally with collateral market value
    const simRatio = Number((data.currentMaintenanceRatio * (1 - dropPct)).toFixed(1));
    return simRatio;
  }, [data, customDropPoints]);

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 animate-fadeIn">
      {/* 1. Header Banner & Live Market Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Scale size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-100 tracking-tight">
                  大盤融資維持率 · 加權指數槓桿風險監控
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Activity size={11} />
                  <span>實時量化模型</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                真實串接 Yahoo Finance (^TWII 加權指數) 與 TWSE 台灣證券交易所融資信用統計數據
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
            {data && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                更新日期：{data.latestDate}
              </span>
            )}
            <button
              onClick={() => loadData(timeRange, true)}
              disabled={isRefreshing || isLoading}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? '同步數據中...' : '重新整理'}</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Cards Grid */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 mt-3.5">
            {/* KPI 1: 台灣加權指數 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <span>台灣加權指數 (^TWII)</span>
              </span>
              <div className="mt-1">
                <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-100">
                  {data.currentTaiex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.taiexChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {data.taiexChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{data.taiexChange >= 0 ? `+${data.taiexChange}` : data.taiexChange}</span>
                  <span>({data.taiexChangePct >= 0 ? `+${data.taiexChangePct}%` : `${data.taiexChangePct}%`})</span>
                </div>
              </div>
            </div>

            {/* KPI 2: 大盤融資維持率 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>大盤融資維持率</span>
                <span className="text-[10px] text-slate-500">基準 166.7%</span>
              </span>
              <div className="mt-1">
                <div className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
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
                <div className={`text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.ratioChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>前日比：</span>
                  <span>{data.ratioChange >= 0 ? `+${data.ratioChange}%` : `${data.ratioChange}%`}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: 全市場融資餘額 */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>全市場融資餘額</span>
                <span className="text-[10px] text-slate-500">集中市場</span>
              </span>
              <div className="mt-1">
                <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-100">
                  {data.currentMarginBalance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  <span className="text-xs font-normal text-slate-400 ml-1">億元</span>
                </div>
                <div className={`text-xs font-bold font-mono flex items-center gap-1 mt-0.5 ${
                  data.marginBalanceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>單日增減：</span>
                  <span>{data.marginBalanceChange >= 0 ? `+${data.marginBalanceChange}億` : `${data.marginBalanceChange}億`}</span>
                </div>
              </div>
            </div>

            {/* KPI 4: 當前槓桿風險等級 */}
            <div className={`rounded-xl p-3 flex flex-col justify-between border ${getRiskStyle(data.riskLevel).bg} ${getRiskStyle(data.riskLevel).border}`}>
              <span className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>目前槓桿風險評級</span>
                <ShieldAlert size={14} className={getRiskStyle(data.riskLevel).text} />
              </span>
              <div className="mt-1">
                <div className={`text-sm sm:text-base font-extrabold ${getRiskStyle(data.riskLevel).text}`}>
                  {getRiskStyle(data.riskLevel).name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {getRiskStyle(data.riskLevel).stars}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Leverage Risk Gauge & Thermometer Visual Banner */}
      {data && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              <span>大盤融資槓桿風險刻度儀表</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              當前落點：<strong className="text-slate-100 font-bold">{data.currentMaintenanceRatio.toFixed(1)}%</strong>
            </span>
          </div>

          {/* Color bar thermometer */}
          <div className="relative pt-6 pb-2">
            {/* Pointer Pin indicator */}
            {(() => {
              // Map 120% to 0%, 180% to 100%
              const clampedRatio = Math.max(120, Math.min(180, data.currentMaintenanceRatio));
              const leftPct = ((clampedRatio - 120) / (180 - 120)) * 100;
              return (
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 z-10"
                  style={{ left: `${leftPct}%` }}
                >
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-white text-slate-950 shadow-md whitespace-nowrap">
                    {data.currentMaintenanceRatio.toFixed(1)}%
                  </span>
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                </div>
              );
            })()}

            {/* Segmented Risk Bar */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800 shadow-inner">
              {/* < 130%: 120 ~ 130 (10 / 60 = 16.7%) */}
              <div className="h-full bg-linear-to-r from-red-600 to-rose-600 relative group" style={{ width: '16.7%' }} title="< 130% 斷頭多殺多風暴區" />
              {/* 130% ~ 140%: (10 / 60 = 16.7%) */}
              <div className="h-full bg-linear-to-r from-rose-500 to-amber-500 relative group" style={{ width: '16.7%' }} title="130% ~ 140% 融資追繳警戒區" />
              {/* 140% ~ 160%: (20 / 60 = 33.3%) */}
              <div className="h-full bg-linear-to-r from-amber-500 to-blue-500 relative group" style={{ width: '33.3%' }} title="140% ~ 160% 降槓桿健康整理區" />
              {/* 160% ~ 170%: (10 / 60 = 16.7%) */}
              <div className="h-full bg-linear-to-r from-blue-500 to-emerald-500 relative group" style={{ width: '16.7%' }} title="160% ~ 170% 強勢多頭推升區" />
              {/* > 170%: 170 ~ 180 (10 / 60 = 16.7%) */}
              <div className="h-full bg-linear-to-r from-emerald-500 to-purple-600 relative group" style={{ width: '16.6%' }} title="> 170% 融資過熱超買警戒區" />
            </div>

            {/* Ticks and Zone Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono px-0.5">
              <span className="text-rose-400 font-bold">120% 斷頭底</span>
              <span className="text-amber-400 font-bold">130% 斷頭線</span>
              <span className="text-amber-300">140% 追繳線</span>
              <span className="text-blue-400">160% 基準軸</span>
              <span className="text-purple-400 font-bold">170% 過熱</span>
              <span className="text-slate-400">180%+</span>
            </div>
          </div>

          {/* Risk Detail Description Box */}
          <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed ${getRiskStyle(data.riskLevel).bg} ${getRiskStyle(data.riskLevel).border}`}>
            <div className="font-bold text-slate-100 flex items-center gap-1.5 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getRiskStyle(data.riskLevel).pill}`}>
                {getRiskStyle(data.riskLevel).name}
              </span>
              <span>{data.riskTitle}</span>
            </div>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              {data.riskDescription}
            </p>
          </div>
        </div>
      )}

      {/* 3. Dual-Axis Interactive Chart Section (台灣加權指數 vs 大盤融資維持率) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col gap-3">
        {/* Top Chart Controls & Timeframe Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight">
              台股加權指數 & 大盤融資維持率 · 同步雙軸走勢圖
            </h3>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 self-start sm:self-auto shadow-inner">
            {(['1mo', '3mo', '6mo', '1y', '2y'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '1mo' ? '1個月' : r === '3mo' ? '3個月' : r === '6mo' ? '6個月' : r === '1y' ? '1年' : '2年'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs flex-wrap bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-blue-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">加權指數 (^TWII) [左軸]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-amber-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">大盤融資維持率 (%) [右軸]</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3.5 border-b border-dashed border-rose-500 inline-block" />
            <span className="text-[11px]">130% 斷頭線</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3.5 border-b border-dashed border-amber-500 inline-block" />
            <span className="text-[11px]">140% 追繳線</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <span className="w-3.5 border-b border-dashed border-purple-500 inline-block" />
            <span className="text-[11px]">170% 過熱線</span>
          </div>
        </div>

        {/* Active Inspection Crosshair Inspector Banner */}
        {activePoint && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-wrap text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-slate-400" />
              <span className="font-mono font-bold text-slate-100">{activePoint.date}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 mr-1">加權指數:</span>
                <span className="font-mono font-extrabold text-blue-400">
                  {activePoint.taiexClose.toLocaleString()}
                </span>
                <span className={`font-mono text-[11px] ml-1 ${activePoint.taiexChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ({activePoint.taiexChange >= 0 ? `+${activePoint.taiexChange}` : activePoint.taiexChange})
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">融資維持率:</span>
                <span className={`font-mono font-black ${
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
              <div className="hidden sm:block">
                <span className="text-slate-400 mr-1">融資餘額:</span>
                <span className="font-mono text-slate-200">
                  {activePoint.marginBalance.toFixed(1)}億
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskStyle(activePoint.riskLevel).pill}`}>
                {getRiskStyle(activePoint.riskLevel).name}
              </span>
            </div>
          </div>
        )}

        {/* Dual-Axis SVG Chart */}
        <div className="relative w-full overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-xl p-1 select-none">
          {isLoading ? (
            <div className="h-72 sm:h-96 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw size={24} className="animate-spin text-blue-500" />
              <span className="text-xs">載入加權指數與融資維持率資料中...</span>
            </div>
          ) : error ? (
            <div className="h-72 sm:h-96 flex flex-col items-center justify-center gap-2 text-rose-400 p-4 text-center">
              <AlertTriangle size={24} />
              <span className="text-xs">{error}</span>
              <button
                onClick={() => loadData(timeRange, true)}
                className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg cursor-pointer"
              >
                重試連線
              </button>
            </div>
          ) : chartMetrics && data && data.series.length > 1 ? (
            <div className="w-full">
              {/* Responsive SVG */}
              <svg
                ref={chartSvgRef}
                viewBox="0 0 900 380"
                className="w-full h-72 sm:h-96 touch-none"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) {
                    handlePointerMove({ clientX: touch.clientX } as any);
                  }
                }}
              >
                <defs>
                  {/* Taiex blue area gradient */}
                  <linearGradient id="taiexGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>

                  {/* 130% Danger Zone red gradient */}
                  <linearGradient id="dangerZoneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {(() => {
                  const width = 900;
                  const height = 380;
                  const pLeft = 60; // Space for Left Y-axis (TAIEX)
                  const pRight = 55; // Space for Right Y-axis (Ratio %)
                  const pTop = 25;
                  const pBottom = 35;
                  const plotW = width - pLeft - pRight;
                  const plotH = height - pTop - pBottom;

                  const { yTaiexMin, yTaiexMax, yRatioMin, yRatioMax } = chartMetrics;
                  const series = data.series;
                  const count = series.length;

                  // Scales
                  const getX = (idx: number) => pLeft + (idx / (count - 1)) * plotW;
                  const getYTaiex = (val: number) =>
                    pTop + plotH - ((val - yTaiexMin) / (yTaiexMax - yTaiexMin)) * plotH;
                  const getYRatio = (val: number) =>
                    pTop + plotH - ((val - yRatioMin) / (yRatioMax - yRatioMin)) * plotH;

                  // 130% line Y pos & 140% line Y pos & 170% line Y pos
                  const y130 = getYRatio(130);
                  const y140 = getYRatio(140);
                  const y160 = getYRatio(160);
                  const y170 = getYRatio(170);

                  // Taiex points path
                  const taiexPoints = series.map((s, i) => `${getX(i).toFixed(1)},${getYTaiex(s.taiexClose).toFixed(1)}`);
                  const taiexLineD = `M ${taiexPoints.join(' L ')}`;
                  const taiexAreaD = `M ${getX(0)},${pTop + plotH} L ${taiexPoints.join(' L ')} L ${getX(count - 1)},${pTop + plotH} Z`;

                  // Margin ratio points path
                  const ratioPoints = series.map((s, i) => `${getX(i).toFixed(1)},${getYRatio(s.marginMaintenanceRatio).toFixed(1)}`);
                  const ratioLineD = `M ${ratioPoints.join(' L ')}`;

                  // Grid lines
                  const horizontalGrids = [0.25, 0.5, 0.75].map(ratio => {
                    const y = pTop + plotH * ratio;
                    const valTaiex = yTaiexMax - (yTaiexMax - yTaiexMin) * ratio;
                    const valRatio = yRatioMax - (yRatioMax - yRatioMin) * ratio;
                    return { y, valTaiex, valRatio };
                  });

                  // X-axis date labels (5 ticks)
                  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(r => {
                    const idx = Math.min(count - 1, Math.round(r * (count - 1)));
                    return { x: getX(idx), date: series[idx].date };
                  });

                  // Active point position
                  const curIdx = activeIndex !== null ? activeIndex : count - 1;
                  const activeX = getX(curIdx);
                  const activeYTaiex = getYTaiex(series[curIdx].taiexClose);
                  const activeYRatio = getYRatio(series[curIdx].marginMaintenanceRatio);

                  return (
                    <g>
                      {/* Danger Zone under 130% */}
                      {y130 < pTop + plotH && (
                        <rect
                          x={pLeft}
                          y={y130}
                          width={plotW}
                          height={Math.max(0, pTop + plotH - y130)}
                          fill="url(#dangerZoneGradient)"
                        />
                      )}

                      {/* Horizontal Grid lines */}
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

                      {/* 130% Liquidation Alert Line */}
                      {y130 >= pTop && y130 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y130}
                            x2={pLeft + plotW}
                            y2={y130}
                            stroke="#f43f5e"
                            strokeWidth="1.5"
                            strokeDasharray="5 3"
                            opacity="0.85"
                          />
                          <text
                            x={pLeft + 4}
                            y={y130 - 4}
                            fill="#f43f5e"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            130% 斷頭多殺多風暴線
                          </text>
                        </g>
                      )}

                      {/* 140% Margin Call Warning Line */}
                      {y140 >= pTop && y140 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y140}
                            x2={pLeft + plotW}
                            y2={y140}
                            stroke="#f59e0b"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                            opacity="0.8"
                          />
                          <text
                            x={pLeft + 4}
                            y={y140 - 4}
                            fill="#f59e0b"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            140% 追繳警戒線
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

                      {/* 170% Overheated warning line */}
                      {y170 >= pTop && y170 <= pTop + plotH && (
                        <g>
                          <line
                            x1={pLeft}
                            y1={y170}
                            x2={pLeft + plotW}
                            y2={y170}
                            stroke="#c084fc"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                            opacity="0.8"
                          />
                          <text
                            x={pLeft + 4}
                            y={y170 - 4}
                            fill="#c084fc"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            170% 融資過熱超買線
                          </text>
                        </g>
                      )}

                      {/* Left Y-axis labels: TAIEX */}
                      <text x={pLeft - 6} y={pTop + 5} textAnchor="end" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMax.toLocaleString()}
                      </text>
                      {horizontalGrids.map((g, i) => (
                        <text key={i} x={pLeft - 6} y={g.y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                          {Math.round(g.valTaiex).toLocaleString()}
                        </text>
                      ))}
                      <text x={pLeft - 6} y={pTop + plotH} textAnchor="end" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {yTaiexMin.toLocaleString()}
                      </text>

                      {/* Right Y-axis labels: Ratio % */}
                      <text x={pLeft + plotW + 6} y={pTop + 5} textAnchor="start" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {yRatioMax}%
                      </text>
                      {horizontalGrids.map((g, i) => (
                        <text key={i} x={pLeft + plotW + 6} y={g.y + 3} textAnchor="start" fill="#64748b" fontSize="9" fontFamily="monospace">
                          {g.valRatio.toFixed(0)}%
                        </text>
                      ))}
                      <text x={pLeft + plotW + 6} y={pTop + plotH} textAnchor="start" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {yRatioMin}%
                      </text>

                      {/* Path 1: TAIEX Area & Line (Blue) */}
                      <path d={taiexAreaD} fill="url(#taiexGradient)" />
                      <path d={taiexLineD} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Path 2: Margin Ratio Line (Amber) */}
                      <path d={ratioLineD} fill="none" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

                      {/* X-axis baseline */}
                      <line x1={pLeft} y1={pTop + plotH} x2={pLeft + plotW} y2={pTop + plotH} stroke="#334155" strokeWidth="1" />

                      {/* X-axis date labels */}
                      {xTicks.map((t, i) => (
                        <text
                          key={i}
                          x={t.x}
                          y={pTop + plotH + 18}
                          textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {t.date.slice(5)}
                        </text>
                      ))}

                      {/* Active Tracking Vertical Crosshair Line */}
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
                      <circle cx={activeX} cy={activeYTaiex} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={activeX} cy={activeYRatio} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    </g>
                  );
                })()}
              </svg>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. Institutional Trader Stress Test Simulation Card (操盤手回檔壓力推演) */}
      {data && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-1.5">
              <Sliders size={16} className="text-rose-400" />
              <span>操盤手極限回檔壓力測試 · 斷頭點位精密推演</span>
            </h3>
            <span className="text-[11px] text-slate-400">大盤跌點 vs 斷頭觸發精算</span>
          </div>

          {/* Quick Buffer Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: 距 140% 追繳警戒線 */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <AlertTriangle size={14} />
                  <span>距離 140% 融資追繳警戒線</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-100 mt-1">
                  尚可承受 <span className="text-amber-400">-{data.pointsDropTo140Warning.toLocaleString()}</span> 點
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  加權指數需再回檔約 <strong className="text-amber-300 font-mono">-{data.percentDropTo140Warning}%</strong> 才會面臨全市場追繳令
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                140% 追繳
              </span>
            </div>

            {/* Box 2: 距 130% 斷頭萬箭齊發線 */}
            <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 sm:p-3.5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <ShieldAlert size={14} />
                  <span>距離 130% 斷頭多殺多臨界線</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-100 mt-1">
                  尚可承受 <span className="text-rose-400">-{data.pointsDropTo130Liquidation.toLocaleString()}</span> 點
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  加權指數需重挫達 <strong className="text-rose-400 font-mono">-{data.percentDropTo130Liquidation}%</strong> 才會觸發系統性斷頭潮
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                130% 斷頭
              </span>
            </div>
          </div>

          {/* Interactive Stress Slider */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mt-1 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                模擬大盤自當前回檔跌點：
                <strong className="text-rose-400 font-mono text-sm ml-1">-{customDropPoints} 點</strong>
                <span className="text-slate-400 text-[11px] ml-1">
                  (-{((customDropPoints / data.currentTaiex) * 100).toFixed(1)}%)
                </span>
              </span>
              <span className="text-slate-400 text-[11px]">
                預估指數：{(data.currentTaiex - customDropPoints).toLocaleString()}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="12000"
              step="100"
              value={customDropPoints}
              onChange={(e) => setCustomDropPoints(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">預估大盤融資維持率降至：</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-black text-sm sm:text-base ${
                  simulatedCustomRatio < 130
                    ? 'text-rose-400'
                    : simulatedCustomRatio < 140
                    ? 'text-amber-400'
                    : 'text-blue-400'
                }`}>
                  {simulatedCustomRatio}%
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  simulatedCustomRatio < 130
                    ? 'bg-rose-600 text-white animate-pulse'
                    : simulatedCustomRatio < 140
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-blue-600 text-white'
                }`}>
                  {simulatedCustomRatio < 130
                    ? '⚠️ 觸發斷頭潮'
                    : simulatedCustomRatio < 140
                    ? '⚠️ 觸發追繳令'
                    : '維持正常安全'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Top Trader Playbook & Historical Panic Crash Bottoms (頂級操盤手實戰秘笈) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <Flame size={17} className="text-amber-400" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-100">
            頂級操盤手實戰解碼 · 融資維持率摸底逃頂精要
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
          {/* Card 1 */}
          <div className="bg-slate-950/70 border border-rose-500/30 rounded-xl p-3 flex flex-col gap-1.5">
            <span className="font-bold text-rose-400 flex items-center gap-1 text-xs sm:text-sm">
              <ShieldAlert size={14} />
              <span>130% 斷頭恐慌底</span>
            </span>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              當大盤維持率殺至 <strong>130% 甚至跌破 125%</strong> 時，代表市場上超過一半的融資戶被券商強制掛市價砍出（多殺多斷頭）。籌碼浮額在恐慌中一次洗淨，往往是<strong>幾年一遇的長線黃金波段大底</strong>（如 2020年3月新冠疫情 125%、2022年10月台積電370元時的 130%）！
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1.5">
            <span className="font-bold text-amber-400 flex items-center gap-1 text-xs sm:text-sm">
              <AlertTriangle size={14} />
              <span>140% 追繳臨界線</span>
            </span>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              維持率跌破 140% 時，券商開始發送 T+2 追繳令，若投資人未在限期內補繳保證金，將面臨強制作空或斷頭處置。此時市場極度脆弱，極易出現弱勢族群無差別補跌，操作上切忌過早開槓桿盲目攤平，需靜待<strong>融資餘額單日爆減 50 億以上</strong>後方為止跌訊號。
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-1.5">
            <span className="font-bold text-purple-400 flex items-center gap-1 text-xs sm:text-sm">
              <Flame size={14} />
              <span>170% 過熱逃頂警戒</span>
            </span>
            <p className="text-slate-300 text-[11px] sm:text-xs">
              維持率衝破 170%~175% 時，散戶融資大舉擴張槓桿，市場一片看好。若此時<strong>指數持續創高但融資維持率卻開始反向背離下滑</strong>，代表主力已經在悄悄調節倒貨，此時應逢高分批獲利了結、嚴控持股水位，防範高檔假突破急殺！
            </p>
          </div>
        </div>

        {/* Historical Reference Table */}
        <div className="mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/40 border-b border-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>台股歷史重大崩盤斷頭潮與後續反彈紀錄</span>
            <span className="text-[10px] text-slate-500">歷史量化複盤</span>
          </div>
          <div className="divide-y divide-slate-800/60 text-[11px]">
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-200">2020/03/19</span>
                <span className="text-slate-400">新冠肺炎全球股災</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-rose-400 font-bold">最低維持率 125.8%</span>
                <span className="text-emerald-400 font-bold">隨後波段 +104% (噴出萬八)</span>
              </div>
            </div>

            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-200">2022/10/25</span>
                <span className="text-slate-400">聯準會強烈升息庫存去化</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-rose-400 font-bold">最低維持率 130.2%</span>
                <span className="text-emerald-400 font-bold">隨後波段 +98% (展開AI大多頭)</span>
              </div>
            </div>

            <div className="px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-200">2024/08/05</span>
                <span className="text-slate-400">黑色星期一單日崩跌1807點</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-amber-400 font-bold">最低維持率 138.5%</span>
                <span className="text-emerald-400 font-bold">融資連2日暴減近300億後強彈</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
