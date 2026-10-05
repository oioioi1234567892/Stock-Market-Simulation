import {
  TechCategory,
  QuarterlyFinancialReport,
  FundamentalScores,
  ValuationPrices,
  FundamentalRecommendation,
  ValuationStage,
} from '../types/stock.ts';

// =========================================================================
// 台灣科技股 11 大類群 8 季真實財報歷史資料庫 (Taiwan Tech Stocks 8Q Financials)
// =========================================================================

interface RawTechStockData {
  symbol: string;
  name: string;
  category: TechCategory;
  basePrice: number;
  trailing12mEPS: number;
  expectedGrowthRate: number; // 預估複合年增率 G (%)
  lowPE: number;
  midPE: number;
  highPE: number;
  latestRevenueYoY: number;
  latestRevenueMoM: number;
  highlights: string[];
  financials8Q: QuarterlyFinancialReport[];
}

export const TAIWAN_TECH_STOCKS_DATA: RawTechStockData[] = [
  // 1. 晶圓代工
  {
    symbol: '2330.TW',
    name: '台積電',
    category: '晶圓代工',
    basePrice: 995,
    trailing12mEPS: 42.5,
    expectedGrowthRate: 26.5,
    lowPE: 18.0,
    midPE: 24.0,
    highPE: 30.0,
    latestRevenueYoY: 34.0,
    latestRevenueMoM: 4.8,
    highlights: ['3nm/2nm 全球先進製程市佔 95%', 'CoWoS 產能連續三年倍增', 'AI 晶片代工幾乎 100% 獨家'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 5086, revenueYoY: 3.6, revenueQoQ: -18.7, grossMargin: 56.3, operatingMargin: 45.5, netMargin: 40.7, eps: 7.98, roe: 28.5, operatingCashFlow: 3820, freeCashFlow: 1420, debtRatio: 41.2, currentRatio: 220 },
      { quarter: '2023Q2', revenue: 4808, revenueYoY: -13.7, revenueQoQ: -5.5, grossMargin: 54.1, operatingMargin: 42.0, netMargin: 37.8, eps: 7.01, roe: 24.6, operatingCashFlow: 3510, freeCashFlow: 1180, debtRatio: 40.8, currentRatio: 235 },
      { quarter: '2023Q3', revenue: 5467, revenueYoY: -10.8, revenueQoQ: 13.7, grossMargin: 54.3, operatingMargin: 41.7, netMargin: 38.6, eps: 8.14, roe: 27.2, operatingCashFlow: 4120, freeCashFlow: 1650, debtRatio: 39.5, currentRatio: 240 },
      { quarter: '2023Q4', revenue: 6255, revenueYoY: -1.5, revenueQoQ: 14.4, grossMargin: 53.0, operatingMargin: 41.6, netMargin: 38.2, eps: 9.21, roe: 29.1, operatingCashFlow: 4680, freeCashFlow: 2100, debtRatio: 38.9, currentRatio: 250 },
      { quarter: '2024Q1', revenue: 5926, revenueYoY: 16.5, revenueQoQ: -5.3, grossMargin: 53.1, operatingMargin: 42.0, netMargin: 38.0, eps: 8.70, roe: 26.8, operatingCashFlow: 4410, freeCashFlow: 1980, debtRatio: 37.5, currentRatio: 260 },
      { quarter: '2024Q2', revenue: 6735, revenueYoY: 40.1, revenueQoQ: 13.6, grossMargin: 53.2, operatingMargin: 42.5, netMargin: 36.8, eps: 9.56, roe: 28.9, operatingCashFlow: 4950, freeCashFlow: 2420, debtRatio: 36.8, currentRatio: 265 },
      { quarter: '2024Q3', revenue: 7597, revenueYoY: 39.0, revenueQoQ: 12.8, grossMargin: 57.8, operatingMargin: 47.5, netMargin: 42.8, eps: 12.54, roe: 33.4, operatingCashFlow: 5820, freeCashFlow: 3120, debtRatio: 35.1, currentRatio: 275 },
      { quarter: '2024Q4', revenue: 8680, revenueYoY: 38.8, revenueQoQ: 14.2, grossMargin: 58.2, operatingMargin: 48.0, netMargin: 43.1, eps: 13.80, roe: 35.2, operatingCashFlow: 6450, freeCashFlow: 3680, debtRatio: 34.2, currentRatio: 285 },
    ],
  },
  {
    symbol: '2303.TW',
    name: '聯電',
    category: '晶圓代工',
    basePrice: 48.5,
    trailing12mEPS: 4.1,
    expectedGrowthRate: 8.5,
    lowPE: 10.0,
    midPE: 13.0,
    highPE: 16.0,
    latestRevenueYoY: 6.2,
    latestRevenueMoM: 1.2,
    highlights: ['22/28nm 特殊製程穩定獲利', '車用與邊緣通訊晶片長約保護', '高現金殖利率與穩健現金流'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 542, revenueYoY: -14.5, revenueQoQ: -20.1, grossMargin: 35.5, operatingMargin: 26.7, netMargin: 29.8, eps: 1.31, roe: 18.2, operatingCashFlow: 240, freeCashFlow: 90, debtRatio: 33.1, currentRatio: 190 },
      { quarter: '2023Q2', revenue: 563, revenueYoY: -21.9, revenueQoQ: 3.8, grossMargin: 36.0, operatingMargin: 27.8, netMargin: 27.7, eps: 1.27, roe: 17.5, operatingCashFlow: 255, freeCashFlow: 105, debtRatio: 32.5, currentRatio: 195 },
      { quarter: '2023Q3', revenue: 571, revenueYoY: -24.3, revenueQoQ: 1.4, grossMargin: 35.9, operatingMargin: 26.8, netMargin: 27.9, eps: 1.29, roe: 17.2, operatingCashFlow: 260, freeCashFlow: 110, debtRatio: 31.8, currentRatio: 200 },
      { quarter: '2023Q4', revenue: 549, revenueYoY: -19.0, revenueQoQ: -3.7, grossMargin: 32.4, operatingMargin: 22.6, netMargin: 24.0, eps: 1.06, roe: 14.1, operatingCashFlow: 230, freeCashFlow: 85, debtRatio: 32.0, currentRatio: 205 },
      { quarter: '2024Q1', revenue: 546, revenueYoY: 0.8, revenueQoQ: -0.6, grossMargin: 30.9, operatingMargin: 21.4, netMargin: 19.1, eps: 0.84, roe: 11.2, operatingCashFlow: 215, freeCashFlow: 75, debtRatio: 31.5, currentRatio: 210 },
      { quarter: '2024Q2', revenue: 568, revenueYoY: 0.9, revenueQoQ: 4.0, grossMargin: 35.2, operatingMargin: 23.3, netMargin: 24.2, eps: 1.11, roe: 14.6, operatingCashFlow: 245, freeCashFlow: 95, debtRatio: 30.9, currentRatio: 215 },
      { quarter: '2024Q3', revenue: 605, revenueYoY: 6.0, revenueQoQ: 6.5, grossMargin: 33.8, operatingMargin: 22.9, netMargin: 23.9, eps: 1.16, roe: 15.0, operatingCashFlow: 260, freeCashFlow: 110, debtRatio: 30.2, currentRatio: 220 },
      { quarter: '2024Q4', revenue: 618, revenueYoY: 12.5, revenueQoQ: 2.1, grossMargin: 34.5, operatingMargin: 23.5, netMargin: 24.5, eps: 1.22, roe: 15.8, operatingCashFlow: 275, freeCashFlow: 125, debtRatio: 29.8, currentRatio: 225 },
    ],
  },

  // 2. 先進封裝 (CoWoS / Packaging)
  {
    symbol: '3711.TW',
    name: '日月光投控',
    category: '先進封裝',
    basePrice: 158,
    trailing12mEPS: 8.8,
    expectedGrowthRate: 22.0,
    lowPE: 13.0,
    midPE: 18.0,
    highPE: 24.0,
    latestRevenueYoY: 14.5,
    latestRevenueMoM: 3.2,
    highlights: ['VIPack 先進封裝技術平台', '涵蓋 CoWoS 模組與高階扇出型封裝', '受惠 AI 晶片測試與先進系統級封裝'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 1309, revenueYoY: -9.4, revenueQoQ: -26.2, grossMargin: 14.8, operatingMargin: 6.9, netMargin: 6.0, eps: 1.82, roe: 12.8, operatingCashFlow: 185, freeCashFlow: 65, debtRatio: 52.1, currentRatio: 142 },
      { quarter: '2023Q2', revenue: 1362, revenueYoY: -15.1, revenueQoQ: 4.1, grossMargin: 16.0, operatingMargin: 7.9, netMargin: 5.7, eps: 1.80, roe: 12.5, operatingCashFlow: 198, freeCashFlow: 78, debtRatio: 51.5, currentRatio: 145 },
      { quarter: '2023Q3', revenue: 1541, revenueYoY: -18.3, revenueQoQ: 13.1, grossMargin: 16.2, operatingMargin: 8.1, netMargin: 5.7, eps: 2.03, roe: 13.9, operatingCashFlow: 225, freeCashFlow: 95, debtRatio: 50.8, currentRatio: 148 },
      { quarter: '2023Q4', revenue: 1606, revenueYoY: -9.5, revenueQoQ: 4.2, grossMargin: 16.0, operatingMargin: 7.9, netMargin: 5.8, eps: 2.18, roe: 14.6, operatingCashFlow: 240, freeCashFlow: 110, debtRatio: 49.5, currentRatio: 152 },
      { quarter: '2024Q1', revenue: 1328, revenueYoY: 1.5, revenueQoQ: -17.3, grossMargin: 15.7, operatingMargin: 7.1, netMargin: 4.3, eps: 1.32, roe: 9.1, operatingCashFlow: 190, freeCashFlow: 70, debtRatio: 48.9, currentRatio: 155 },
      { quarter: '2024Q2', revenue: 1403, revenueYoY: 3.0, revenueQoQ: 5.6, grossMargin: 16.4, operatingMargin: 7.8, netMargin: 5.5, eps: 1.80, roe: 12.2, operatingCashFlow: 210, freeCashFlow: 88, debtRatio: 48.2, currentRatio: 158 },
      { quarter: '2024Q3', revenue: 1601, revenueYoY: 3.9, revenueQoQ: 14.1, grossMargin: 16.5, operatingMargin: 8.4, netMargin: 6.1, eps: 2.24, roe: 14.8, operatingCashFlow: 265, freeCashFlow: 135, debtRatio: 47.5, currentRatio: 160 },
      { quarter: '2024Q4', revenue: 1780, revenueYoY: 10.8, revenueQoQ: 11.2, grossMargin: 17.5, operatingMargin: 9.5, netMargin: 7.2, eps: 3.44, roe: 18.5, operatingCashFlow: 310, freeCashFlow: 180, debtRatio: 46.8, currentRatio: 165 },
    ],
  },
  {
    symbol: '2449.TW',
    name: '京元電子',
    category: '先進封裝',
    basePrice: 128,
    trailing12mEPS: 6.5,
    expectedGrowthRate: 35.0,
    lowPE: 16.0,
    midPE: 21.0,
    highPE: 28.0,
    latestRevenueYoY: 28.6,
    latestRevenueMoM: 5.5,
    highlights: ['美系 AI GPU 晶圓測試主要代工廠', '高階測試機台產能滿載排至年底', '處分蘇州廠獲利豐厚，專注高階測試'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 77.8, revenueYoY: -13.5, revenueQoQ: -11.9, grossMargin: 30.5, operatingMargin: 20.1, netMargin: 15.2, eps: 0.97, roe: 11.8, operatingCashFlow: 32, freeCashFlow: 14, debtRatio: 45.2, currentRatio: 135 },
      { quarter: '2023Q2', revenue: 81.7, revenueYoY: -17.7, revenueQoQ: 5.0, grossMargin: 33.2, operatingMargin: 22.8, netMargin: 18.9, eps: 1.26, roe: 15.2, operatingCashFlow: 36, freeCashFlow: 18, debtRatio: 44.5, currentRatio: 138 },
      { quarter: '2023Q3', revenue: 85.9, revenueYoY: -4.8, revenueQoQ: 5.1, grossMargin: 35.4, operatingMargin: 24.5, netMargin: 18.0, eps: 1.26, roe: 15.1, operatingCashFlow: 39, freeCashFlow: 20, debtRatio: 43.8, currentRatio: 142 },
      { quarter: '2023Q4', revenue: 84.8, revenueYoY: -4.1, revenueQoQ: -1.3, grossMargin: 34.1, operatingMargin: 22.8, netMargin: 18.5, eps: 1.28, roe: 15.3, operatingCashFlow: 38, freeCashFlow: 19, debtRatio: 42.9, currentRatio: 145 },
      { quarter: '2024Q1', revenue: 82.2, revenueYoY: 5.7, revenueQoQ: -3.1, grossMargin: 33.5, operatingMargin: 22.2, netMargin: 16.7, eps: 1.12, roe: 13.5, operatingCashFlow: 35, freeCashFlow: 16, debtRatio: 41.5, currentRatio: 150 },
      { quarter: '2024Q2', revenue: 89.5, revenueYoY: 9.5, revenueQoQ: 8.9, grossMargin: 34.8, operatingMargin: 24.1, netMargin: 20.5, eps: 1.50, roe: 17.5, operatingCashFlow: 42, freeCashFlow: 23, debtRatio: 40.2, currentRatio: 155 },
      { quarter: '2024Q3', revenue: 98.2, revenueYoY: 14.3, revenueQoQ: 9.7, grossMargin: 36.8, operatingMargin: 26.5, netMargin: 21.8, eps: 1.82, roe: 20.5, operatingCashFlow: 48, freeCashFlow: 28, debtRatio: 38.5, currentRatio: 165 },
      { quarter: '2024Q4', revenue: 108.5, revenueYoY: 27.9, revenueQoQ: 10.5, grossMargin: 38.5, operatingMargin: 28.2, netMargin: 23.5, eps: 2.06, roe: 22.8, operatingCashFlow: 55, freeCashFlow: 34, debtRatio: 37.0, currentRatio: 175 },
    ],
  },
  {
    symbol: '3131.TWO',
    name: '弘塑',
    category: '先進封裝',
    basePrice: 1720,
    trailing12mEPS: 38.5,
    expectedGrowthRate: 52.0,
    lowPE: 30.0,
    midPE: 42.0,
    highPE: 58.0,
    latestRevenueYoY: 65.4,
    latestRevenueMoM: 12.0,
    highlights: ['CoWoS 濕製程單晶圓清洗設備全球獨家', '台積電與日月光高階設備訂單排滿至2026', '自製化學品耗材帶來長期高毛利循環'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 8.2, revenueYoY: -12.1, revenueQoQ: -15.2, grossMargin: 42.1, operatingMargin: 19.5, netMargin: 17.2, eps: 5.12, roe: 18.5, operatingCashFlow: 2.1, freeCashFlow: 1.4, debtRatio: 38.2, currentRatio: 180 },
      { quarter: '2023Q2', revenue: 9.1, revenueYoY: -8.5, revenueQoQ: 11.0, grossMargin: 43.5, operatingMargin: 21.2, netMargin: 18.5, eps: 6.05, roe: 20.8, operatingCashFlow: 2.6, freeCashFlow: 1.8, debtRatio: 37.5, currentRatio: 185 },
      { quarter: '2023Q3', revenue: 9.8, revenueYoY: 4.2, revenueQoQ: 7.7, grossMargin: 44.2, operatingMargin: 22.0, netMargin: 19.1, eps: 6.72, roe: 22.5, operatingCashFlow: 2.9, freeCashFlow: 2.1, debtRatio: 36.8, currentRatio: 190 },
      { quarter: '2023Q4', revenue: 10.5, revenueYoY: 12.8, revenueQoQ: 7.1, grossMargin: 45.1, operatingMargin: 23.4, netMargin: 20.2, eps: 7.61, roe: 24.6, operatingCashFlow: 3.3, freeCashFlow: 2.5, debtRatio: 35.5, currentRatio: 195 },
      { quarter: '2024Q1', revenue: 11.2, revenueYoY: 36.6, revenueQoQ: 6.7, grossMargin: 45.8, operatingMargin: 24.5, netMargin: 21.0, eps: 8.42, roe: 26.2, operatingCashFlow: 3.8, freeCashFlow: 2.9, debtRatio: 34.2, currentRatio: 205 },
      { quarter: '2024Q2', revenue: 12.8, revenueYoY: 40.7, revenueQoQ: 14.3, grossMargin: 46.5, operatingMargin: 25.8, netMargin: 22.1, eps: 9.85, roe: 29.5, operatingCashFlow: 4.5, freeCashFlow: 3.6, debtRatio: 33.1, currentRatio: 215 },
      { quarter: '2024Q3', revenue: 14.6, revenueYoY: 49.0, revenueQoQ: 14.1, grossMargin: 47.8, operatingMargin: 27.2, netMargin: 23.5, eps: 11.45, roe: 32.8, operatingCashFlow: 5.2, freeCashFlow: 4.2, debtRatio: 31.8, currentRatio: 225 },
      { quarter: '2024Q4', revenue: 17.5, revenueYoY: 66.7, revenueQoQ: 19.9, grossMargin: 48.5, operatingMargin: 28.5, netMargin: 24.8, eps: 13.80, roe: 36.5, operatingCashFlow: 6.5, freeCashFlow: 5.3, debtRatio: 30.5, currentRatio: 240 },
    ],
  },
  {
    symbol: '6187.TWO',
    name: '萬潤',
    category: '先進封裝',
    basePrice: 420,
    trailing12mEPS: 12.8,
    expectedGrowthRate: 68.0,
    lowPE: 22.0,
    midPE: 32.0,
    highPE: 45.0,
    latestRevenueYoY: 185.0,
    latestRevenueMoM: 18.2,
    highlights: ['CoWoS 晶圓點膠機與貼合機主力供貨商', '單月營收連續刷新歷史新高', '受惠晶圓代工龍頭先進封裝擴產潮'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 2.8, revenueYoY: -55.2, revenueQoQ: -35.1, grossMargin: 40.1, operatingMargin: 10.2, netMargin: 9.5, eps: 0.35, roe: 4.2, operatingCashFlow: 0.6, freeCashFlow: 0.3, debtRatio: 32.5, currentRatio: 210 },
      { quarter: '2023Q2', revenue: 3.2, revenueYoY: -48.1, revenueQoQ: 14.3, grossMargin: 41.5, operatingMargin: 12.5, netMargin: 11.2, eps: 0.48, roe: 5.8, operatingCashFlow: 0.8, freeCashFlow: 0.5, debtRatio: 31.8, currentRatio: 215 },
      { quarter: '2023Q3', revenue: 3.9, revenueYoY: -22.5, revenueQoQ: 21.9, grossMargin: 42.8, operatingMargin: 15.2, netMargin: 13.5, eps: 0.68, roe: 8.1, operatingCashFlow: 1.1, freeCashFlow: 0.7, debtRatio: 30.9, currentRatio: 220 },
      { quarter: '2023Q4', revenue: 5.1, revenueYoY: 18.2, revenueQoQ: 30.8, grossMargin: 44.5, operatingMargin: 19.5, netMargin: 16.8, eps: 1.15, roe: 13.5, operatingCashFlow: 1.6, freeCashFlow: 1.1, debtRatio: 29.5, currentRatio: 230 },
      { quarter: '2024Q1', revenue: 8.5, revenueYoY: 203.6, revenueQoQ: 66.7, grossMargin: 48.2, operatingMargin: 26.5, netMargin: 22.5, eps: 2.45, roe: 26.5, operatingCashFlow: 2.8, freeCashFlow: 2.1, debtRatio: 28.2, currentRatio: 245 },
      { quarter: '2024Q2', revenue: 11.8, revenueYoY: 268.8, revenueQoQ: 38.8, grossMargin: 51.5, operatingMargin: 30.2, netMargin: 25.8, eps: 3.82, roe: 36.8, operatingCashFlow: 4.1, freeCashFlow: 3.2, debtRatio: 26.5, currentRatio: 260 },
      { quarter: '2024Q3', revenue: 15.2, revenueYoY: 289.7, revenueQoQ: 28.8, grossMargin: 53.8, operatingMargin: 33.5, netMargin: 28.2, eps: 5.20, roe: 45.2, operatingCashFlow: 5.6, freeCashFlow: 4.5, debtRatio: 24.8, currentRatio: 280 },
      { quarter: '2024Q4', revenue: 18.5, revenueYoY: 262.7, revenueQoQ: 21.7, grossMargin: 54.5, operatingMargin: 34.5, netMargin: 29.1, eps: 6.35, roe: 51.2, operatingCashFlow: 6.8, freeCashFlow: 5.6, debtRatio: 23.5, currentRatio: 295 },
    ],
  },

  // 3. 手機與AI晶片 / IC設計 / 晶片設計
  {
    symbol: '2454.TW',
    name: '聯發科',
    category: '手機與AI晶片',
    basePrice: 1380,
    trailing12mEPS: 68.5,
    expectedGrowthRate: 28.0,
    lowPE: 16.0,
    midPE: 22.0,
    highPE: 28.0,
    latestRevenueYoY: 24.2,
    latestRevenueMoM: 6.5,
    highlights: ['天璣 9400 全大核 AI 手機晶片橫掃旗艦市場', '自研 ASIC 客製化晶片切入雲端巨頭供應鏈', '智慧座艙車載晶片獲全球車廠採用'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 956, revenueYoY: -33.0, revenueQoQ: -11.6, grossMargin: 48.0, operatingMargin: 15.0, netMargin: 17.6, eps: 10.64, roe: 18.2, operatingCashFlow: 145, freeCashFlow: 85, debtRatio: 38.5, currentRatio: 185 },
      { quarter: '2023Q2', revenue: 981, revenueYoY: -37.0, revenueQoQ: 2.6, grossMargin: 47.5, operatingMargin: 15.0, netMargin: 16.3, eps: 10.07, roe: 17.5, operatingCashFlow: 150, freeCashFlow: 90, debtRatio: 37.8, currentRatio: 190 },
      { quarter: '2023Q3', revenue: 1101, revenueYoY: -21.7, revenueQoQ: 12.2, grossMargin: 47.4, operatingMargin: 16.3, netMargin: 16.8, eps: 11.57, roe: 19.8, operatingCashFlow: 175, freeCashFlow: 110, debtRatio: 36.9, currentRatio: 195 },
      { quarter: '2023Q4', revenue: 1296, revenueYoY: 19.7, revenueQoQ: 17.7, grossMargin: 48.3, operatingMargin: 19.1, netMargin: 19.8, eps: 16.15, roe: 26.5, operatingCashFlow: 220, freeCashFlow: 150, debtRatio: 35.8, currentRatio: 205 },
      { quarter: '2024Q1', revenue: 1334, revenueYoY: 39.5, revenueQoQ: 2.9, grossMargin: 52.4, operatingMargin: 24.1, netMargin: 23.7, eps: 19.85, roe: 31.2, operatingCashFlow: 255, freeCashFlow: 185, debtRatio: 34.5, currentRatio: 215 },
      { quarter: '2024Q2', revenue: 1273, revenueYoY: 29.7, revenueQoQ: -4.6, grossMargin: 48.8, operatingMargin: 19.6, netMargin: 20.4, eps: 16.19, roe: 25.8, operatingCashFlow: 215, freeCashFlow: 145, debtRatio: 34.0, currentRatio: 220 },
      { quarter: '2024Q3', revenue: 1318, revenueYoY: 19.7, revenueQoQ: 3.5, grossMargin: 48.8, operatingMargin: 18.0, netMargin: 19.4, eps: 15.94, roe: 25.2, operatingCashFlow: 225, freeCashFlow: 155, debtRatio: 33.2, currentRatio: 225 },
      { quarter: '2024Q4', revenue: 1420, revenueYoY: 9.6, revenueQoQ: 7.7, grossMargin: 49.5, operatingMargin: 19.8, netMargin: 20.8, eps: 18.52, roe: 28.5, operatingCashFlow: 260, freeCashFlow: 190, debtRatio: 32.5, currentRatio: 230 },
    ],
  },
  {
    symbol: '3661.TW',
    name: '世芯-KY',
    category: '晶片設計',
    basePrice: 2850,
    trailing12mEPS: 75.0,
    expectedGrowthRate: 45.0,
    lowPE: 28.0,
    midPE: 40.0,
    highPE: 55.0,
    latestRevenueYoY: 52.5,
    latestRevenueMoM: 8.8,
    highlights: ['北美一線雲端大廠 (CSP) 3nm AI ASIC 核心主力', '量產與委託設計 (NRE) 訂單能見度直達2026', '先進製程與 CoWoS 封裝整合設計能力無人能敵'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 57.2, revenueYoY: 118.0, revenueQoQ: 22.5, grossMargin: 22.8, operatingMargin: 12.5, netMargin: 10.2, eps: 8.05, roe: 22.5, operatingCashFlow: 6.8, freeCashFlow: 5.2, debtRatio: 48.5, currentRatio: 160 },
      { quarter: '2023Q2', revenue: 79.3, revenueYoY: 145.2, revenueQoQ: 38.6, grossMargin: 21.5, operatingMargin: 11.8, netMargin: 9.2, eps: 10.15, roe: 26.8, operatingCashFlow: 8.5, freeCashFlow: 6.8, debtRatio: 47.8, currentRatio: 165 },
      { quarter: '2023Q3', revenue: 76.1, revenueYoY: 115.0, revenueQoQ: -4.0, grossMargin: 24.5, operatingMargin: 13.8, netMargin: 11.5, eps: 12.03, roe: 30.5, operatingCashFlow: 10.2, freeCashFlow: 8.5, debtRatio: 46.5, currentRatio: 170 },
      { quarter: '2023Q4', revenue: 92.6, revenueYoY: 98.5, revenueQoQ: 21.7, grossMargin: 22.1, operatingMargin: 12.9, netMargin: 10.9, eps: 14.85, roe: 35.2, operatingCashFlow: 12.8, freeCashFlow: 10.5, debtRatio: 45.2, currentRatio: 175 },
      { quarter: '2024Q1', revenue: 104.9, revenueYoY: 83.4, revenueQoQ: 13.3, grossMargin: 19.8, operatingMargin: 11.5, netMargin: 9.7, eps: 15.83, roe: 36.8, operatingCashFlow: 14.5, freeCashFlow: 12.0, debtRatio: 44.1, currentRatio: 180 },
      { quarter: '2024Q2', revenue: 135.8, revenueYoY: 71.2, revenueQoQ: 29.5, grossMargin: 19.2, operatingMargin: 11.0, netMargin: 9.4, eps: 18.88, roe: 41.2, operatingCashFlow: 18.2, freeCashFlow: 15.5, debtRatio: 43.5, currentRatio: 185 },
      { quarter: '2024Q3', revenue: 148.2, revenueYoY: 94.7, revenueQoQ: 9.1, grossMargin: 19.5, operatingMargin: 11.4, netMargin: 9.8, eps: 21.50, roe: 44.5, operatingCashFlow: 21.0, freeCashFlow: 18.2, debtRatio: 42.1, currentRatio: 190 },
      { quarter: '2024Q4', revenue: 165.0, revenueYoY: 78.2, revenueQoQ: 11.3, grossMargin: 20.2, operatingMargin: 12.2, netMargin: 10.5, eps: 24.20, roe: 48.0, operatingCashFlow: 24.5, freeCashFlow: 21.0, debtRatio: 41.0, currentRatio: 200 },
    ],
  },
  {
    symbol: '5274.TWO',
    name: '信驊',
    category: 'IC設計',
    basePrice: 4250,
    trailing12mEPS: 62.0,
    expectedGrowthRate: 50.0,
    lowPE: 45.0,
    midPE: 65.0,
    highPE: 85.0,
    latestRevenueYoY: 102.5,
    latestRevenueMoM: 14.2,
    highlights: ['伺服器遠端管理晶片 (BMC) 全球市佔率高達 75%', 'AI 伺服器帶動雙晶片與資安晶片 (RoT) 滲透率激增', '台股股王，毛利率長年維持 64% 以上神級水準'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 6.7, revenueYoY: -42.5, revenueQoQ: -49.5, grossMargin: 64.2, operatingMargin: 38.5, netMargin: 35.8, eps: 6.25, roe: 24.5, operatingCashFlow: 2.8, freeCashFlow: 2.4, debtRatio: 18.5, currentRatio: 380 },
      { quarter: '2023Q2', revenue: 6.8, revenueYoY: -51.2, revenueQoQ: 1.5, grossMargin: 64.0, operatingMargin: 38.1, netMargin: 35.2, eps: 6.28, roe: 24.8, operatingCashFlow: 2.9, freeCashFlow: 2.5, debtRatio: 18.0, currentRatio: 390 },
      { quarter: '2023Q3', revenue: 7.9, revenueYoY: -39.5, revenueQoQ: 16.2, grossMargin: 64.5, operatingMargin: 40.2, netMargin: 37.5, eps: 7.82, roe: 29.5, operatingCashFlow: 3.5, freeCashFlow: 3.1, debtRatio: 17.5, currentRatio: 400 },
      { quarter: '2023Q4', revenue: 9.8, revenueYoY: -26.0, revenueQoQ: 24.1, grossMargin: 64.8, operatingMargin: 42.1, netMargin: 39.2, eps: 10.05, roe: 36.2, operatingCashFlow: 4.5, freeCashFlow: 4.0, debtRatio: 16.8, currentRatio: 420 },
      { quarter: '2024Q1', revenue: 10.1, revenueYoY: 50.7, revenueQoQ: 3.1, grossMargin: 65.2, operatingMargin: 43.5, netMargin: 40.5, eps: 10.88, roe: 38.5, operatingCashFlow: 4.8, freeCashFlow: 4.3, debtRatio: 16.2, currentRatio: 435 },
      { quarter: '2024Q2', revenue: 13.5, revenueYoY: 98.5, revenueQoQ: 33.7, grossMargin: 65.5, operatingMargin: 45.2, netMargin: 42.1, eps: 15.20, roe: 49.2, operatingCashFlow: 6.5, freeCashFlow: 5.9, debtRatio: 15.5, currentRatio: 450 },
      { quarter: '2024Q3', revenue: 17.5, revenueYoY: 121.5, revenueQoQ: 29.6, grossMargin: 65.8, operatingMargin: 46.5, netMargin: 43.5, eps: 20.15, roe: 58.5, operatingCashFlow: 8.5, freeCashFlow: 7.8, debtRatio: 14.8, currentRatio: 470 },
      { quarter: '2024Q4', revenue: 19.8, revenueYoY: 102.0, revenueQoQ: 13.1, grossMargin: 66.2, operatingMargin: 47.8, netMargin: 44.8, eps: 23.40, roe: 64.0, operatingCashFlow: 9.8, freeCashFlow: 9.0, debtRatio: 14.0, currentRatio: 490 },
    ],
  },

  // 4. AI伺服器 / 電子製造 (ODM / EMS)
  {
    symbol: '2317.TW',
    name: '鴻海',
    category: 'AI伺服器',
    basePrice: 208,
    trailing12mEPS: 12.2,
    expectedGrowthRate: 25.0,
    lowPE: 12.0,
    midPE: 17.0,
    highPE: 23.0,
    latestRevenueYoY: 20.5,
    latestRevenueMoM: 5.8,
    highlights: ['GB200 NVL72 伺服器全球出貨最大垂直整合廠', 'AI 伺服器營收比重突破 40% 快速翻倍', '從高速連接器、水冷模組到機櫃整機一條龍'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 14624, revenueYoY: 3.9, revenueQoQ: -25.5, grossMargin: 6.0, operatingMargin: 2.8, netMargin: 0.9, eps: 0.93, roe: 3.2, operatingCashFlow: 380, freeCashFlow: 120, debtRatio: 58.2, currentRatio: 135 },
      { quarter: '2023Q2', revenue: 13045, revenueYoY: -13.8, revenueQoQ: -10.8, grossMargin: 6.4, operatingMargin: 2.4, netMargin: 2.5, eps: 2.38, roe: 8.5, operatingCashFlow: 410, freeCashFlow: 150, debtRatio: 57.5, currentRatio: 138 },
      { quarter: '2023Q3', revenue: 15432, revenueYoY: -11.7, revenueQoQ: 18.3, grossMargin: 6.7, operatingMargin: 3.0, netMargin: 2.8, eps: 3.11, roe: 10.8, operatingCashFlow: 490, freeCashFlow: 210, debtRatio: 56.8, currentRatio: 140 },
      { quarter: '2023Q4', revenue: 18512, revenueYoY: -5.6, revenueQoQ: 20.0, grossMargin: 6.1, operatingMargin: 2.9, netMargin: 2.9, eps: 3.83, roe: 13.2, operatingCashFlow: 580, freeCashFlow: 280, debtRatio: 55.9, currentRatio: 145 },
      { quarter: '2024Q1', revenue: 13240, revenueYoY: -9.5, revenueQoQ: -28.5, grossMargin: 6.3, operatingMargin: 2.8, netMargin: 1.7, eps: 1.59, roe: 5.5, operatingCashFlow: 430, freeCashFlow: 160, debtRatio: 55.2, currentRatio: 148 },
      { quarter: '2024Q2', revenue: 15518, revenueYoY: 19.0, revenueQoQ: 17.2, grossMargin: 6.4, operatingMargin: 2.9, netMargin: 2.3, eps: 2.53, roe: 8.9, operatingCashFlow: 520, freeCashFlow: 230, debtRatio: 54.5, currentRatio: 152 },
      { quarter: '2024Q3', revenue: 18537, revenueYoY: 20.1, revenueQoQ: 19.5, grossMargin: 6.2, operatingMargin: 3.0, netMargin: 2.7, eps: 3.55, roe: 12.5, operatingCashFlow: 630, freeCashFlow: 320, debtRatio: 53.8, currentRatio: 155 },
      { quarter: '2024Q4', revenue: 21850, revenueYoY: 18.0, revenueQoQ: 17.9, grossMargin: 6.5, operatingMargin: 3.3, netMargin: 3.1, eps: 4.85, roe: 16.5, operatingCashFlow: 750, freeCashFlow: 410, debtRatio: 52.9, currentRatio: 160 },
    ],
  },
  {
    symbol: '2382.TW',
    name: '廣達',
    category: 'AI伺服器',
    basePrice: 285,
    trailing12mEPS: 15.5,
    expectedGrowthRate: 38.0,
    lowPE: 15.0,
    midPE: 20.0,
    highPE: 26.0,
    latestRevenueYoY: 38.5,
    latestRevenueMoM: 7.2,
    highlights: ['北美四大 CSP 雲端巨頭最核心機櫃伺服器夥伴', 'AI 伺服器營收佔比超過 50%，毛利率創歷史新高', '液冷散熱機櫃系統出貨量居全球領先地位'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 2717, revenueYoY: -11.9, revenueQoQ: -18.2, grossMargin: 6.6, operatingMargin: 3.0, netMargin: 2.4, eps: 1.68, roe: 15.2, operatingCashFlow: 95, freeCashFlow: 45, debtRatio: 72.5, currentRatio: 125 },
      { quarter: '2023Q2', revenue: 2450, revenueYoY: 5.6, revenueQoQ: -9.8, grossMargin: 8.5, operatingMargin: 4.6, netMargin: 4.1, eps: 2.63, roe: 23.5, operatingCashFlow: 140, freeCashFlow: 85, debtRatio: 70.8, currentRatio: 130 },
      { quarter: '2023Q3', revenue: 2865, revenueYoY: -25.0, revenueQoQ: 16.9, grossMargin: 8.1, operatingMargin: 4.4, netMargin: 4.5, eps: 3.32, roe: 28.5, operatingCashFlow: 165, freeCashFlow: 105, debtRatio: 68.9, currentRatio: 135 },
      { quarter: '2023Q4', revenue: 2828, revenueYoY: -19.4, revenueQoQ: -1.3, grossMargin: 8.1, operatingMargin: 4.1, netMargin: 3.6, eps: 2.66, roe: 22.8, operatingCashFlow: 150, freeCashFlow: 90, debtRatio: 67.5, currentRatio: 140 },
      { quarter: '2024Q1', revenue: 2600, revenueYoY: -4.3, revenueQoQ: -8.1, grossMargin: 8.5, operatingMargin: 4.5, netMargin: 4.6, eps: 3.13, roe: 25.8, operatingCashFlow: 160, freeCashFlow: 100, debtRatio: 66.2, currentRatio: 145 },
      { quarter: '2024Q2', revenue: 3167, revenueYoY: 29.3, revenueQoQ: 21.8, grossMargin: 8.6, operatingMargin: 4.9, netMargin: 4.8, eps: 3.92, roe: 31.2, operatingCashFlow: 210, freeCashFlow: 140, debtRatio: 65.0, currentRatio: 150 },
      { quarter: '2024Q3', revenue: 4245, revenueYoY: 48.2, revenueQoQ: 34.0, grossMargin: 8.2, operatingMargin: 4.6, netMargin: 3.9, eps: 4.32, roe: 33.5, operatingCashFlow: 270, freeCashFlow: 185, debtRatio: 64.2, currentRatio: 155 },
      { quarter: '2024Q4', revenue: 4950, revenueYoY: 75.0, revenueQoQ: 16.6, grossMargin: 8.3, operatingMargin: 4.8, netMargin: 4.1, eps: 5.15, roe: 38.5, operatingCashFlow: 320, freeCashFlow: 230, debtRatio: 63.5, currentRatio: 160 },
    ],
  },
  {
    symbol: '6669.TW',
    name: '緯穎',
    category: 'AI伺服器',
    basePrice: 2150,
    trailing12mEPS: 118.0,
    expectedGrowthRate: 55.0,
    lowPE: 16.0,
    midPE: 22.0,
    highPE: 30.0,
    latestRevenueYoY: 85.2,
    latestRevenueMoM: 15.0,
    highlights: ['純白牌雲端伺服器龍頭，獲利能力冠絕同業', '美系 CSP 巨頭客製化 ASIC 伺服器爆發式出貨', '液冷浸沒式散熱前瞻佈局完整'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 742, revenueYoY: 46.4, revenueQoQ: -15.1, grossMargin: 8.3, operatingMargin: 6.2, netMargin: 4.4, eps: 18.86, roe: 32.5, operatingCashFlow: 45, freeCashFlow: 32, debtRatio: 64.2, currentRatio: 145 },
      { quarter: '2023Q2', revenue: 563, revenueYoY: -25.0, revenueQoQ: -24.1, grossMargin: 8.6, operatingMargin: 6.1, netMargin: 4.7, eps: 14.96, roe: 25.8, operatingCashFlow: 38, freeCashFlow: 26, debtRatio: 63.5, currentRatio: 150 },
      { quarter: '2023Q3', revenue: 528, revenueYoY: -33.7, revenueQoQ: -6.2, grossMargin: 9.6, operatingMargin: 6.2, netMargin: 3.7, eps: 14.90, roe: 24.5, operatingCashFlow: 35, freeCashFlow: 24, debtRatio: 62.1, currentRatio: 155 },
      { quarter: '2023Q4', revenue: 585, revenueYoY: -33.1, revenueQoQ: 10.8, grossMargin: 11.0, operatingMargin: 7.9, netMargin: 6.0, eps: 20.10, roe: 31.8, operatingCashFlow: 52, freeCashFlow: 40, debtRatio: 60.5, currentRatio: 160 },
      { quarter: '2024Q1', revenue: 696, revenueYoY: -6.2, revenueQoQ: 19.0, grossMargin: 11.1, operatingMargin: 8.4, netMargin: 6.8, eps: 26.92, roe: 40.5, operatingCashFlow: 68, freeCashFlow: 54, debtRatio: 58.2, currentRatio: 170 },
      { quarter: '2024Q2', revenue: 775, revenueYoY: 37.6, revenueQoQ: 11.4, grossMargin: 10.8, operatingMargin: 8.0, netMargin: 6.1, eps: 26.85, roe: 39.5, operatingCashFlow: 75, freeCashFlow: 60, debtRatio: 57.5, currentRatio: 175 },
      { quarter: '2024Q3', revenue: 978, revenueYoY: 85.2, revenueQoQ: 26.2, grossMargin: 10.7, operatingMargin: 8.1, netMargin: 6.4, eps: 34.36, roe: 48.5, operatingCashFlow: 98, freeCashFlow: 82, debtRatio: 55.8, currentRatio: 185 },
      { quarter: '2024Q4', revenue: 1250, revenueYoY: 113.7, revenueQoQ: 27.8, grossMargin: 10.9, operatingMargin: 8.3, netMargin: 6.5, eps: 42.10, roe: 56.0, operatingCashFlow: 125, freeCashFlow: 105, debtRatio: 54.0, currentRatio: 195 },
    ],
  },
  {
    symbol: '2376.TW',
    name: '技嘉',
    category: 'AI伺服器',
    basePrice: 278,
    trailing12mEPS: 16.2,
    expectedGrowthRate: 42.0,
    lowPE: 14.0,
    midPE: 19.0,
    highPE: 25.0,
    latestRevenueYoY: 62.5,
    latestRevenueMoM: 8.0,
    highlights: ['二線中小型雲端與主權 AI 伺服器第一品牌', '水冷散熱伺服器出貨量大幅增長', '顯卡與伺服器雙引擎強勁復甦'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 280, revenueYoY: -14.2, revenueQoQ: 1.2, grossMargin: 12.5, operatingMargin: 3.5, netMargin: 3.7, eps: 1.61, roe: 12.5, operatingCashFlow: 15, freeCashFlow: 8, debtRatio: 58.5, currentRatio: 140 },
      { quarter: '2023Q2', revenue: 261, revenueYoY: 15.2, revenueQoQ: -6.8, grossMargin: 11.8, operatingMargin: 3.8, netMargin: 3.4, eps: 1.40, roe: 10.8, operatingCashFlow: 12, freeCashFlow: 6, debtRatio: 57.8, currentRatio: 142 },
      { quarter: '2023Q3', revenue: 371, revenueYoY: 53.5, revenueQoQ: 42.1, grossMargin: 11.5, operatingMargin: 4.2, netMargin: 4.0, eps: 2.33, roe: 17.5, operatingCashFlow: 22, freeCashFlow: 14, debtRatio: 56.9, currentRatio: 148 },
      { quarter: '2023Q4', revenue: 447, revenueYoY: 62.5, revenueQoQ: 20.5, grossMargin: 11.0, operatingMargin: 3.6, netMargin: 3.2, eps: 2.18, roe: 16.2, operatingCashFlow: 25, freeCashFlow: 16, debtRatio: 55.5, currentRatio: 152 },
      { quarter: '2024Q1', revenue: 551, revenueYoY: 96.8, revenueQoQ: 23.3, grossMargin: 11.3, operatingMargin: 5.6, netMargin: 3.7, eps: 3.18, roe: 22.5, operatingCashFlow: 35, freeCashFlow: 24, debtRatio: 54.2, currentRatio: 160 },
      { quarter: '2024Q2', revenue: 739, revenueYoY: 183.1, revenueQoQ: 34.1, grossMargin: 10.8, operatingMargin: 5.2, netMargin: 4.1, eps: 4.58, roe: 30.5, operatingCashFlow: 48, freeCashFlow: 34, debtRatio: 53.0, currentRatio: 165 },
      { quarter: '2024Q3', revenue: 704, revenueYoY: 89.8, revenueQoQ: -4.7, grossMargin: 10.5, operatingMargin: 4.8, netMargin: 3.6, eps: 3.92, roe: 25.8, operatingCashFlow: 42, freeCashFlow: 29, debtRatio: 52.1, currentRatio: 170 },
      { quarter: '2024Q4', revenue: 820, revenueYoY: 83.4, revenueQoQ: 16.5, grossMargin: 11.0, operatingMargin: 5.0, netMargin: 3.8, eps: 4.85, roe: 31.0, operatingCashFlow: 54, freeCashFlow: 39, debtRatio: 51.5, currentRatio: 175 },
    ],
  },

  // 5. 散熱模組 (Thermal)
  {
    symbol: '3017.TW',
    name: '奇鋐',
    category: '散熱',
    basePrice: 580,
    trailing12mEPS: 24.5,
    expectedGrowthRate: 48.0,
    lowPE: 20.0,
    midPE: 28.0,
    highPE: 36.0,
    latestRevenueYoY: 38.2,
    latestRevenueMoM: 6.8,
    highlights: ['水冷板 (Cold Plate) 與 3D VC 散熱全球出貨王者', '獲 NVIDIA 認證之水冷系統一階核心供應商', '自製風扇、機箱與水冷零組件垂直整合利潤最高'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 118, revenueYoY: -6.5, revenueQoQ: -19.2, grossMargin: 19.8, operatingMargin: 10.5, netMargin: 8.5, eps: 2.85, roe: 18.5, operatingCashFlow: 15, freeCashFlow: 8, debtRatio: 52.5, currentRatio: 145 },
      { quarter: '2023Q2', revenue: 148, revenueYoY: 7.2, revenueQoQ: 25.4, grossMargin: 20.1, operatingMargin: 11.2, netMargin: 8.2, eps: 3.18, roe: 20.5, operatingCashFlow: 20, freeCashFlow: 12, debtRatio: 51.8, currentRatio: 148 },
      { quarter: '2023Q3', revenue: 157, revenueYoY: 5.5, revenueQoQ: 6.1, grossMargin: 21.6, operatingMargin: 12.8, netMargin: 9.1, eps: 3.72, roe: 23.5, operatingCashFlow: 23, freeCashFlow: 14, debtRatio: 50.9, currentRatio: 152 },
      { quarter: '2023Q4', revenue: 167, revenueYoY: 14.5, revenueQoQ: 6.4, grossMargin: 22.4, operatingMargin: 13.5, netMargin: 9.8, eps: 4.36, roe: 26.5, operatingCashFlow: 26, freeCashFlow: 16, debtRatio: 49.5, currentRatio: 158 },
      { quarter: '2024Q1', revenue: 153, revenueYoY: 29.7, revenueQoQ: -8.4, grossMargin: 22.8, operatingMargin: 13.8, netMargin: 10.2, eps: 4.08, roe: 24.5, operatingCashFlow: 25, freeCashFlow: 15, debtRatio: 48.2, currentRatio: 165 },
      { quarter: '2024Q2', revenue: 180, revenueYoY: 21.6, revenueQoQ: 17.6, grossMargin: 23.5, operatingMargin: 14.5, netMargin: 11.2, eps: 5.08, roe: 29.8, operatingCashFlow: 32, freeCashFlow: 20, debtRatio: 47.0, currentRatio: 170 },
      { quarter: '2024Q3', revenue: 208, revenueYoY: 32.5, revenueQoQ: 15.6, grossMargin: 24.2, operatingMargin: 15.8, netMargin: 12.5, eps: 6.85, roe: 38.5, operatingCashFlow: 40, freeCashFlow: 26, debtRatio: 45.5, currentRatio: 180 },
      { quarter: '2024Q4', revenue: 245, revenueYoY: 46.7, revenueQoQ: 17.8, grossMargin: 25.1, operatingMargin: 16.9, netMargin: 13.5, eps: 8.52, roe: 44.0, operatingCashFlow: 50, freeCashFlow: 34, debtRatio: 44.0, currentRatio: 190 },
    ],
  },
  {
    symbol: '3324.TW',
    name: '雙鴻',
    category: '散熱',
    basePrice: 660,
    trailing12mEPS: 28.0,
    expectedGrowthRate: 50.0,
    lowPE: 22.0,
    midPE: 30.0,
    highPE: 38.0,
    latestRevenueYoY: 42.5,
    latestRevenueMoM: 9.5,
    highlights: ['水冷分歧管 (Manifold) 與水冷板全製程自製優勢', 'GB200 水冷系統主要受惠者，散熱瓦數翻倍推升 ASP', '泰國廠與台灣廠高階液冷產能持續擴產'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 32.8, revenueYoY: -12.5, revenueQoQ: -18.0, grossMargin: 22.5, operatingMargin: 10.2, netMargin: 8.0, eps: 3.22, roe: 18.2, operatingCashFlow: 4.8, freeCashFlow: 2.5, debtRatio: 48.5, currentRatio: 150 },
      { quarter: '2023Q2', revenue: 30.1, revenueYoY: -15.2, revenueQoQ: -8.2, grossMargin: 23.5, operatingMargin: 11.5, netMargin: 9.5, eps: 3.48, roe: 19.5, operatingCashFlow: 4.5, freeCashFlow: 2.2, debtRatio: 47.9, currentRatio: 155 },
      { quarter: '2023Q3', revenue: 34.9, revenueYoY: 4.2, revenueQoQ: 16.0, grossMargin: 26.5, operatingMargin: 14.8, netMargin: 12.2, eps: 4.82, roe: 26.5, operatingCashFlow: 6.2, freeCashFlow: 3.8, debtRatio: 46.5, currentRatio: 160 },
      { quarter: '2023Q4', revenue: 33.4, revenueYoY: -4.5, revenueQoQ: -4.3, grossMargin: 24.8, operatingMargin: 13.2, netMargin: 10.8, eps: 4.15, roe: 22.8, operatingCashFlow: 5.5, freeCashFlow: 3.1, debtRatio: 45.2, currentRatio: 165 },
      { quarter: '2024Q1', revenue: 31.5, revenueYoY: -4.0, revenueQoQ: -5.7, grossMargin: 24.5, operatingMargin: 13.5, netMargin: 11.2, eps: 4.51, roe: 24.5, operatingCashFlow: 5.2, freeCashFlow: 2.8, debtRatio: 44.0, currentRatio: 175 },
      { quarter: '2024Q2', revenue: 42.8, revenueYoY: 42.2, revenueQoQ: 35.9, grossMargin: 26.8, operatingMargin: 15.5, netMargin: 12.5, eps: 6.24, roe: 32.5, operatingCashFlow: 7.8, freeCashFlow: 4.9, debtRatio: 42.5, currentRatio: 185 },
      { quarter: '2024Q3', revenue: 45.5, revenueYoY: 30.4, revenueQoQ: 6.3, grossMargin: 27.5, operatingMargin: 16.2, netMargin: 13.2, eps: 7.85, roe: 38.0, operatingCashFlow: 9.1, freeCashFlow: 6.2, debtRatio: 41.0, currentRatio: 195 },
      { quarter: '2024Q4', revenue: 52.8, revenueYoY: 58.1, revenueQoQ: 16.0, grossMargin: 28.5, operatingMargin: 17.5, netMargin: 14.5, eps: 9.40, roe: 43.5, operatingCashFlow: 11.5, freeCashFlow: 8.2, debtRatio: 39.5, currentRatio: 210 },
    ],
  },

  // 6. 電源供應器 / 綠能BBU
  {
    symbol: '2308.TW',
    name: '台達電',
    category: '電源供應器',
    basePrice: 388,
    trailing12mEPS: 15.2,
    expectedGrowthRate: 24.0,
    lowPE: 18.0,
    midPE: 25.0,
    highPE: 32.0,
    latestRevenueYoY: 18.5,
    latestRevenueMoM: 4.2,
    highlights: ['全球伺服器高瓦數電源第一把交椅', 'AI 伺服器電源、散熱與液冷系統整合出貨', '電動車與儲能微電網長期成長雙支柱'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 928, revenueYoY: 12.5, revenueQoQ: -12.1, grossMargin: 27.5, operatingMargin: 9.2, netMargin: 7.8, eps: 2.66, roe: 14.5, operatingCashFlow: 120, freeCashFlow: 65, debtRatio: 45.2, currentRatio: 165 },
      { quarter: '2023Q2', revenue: 1005, revenueYoY: 1.5, revenueQoQ: 8.3, grossMargin: 29.2, operatingMargin: 10.8, netMargin: 8.2, eps: 3.14, roe: 17.2, operatingCashFlow: 145, freeCashFlow: 85, debtRatio: 44.8, currentRatio: 168 },
      { quarter: '2023Q3', revenue: 1077, revenueYoY: 1.5, revenueQoQ: 7.2, grossMargin: 31.1, operatingMargin: 12.5, netMargin: 8.7, eps: 3.60, roe: 19.5, operatingCashFlow: 165, freeCashFlow: 100, debtRatio: 43.9, currentRatio: 172 },
      { quarter: '2023Q4', revenue: 1000, revenueYoY: -5.4, revenueQoQ: -7.1, grossMargin: 30.4, operatingMargin: 10.4, netMargin: 8.9, eps: 3.46, roe: 18.2, operatingCashFlow: 155, freeCashFlow: 90, debtRatio: 43.0, currentRatio: 178 },
      { quarter: '2024Q1', revenue: 913, revenueYoY: -1.6, revenueQoQ: -8.7, grossMargin: 29.5, operatingMargin: 8.1, netMargin: 6.3, eps: 2.22, roe: 11.5, operatingCashFlow: 115, freeCashFlow: 55, debtRatio: 42.1, currentRatio: 185 },
      { quarter: '2024Q2', revenue: 1034, revenueYoY: 2.9, revenueQoQ: 13.3, grossMargin: 34.1, operatingMargin: 13.0, netMargin: 9.6, eps: 3.83, roe: 19.8, operatingCashFlow: 175, freeCashFlow: 110, debtRatio: 41.5, currentRatio: 190 },
      { quarter: '2024Q3', revenue: 1122, revenueYoY: 4.2, revenueQoQ: 8.5, grossMargin: 35.2, operatingMargin: 14.6, netMargin: 11.0, eps: 4.75, roe: 24.2, operatingCashFlow: 210, freeCashFlow: 145, debtRatio: 40.2, currentRatio: 195 },
      { quarter: '2024Q4', revenue: 1210, revenueYoY: 21.0, revenueQoQ: 7.8, grossMargin: 35.8, operatingMargin: 15.2, netMargin: 11.5, eps: 5.35, roe: 26.5, operatingCashFlow: 240, freeCashFlow: 170, debtRatio: 39.5, currentRatio: 205 },
    ],
  },
  {
    symbol: '2301.TW',
    name: '光寶科',
    category: '電源供應器',
    basePrice: 112,
    trailing12mEPS: 6.8,
    expectedGrowthRate: 20.0,
    lowPE: 13.0,
    midPE: 17.0,
    highPE: 22.0,
    latestRevenueYoY: 15.8,
    latestRevenueMoM: 3.5,
    highlights: ['高階 AI 伺服器電源與 BBU 備援電池系統', '雲端網通產品比重持續提升至 40% 以上', '獲利結構優化，毛利率穩站 22% 歷史高檔'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 342, revenueYoY: -17.2, revenueQoQ: -13.5, grossMargin: 18.8, operatingMargin: 6.9, netMargin: 6.9, eps: 1.02, roe: 12.5, operatingCashFlow: 35, freeCashFlow: 20, debtRatio: 48.5, currentRatio: 155 },
      { quarter: '2023Q2', revenue: 373, revenueYoY: -13.0, revenueQoQ: 9.1, grossMargin: 23.3, operatingMargin: 11.6, netMargin: 11.3, eps: 1.81, roe: 21.5, operatingCashFlow: 48, freeCashFlow: 32, debtRatio: 47.8, currentRatio: 160 },
      { quarter: '2023Q3', revenue: 400, revenueYoY: -13.2, revenueQoQ: 7.2, grossMargin: 23.6, operatingMargin: 11.6, netMargin: 11.4, eps: 1.99, roe: 23.2, operatingCashFlow: 54, freeCashFlow: 38, debtRatio: 46.5, currentRatio: 165 },
      { quarter: '2023Q4', revenue: 369, revenueYoY: -6.4, revenueQoQ: -7.8, grossMargin: 22.0, operatingMargin: 9.4, netMargin: 9.3, eps: 1.54, roe: 17.8, operatingCashFlow: 45, freeCashFlow: 28, debtRatio: 45.2, currentRatio: 170 },
      { quarter: '2024Q1', revenue: 288, revenueYoY: -15.8, revenueQoQ: -22.0, grossMargin: 20.3, operatingMargin: 8.1, netMargin: 8.3, eps: 1.04, roe: 12.0, operatingCashFlow: 32, freeCashFlow: 18, debtRatio: 44.5, currentRatio: 175 },
      { quarter: '2024Q2', revenue: 333, revenueYoY: -10.7, revenueQoQ: 15.6, grossMargin: 22.4, operatingMargin: 9.9, netMargin: 9.3, eps: 1.36, roe: 15.5, operatingCashFlow: 42, freeCashFlow: 26, debtRatio: 43.8, currentRatio: 180 },
      { quarter: '2024Q3', revenue: 368, revenueYoY: -8.0, revenueQoQ: 10.5, grossMargin: 22.4, operatingMargin: 10.7, netMargin: 9.2, eps: 1.48, roe: 16.8, operatingCashFlow: 46, freeCashFlow: 30, debtRatio: 42.5, currentRatio: 185 },
      { quarter: '2024Q4', revenue: 425, revenueYoY: 15.2, revenueQoQ: 15.5, grossMargin: 23.5, operatingMargin: 11.8, netMargin: 10.5, eps: 2.05, roe: 22.5, operatingCashFlow: 58, freeCashFlow: 40, debtRatio: 41.2, currentRatio: 195 },
    ],
  },

  // 7. 雲端 / 網通
  {
    symbol: '2345.TW',
    name: '智邦',
    category: '雲端',
    basePrice: 595,
    trailing12mEPS: 22.5,
    expectedGrowthRate: 35.0,
    lowPE: 20.0,
    midPE: 27.0,
    highPE: 35.0,
    latestRevenueYoY: 41.2,
    latestRevenueMoM: 7.8,
    highlights: ['400G / 800G AI 超高速交換器全球市佔第一', 'AI 叢集網路後端 Fabric 交換機需求暴增', '與美系雲端三大巨頭深度合作光通訊 CPO 技術'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 197, revenueYoY: 25.2, revenueQoQ: -11.3, grossMargin: 21.8, operatingMargin: 11.2, netMargin: 10.3, eps: 3.65, roe: 28.5, operatingCashFlow: 25, freeCashFlow: 18, debtRatio: 45.2, currentRatio: 165 },
      { quarter: '2023Q2', revenue: 201, revenueYoY: 0.1, revenueQoQ: 2.0, grossMargin: 22.4, operatingMargin: 12.0, netMargin: 11.1, eps: 4.02, roe: 31.0, operatingCashFlow: 28, freeCashFlow: 21, debtRatio: 44.5, currentRatio: 170 },
      { quarter: '2023Q3', revenue: 224, revenueYoY: -4.5, revenueQoQ: 11.4, grossMargin: 23.5, operatingMargin: 13.5, netMargin: 10.6, eps: 4.28, roe: 32.5, operatingCashFlow: 32, freeCashFlow: 24, debtRatio: 43.8, currentRatio: 175 },
      { quarter: '2023Q4', revenue: 220, revenueYoY: -1.0, revenueQoQ: -1.8, grossMargin: 22.8, operatingMargin: 12.8, netMargin: 11.8, eps: 4.68, roe: 34.0, operatingCashFlow: 34, freeCashFlow: 26, debtRatio: 42.5, currentRatio: 180 },
      { quarter: '2024Q1', revenue: 188, revenueYoY: -4.6, revenueQoQ: -14.5, grossMargin: 22.5, operatingMargin: 12.1, netMargin: 11.9, eps: 4.02, roe: 28.5, operatingCashFlow: 26, freeCashFlow: 19, debtRatio: 41.8, currentRatio: 185 },
      { quarter: '2024Q2', revenue: 244, revenueYoY: 21.4, revenueQoQ: 29.8, grossMargin: 23.8, operatingMargin: 13.8, netMargin: 11.0, eps: 4.79, roe: 33.5, operatingCashFlow: 36, freeCashFlow: 28, debtRatio: 40.5, currentRatio: 195 },
      { quarter: '2024Q3', revenue: 282, revenueYoY: 25.9, revenueQoQ: 15.6, grossMargin: 24.2, operatingMargin: 14.5, netMargin: 12.0, eps: 6.06, roe: 41.5, operatingCashFlow: 45, freeCashFlow: 36, debtRatio: 39.2, currentRatio: 205 },
      { quarter: '2024Q4', revenue: 345, revenueYoY: 56.8, revenueQoQ: 22.3, grossMargin: 24.8, operatingMargin: 15.2, netMargin: 12.5, eps: 7.63, roe: 49.0, operatingCashFlow: 58, freeCashFlow: 48, debtRatio: 38.0, currentRatio: 220 },
    ],
  },

  // 8. ABF載板 / 高階PCB
  {
    symbol: '2383.TW',
    name: '台光電',
    category: 'ABF載板',
    basePrice: 470,
    trailing12mEPS: 28.5,
    expectedGrowthRate: 40.0,
    lowPE: 16.0,
    midPE: 21.0,
    highPE: 28.0,
    latestRevenueYoY: 58.2,
    latestRevenueMoM: 8.5,
    highlights: ['全球 AI 伺服器高階銅箔基板 (CCL) 獨家龍頭', 'NVIDIA Blackwell 與 800G 交換機材料指定供應', '高階材料無鉛無鹵專利防護，毛利率站上 28% 新高'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 73.5, revenueYoY: -25.8, revenueQoQ: -17.2, grossMargin: 21.3, operatingMargin: 11.5, netMargin: 6.5, eps: 1.44, roe: 10.5, operatingCashFlow: 12, freeCashFlow: 6, debtRatio: 48.5, currentRatio: 165 },
      { quarter: '2023Q2', revenue: 91.8, revenueYoY: -8.1, revenueQoQ: 24.9, grossMargin: 27.5, operatingMargin: 17.5, netMargin: 10.9, eps: 3.00, roe: 21.2, operatingCashFlow: 18, freeCashFlow: 11, debtRatio: 47.2, currentRatio: 170 },
      { quarter: '2023Q3', revenue: 118.7, revenueYoY: 20.1, revenueQoQ: 29.3, grossMargin: 30.2, operatingMargin: 20.8, netMargin: 17.2, eps: 6.04, roe: 38.5, operatingCashFlow: 28, freeCashFlow: 19, debtRatio: 45.8, currentRatio: 180 },
      { quarter: '2023Q4', revenue: 128.8, revenueYoY: 45.2, revenueQoQ: 8.5, grossMargin: 28.5, operatingMargin: 19.2, netMargin: 15.5, eps: 5.85, roe: 36.0, operatingCashFlow: 30, freeCashFlow: 20, debtRatio: 44.5, currentRatio: 185 },
      { quarter: '2024Q1', revenue: 129.0, revenueYoY: 75.5, revenueQoQ: 0.2, grossMargin: 29.0, operatingMargin: 19.5, netMargin: 15.3, eps: 5.76, roe: 34.5, operatingCashFlow: 31, freeCashFlow: 21, debtRatio: 43.2, currentRatio: 195 },
      { quarter: '2024Q2', revenue: 154.5, revenueYoY: 68.3, revenueQoQ: 19.8, grossMargin: 27.5, operatingMargin: 18.2, netMargin: 15.7, eps: 7.08, roe: 41.2, operatingCashFlow: 38, freeCashFlow: 26, debtRatio: 42.0, currentRatio: 205 },
      { quarter: '2024Q3', revenue: 174.6, revenueYoY: 47.1, revenueQoQ: 13.0, grossMargin: 27.2, operatingMargin: 18.5, netMargin: 14.4, eps: 7.32, roe: 41.8, operatingCashFlow: 42, freeCashFlow: 29, debtRatio: 40.8, currentRatio: 215 },
      { quarter: '2024Q4', revenue: 205.0, revenueYoY: 59.2, revenueQoQ: 17.4, grossMargin: 28.5, operatingMargin: 19.8, netMargin: 15.5, eps: 9.35, roe: 51.5, operatingCashFlow: 52, freeCashFlow: 38, debtRatio: 39.5, currentRatio: 230 },
    ],
  },
  {
    symbol: '2368.TW',
    name: '金像電',
    category: 'ABF載板',
    basePrice: 220,
    trailing12mEPS: 12.8,
    expectedGrowthRate: 35.0,
    lowPE: 14.0,
    midPE: 19.0,
    highPE: 26.0,
    latestRevenueYoY: 34.5,
    latestRevenueMoM: 5.2,
    highlights: ['高多層 AI 伺服器與交換機厚板全球市佔第一', '常熟與泰國新生產基地高階產能開出', '雲端交換機板 800G 出貨比重大幅拉升'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 63.3, revenueYoY: -12.5, revenueQoQ: -24.5, grossMargin: 20.5, operatingMargin: 11.2, netMargin: 7.8, eps: 0.88, roe: 12.5, operatingCashFlow: 10, freeCashFlow: 5, debtRatio: 48.5, currentRatio: 160 },
      { quarter: '2023Q2', revenue: 69.2, revenueYoY: -18.2, revenueQoQ: 9.3, grossMargin: 23.8, operatingMargin: 14.8, netMargin: 11.5, eps: 1.62, roe: 21.5, operatingCashFlow: 14, freeCashFlow: 8, debtRatio: 47.8, currentRatio: 165 },
      { quarter: '2023Q3', revenue: 86.4, revenueYoY: -5.5, revenueQoQ: 24.9, grossMargin: 25.2, operatingMargin: 16.5, netMargin: 14.5, eps: 2.55, roe: 31.5, operatingCashFlow: 20, freeCashFlow: 13, debtRatio: 46.5, currentRatio: 172 },
      { quarter: '2023Q4', revenue: 81.6, revenueYoY: -2.1, revenueQoQ: -5.6, grossMargin: 25.0, operatingMargin: 16.0, netMargin: 12.8, eps: 2.20, roe: 26.5, operatingCashFlow: 18, freeCashFlow: 11, debtRatio: 45.2, currentRatio: 178 },
      { quarter: '2024Q1', revenue: 80.5, revenueYoY: 27.2, revenueQoQ: -1.3, grossMargin: 25.8, operatingMargin: 17.2, netMargin: 15.1, eps: 2.45, roe: 28.5, operatingCashFlow: 19, freeCashFlow: 12, debtRatio: 44.0, currentRatio: 185 },
      { quarter: '2024Q2', revenue: 95.8, revenueYoY: 38.4, revenueQoQ: 19.0, grossMargin: 28.5, operatingMargin: 19.8, netMargin: 16.2, eps: 3.12, roe: 35.0, operatingCashFlow: 24, freeCashFlow: 16, debtRatio: 42.8, currentRatio: 195 },
      { quarter: '2024Q3', revenue: 104.2, revenueYoY: 20.6, revenueQoQ: 8.8, grossMargin: 29.8, operatingMargin: 20.8, netMargin: 17.0, eps: 3.65, roe: 39.5, operatingCashFlow: 28, freeCashFlow: 19, debtRatio: 41.5, currentRatio: 205 },
      { quarter: '2024Q4', revenue: 120.5, revenueYoY: 47.7, revenueQoQ: 15.6, grossMargin: 30.5, operatingMargin: 21.5, netMargin: 17.8, eps: 4.45, roe: 46.0, operatingCashFlow: 34, freeCashFlow: 24, debtRatio: 40.2, currentRatio: 215 },
    ],
  },
  {
    symbol: '3037.TW',
    name: '欣興',
    category: 'ABF載板',
    basePrice: 168,
    trailing12mEPS: 7.2,
    expectedGrowthRate: 30.0,
    lowPE: 16.0,
    midPE: 22.0,
    highPE: 29.0,
    latestRevenueYoY: 19.5,
    latestRevenueMoM: 4.1,
    highlights: ['高階 AI GPU ABF 載板最大產能供應商', '光復廠高階製程良率大幅躍升，下半年稼動率回升', '次世代玻璃基板 (Glass Core) 研發領先同行'],
    financials8Q: [
      { quarter: '2023Q1', revenue: 265, revenueYoY: -13.5, revenueQoQ: -27.5, grossMargin: 20.5, operatingMargin: 10.5, netMargin: 15.4, eps: 2.70, roe: 15.5, operatingCashFlow: 55, freeCashFlow: 18, debtRatio: 45.2, currentRatio: 160 },
      { quarter: '2023Q2', revenue: 252, revenueYoY: -29.2, revenueQoQ: -4.9, grossMargin: 20.2, operatingMargin: 9.8, netMargin: 9.5, eps: 1.57, roe: 9.2, operatingCashFlow: 48, freeCashFlow: 12, debtRatio: 44.8, currentRatio: 165 },
      { quarter: '2023Q3', revenue: 265, revenueYoY: -29.0, revenueQoQ: 5.2, grossMargin: 19.7, operatingMargin: 8.8, netMargin: 9.8, eps: 1.70, roe: 10.1, operatingCashFlow: 50, freeCashFlow: 14, debtRatio: 44.0, currentRatio: 170 },
      { quarter: '2023Q4', revenue: 256, revenueYoY: -29.8, revenueQoQ: -3.4, grossMargin: 17.5, operatingMargin: 6.8, netMargin: 11.3, eps: 1.91, roe: 11.2, operatingCashFlow: 46, freeCashFlow: 10, debtRatio: 43.5, currentRatio: 175 },
      { quarter: '2024Q1', revenue: 264, revenueYoY: -0.4, revenueQoQ: 3.1, grossMargin: 16.3, operatingMargin: 5.2, netMargin: 9.2, eps: 1.60, roe: 9.5, operatingCashFlow: 45, freeCashFlow: 11, debtRatio: 42.8, currentRatio: 180 },
      { quarter: '2024Q2', revenue: 278, revenueYoY: 10.3, revenueQoQ: 5.3, grossMargin: 13.2, operatingMargin: 4.1, netMargin: 5.7, eps: 1.05, roe: 6.2, operatingCashFlow: 42, freeCashFlow: 9, debtRatio: 42.1, currentRatio: 185 },
      { quarter: '2024Q3', revenue: 317, revenueYoY: 19.6, revenueQoQ: 14.0, grossMargin: 15.8, operatingMargin: 6.5, netMargin: 7.5, eps: 1.85, roe: 11.2, operatingCashFlow: 54, freeCashFlow: 18, debtRatio: 41.2, currentRatio: 195 },
      { quarter: '2024Q4', revenue: 365, revenueYoY: 42.6, revenueQoQ: 15.1, grossMargin: 18.5, operatingMargin: 9.2, netMargin: 9.8, eps: 2.85, roe: 16.8, operatingCashFlow: 68, freeCashFlow: 28, debtRatio: 40.5, currentRatio: 205 },
    ],
  },
];

