import { CandleData } from './stock.ts';

/**
 * 6 大專業 K 線技術指標型態 (用戶指定核心獵殺指標)
 * 1. VCP突破 (波動收斂突破)
 * 2. 趨勢反轉向上 (下降趨勢線突破扭轉)
 * 3. 均線糾結帶量突破 (5/20/60MA 糾結後帶量突破箱頂)
 * 4. 旗形突破 (高姿態旗形強勢放量突破)
 * 5. 杯柄突破 (經典杯柄形態突破頸線)
 * 6. W底出量突破 (雙底/W底右腳墊高出量突破)
 */
export type BreakoutPatternType =
  | 'VCP_CONTRACTION'       // VCP突破
  | 'TRENDLINE_BREAKOUT'    // 趨勢反轉向上
  | 'MA_CONVERGENCE_BOX'    // 均線糾結帶量突破
  | 'HIGH_TIGHT_FLAG'       // 旗形突破
  | 'CUP_AND_HANDLE'        // 杯柄突破
  | 'DOUBLE_BOTTOM_SURGE';  // W底出量突破

/**
 * 最近五筆交易日之單日數據
 */
export interface DailySessionData {
  sessionIndex: number;    // 1 to 5 (1=T-4, 5=最新T日)
  sessionLabel: string;    // e.g. "T-4", "T-3", "T-2", "T-1", "今日(T)"
  date: string;            // e.g. "10/16", "10/17"
  turnoverAmount: number;  // 成交金額 (億元新台幣)
  volumeShares: number;    // 成交張數 (萬張)
  changePercent: number;   // 漲跌幅 (%)
}

/**
 * 台股各項產業分類之統計資訊 (包含最近 5 筆交易量與漲跌幅)
 */
export interface IndustrySectorInfo {
  sectorId: string;
  sectorName: string;
  categoryGroup: '電子科技' | '傳產製造' | '生技醫療' | '金融內需';
  subDescription: string;
  stocksCount: number;

  // 最近五筆交易日之量價明細與加總統計
  recent5Sessions: DailySessionData[];
  fiveDayTotalTurnover: number;       // 最近 5 筆累計總成交額 (億元)
  fiveDayTotalVolumeShares: number;   // 最近 5 筆累計總成交量 (萬張)
  fiveDayCumulativeChange: number;    // 最近 5 筆累計漲跌幅 (%)
  fiveDayVolumeSharePercent: number;  // 佔全市場近5筆總成交量之佔比 (%)

  // 熱門評級與大盤指數比較 (上漲量能熱門評分)
  heatScore: number;                  // 上漲量能熱門度綜合評分 (0-100)
  isTop5Hot: boolean;                 // 是否晉級為五大近期熱門產業
  hotRank?: number;                   // 若為熱門產業，其排名 1-5
  relativeStrengthVsTaiex: number;    // 與大盤加權指數比較之相對強弱/超額報酬 (%)
  upwardVolumeRatio: number;          // 上漲量能佔比: 5日內上漲交易日之成交金額佔總成交比重 (%)
  upwardVolumeAmount: number;         // 上漲日成交總額 (億元)
  taiexComparisonLabel: string;       // 大盤比較標籤 (如: "超越大盤 +5.7%" 或 "弱於大盤 -2.1%")
  heatScoreBreakdown?: {
    upwardVolumeScore: number;        // 上漲日買盤放量評分 (0-35)
    relativeStrengthScore: number;    // 超額大盤強弱度評分 (0-25)
    volumeShareScore: number;         // 全市場成交量份額評分 (0-25)
    accelerationScore: number;        // 量能爆發加速評分 (0-15)
  };

  // 驅動題材與成分股
  mainCatalyst: string;
  momentumGradeLabel: string;
  representativeStocks: string[];
  memberStocks: {
    code: string;
    name: string;
    symbol: string;
    subCategory: string;
    basePrice: number;
    catalyst?: string;
  }[];
}

export interface TopSectorVolumeInfo {
  sector: string;
  rank: number;
  dailyTurnoverAmount: number;        // 最新當日成交金額 (億元)
  dailyVolumeShares: number;          // 最新當日成交張數 (萬張)
  fiveDayTotalTurnover: number;       // 最近 5 筆累計總成交金額 (億元)
  fiveDayCumulativeChange: number;    // 最近 5 筆累計加權漲跌幅 (%)
  volumeSharePercent: number;         // 佔大盤總成交量比重 (%)
  sectorChangePercent: number;        // 當日板塊加權漲跌幅 (%)
  mainDriver: string;                 // 主力資金拉抬核心題材
  momentumGrade: 'EXTREME_SURGE' | 'STRONG_ACCUMULATION' | 'CONVERGENCE_BREAKOUT';
  momentumGradeLabel: string;
  stocksCount: number;
  representativeStocks: string[];     // 代表性龍頭股 (e.g. ['2330 台積電', '3711 日月光投控'])
  recent5Sessions: DailySessionData[];// 最近五筆交易量價走勢
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

  // AI Agent 形態研判 (嚴格落入 6 大技術指標)
  patternType: BreakoutPatternType;
  patternName: string;        // 繁體中文形態名稱 (如 "VCP 量縮極致後首根起漲大紅K")
  patternTag: string;         // 標籤，例如 "VCP突破", "趨勢反轉向上", "均線糾結帶量突破", "旗形突破", "杯柄突破", "W底出量突破"
  patternScore: number;       // 形態匹配度評分 (0-100)
  breakoutScore: number;      // 綜合放量起漲評分 (0-100)
  breakoutStage: 'BREAKING_OUT_NOW' | 'ABOUT_TO_BREAK' | 'PULLBACK_TEST';
  breakoutStageLabel: string; // "🚀 剛放量突破第1根" | "⚡ 頸線下蓄勢待發" | "🎯 突破後量縮回測支撐"

  // 操盤關鍵位階 (操盤手專業價格推估)
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
  fiveDayReturn?: number;       // 近 5 筆累積漲跌幅 (%)
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

export interface MarketBenchmarkInfo {
  name: string;                         // '加權指數 (^TWII)'
  symbol: string;                       // '^TWII'
  currentClose: number;                 // 最新指數點位 (如 23,450 點)
  change: number;                       // 最新漲跌點數
  changePercent: number;                // 最新當日漲跌幅 (%)
  fiveDayCumulativeChange: number;      // 最近 5 個交易日累計漲跌幅 (%)
  recent5Sessions: DailySessionData[];  // 最近 5 個交易日指數點位與漲跌幅
}

export interface VolumeBreakoutScanResult {
  scanTimestamp: number;
  marketTurnoverTotal: number;        // 當日大盤成交總額 (億元)
  fiveDayMarketTurnoverTotal: number; // 最近 5 筆大盤累計總成交額 (億元)
  marketBenchmark: MarketBenchmarkInfo; // 大盤加權指數基準比較數據
  allIndustrySectors: IndustrySectorInfo[]; // 台股各項產業分類與最近 5 筆交易量/漲跌幅統計
  top5Sectors: TopSectorVolumeInfo[]; // 從最近 5 筆資料篩選出之 5 個近期熱門產業
  top20Stocks: BreakoutStockCandidate[]; // 從 5 個熱門產業依 6 大 K 線指標篩選出之 20 檔即將上漲黑馬
  summaryMessage: string;
}
