import React, { useState, useMemo } from 'react';
import {
  TechSector,
  QuarterFinancial,
} from '../data/techFinancialsData.ts';
import {
  AnalyzedTechStock,
  runTechFundamentalScan,
  ValuationStance,
} from '../utils/fundamentalAnalysisEngine.ts';
import {
  Cpu,
  Layers,
  Sparkles,
  TrendingUp,
  Search,
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
  Calculator,
} from 'lucide-react';

interface TechFundamentalScannerProps {
  onSelectStockForChart: (symbol: string, name: string) => void;
}

export const TechFundamentalScanner: React.FC<TechFundamentalScannerProps> = ({
  onSelectStockForChart,
}) => {
  // Scan State
  const [hasScanned, setHasScanned] = useState<boolean>(true); // Preloaded with default verified scan
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(4);
  const [scanProgress, setScanProgress] = useState<number>(100);

  // Filter States
  const [selectedSector, setSelectedSector] = useState<TechSector | 'ALL'>('ALL');
  const [selectedStance, setSelectedStance] = useState<ValuationStance | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [minGrowthFilter, setMinGrowthFilter] = useState<boolean>(false);

  // Detail Modal State
  const [detailStock, setDetailStock] = useState<AnalyzedTechStock | null>(null);

  // Full analyzed results
  const [analyzedList, setAnalyzedList] = useState<AnalyzedTechStock[]>(() => runTechFundamentalScan());

  // Trigger Scan Animation
  const handleTriggerScan = () => {
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(15);

    setTimeout(() => {
      setScanStep(2);
      setScanProgress(45);
    }, 400);

    setTimeout(() => {
      setScanStep(3);
      setScanProgress(75);
    }, 800);

    setTimeout(() => {
      setScanStep(4);
      setScanProgress(100);
      const results = runTechFundamentalScan();
      setAnalyzedList(results);
      setIsScanning(false);
      setHasScanned(true);
    }, 1200);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return analyzedList.filter(stock => {
      // Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return false;
      // Stance filter
      if (selectedStance !== 'ALL' && stock.valuation.valuationStance !== selectedStance) return false;
      // High growth only filter
      if (minGrowthFilter && stock.scores.growthScore < 80) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesCode = stock.code.toLowerCase().includes(q);
        const matchesName = stock.name.toLowerCase().includes(q);
        const matchesSub = stock.subCategory.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesSub) return false;
      }
      return true;
    });
  }, [analyzedList, selectedSector, selectedStance, minGrowthFilter, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = analyzedList.length;
    const cheapCount = analyzedList.filter(s => s.valuation.valuationStance === 'CHEAP').length;
    const fairLowCount = analyzedList.filter(s => s.valuation.valuationStance === 'FAIR_LOW').length;
    const avgGrowthScore = Math.round(analyzedList.reduce((acc, s) => acc + s.scores.growthScore, 0) / total);
    const avgGrossMargin = (analyzedList.reduce((acc, s) => acc + s.quarters[0].grossMargin, 0) / total).toFixed(1);
    const avgExpectedGrowth = (analyzedList.reduce((acc, s) => acc + s.expectedGrowthRate, 0) / total).toFixed(1);
    return {
      total,
      cheapCount,
      fairLowCount,
      avgGrowthScore,
      avgGrossMargin,
      avgExpectedGrowth,
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
      {/* Hero Header & Scan Control Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} />
                基本面 8 季財報深度量化掃描
              </span>
              <span className="text-[11px] text-slate-400">
                · 不調用外部API · 本地高階量化運算
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>台灣科技股 7 大板塊高成長推薦 (Top 20)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              橫跨晶圓代工、先進封裝CoWoS、IC與AI晶片、AI伺服器、散熱、電源/BBU及ABF載板。深度檢索連續 8 個季度財報，透過 7 項量化指標及 <strong className="text-blue-300">PEG (60%) + P/E Band (40%) 雙模動態估值</strong> 精算便宜價、合理價與昂貴價。
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>正在掃描財報數據庫...</span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white" />
                  <span>立即重新掃描 8 季財報</span>
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
                {scanStep === 1 && '步驟 1/4: 檢索台股科技股 7 大類群最近 8 季度營收與獲利報表...'}
                {scanStep === 2 && '步驟 2/4: 計算成長性、毛利率、營益率、ROE、ROIC、現金流、負債健康度 (0-100分)...'}
                {scanStep === 3 && '步驟 3/4: 執行同產業族群互相比較與篩選 Top 20 領先高成長股票...'}
                {scanStep === 4 && '步驟 4/4: 動態估值 (PEG 模型 60% + P/E Band 40% 加權算價) 計算便宜/合理/昂貴價...'}
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">推薦入選標的</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">
            20 <span className="text-xs text-slate-400 font-sans font-normal">檔精選</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">跨 7 大科技關鍵賽道</span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            超值便宜區標的
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-300 mt-1">
            {stats.cheapCount} <span className="text-xs text-slate-400 font-sans font-normal">檔</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5">現價低於綜合便宜價</span>
        </div>

        <div className="bg-slate-900/80 border border-cyan-900/40 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            合理偏低區標的
          </span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-300 mt-1">
            {stats.fairLowCount} <span className="text-xs text-slate-400 font-sans font-normal">檔</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 mt-0.5">介於便宜價與合理價</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">平均預估獲利成長</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-300 mt-1">
            +{stats.avgExpectedGrowth}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">次年度獲利動能</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">平均最新毛利率</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-purple-300 mt-1">
            {stats.avgGrossMargin}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">高毛利技術護城河</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">平均基本面成長分</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-300 mt-1">
            {stats.avgGrowthScore} <span className="text-xs text-slate-400 font-sans font-normal">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">近 8 季成長力綜合評分</span>
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

        {/* Second Filter Row: Stance, Search, Growth Toggle, View Mode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stance Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] px-1.5 font-medium">位階:</span>
              <button
                onClick={() => setSelectedStance('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedStance === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedStance('CHEAP')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedStance === 'CHEAP' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                超值便宜
              </button>
              <button
                onClick={() => setSelectedStance('FAIR_LOW')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedStance === 'FAIR_LOW' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                合理偏低
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
              <span>僅看高成長 (評分≥80)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="搜尋代號/名稱/業務..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('card')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="卡片精華視圖"
              >
                卡片
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="表格數據對比視圖"
              >
                表格
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results View */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Info size={32} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">查無符合條件的科技股標的</p>
          <p className="text-xs text-slate-500">請嘗試調整產業類別、估值位階或清空搜尋字詞。</p>
          <button
            onClick={() => {
              setSelectedSector('ALL');
              setSelectedStance('ALL');
              setMinGrowthFilter(false);
              setSearchQuery('');
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg mt-2"
          >
            重置所有篩選
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredList.map(stock => {
            const isCheapOrFair = stock.valuation.valuationStance === 'CHEAP' || stock.valuation.valuationStance === 'FAIR_LOW';
            const price = stock.currentPrice;
            const cheap = stock.valuation.finalCheapPrice;
            const fair = stock.valuation.finalFairPrice;
            const expensive = stock.valuation.finalExpensivePrice;

            // Calculate percentage position along range
            const minP = cheap * 0.85;
            const maxP = expensive * 1.15;
            const currentPct = Math.min(100, Math.max(0, ((price - minP) / (maxP - minP)) * 100));

            return (
              <div
                key={stock.symbol}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 sm:p-4.5 flex flex-col justify-between gap-3.5 shadow-md hover:shadow-lg transition-all"
              >
                {/* Header: Rank, Name, Sector, Price */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-mono font-bold shadow-xs">
                        #{stock.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-100 text-base">{stock.name}</h3>
                          <span className="font-mono text-xs text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {stock.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="text-blue-400 font-semibold">{stock.sector}</span>
                          <span>·</span>
                          <span className="truncate max-w-[180px] sm:max-w-xs">{stock.subCategory}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Change */}
                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-slate-100">
                        ${stock.currentPrice}
                      </div>
                      <div className="text-xs font-mono font-semibold flex items-center justify-end gap-1 text-red-400">
                        <TrendingUp size={12} />
                        <span>+{stock.changePercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Valuation Range River Bar (便宜價 - 合理價 - 昂貴價) */}
                  <div className="mt-3.5 bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">動態估值位階</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stock.valuation.valuationBadgeClass}`}>
                        {stock.valuation.valuationLabel}
                      </span>
                    </div>

                    {/* River Bar Slider */}
                    <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden mt-1 flex border border-slate-800">
                      <div className="w-[33%] bg-emerald-500/30 border-r border-emerald-500/50" title="便宜區" />
                      <div className="w-[34%] bg-cyan-500/30 border-r border-cyan-500/50" title="合理區" />
                      <div className="w-[33%] bg-rose-500/30" title="昂貴區" />
                      {/* Current Price Marker Indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-white shadow-xs rounded-full transform -translate-x-1/2"
                        style={{ left: `${currentPct}%` }}
                        title={`現價 $${price}`}
                      />
                    </div>

                    {/* 3 Price Anchors */}
                    <div className="grid grid-cols-3 text-center text-xs font-mono pt-1">
                      <div>
                        <span className="text-[10px] text-emerald-400 block font-sans">便宜價</span>
                        <strong className="text-emerald-300 font-bold">${cheap}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-400 block font-sans">合理價</span>
                        <strong className="text-cyan-300 font-bold">${fair}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 block font-sans">昂貴價</span>
                        <strong className="text-rose-300 font-bold">${expensive}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 7-Score Fundamental Metric Pills */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block font-sans">成長性</span>
                      <span className="text-amber-300 font-bold text-xs">{stock.scores.growthScore}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block font-sans">毛利率</span>
                      <span className="text-purple-300 font-bold text-xs">{stock.scores.grossMarginScore}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block font-sans">ROE/ROIC</span>
                      <span className="text-emerald-300 font-bold text-xs">{stock.scores.roicScore}</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-500 block font-sans">負債健康</span>
                      <span className="text-blue-300 font-bold text-xs">{stock.scores.debtHealthScore}</span>
                    </div>
                  </div>

                  {/* Opportunities & Risks Snippets */}
                  <div className="mt-2.5 flex flex-col gap-1 text-[11px] leading-relaxed">
                    {stock.opportunities[0] && (
                      <div className="text-emerald-300/90 flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{stock.opportunities[0]}</span>
                      </div>
                    )}
                    {stock.risks[0] && (
                      <div className="text-slate-400 flex items-start gap-1.5">
                        <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{stock.risks[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: View Financials Detail + Jump to Chart */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailStock(stock)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={13} className="text-blue-400" />
                    <span>8季財報明細與算價</span>
                  </button>

                  <button
                    onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="跳轉至即時K線與量化回測"
                  >
                    <LineChart size={13} />
                    <span>K線技術回測</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW FOR DEEP COMPARISON */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">排名/標的</th>
                  <th className="py-3 px-3">產業類別</th>
                  <th className="py-3 px-3 text-right">現價</th>
                  <th className="py-3 px-3 text-center">估值位階</th>
                  <th className="py-3 px-3 text-right">便宜價</th>
                  <th className="py-3 px-3 text-right">合理價</th>
                  <th className="py-3 px-3 text-right">昂貴價</th>
                  <th className="py-3 px-3 text-right">最新毛利</th>
                  <th className="py-3 px-3 text-right">ROE</th>
                  <th className="py-3 px-3 text-right">ROIC</th>
                  <th className="py-3 px-3 text-right">預估成長</th>
                  <th className="py-3 px-3 text-center">成長評分</th>
                  <th className="py-3 px-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredList.map(stock => (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-900/40 text-blue-300 font-bold text-xs flex items-center justify-center font-mono">
                          {stock.rank}
                        </span>
                        <div>
                          <strong className="text-slate-100 font-bold text-xs block">{stock.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">{stock.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="text-blue-400 font-medium block">{stock.sector}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">{stock.subCategory}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-100">
                      ${stock.currentPrice}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stock.valuation.valuationBadgeClass}`}>
                        {stock.valuation.valuationLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      ${stock.valuation.finalCheapPrice}
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400 font-bold">
                      ${stock.valuation.finalFairPrice}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400 font-bold">
                      ${stock.valuation.finalExpensivePrice}
                    </td>
                    <td className="py-3 px-3 text-right text-purple-300">
                      {stock.quarters[0].grossMargin}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {stock.quarters[0].roe}%
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300 font-bold">
                      {stock.quarters[0].roic}%
                    </td>
                    <td className="py-3 px-3 text-right text-amber-300 font-bold">
                      +{stock.expectedGrowthRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-400">
                      {stock.valuation.growthPotentialScore}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailStock(stock)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                          title="查看 8 季財報"
                        >
                          財報
                        </button>
                        <button
                          onClick={() => onSelectStockForChart(stock.symbol, stock.name)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
                          title="技術線圖"
                        >
                          K線
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8-Quarter Financials & Dynamic Valuation Detail Modal */}
      {detailStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 flex flex-col gap-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg">
                  #{detailStock.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-100">{detailStock.name}</h2>
                    <span className="font-mono text-sm text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {detailStock.symbol}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${detailStock.valuation.valuationBadgeClass}`}>
                      {detailStock.valuation.valuationLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span className="text-blue-400 font-semibold">{detailStock.sector}</span>
                    <span>·</span>
                    <span>{detailStock.subCategory}</span>
                    <span>·</span>
                    <span>同族群排名 第 {detailStock.peerRankInSector} / {detailStock.peerCountInSector} 名</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailStock(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Core Description & Catalyst */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  <strong className="text-white">公司核心護城河：</strong>{detailStock.description}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  <strong className="text-amber-300">未來獲利催化劑：</strong>{detailStock.catalyst}
                </span>
              </div>
            </div>

            {/* Valuation Breakdown Formula Panel (PEG 60% + PE Band 40%) */}
            <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Calculator size={15} className="text-blue-400" />
                  <h4 className="font-bold text-slate-200 text-xs sm:text-sm">
                    動態估值矩陣拆解 (PEG 模型 60% + P/E Band 河流圖 40%)
                  </h4>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  現價: <strong className="text-white">${detailStock.currentPrice}</strong> · TTM EPS: <strong className="text-blue-300">${detailStock.ttmEps}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* PEG Model Details */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5 font-mono">
                  <div className="flex items-center justify-between font-sans text-blue-300 font-semibold">
                    <span>1. PEG 成長性估值 (60% 權重)</span>
                    <span className="text-[11px] text-slate-400">G = +{detailStock.expectedGrowthRate}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Peter Lynch 標準 (便宜PEG=0.75, 合理=1.05, 昂貴=1.45)
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">便宜價</span>
                      <strong className="text-emerald-400">${detailStock.valuation.pegCheap}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">合理價</span>
                      <strong className="text-cyan-400">${detailStock.valuation.pegFair}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">昂貴價</span>
                      <strong className="text-rose-400">${detailStock.valuation.pegExpensive}</strong>
                    </div>
                  </div>
                </div>

                {/* PE Band Details */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5 font-mono">
                  <div className="flex items-center justify-between font-sans text-indigo-300 font-semibold">
                    <span>2. P/E Band 歷史河流圖 (40% 權重)</span>
                    <span className="text-[11px] text-slate-400">PE區間: {detailStock.peLow}x ~ {detailStock.peHigh}x</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    基於歷史 5 年本益比位階河流統計低標、中標與高標
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">低標(便宜)</span>
                      <strong className="text-emerald-400">${detailStock.valuation.peBandCheap}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">中標(合理)</span>
                      <strong className="text-cyan-400">${detailStock.valuation.peBandFair}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">高標(昂貴)</span>
                      <strong className="text-rose-400">${detailStock.valuation.peBandExpensive}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weighted Final Combined Prices */}
              <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-300">
                  <strong className="text-white block">加權最終結論價位：</strong>
                  <span className="text-slate-400 text-[11px]">
                    現價 ${detailStock.currentPrice} 處於【<span className="text-white font-bold">{detailStock.valuation.valuationLabel}</span>】，距合理價空間 {detailStock.valuation.upsideToFair > 0 ? `+${detailStock.valuation.upsideToFair}%` : `${detailStock.valuation.upsideToFair}%`}
                  </span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <div className="text-center">
                    <span className="text-[10px] text-emerald-400 font-sans block font-semibold">綜合便宜價</span>
                    <strong className="text-lg text-emerald-300 font-black">${detailStock.valuation.finalCheapPrice}</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-cyan-400 font-sans block font-semibold">綜合合理價</span>
                    <strong className="text-lg text-cyan-300 font-black">${detailStock.valuation.finalFairPrice}</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-rose-400 font-sans block font-semibold">綜合昂貴價</span>
                    <strong className="text-lg text-rose-300 font-black">${detailStock.valuation.finalExpensivePrice}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 8-Quarter Financials Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <FileSpreadsheet size={15} className="text-emerald-400" />
                  <span>最近 8 個季度財報明細表 (連續追蹤)</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">單位: 新台幣 / 億元</span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">季度</th>
                      <th className="py-2.5 px-3 text-right">營收 YoY</th>
                      <th className="py-2.5 px-3 text-right">毛利率</th>
                      <th className="py-2.5 px-3 text-right">營益率</th>
                      <th className="py-2.5 px-3 text-right">ROE</th>
                      <th className="py-2.5 px-3 text-right">ROIC</th>
                      <th className="py-2.5 px-3 text-right">自由現金流</th>
                      <th className="py-2.5 px-3 text-right">負債比</th>
                      <th className="py-2.5 px-3 text-right">單季 EPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {detailStock.quarters.map((q, idx) => (
                      <tr key={q.quarter} className={idx === 0 ? 'bg-blue-950/20 font-semibold' : 'hover:bg-slate-900/50'}>
                        <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                          <span className="text-slate-200">{q.quarter}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-600 text-white font-bold">最新</span>
                          )}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${q.revenueYoY >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {q.revenueYoY >= 0 ? `+${q.revenueYoY.toFixed(1)}%` : `${q.revenueYoY.toFixed(1)}%`}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-300 font-bold">
                          {q.grossMargin.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {q.operatingMargin.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          {q.roe.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-300">
                          {q.roic.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          ${q.freeCashFlow} 億
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {q.debtRatio.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          ${q.eps.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Opportunities & Risks Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 flex flex-col gap-1.5">
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  操盤手機會洞察
                </span>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {detailStock.opportunities.map((opp, idx) => (
                    <li key={idx} className="leading-relaxed">{opp}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 flex flex-col gap-1.5">
                <span className="font-bold text-rose-300 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-rose-400" />
                  操盤手風險提示
                </span>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {detailStock.risks.map((risk, idx) => (
                    <li key={idx} className="leading-relaxed">{risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDetailStock(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                關閉
              </button>
              <button
                onClick={() => {
                  onSelectStockForChart(detailStock.symbol, detailStock.name);
                  setDetailStock(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <LineChart size={14} />
                <span>切換至此標的 K 線圖與量化回測</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