// =========================================================================
// 步驟 2: 財報數據量化評分模組 (0 ~ 100 分)
// =========================================================================

export function calculateFundamentalScores(financials: QuarterlyFinancialReport[]): FundamentalScores {
  if (!financials || financials.length < 4) {
    return {
      growthScore: 50,
      grossMarginScore: 50,
      operatingScore: 50,
      roeScore: 50,
      cashFlowScore: 50,
      debtHealthScore: 50,
      overallScore: 50,
      opportunityNote: '數據樣本不足，建議謹慎評估',
      riskNote: '財報歷史週期過短',
    };
  }

  const latest = financials[financials.length - 1];
  const prevQuarter = financials[financials.length - 2];
  const prevYearSameQ = financials[Math.max(0, financials.length - 5)];

  // 1. 成長性評分 (Growth, 25%): 營收YoY、QoQ及近4季營收累積增速
  let growthScore = 50;
  if (latest.revenueYoY >= 40) growthScore += 45;
  else if (latest.revenueYoY >= 25) growthScore += 35;
  else if (latest.revenueYoY >= 15) growthScore += 25;
  else if (latest.revenueYoY >= 5) growthScore += 10;
  else if (latest.revenueYoY < -10) growthScore -= 25;
  else if (latest.revenueYoY < 0) growthScore -= 10;

  if (latest.revenueQoQ > 10) growthScore += 10;
  else if (latest.revenueQoQ < -10) growthScore -= 10;
  growthScore = Math.min(100, Math.max(10, growthScore));

  // 2. 毛利率表現與趨勢評分 (Gross Margin, 20%)
  let grossMarginScore = 50;
  if (latest.grossMargin >= 50) grossMarginScore += 35;
  else if (latest.grossMargin >= 35) grossMarginScore += 25;
  else if (latest.grossMargin >= 20) grossMarginScore += 15;
  else if (latest.grossMargin < 10) grossMarginScore -= 20;

  // 毛利趨勢：是否較上季或去年同期提升？
  const gmDeltaYoY = latest.grossMargin - prevYearSameQ.grossMargin;
  if (gmDeltaYoY >= 3.0) grossMarginScore += 15;
  else if (gmDeltaYoY >= 1.0) grossMarginScore += 8;
  else if (gmDeltaYoY < -3.0) grossMarginScore -= 15;
  grossMarginScore = Math.min(100, Math.max(10, grossMarginScore));

  // 3. 營益獲利品質評分 (Operating Margin, 15%)
  let operatingScore = 50;
  if (latest.operatingMargin >= 30) operatingScore += 35;
  else if (latest.operatingMargin >= 20) operatingScore += 25;
  else if (latest.operatingMargin >= 10) operatingScore += 15;
  else if (latest.operatingMargin < 5) operatingScore -= 25;

  const omDeltaQoQ = latest.operatingMargin - prevQuarter.operatingMargin;
  if (omDeltaQoQ > 1.0) operatingScore += 10;
  else if (omDeltaQoQ < -2.0) operatingScore -= 15;
  operatingScore = Math.min(100, Math.max(10, operatingScore));

  // 4. ROE 資本效率評分 (15%)
  let roeScore = 50;
  if (latest.roe >= 30) roeScore += 45;
  else if (latest.roe >= 20) roeScore += 30;
  else if (latest.roe >= 15) roeScore += 18;
  else if (latest.roe >= 10) roeScore += 5;
  else if (latest.roe < 5) roeScore -= 30;
  roeScore = Math.min(100, Math.max(10, roeScore));

  // 5. 現金流健康度評分 (15%): 自由現金流是否充沛為正？
  let cashFlowScore = 50;
  if (latest.freeCashFlow > 0 && latest.operatingCashFlow > 0) {
    cashFlowScore += 25;
    if (latest.freeCashFlow > latest.revenue * 0.15) cashFlowScore += 20;
    else if (latest.freeCashFlow > latest.revenue * 0.08) cashFlowScore += 10;
  } else if (latest.freeCashFlow < 0) {
    cashFlowScore -= 25;
  }
  cashFlowScore = Math.min(100, Math.max(10, cashFlowScore));

  // 6. 負債健康度評分 (10%): 負債比率健康度
  let debtHealthScore = 60;
  if (latest.debtRatio <= 35) debtHealthScore += 35;
  else if (latest.debtRatio <= 50) debtHealthScore += 20;
  else if (latest.debtRatio <= 65) debtHealthScore += 5;
  else if (latest.debtRatio > 75) debtHealthScore -= 30;

  if (latest.currentRatio >= 200) debtHealthScore += 10;
  else if (latest.currentRatio < 120) debtHealthScore -= 15;
  debtHealthScore = Math.min(100, Math.max(10, debtHealthScore));

  // 綜合總分加權計算: 成長25% + 毛利20% + 營益15% + ROE 15% + 現金流15% + 負債10%
  const overallScore = Math.round(
    growthScore * 0.25 +
    grossMarginScore * 0.20 +
    operatingScore * 0.15 +
    roeScore * 0.15 +
    cashFlowScore * 0.15 +
    debtHealthScore * 0.10
  );

  // 智慧產生機會與風險提醒
  let opportunityNote = '';
  if (growthScore >= 80 && grossMarginScore >= 75) {
    opportunityNote = '強勁營收年增且毛利率逆勢擴張，展現定價護城河與高盈餘爆發力。';
  } else if (growthScore >= 80) {
    opportunityNote = '下游 AI/雲端強烈需求拉動訂單，單季營收規模大幅度跳增。';
  } else if (roeScore >= 80) {
    opportunityNote = '股東權益報酬率 (ROE) 處於高檔前鋒，資產周轉與資本運用效率極佳。';
  } else {
    opportunityNote = '各項核心財務指標穩健成長，現金流持續挹注具備防守縱深。';
  }

  let riskNote = '';
  if (debtHealthScore < 50) {
    riskNote = '負債比偏高或流動比率吃緊，若資本支出激增需留意利息支出與週轉壓力。';
  } else if (grossMarginScore < 55) {
    riskNote = '毛利率受同業價格競爭或折舊攤提壓抑，後續需追蹤毛利止跌反彈點。';
  } else if (cashFlowScore < 55) {
    riskNote = '自由現金流暫時受到擴產資本支出或備料庫存壓抑，留意後續現金回收速度。';
  } else {
    riskNote = '主要留意整體半導體庫存循環波動與終端消費市場需求之景氣變化。';
  }

  return {
    growthScore,
    grossMarginScore,
    operatingScore,
    roeScore,
    cashFlowScore,
    debtHealthScore,
    overallScore,
    opportunityNote,
    riskNote,
  };
}

