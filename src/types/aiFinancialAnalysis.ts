import { TechSector, QuarterFinancial } from '../data/techFinancialsData.ts';

export type AiCompetitivenessRating =
  | 'TOP_TIER' // 🌟 產業頂級統治力
  | 'STRONG_MOAT' // 🟢 領先強勢競爭力
  | 'PEER_AVERAGE' // 🟡 同業中游持平
  | 'LAGGING'; // 🔴 競爭邊緣面臨挑戰

export type AiTraderVerdict =
  | 'CORE_ALLOCATION' // 核心強勢配置
  | 'BUY_ON_DIP' // 逢低戰略布局
  | 'NEUTRAL_WATCH' // 中立區間觀察
  | 'DEFENSIVE_AVOID'; // 避開防禦性減碼

export type AiDebtHealthStatus =
  | 'EXCELLENT' // 財務極度健全 (低負債、高現金流)
  | 'HEALTHY' // 財務穩健安全
  | 'MODERATE' // 財務普通可控
  | 'CAUTION'; // 需留意負債或現金流

export interface AiStockFinancialAnalysis {
  symbol: string;
  name: string;
  code: string;
  sector: TechSector;
  subCategory: string;
  currentPrice: number;
  changePercent: number;

  // 1. 產業比較與競爭力判斷 (Industry Comparison & Moat)
  competitivenessRating: AiCompetitivenessRating;
  competitivenessLabel: string;
  competitivenessScore: number; // 0 - 100
  competitivenessBadgeClass: string;
  competitivenessMoat: string; // 與同賽道競爭者對比之護城河亮點
  peerRankText: string; // e.g. "晶圓代工第 1 名 / 共 2 檔"

  // 2. 獲利能力 (Profitability)
  profitabilityScore: number; // 0 - 100
  grossMarginLatest: number; // 最新毛利率 %
  operatingMarginLatest: number; // 最新營益率 %
  ttmEps: number;
  profitabilityAnalysis: string; // 獲利能力深度解析

  // 3. 資產報酬率 (Return on Capital & Assets: ROA / ROE / ROIC)
  assetReturnScore: number; // 0 - 100
  roeLatest: number; // 最新 ROE %
  roicLatest: number; // 最新 ROIC %
  estimatedRoa: number; // 推估 ROA %
  assetReturnAnalysis: string; // 資產與資本運用回報率解析

  // 4. 營收增長率 (Revenue Growth Momentum)
  revenueGrowthScore: number; // 0 - 100
  revenueLatestYoY: number; // 最新月營收 YoY %
  expectedGrowthRate: number; // 次年度預期獲利年增率 %
  revenueGrowthAnalysis: string; // 營收成長動能與可持續性

  // 5. 負債健康度 (Debt & Financial Health)
  debtHealthScore: number; // 0 - 100
  debtRatioLatest: number; // 最新負債比率 %
  freeCashFlowLatest: number; // 最新自由現金流 (億元)
  debtHealthStatus: AiDebtHealthStatus;
  debtHealthStatusLabel: string;
  debtHealthBadgeClass: string;
  debtHealthAnalysis: string; // 負債結構與現金流償債抗風險能力

  // 6. 未來三大潛在風險 (Future Key Risks)
  futureRisks: string[]; // 2-3項明確具體之未來風險因子
  riskWarningSign: string; // 操盤手核心監控警戒指標

  // 7. 最新法說會精華與未來展望 (Latest Investor Conference Highlights & Guidance)
  earningsCallSummary?: string; // 最新法說會管理階層重點報告
  earningsCallGuidance?: string; // 未來季/年度財測展望指引
  earningsCallDate?: string; // 最近法說會舉辦季度或日期 (如 2026Q3 法說會)

  // 8. 全球宏觀市場方向結合 (Global Market Macro Context & Opportunities)
  globalMarketContext?: string; // 結合美股科技巨頭資本支出、聯準會利率、地緣政治之全球市場動向
  futureOpportunities?: string[]; // 未來主要成長機遇 (AI、邊緣運算、全球供應鏈移轉等)

  // 9. 操盤手綜合研判結論與總分 (Trader Stance & Recommendation)
  overallScore?: number; // 綜合評分 (0-100)
  traderVerdict: AiTraderVerdict;
  traderVerdictLabel: string;
  traderVerdictBadgeClass: string;
  traderSummary: string; // 總結操盤操作指引

  generatedAt: string;
  source: 'gemini' | 'analyst_engine';
}
