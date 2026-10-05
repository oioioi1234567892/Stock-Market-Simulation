export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  timestamp: number;
}

export interface CandleData {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  k?: number;
  d?: number;
  dif?: number;
  macd?: number;
  osc?: number;
  rsi?: number;
  atr?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  bbWidth?: number;
}

export type IndicatorType = 'MA' | 'VOL' | 'KD' | 'MACD' | 'RSI' | 'BB' | 'ATR';

export type EntryConditionType =
  | 'checkMaGoldenCross'
  | 'checkKdGoldenCross'
  | 'checkMacdGoldenCross'
  | 'checkDifGtMacd'
  | 'checkRsiEntry'
  | 'checkBreakout30dHigh'
  | 'checkVolumeSpike'
  | 'checkCloseAboveMa20';

export interface EntryCondition {
  id: string;
  type: EntryConditionType;
  description: string;
  enabled: boolean;
  name: string;
}

export type ExitConditionType =
  | 'checkMaDeathCross'
  | 'checkKdDeathCross'
  | 'checkMacdDeathCross'
  | 'checkDifLtMacd'
  | 'checkRsiExit'
  | 'checkBreakdown30dHigh'
  | 'checkCloseBelowMa20';

export interface ExitCondition {
  id: string;
  type: ExitConditionType;
  description: string;
  enabled: boolean;
  name: string;
}

export interface StrategyConfig {
  name: string;
  entryLogic: 'AND' | 'OR'; // All entry conditions match OR any matches
  exitLogic: 'AND' | 'OR';  // All exit conditions match OR any matches
  entryConditions: EntryCondition[];
  exitConditions: ExitCondition[];
  // Dynamic ATR Risk Controls (replacing fixed stops)
  atrInitialStopMultiplier: number; // e.g. 2.0 (2x ATR initial stop), 0 to disable
  atrTrailingStopMultiplier: number; // e.g. 3.0 (3x ATR trailing stop profit), 0 to disable
  initialCapital: number; // e.g. 1,000,000 TWD
  positionSizing: 'ALL_IN' | 'FIXED_SHARES' | 'PERCENT_CAPITAL';
  fixedShares?: number; // 任意指定股數（已取消整股1000股強制限制，支援零股/精準股數）
  transactionFeePct: number; // default 0.1425%
  taxPct: number; // default 0.3%
}

export interface OpenPosition {
  entryDate: string;
  entryPrice: number;
  shares: number;
  holdingDays: number;
  currentPrice: number;
  currentValue: number;
  unrealizedReturnPct: number;
  unrealizedReturnAmount: number;
}

export interface TradeRecord {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  holdingDays: number;
  returnPct: number;
  returnAmount: number;
  exitReason: string;
  isWin: boolean;
  status?: 'CLOSED' | 'OPEN';
}

export interface EquityPoint {
  date: string;
  equity: number;
  benchmarkEquity?: number;
  drawdownPct: number;
}

export interface BacktestResult {
  symbol: string;
  stockName: string;
  strategyName: string;
  dateRange: {
    start: string;
    end: string;
  };
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // 0 - 100
  totalReturnPct: number;
  cagrPct: number;
  profitFactor: number;
  expectancyPct: number; // 期望值（每筆交易期望報酬率%）
  expectancyAmount: number; // 期望值（每筆交易期望金額）
  averageWinPct: number;
  averageLossPct: number;
  winLossRatio: number;
  maxDrawdownPct: number;
  trades: TradeRecord[];
  equityCurve: EquityPoint[];
  openPosition?: OpenPosition | null;
}

export interface WatchlistItem {
  id: number;
  userId: string;
  symbol: string;
  name: string;
  market?: string;
  targetBuyPrice?: string | null;
  targetSellPrice?: string | null;
  notes?: string | null;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

export type StrategySignalStatus = 'BUY' | 'HOLD' | 'SELL' | 'WAIT';

export interface StockStrategySignal {
  status: StrategySignalStatus;
  statusLabel: string;
  statusDesc: string;
  badgeClass: string;
  entryDate?: string;
  entryPrice?: number;
  exitPrice?: number;
  holdingDays?: number;
  returnPct?: number;
  winRate: number;
  expectancyPct: number;
  expectancyAmount: number;
  maxDrawdownPct: number;
  totalTrades: number;
  profitFactor: number;
  totalReturnPct: number;
}

// ==========================================
// 基本面與財報 8 季量化模型 & 動態估值型別
// ==========================================

export type TechCategory =
  | '晶圓代工'
  | '先進封裝'
  | 'IC設計'
  | '手機與AI晶片'
  | 'AI伺服器'
  | '電子製造'
  | '雲端'
  | '散熱'
  | '電源供應器'
  | '晶片設計'
  | 'ABF載板';

export interface QuarterlyFinancialReport {
  quarter: string; // e.g. '2024Q3', '2024Q2'
  revenue: number; // 營業收入 (億新台幣)
  revenueYoY: number; // 營收年增率 (%)
  revenueQoQ: number; // 營收季增率 (%)
  grossMargin: number; // 毛利率 (%)
  operatingMargin: number; // 營業利益率 (%)
  netMargin: number; // 稅後淨利率 (%)
  eps: number; // 單季 EPS (元)
  roe: number; // 年化/單季化 ROE (%)
  operatingCashFlow: number; // 營業現金流 (億新台幣)
  freeCashFlow: number; // 自由現金流 (億新台幣)
  debtRatio: number; // 負債比率 (%)
  currentRatio: number; // 流動比率 (%)
}

export interface FundamentalScores {
  growthScore: number; // 成長性 (YoY / QoQ) 0-100
  grossMarginScore: number; // 毛利率表現與趨勢 0-100
  operatingScore: number; // 營益獲利品質 0-100
  roeScore: number; // ROE 資本效率 0-100
  cashFlowScore: number; // 現金流健康度 0-100
  debtHealthScore: number; // 負債健康度 0-100
  overallScore: number; // 基本面量化總評分 0-100
  opportunityNote: string; // 機會亮點解析
  riskNote: string; // 風險防守提示
}

export type ValuationStage = 'CHEAP' | 'FAIR_LOW' | 'FAIR_HIGH' | 'EXPENSIVE';

export interface ValuationPrices {
  cheapPrice: number; // 【便宜價】 (PEG 60% + P/E 40%)
  fairPrice: number; // 【合理價】 (PEG 60% + P/E 40%)
  expensivePrice: number; // 【昂貴價】 (PEG 60% + P/E 40%)
  pegRatio: number; // 當前 PEG 比值
  pegValuation: {
    cheap: number;
    fair: number;
    expensive: number;
  };
  peBandValuation: {
    lowPE: number;
    midPE: number;
    highPE: number;
    cheap: number;
    fair: number;
    expensive: number;
  };
  stage: ValuationStage;
  stageLabel: string;
  stageBadgeClass: string;
  discountToFairPct: number; // 距合理價之安全邊際折溢價率 (%)
  growthPotentialScore: number; // 股價成長能力評分 (0-100)
}

export interface FundamentalRecommendation {
  rank: number;
  symbol: string;
  name: string;
  category: TechCategory;
  currentPrice: number;
  change: number;
  changePercent: number;
  trailing12mEPS: number; // 近 4 季累計 EPS
  expectedGrowthRate: number; // 預估複合成長率 G (%)
  forwardPE: number; // 預估本益比
  financials8Q: QuarterlyFinancialReport[];
  scores: FundamentalScores;
  valuation: ValuationPrices;
  latestRevenueYoY: number;
  latestRevenueMoM: number;
  highlights: string[];
}