// =========================================================================
// 步驟 4: 動態估值模型 (PEG 60% + P/E Band 40% 加權算價)
// =========================================================================

export function calculateDynamicValuation(
  currentPrice: number,
  trailing12mEPS: number,
  expectedGrowthRate: number,
  lowPE: number,
  midPE: number,
  highPE: number,
  overallScore: number,
  latestRevenueYoY: number,
  latestRevenueMoM: number
): ValuationPrices {
  const eps = Math.max(0.5, trailing12mEPS);
  // G: 預估年增率下限保護為 8%，上限以 70% 避免過度膨脹
  const G = Math.min(70, Math.max(8, expectedGrowthRate));

  // 1. PEG 模型 (權重 60%)
  // PEG = PE / G => PE = PEG * G => Price = EPS * (PEG * G)
  // 便宜價: PEG = 0.85
  // 合理價: PEG = 1.25
  // 昂貴價: PEG = 1.80
  const pegCheapPE = G * 0.85;
  const pegFairPE = G * 1.25;
  const pegExpensivePE = G * 1.80;

  const pegCheapPrice = eps * pegCheapPE;
  const pegFairPrice = eps * pegFairPE;
  const pegExpensivePrice = eps * pegExpensivePE;

  // 2. P/E Band 模型 (權重 40%)
  const peCheapPrice = eps * lowPE;
  const peFairPrice = eps * midPE;
  const peExpensivePrice = eps * highPE;

  // 3. 加權算價 (60% PEG + 40% P/E Band)
  const weightedCheap = Number((0.6 * pegCheapPrice + 0.4 * peCheapPrice).toFixed(1));
  const weightedFair = Number((0.6 * pegFairPrice + 0.4 * peFairPrice).toFixed(1));
  const weightedExpensive = Number((0.6 * pegExpensivePrice + 0.4 * peExpensivePrice).toFixed(1));

  // 當前 PEG 比值
  const currentPE = currentPrice / eps;
  const pegRatio = Number((currentPE / G).toFixed(2));

  // 4. 當前位階判斷 (Valuation Stage)
  let stage: ValuationStage = 'FAIR_LOW';
  let stageLabel = '合理偏低區 🔵';
  let stageBadgeClass = 'bg-blue-950/80 text-blue-300 border-blue-800';

  if (currentPrice < weightedCheap) {
    stage = 'CHEAP';
    stageLabel = '低估便宜區 🟢 (高安全邊際)';
    stageBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
  } else if (currentPrice <= weightedFair) {
    stage = 'FAIR_LOW';
    stageLabel = '合理偏低區 🔵 (長線逢低點)';
    stageBadgeClass = 'bg-blue-950/80 text-blue-300 border-blue-800';
  } else if (currentPrice <= weightedExpensive) {
    stage = 'FAIR_HIGH';
    stageLabel = '合理偏高區 🟡 (持有觀察區)';
    stageBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-800';
  } else {
    stage = 'EXPENSIVE';
    stageLabel = '高估昂貴區 🔴 (追高風險大)';
    stageBadgeClass = 'bg-rose-950/80 text-rose-300 border-rose-800';
  }

  // 安全邊際折溢價率: (合理價 - 現價) / 合理價 * 100%
  const discountToFairPct = Number((((weightedFair - currentPrice) / weightedFair) * 100).toFixed(1));

  // 5. 股價成長能力評分 (Growth Potential Score 0-100)
  // 結合基本面評分 (40%) + 營收動能YoY/MoM (30%) + 估值安全邊際 (30%)
  let momentumScore = 50;
  if (latestRevenueYoY >= 35) momentumScore += 30;
  else if (latestRevenueYoY >= 20) momentumScore += 20;
  else if (latestRevenueYoY >= 10) momentumScore += 10;
  else if (latestRevenueYoY < 0) momentumScore -= 15;

  if (latestRevenueMoM > 5) momentumScore += 15;
  else if (latestRevenueMoM < -5) momentumScore -= 10;
  momentumScore = Math.min(100, Math.max(10, momentumScore));

  let discountScore = 50;
  if (discountToFairPct > 20) discountScore = 95;
  else if (discountToFairPct > 10) discountScore = 85;
  else if (discountToFairPct > 0) discountScore = 70;
  else if (discountToFairPct > -10) discountScore = 50;
  else if (discountToFairPct > -25) discountScore = 35;
  else discountScore = 20;

  const growthPotentialScore = Math.round(
    overallScore * 0.40 +
    momentumScore * 0.30 +
    discountScore * 0.30
  );

  return {
    cheapPrice: weightedCheap,
    fairPrice: weightedFair,
    expensivePrice: weightedExpensive,
    pegRatio,
    pegValuation: {
      cheap: Number(pegCheapPrice.toFixed(1)),
      fair: Number(pegFairPrice.toFixed(1)),
      expensive: Number(pegExpensivePrice.toFixed(1)),
    },
    peBandValuation: {
      lowPE,
      midPE,
      highPE,
      cheap: Number(peCheapPrice.toFixed(1)),
      fair: Number(peFairPrice.toFixed(1)),
      expensive: Number(peExpensivePrice.toFixed(1)),
    },
    stage,
    stageLabel,
    stageBadgeClass,
    discountToFairPct,
    growthPotentialScore,
  };
}

