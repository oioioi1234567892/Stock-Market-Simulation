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
