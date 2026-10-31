import React, { useState, useEffect, useMemo } from 'react';
import { InstitutionalDailyRecord } from '../types/stock.ts';
import { BarChart2, Table, TrendingUp, TrendingDown, Layers, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface InstitutionalResponse {
  symbol: string;
  code: string;
  name: string;
  latestDate: string;
  summary: {
    foreignNetLots: number;
    trustNetLots: number;
    dealerNetLots: number;
    totalNetLots: number;
    cum5DayForeignLots: number;
    cum5DayTrustLots: number;
    cum5DayDealerLots: number;
    cum5DayTotalLots: number;
    cum20DayTotalLots: number;
    sentiment: string;
  };
  records: InstitutionalDailyRecord[];
}

interface InstitutionalTradesPanelProps {
  symbol: string;
  stockName: string;
  activeDate?: string | null;
  onHoverDate?: (date: string | null) => void;
}

export const InstitutionalTradesPanel: React.FC<InstitutionalTradesPanelProps> = ({
  symbol,
  stockName,
  activeDate,
  onHoverDate,
}) => {
  const [data, setData] = useState<InstitutionalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [activeFilter, setActiveFilter] = useState<'stacked' | 'all' | 'foreign' | 'trust' | 'dealer' | 'grouped'>('stacked');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedRecordDate, setSelectedRecordDate] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetch(`/api/stocks/${encodeURIComponent(symbol)}/institutional`)
      .then(res => res.json())
      .then((resData: InstitutionalResponse) => {
        if (!isCancelled) {
          setData(resData);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to load institutional records:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [symbol]);

  // Determine active displayed record: activeDate (from K-line crosshair) > selectedRecordDate > latest record
  const currentRecord = useMemo(() => {
    if (!data || !data.records || data.records.length === 0) return null;
    const targetDate = activeDate || selectedRecordDate;
    if (targetDate) {
      const match = data.records.find(r => r.date === targetDate);
      if (match) return match;
    }
    return data.records[data.records.length - 1];
  }, [data, activeDate, selectedRecordDate]);

  // Sliced recent 25 trading days for the bar chart
  const chartRecords = useMemo(() => {
    if (!data || !data.records) return [];
    return data.records.slice(-25);
  }, [data]);

  // Calculate max absolute lots for chart scaling (accounting for stacked totals)
  const maxAbsLots = useMemo(() => {
    if (chartRecords.length === 0) return 1000;
    let max = 100;
    chartRecords.forEach(r => {
      const posSum =
        (r.foreignNetLots > 0 ? r.foreignNetLots : 0) +
        (r.trustNetLots > 0 ? r.trustNetLots : 0) +
        (r.dealerNetLots > 0 ? r.dealerNetLots : 0);
      const negSum =
        (r.foreignNetLots < 0 ? Math.abs(r.foreignNetLots) : 0) +
        (r.trustNetLots < 0 ? Math.abs(r.trustNetLots) : 0) +
        (r.dealerNetLots < 0 ? Math.abs(r.dealerNetLots) : 0);
      max = Math.max(
        max,
        posSum,
        negSum,
        Math.abs(r.totalNetLots),
        Math.abs(r.foreignNetLots),
        Math.abs(r.trustNetLots),
        Math.abs(r.dealerNetLots)
      );
    });
    return Math.max(100, Math.ceil(max * 1.15));
  }, [chartRecords]);

  const formatLots = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toLocaleString()} 張`;
  };

  return (
    <div className="w-full bg-slate-950 border-t border-slate-800 text-slate-200">
      {/* Top Header & Quick Summary Bar */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs sm:text-sm">
            <Layers size={14} className="text-blue-400" />
            <span>三大法人每日買賣超</span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {stockName} ({symbol})
          </span>

          {data?.summary && (
            <span
              className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-semibold border ${
                data.summary.sentiment.includes('多方') || data.summary.sentiment.includes('同步買超')
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : data.summary.sentiment.includes('空方') || data.summary.sentiment.includes('提款')
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-800 text-amber-300'
              }`}
            >
              {data.summary.sentiment}
            </span>
          )}
        </div>

        {/* View Mode & Expand Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 size={12} />
              <span>走勢柱狀圖</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table size={12} />
              <span>每日明細表</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? '收合法人籌碼' : '展開法人籌碼'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2">
          {/* Stacked Legend & Cumulative Stats */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-slate-400 px-0.5">
            <div className="flex items-center gap-2.5 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 inline-block shadow-xs"></span> 外資
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block shadow-xs"></span> 投信
              </span>
              <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-purple-400 inline-block shadow-xs"></span> 自營商
              </span>
            </div>

            {data?.summary && (
              <div className="flex items-center gap-2 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60">
                <span>
                  近5日合計:
                  <strong
                    className={`ml-1 ${
                      data.summary.cum5DayTotalLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatLots(data.summary.cum5DayTotalLots)}
                  </strong>
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  近20日合計:
                  <strong
                    className={`ml-1 ${
                      data.summary.cum20DayTotalLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatLots(data.summary.cum20DayTotalLots)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* View Mode 1: Daily Institutional Net Flow Bar Chart */}
          {viewMode === 'chart' && (
            <div className="w-full bg-slate-900/80 rounded-lg p-2 border border-slate-800/80 flex flex-col gap-1.5">
              {/* Dedicated Plot Canvas Area */}
              <div className="relative w-full h-[145px] sm:h-[160px]">
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-20">
                    <span className="text-xs text-blue-400">正在同步台灣證交所最新法人籌碼...</span>
                  </div>
                )}

                {/* Zero baseline exactly at the vertical center of the plot area */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-slate-700/70 pointer-events-none z-10"></div>

                {/* Bars container (100% height of plot area, full width) */}
                <div className="w-full h-full flex items-stretch gap-1 sm:gap-1.5 relative z-0">
                  {chartRecords.map((r) => {
                    const isHovered = (activeDate || selectedRecordDate) === r.date;

                    // Positive segments: stack upward from 50% baseline (bottom: 50% + offset)
                    let currentPosOffset = 0;
                    const posSegments: { key: string; name: string; lots: number; color: string; height: number; bottomOffset: number }[] = [];
                    if (r.foreignNetLots > 0) {
                      const h = (r.foreignNetLots / maxAbsLots) * 46;
                      posSegments.push({
                        key: 'foreign',
                        name: '外資',
                        lots: r.foreignNetLots,
                        color: '#38bdf8', // sky-400
                        height: Math.max(1, h),
                        bottomOffset: currentPosOffset,
                      });
                      currentPosOffset += h;
                    }
                    if (r.trustNetLots > 0) {
                      const h = (r.trustNetLots / maxAbsLots) * 46;
                      posSegments.push({
                        key: 'trust',
                        name: '投信',
                        lots: r.trustNetLots,
                        color: '#f59e0b', // amber-500
                        height: Math.max(1, h),
                        bottomOffset: currentPosOffset,
                      });
                      currentPosOffset += h;
                    }
                    if (r.dealerNetLots > 0) {
                      const h = (r.dealerNetLots / maxAbsLots) * 46;
                      posSegments.push({
                        key: 'dealer',
                        name: '自營商',
                        lots: r.dealerNetLots,
                        color: '#c084fc', // purple-400
                        height: Math.max(1, h),
                        bottomOffset: currentPosOffset,
                      });
                      currentPosOffset += h;
                    }

                    // Negative segments: stack downward from 50% baseline (top: 50% + offset)
                    let currentNegOffset = 0;
                    const negSegments: { key: string; name: string; lots: number; color: string; height: number; topOffset: number }[] = [];
                    if (r.foreignNetLots < 0) {
                      const h = (Math.abs(r.foreignNetLots) / maxAbsLots) * 46;
                      negSegments.push({
                        key: 'foreign',
                        name: '外資',
                        lots: r.foreignNetLots,
                        color: '#0284c7', // deep sky blue
                        height: Math.max(1, h),
                        topOffset: currentNegOffset,
                      });
                      currentNegOffset += h;
                    }
                    if (r.trustNetLots < 0) {
                      const h = (Math.abs(r.trustNetLots) / maxAbsLots) * 46;
                      negSegments.push({
                        key: 'trust',
                        name: '投信',
                        lots: r.trustNetLots,
                        color: '#d97706', // deep amber
                        height: Math.max(1, h),
                        topOffset: currentNegOffset,
                      });
                      currentNegOffset += h;
                    }
                    if (r.dealerNetLots < 0) {
                      const h = (Math.abs(r.dealerNetLots) / maxAbsLots) * 46;
                      negSegments.push({
                        key: 'dealer',
                        name: '自營商',
                        lots: r.dealerNetLots,
                        color: '#9333ea', // deep purple
                        height: Math.max(1, h),
                        topOffset: currentNegOffset,
                      });
                      currentNegOffset += h;
                    }

                    // Single filter values
                    let singlePlotVal = r.totalNetLots;
                    let singleBarColor = r.totalNetLots >= 0 ? '#ef4444' : '#22c55e';
                    if (activeFilter === 'foreign') {
                      singlePlotVal = r.foreignNetLots;
                      singleBarColor = r.foreignNetLots >= 0 ? '#38bdf8' : '#0284c7';
                    } else if (activeFilter === 'trust') {
                      singlePlotVal = r.trustNetLots;
                      singleBarColor = r.trustNetLots >= 0 ? '#f59e0b' : '#b45309';
                    } else if (activeFilter === 'dealer') {
                      singlePlotVal = r.dealerNetLots;
                      singleBarColor = r.dealerNetLots >= 0 ? '#c084fc' : '#7e22ce';
                    }

                    const singleBarHeightPct = Math.min(46, (Math.abs(singlePlotVal) / maxAbsLots) * 46);
                    const isSinglePositive = singlePlotVal >= 0;

                    return (
                      <div
                        key={r.date}
                        className="flex-1 h-full relative cursor-pointer group focus:outline-none select-none"
                        onClick={() => {
                          setSelectedRecordDate(r.date);
                          if (onHoverDate) onHoverDate(r.date);
                        }}
                        onMouseEnter={() => {
                          setSelectedRecordDate(r.date);
                          if (onHoverDate) onHoverDate(r.date);
                        }}
                      >
                        {/* 1. Stacked Mode: Stack 外資, 投信, 自營商 on the EXACT SAME DAY flush to 50% zero axis */}
                        {activeFilter === 'stacked' && (
                          <div className="w-full h-full relative">
                            {/* Positive Stacking Segments (anchored flush to 50% baseline going upwards) */}
                            {posSegments.map(seg => (
                              <div
                                key={seg.key}
                                className="w-full absolute rounded-xs transition-all duration-150 border-t border-slate-900/60"
                                style={{
                                  backgroundColor: seg.color,
                                  height: `${seg.height}%`,
                                  bottom: `calc(50% + ${seg.bottomOffset}%)`,
                                  opacity: isHovered ? 1 : 0.9,
                                }}
                              />
                            ))}

                            {/* Negative Stacking Segments (anchored flush to 50% baseline going downwards) */}
                            {negSegments.map(seg => (
                              <div
                                key={seg.key}
                                className="w-full absolute rounded-xs transition-all duration-150 border-b border-slate-900/60"
                                style={{
                                  backgroundColor: seg.color,
                                  height: `${seg.height}%`,
                                  top: `calc(50% + ${seg.topOffset}%)`,
                                  opacity: isHovered ? 1 : 0.9,
                                }}
                              />
                            ))}

                            {/* If all 3 are 0 lots on this day */}
                            {posSegments.length === 0 && negSegments.length === 0 && (
                              <div
                                className="w-full h-0.5 bg-slate-600 absolute"
                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                              />
                            )}
                          </div>
                        )}

                        {/* 2. Grouped Mode: 3 mini bars side by side, flush with 50% zero axis */}
                        {activeFilter === 'grouped' && (
                          <div className="w-full h-full relative flex items-center justify-between gap-0.5">
                            {/* Foreign */}
                            <div
                              className="flex-1 rounded-xs absolute"
                              style={{
                                left: '0%',
                                width: '30%',
                                backgroundColor: r.foreignNetLots >= 0 ? '#38bdf8' : '#0284c7',
                                height: `${Math.min(46, (Math.abs(r.foreignNetLots) / maxAbsLots) * 46)}%`,
                                ...(r.foreignNetLots >= 0
                                  ? { bottom: '50%' }
                                  : { top: '50%' }),
                              }}
                            />
                            {/* Trust */}
                            <div
                              className="flex-1 rounded-xs absolute"
                              style={{
                                left: '35%',
                                width: '30%',
                                backgroundColor: r.trustNetLots >= 0 ? '#f59e0b' : '#b45309',
                                height: `${Math.min(46, (Math.abs(r.trustNetLots) / maxAbsLots) * 46)}%`,
                                ...(r.trustNetLots >= 0
                                  ? { bottom: '50%' }
                                  : { top: '50%' }),
                              }}
                            />
                            {/* Dealer */}
                            <div
                              className="flex-1 rounded-xs absolute"
                              style={{
                                left: '70%',
                                width: '30%',
                                backgroundColor: r.dealerNetLots >= 0 ? '#c084fc' : '#7e22ce',
                                height: `${Math.min(46, (Math.abs(r.dealerNetLots) / maxAbsLots) * 46)}%`,
                                ...(r.dealerNetLots >= 0
                                  ? { bottom: '50%' }
                                  : { top: '50%' }),
                              }}
                            />
                          </div>
                        )}

                        {/* 3. Single / Total Bar Mode, flush with 50% zero axis */}
                        {activeFilter !== 'stacked' && activeFilter !== 'grouped' && (
                          <div
                            className="w-full rounded-xs transition-all duration-150 absolute left-0 right-0 mx-auto"
                            style={{
                              backgroundColor: singleBarColor,
                              height: `${Math.max(1, singleBarHeightPct)}%`,
                              ...(isSinglePositive
                                ? { bottom: '50%' }
                                : { top: '50%' }),
                              opacity: isHovered ? 1 : 0.85,
                              transform: isHovered ? 'scaleX(1.15)' : 'none',
                            }}
                          />
                        )}

                        {/* Rich Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none z-30 bg-slate-950/95 border border-slate-700 p-2 rounded-lg shadow-2xl text-[10px] font-mono whitespace-nowrap text-slate-200 min-w-[135px] backdrop-blur-xs">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
                            <span>{r.date}</span>
                            <span className={r.totalNetLots >= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {formatLots(r.totalNetLots)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sky-400 gap-2 mb-0.5">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>
                              外資:
                            </span>
                            <span className="font-bold">{formatLots(r.foreignNetLots)}</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-400 gap-2 mb-0.5">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                              投信:
                            </span>
                            <span className="font-bold">{formatLots(r.trustNetLots)}</span>
                          </div>
                          <div className="flex justify-between items-center text-purple-400 gap-2 mb-1">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                              自營:
                            </span>
                            <span className="font-bold">{formatLots(r.dealerNetLots)}</span>
                          </div>
                          {r.closePrice && (
                            <div className="pt-1 border-t border-slate-800/80 flex justify-between text-slate-400 text-[9px]">
                              <span>收盤價</span>
                              <span className="text-slate-200 font-bold">${r.closePrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Date Timeline Labels below the plot area */}
              <div className="w-full px-1 flex justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                <span>{chartRecords[0]?.date.slice(5) || ''}</span>
                <span>{chartRecords[Math.floor(chartRecords.length / 2)]?.date.slice(5) || ''}</span>
                <span>{chartRecords[chartRecords.length - 1]?.date.slice(5) || ''}</span>
              </div>
            </div>
          )}

          {/* View Mode 2: Detailed Daily Institutional Table */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto max-h-[220px] rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2.5">日期</th>
                    <th className="py-1.5 px-2">收盤價</th>
                    <th className="py-1.5 px-2">漲跌幅</th>
                    <th className="py-1.5 px-2 text-sky-400">外資(張)</th>
                    <th className="py-1.5 px-2 text-amber-400">投信(張)</th>
                    <th className="py-1.5 px-2 text-purple-400">自營商(張)</th>
                    <th className="py-1.5 px-2 text-right">三大法人合計(張)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                  {data?.records
                    ?.slice()
                    .reverse()
                    .map((r) => {
                      const isHovered = (activeDate || selectedRecordDate) === r.date;
                      return (
                        <tr
                          key={r.date}
                          onClick={() => {
                            setSelectedRecordDate(r.date);
                            if (onHoverDate) onHoverDate(r.date);
                          }}
                          className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                            isHovered ? 'bg-blue-950/40 border-l-2 border-blue-400' : ''
                          }`}
                        >
                          <td className="py-1.5 px-2.5 text-slate-300 font-medium">{r.date}</td>
                          <td className="py-1.5 px-2 text-slate-200">${r.closePrice ?? '--'}</td>
                          <td
                            className={`py-1.5 px-2 font-bold ${
                              (r.changePercent || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {(r.changePercent || 0) >= 0 ? '+' : ''}
                            {r.changePercent}%
                          </td>
                          <td
                            className={`py-1.5 px-2 ${
                              r.foreignNetLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatLots(r.foreignNetLots)}
                          </td>
                          <td
                            className={`py-1.5 px-2 ${
                              r.trustNetLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatLots(r.trustNetLots)}
                          </td>
                          <td
                            className={`py-1.5 px-2 ${
                              r.dealerNetLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatLots(r.dealerNetLots)}
                          </td>
                          <td
                            className={`py-1.5 px-2 text-right font-extrabold ${
                              r.totalNetLots >= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatLots(r.totalNetLots)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
