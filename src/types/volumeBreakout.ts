import { CandleData } from './stock.ts';

export type BreakoutPatternType =
  | 'VCP_CONTRACTION'       // VCP 量縮極致後首根起漲大紅K
  | 'MA_CONVERGENCE_BOX'    // 均線多頭糾結 + 帶量突破箱頂
  | 'HIGH_TIGHT_FLAG'       // 經典高姿態旗形強勢放量突破
  | 'CUP_AND_HANDLE'        // 杯柄形態帶量突破頸線
  | 'DOUBLE_BOTTOM_SURGE'   // W底/頭肩底右肩出量起漲
  | 'BOLLINGER_SQUEEZE'     // 布林通道極度壓縮後開口放量
  | 'TRENDLINE_BREAKOUT';   // 下降壓力線突破 + 主力洗盤結束

export interface TopSectorVolumeInfo {
  sector: string;
  rank: number;
  dailyTurnoverAmount: number; // 當日成交金額 (億元新台幣)
  dailyVolumeShares: number;   // 當日成交股數 (萬張)
  volumeSharePercent: number;  // 佔大盤總成交量比重 (%)
  sectorChangePercent: number; // 當日板塊加權漲跌幅 (%)
  mainDriver: string;          // 主力資金拉抬核心題材
  momentumGrade: 'EXTREME_SURGE' | 'STRONG_ACCUMULATION' | 'CONVERGENCE_BREAKOUT';
  momentumGradeLabel: string;
  stocksCount: number;
  representativeStocks: string[]; // 代表性龍頭股 (e.g. ['2330 台積電', '3711 日月光投控'])
}

export interface BreakoutStockCandidate {
  rank: number;
  code: string;
  name: string;
  symbol: string;
  sector: string;
  subCategory: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volumeToday: number;        // 今日成交量 (張)
  volumeMa20: number;         // 20日均量 (張)
  volumeSurgeRatio: number;   // 放量暴增倍數 (例如 2.85x)
  volumeSurgeStatus: 'EXPLOSIVE' | 'HIGH' | 'EMERGING'; // 暴量起漲 / 顯著放量 / 溫和加溫
  volumeSurgeLabel: string;   // 例如: "🔥 暴增 2.9倍"

  // AI Agent 形態研判
  patternType: BreakoutPatternType;
  patternName: string;        // 繁體中文形態名稱
  patternTag: string;         // 標籤，例如 "VCP突破", "均線糾結", "杯柄突破"
  patternScore: number;       // 形態匹配度評分 (0-100)
  breakoutScore: number;      // 綜合放量起漲評分 (0-100)
  breakoutStage: 'BREAKING_OUT_NOW' | 'ABOUT_TO_BREAK' | 'PULLBACK_TEST';
  breakoutStageLabel: string; // "🚀 剛放量突破第1根" | "⚡ 頸線下蓄勢待發" | "🎯 突破後量縮回測支撐"

  // 操盤關鍵位階
  breakoutPrice: number;      // 關鍵突破頸線價位
  entryZoneLow: number;       // 建議切入區間低標
  entryZoneHigh: number;      // 建議切入區間高標
  stopLossPrice: number;      // 關鍵防守停損價 (破此價形態破壞)
  targetPrice1: number;       // 第 1 波段目標價位
  targetPrice2: number;       // 第 2 主升段目標價位
  riskRewardRatio: string;    // 風險報酬比 (e.g. "1 : 3.8")
  upsidePotentialPercent: number; // 預期潛在漲幅空間 (%)

  // 技術指標輔助數值
  maConvergencePercent: number; // 均線糾結度 (5/10/20MA 差距 %)
  consolidationDays: number;    // 量縮整理橫盤天數
  rsi14: number;
  kdK: number;
  kdD: number;
  oneMonthReturn?: number;      // 近 1 個月累積漲跌幅 (%)
  isBullTrend?: boolean;        // 是否處於多頭牛市結構 (站上20MA/多頭排列)
  ma5?: number;
  ma20?: number;
  ma60?: number;

  // AI Agent 研判詳解
  aiTraderVerdict: string;     // 1-2 句操盤手核心定錨
  patternAnalysis: string;     // 深度形態幾何與籌碼洗盤解析
  catalystReason: string;      // 基本面催化劑與主力炒作題材
  actionSuggestion: string;    // 具體進出場操作紀律

  // 3 個月 K 線預覽數據 (約 60 筆)
  candles3Mo?: CandleData[];
}

export interface VolumeBreakoutScanResult {
  scanTimestamp: number;
  marketTurnoverTotal: number; // 大盤成交總額 (億元)
  top5Sectors: TopSectorVolumeInfo[];
  top20Stocks: BreakoutStockCandidate[];
  summaryMessage: string;
}
