import React, { useState, useMemo } from 'react';
import {
  TechCategory,
  FundamentalRecommendation,
  ValuationStage,
  QuarterlyFinancialReport,
} from '../types/stock.ts';
import { getTop20FundamentalRecommendations } from '../utils/fundamentalEngine.ts';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calculator,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  BarChart3,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  ArrowUpRight,
  BookmarkPlus,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';

interface FundamentalStockScreenerProps {
  onSelectStock: (symbol: string, name: string) => void;
  onAddToWatchlist?: (symbol: string, name: string) => void;
  currentSymbol?: string;
  watchlistSymbols?: string[];
}

export const FundamentalStockScreener: React.FC<FundamentalStockScreenerProps> = ({
  onSelectStock,
  onAddToWatchlist,
  currentSymbol,
  watchlistSymbols = [],
}) => {
  // All 20 recommendations generated purely by quantitative model & 8Q data (zero API call)
  const allRecommendations = useMemo(() => {
    return getTop20FundamentalRecommendations();
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'growth' | 'score' | 'discount' | 'pe' | 'yoy'>('growth');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedStockSymbol, setExpandedStockSymbol] = useState<string | null>(null);

  // Available Categories
  const categories: (TechCategory | 'ALL')[] = [
    'ALL',
    '晶圓代工',
    '先進封裝',
    'IC設計',
    '手機與AI晶片',
    'AI伺服器',
    '散熱',
    '電源供應器',
    '晶片設計',
    'ABF載板',
    '雲端',
  ];

  // Filter and sort items
  const filteredStocks = useMemo(() => {
    return allRecommendations
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }
        // Valuation stage filter
        if (selectedStage !== 'ALL' && item.valuation.stage !== selectedStage) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSym = item.symbol.toLowerCase().includes(q);
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchSym && !matchName && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'growth') {
          return b.valuation.growthPotentialScore - a.valuation.growthPotentialScore;
        }
        if (sortBy === 'score') {
          return b.scores.overallScore - a.scores.overallScore;
        }
        if (sortBy === 'discount') {
          return b.valuation.discountToFairPct - a.valuation.discountToFairPct;
        }
        if (sortBy === 'pe') {
          return a.forwardPE - b.forwardPE;
        }
        if (sortBy === 'yoy') {
          return b.latestRevenueYoY - a.latestRevenueYoY;
        }
        return a.rank - b.rank;
      });
  }, [allRecommendations, selectedCategory, selectedStage, sortBy, searchQuery]);

  return (
    <div className="flex flex-col gap-4 text-slate-200">
      {/* 頂部策略橫幅：8季財報量化選股模型與 PEG 60% + PE Band 40% 動態估值說明 */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/50 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-400" />
                基本面 8 季財報量化篩選
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-950/70 border border-purple-800/60 text-purple-300">
                動態估值：60% PEG + 40% P/E Band
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                純在地模型演算 · 零 API 調用
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>台灣科技各類群 · 高成長潛力 TOP 20 菁英推薦</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              涵蓋晶圓代工、先進封裝 (CoWoS)、AI晶片、AI伺服器、散熱、高階PCB等 11 大核心科技聚落。從最近 8 季真實財報中進行 6 大維度量化評分（成長性 YoY、毛利趨勢、營益率、ROE、自由現金流、負債健康度），並精確計算各檔股票的【便宜價】、【合理價】與【昂貴價】。
            </p>
          </div>

          {/* 視圖切換與搜尋框 */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid size={14} />
                <span>卡片視圖</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon size={14} />
                <span>報表清單</span>
              </button>
            </div>
          </div>
        </div>

        {/* 篩選與排序控制列 */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 搜尋與排序 */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* 搜尋 */}
            <div className="relative min-w-[180px] max-w-[240px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="搜尋股票代號或名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* 排序方式 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="shrink-0 font-medium">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
              >
                <option value="growth">🔥 股價成長潛力分 (高到低)</option>
                <option value="score">🏆 基本面總評分 (高到低)</option>
                <option value="discount">💰 安全邊際折價 (便宜優先)</option>
                <option value="yoy">📈 最新營收 YoY (爆發力優先)</option>
                <option value="pe">📉 本益比 P/E (低到高)</option>
              </select>
            </div>

            {/* 位階快篩 */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="shrink-0 font-medium">位階:</span>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
              >
                <option value="ALL">全估值位階</option>
                <option value="CHEAP">🟢 低估便宜區</option>
                <option value="FAIR_LOW">🔵 合理偏低區</option>
                <option value="FAIR_HIGH">🟡 合理偏高區</option>
                <option value="EXPENSIVE">🔴 高估昂貴區</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 text-right">
            已精選篩選 <strong className="text-blue-400">{filteredStocks.length}</strong> / 20 檔標的
          </div>
        </div>

        {/* 11 大科技類群 Pills 橫向切換列 */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-3 mt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat === 'ALL' ? '全部類群' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 視圖呈現：卡片視圖 (Cards View) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredStocks.map((stock) => {
            const isCurrentlySelected = stock.symbol === currentSymbol;
            const isSaved = watchlistSymbols.includes(stock.symbol);
            const isExpanded = expandedStockSymbol === stock.symbol;

            return (
              <div
                key={stock.symbol}
                className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                  isCurrentlySelected
                    ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-xl shadow-blue-950/40'
                    : 'border-slate-800 hover:border-slate-700/80 shadow-lg'
                }`}
              >
                {/* 頂部：排名、個股、類別標籤與操作按鈕 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        stock.rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                          : stock.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : stock.rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{stock.rank}
                    </div>

                    <div className="truncate min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-100 text-base sm:text-lg tracking-tight">
                          {stock.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {stock.symbol}
                        </span>
                        <span className="text-[11px] font-medium text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2 py-0.2 rounded-full">
                          {stock.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>預估成長率 G: <strong className="text-emerald-400 font-mono">+{stock.expectedGrowthRate}%</strong></span>
                        <span>·</span>
                        <span>近四季 EPS: <strong className="text-slate-200 font-mono">${stock.trailing12mEPS}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 當前即時股價 */}
                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-100">
                      ${stock.currentPrice.toFixed(2)}
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      P/E: <strong className="text-slate-300 font-bold">{stock.forwardPE}x</strong>
                    </div>
                  </div>
                </div>

                {/* 核心亮點短評 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {stock.highlights.map((hl, i) => (
                    <span
                      key={i}
                      className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded-md"
                    >
                      ✦ {hl}
                    </span>
                  ))}
                </div>

                {/* 動態估值核心儀表板 (PEG 60% + P/E Band 40%) */}
                <div className="bg-slate-950/85 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                      <Calculator size={14} className="text-blue-400" />
                      <span>動態算價 (60% PEG + 40% P/E)</span>
                    </div>
                    {/* 位階徽章 */}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${stock.valuation.stageBadgeClass}`}>
                      {stock.valuation.stageLabel}
                    </span>
                  </div>

                  {/* 便宜價 / 合理價 / 昂貴價 三大核心估值卡片 */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    {/* 便宜價 */}
                    <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2 flex flex-col items-center">
                      <span className="text-[10px] text-emerald-400 font-sans font-semibold mb-0.5">【便宜價】</span>
                      <span className="text-sm sm:text-base font-black text-emerald-300">
                        ${stock.valuation.cheapPrice}
                      </span>
                      <span className="text-[9px] text-slate-500 font-sans mt-0.5">強安全邊際</span>
                    </div>

                    {/* 合理價 */}
                    <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-2 flex flex-col items-center">
                      <span className="text-[10px] text-blue-400 font-sans font-semibold mb-0.5">【合理價】</span>
                      <span className="text-sm sm:text-base font-black text-blue-300">
                        ${stock.valuation.fairPrice}
                      </span>
                      <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                        折價 {stock.valuation.discountToFairPct > 0 ? `+${stock.valuation.discountToFairPct}%` : `${stock.valuation.discountToFairPct}%`}
                      </span>
                    </div>

                    {/* 昂貴價 */}
                    <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-2 flex flex-col items-center">
                      <span className="text-[10px] text-rose-400 font-sans font-semibold mb-0.5">【昂貴價】</span>
                      <span className="text-sm sm:text-base font-black text-rose-300">
                        ${stock.valuation.expensivePrice}
                      </span>
                      <span className="text-[9px] text-slate-500 font-sans mt-0.5">高估風險區</span>
                    </div>
                  </div>

                  {/* 視覺化價位尺標 (Price Gauge Bar) */}
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="w-1/3 bg-emerald-700/60 h-full border-r border-slate-900"></div>
                      <div className="w-1/3 bg-blue-700/60 h-full border-r border-slate-900"></div>
                      <div className="w-1/3 bg-rose-700/60 h-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>便宜 ${stock.valuation.cheapPrice}</span>
                      <span className="text-slate-300 font-bold">現價 ${stock.currentPrice.toFixed(0)} (PEG: {stock.valuation.pegRatio})</span>
                      <span>昂貴 ${stock.valuation.expensivePrice}</span>
                    </div>
                  </div>
                </div>

                {/* 六大基本面量化指標進度條 (0-100 分) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  {/* 1. 成長性 (YoY) */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>營收成長性</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.growthScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stock.scores.growthScore}%` }}></div>
                    </div>
                  </div>

                  {/* 2. 毛利率趨勢 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>毛利率表現</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.grossMarginScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stock.scores.grossMarginScore}%` }}></div>
                    </div>
                  </div>

                  {/* 3. 營益獲利 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>營益率品質</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.operatingScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stock.scores.operatingScore}%` }}></div>
                    </div>
                  </div>

                  {/* 4. ROE 資本效率 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>ROE 效率</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.roeScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stock.scores.roeScore}%` }}></div>
                    </div>
                  </div>

                  {/* 5. 現金流健康 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>自由現金流</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.cashFlowScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${stock.scores.cashFlowScore}%` }}></div>
                    </div>
                  </div>

                  {/* 6. 負債健康度 */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>負債安全度</span>
                      <span className="font-mono font-bold text-slate-200">{stock.scores.debtHealthScore}分</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${stock.scores.debtHealthScore}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* 機會亮點與風險提醒 */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex items-start gap-1.5 text-emerald-300">
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
                    <span><strong>機會亮點：</strong>{stock.scores.opportunityNote}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-amber-300">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                    <span><strong>風險防守：</strong>{stock.scores.riskNote}</span>
                  </div>
                </div>

                {/* 展開 8 季財報詳細數據 */}
                {isExpanded && (
                  <div className="mt-2 pt-3 border-t border-slate-800 flex flex-col gap-2 overflow-x-auto">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>最近 8 季財報關鍵數值矩陣 (2023Q1 ~ 2024Q4)</span>
                      <span className="text-[10px] font-mono text-slate-500">單位: 億新台幣 / EPS(元)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-1 px-1.5">季度</th>
                            <th className="py-1 px-1.5 text-right">營收</th>
                            <th className="py-1 px-1.5 text-right">YoY</th>
                            <th className="py-1 px-1.5 text-right">毛利率</th>
                            <th className="py-1 px-1.5 text-right">營益率</th>
                            <th className="py-1 px-1.5 text-right">EPS</th>
                            <th className="py-1 px-1.5 text-right">ROE</th>
                            <th className="py-1 px-1.5 text-right">自由現金</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-[11px]">
                          {stock.financials8Q.map((q) => (
                            <tr key={q.quarter} className="hover:bg-slate-800/40">
                              <td className="py-1 px-1.5 font-bold text-slate-300">{q.quarter}</td>
                              <td className="py-1 px-1.5 text-right">${q.revenue}</td>
                              <td className={`py-1 px-1.5 text-right ${q.revenueYoY >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {q.revenueYoY >= 0 ? `+${q.revenueYoY}%` : `${q.revenueYoY}%`}
                              </td>
                              <td className="py-1 px-1.5 text-right text-slate-200">{q.grossMargin}%</td>
                              <td className="py-1 px-1.5 text-right text-slate-200">{q.operatingMargin}%</td>
                              <td className="py-1 px-1.5 text-right font-bold text-slate-100">${q.eps}</td>
                              <td className="py-1 px-1.5 text-right text-amber-300">{q.roe}%</td>
                              <td className="py-1 px-1.5 text-right text-cyan-300">${q.freeCashFlow}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 底部功能操作按鈕 */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setExpandedStockSymbol(isExpanded ? null : stock.symbol)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? '收起 8 季財報' : '查看 8 季財報明細'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <div className="flex items-center gap-2">
                    {onAddToWatchlist && (
                      <button
                        onClick={() => onAddToWatchlist(stock.symbol, stock.name)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                          isSaved
                            ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                      >
                        <BookmarkPlus size={13} />
                        <span>{isSaved ? '已在自選' : '加入自選'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectStock(stock.symbol, stock.name)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>觀測線型與回測</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 視圖呈現：報表矩陣視圖 (Table View) */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">排行</th>
                  <th className="py-2.5 px-3">標的名稱</th>
                  <th className="py-2.5 px-3">科技類群</th>
                  <th className="py-2.5 px-3 text-right">現價</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">【便宜價】</th>
                  <th className="py-2.5 px-3 text-right text-blue-400">【合理價】</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">【昂貴價】</th>
                  <th className="py-2.5 px-3 text-center">當前位階</th>
                  <th className="py-2.5 px-3 text-right">預估 G</th>
                  <th className="py-2.5 px-3 text-right">PEG</th>
                  <th className="py-2.5 px-3 text-right">毛利率</th>
                  <th className="py-2.5 px-3 text-right">ROE</th>
                  <th className="py-2.5 px-3 text-right text-blue-300">成長潛力分</th>
                  <th className="py-2.5 px-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStocks.map((stock) => {
                  const latestQ = stock.financials8Q[stock.financials8Q.length - 1];
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectStock(stock.symbol, stock.name)}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-400">#{stock.rank}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-100">{stock.name}</div>
                        <div className="text-[10px] text-slate-500">{stock.symbol}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-blue-300 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded">
                          {stock.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">${stock.currentPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">${stock.valuation.cheapPrice}</td>
                      <td className="py-2.5 px-3 text-right text-blue-300 font-bold">${stock.valuation.fairPrice}</td>
                      <td className="py-2.5 px-3 text-right text-rose-300 font-bold">${stock.valuation.expensivePrice}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stock.valuation.stageBadgeClass}`}>
                          {stock.valuation.stageLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+{stock.expectedGrowthRate}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-300">{stock.valuation.pegRatio}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{latestQ.grossMargin}%</td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">{latestQ.roe}%</td>
                      <td className="py-2.5 px-3 text-right font-black text-sm text-blue-400">
                        {stock.valuation.growthPotentialScore}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectStock(stock.symbol, stock.name)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-colors"
                        >
                          觀測
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
    </div>
  );
};