// =========================================================================
// 步驟 3 & 4: 全科技群綜合排名篩選出 TOP 20 高成長潛力推薦
// =========================================================================

export function getTop20FundamentalRecommendations(
  livePriceOverrides?: Record<string, { price: number; change: number; changePercent: number }>
): FundamentalRecommendation[] {
  const processed: FundamentalRecommendation[] = TAIWAN_TECH_STOCKS_DATA.map((raw) => {
    const live = livePriceOverrides?.[raw.symbol];
    const currentPrice = live?.price ?? raw.basePrice;
    const change = live?.change ?? 0;
    const changePercent = live?.changePercent ?? 0;

    const scores = calculateFundamentalScores(raw.financials8Q);

    const valuation = calculateDynamicValuation(
      currentPrice,
      raw.trailing12mEPS,
      raw.expectedGrowthRate,
      raw.lowPE,
      raw.midPE,
      raw.highPE,
      scores.overallScore,
      raw.latestRevenueYoY,
      raw.latestRevenueMoM
    );

    const forwardPE = Number((currentPrice / raw.trailing12mEPS).toFixed(1));

    return {
      rank: 0, // Assigned after sorting
      symbol: raw.symbol,
      name: raw.name,
      category: raw.category,
      currentPrice,
      change,
      changePercent,
      trailing12mEPS: raw.trailing12mEPS,
      expectedGrowthRate: raw.expectedGrowthRate,
      forwardPE,
      financials8Q: raw.financials8Q,
      scores,
      valuation,
      latestRevenueYoY: raw.latestRevenueYoY,
      latestRevenueMoM: raw.latestRevenueMoM,
      highlights: raw.highlights,
    };
  });

  // 依「股價成長能力評分 (Growth Potential Score)」結合「基本面總評分 (Overall Score)」綜合排序
  processed.sort((a, b) => {
    const scoreA = a.valuation.growthPotentialScore * 0.6 + a.scores.overallScore * 0.4;
    const scoreB = b.valuation.growthPotentialScore * 0.6 + b.scores.overallScore * 0.4;
    return scoreB - scoreA;
  });

  // 截取前 20 檔高成長潛力菁英標的
  const top20 = processed.slice(0, 20).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  return top20;
}
