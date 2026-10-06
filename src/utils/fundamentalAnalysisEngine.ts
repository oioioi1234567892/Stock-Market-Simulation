import {
  TechStockFinancialData,
  QuarterFinancial,
  TechSector,
  TAIWAN_TECH_STOCKS_DATABASE,
} from '../data/techFinancialsData.ts';

export interface FundamentalScores {
  growthScore: number; // 成長性評分 (0-100)
  grossMarginScore: number; // 毛利率評分 (0-100)
  operatingMarginScore: number; // 營益率評分 (0-100)
  roeScore: number; // ROE評分 (0-100)
  roicScore: number; // ROIC評分 (0-100)
  cashFlowScore: number; // 現金流評分 (0-100)
  debtHealthScore: number; // 負債健康度 (0-100)
  compositeScore: number; // 綜合基本面總分 (0-100)
}

export type ValuationStance = 'CHEAP' | 'FAIR_LOW' | 'FAIR_HIGH' | 'EXPENSIVE';

export interface DynamicValuationResult {
  pegCheap: number;
  pegFair: number;
  pegExpensive: number;
  peBandCheap: number;
  peBandFair: number;
  peBandExpensive: number;
  finalCheapPrice: number; // 便宜價 (PEG 60% + PE Band 40%)
  finalFairPrice: number; // 合理價
  finalExpensivePrice: number; // 昂貴價
  upsideToFair: number; // 距合理價潛在漲幅 %
  upsideToExpensive: number; // 距昂貴價潛在空間 %
  valuationStance: ValuationStance;
  valuationLabel: string;
  valuationBadgeClass: string;
  growthPotentialScore: number; // 股價成長能力評分 (0-100)
}

export interface AnalyzedTechStock extends TechStockFinancialData {
  rank: number;
  scores: FundamentalScores;
  valuation: DynamicValuationResult;
  opportunities: string[];
  risks: string[];
  peerRankInSector: number; // 同產業排名
  peerCountInSector: number; // 同產業檔數
}

// 1. 成長性評分 (Growth Score, 0 - 100)
export function calculateGrowthScore(q: QuarterFinancial[], mom: number, expectedGrowth: number): number {
  if (!q || q.length === 0) return 50;
  const recent3YoY = q.slice(0, 3).reduce((acc, curr) => acc + curr.revenueYoY, 0) / 3;
  const old3YoY = q.slice(4, 7).reduce((acc, curr) => acc + curr.revenueYoY, 0) / Math.max(1, q.slice(4, 7).length);
  const acceleration = recent3YoY - old3YoY;

  let score = 50;
  // Recent YoY level
  if (recent3YoY >= 50) score += 28;
  else if (recent3YoY >= 30) score += 22;
  else if (recent3YoY >= 15) score += 15;
  else if (recent3YoY >= 5) score += 8;
  else if (recent3YoY < 0) score -= 12;

  // Expected growth rate boost
  if (expectedGrowth >= 35) score += 12;
  else if (expectedGrowth >= 20) score += 8;
  else if (expectedGrowth >= 10) score += 4;

  // Acceleration factor
  if (acceleration > 20) score += 8;
  else if (acceleration > 0) score += 4;
  else score -= 4;

  // MoM momentum
  if (mom > 5) score += 5;
  else if (mom > 0) score += 2;
  else score -= 3;

  return Math.min(99, Math.max(35, Math.round(score)));
}

// 2. 毛利率評分 (Gross Margin Score, 0 - 100)
export function calculateGrossMarginScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 50;
  const latestGM = q[0].grossMargin;
  const prevGM = q[1]?.grossMargin ?? latestGM;
  const avg8GM = q.reduce((acc, curr) => acc + curr.grossMargin, 0) / q.length;

  let score = 50;
  // Absolute level (Tech pricing power moat)
  if (latestGM >= 55) score += 35;
  else if (latestGM >= 45) score += 28;
  else if (latestGM >= 30) score += 20;
  else if (latestGM >= 20) score += 12;
  else if (latestGM >= 10) score += 5;
  else score -= 5;

  // QoQ expansion
  if (latestGM > prevGM + 1.5) score += 8;
  else if (latestGM >= prevGM) score += 4;
  else score -= 4;

  // vs 8Q Average
  if (latestGM > avg8GM) score += 5;
  else score -= 3;

  return Math.min(99, Math.max(30, Math.round(score)));
}

// 3. 營益率評分 (Operating Margin Score, 0 - 100)
export function calculateOperatingMarginScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 50;
  const latestOP = q[0].operatingMargin;
  const prevOP = q[1]?.operatingMargin ?? latestOP;

  let score = 50;
  if (latestOP >= 40) score += 35;
  else if (latestOP >= 25) score += 28;
  else if (latestOP >= 15) score += 20;
  else if (latestOP >= 8) score += 12;
  else if (latestOP >= 3) score += 5;
  else score -= 8;

  if (latestOP > prevOP) score += 7;
  else if (latestOP < prevOP - 1.0) score -= 5;

  return Math.min(99, Math.max(25, Math.round(score)));
}

// 4. ROE 評分 (0 - 100)
export function calculateRoeScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 50;
  const latestROE = q[0].roe;
  const avgROE = q.reduce((acc, curr) => acc + curr.roe, 0) / q.length;

  let score = 50;
  if (latestROE >= 35) score += 35;
  else if (latestROE >= 25) score += 28;
  else if (latestROE >= 18) score += 20;
  else if (latestROE >= 12) score += 12;
  else score -= 5;

  if (avgROE >= 22) score += 8;
  else if (avgROE >= 15) score += 4;

  return Math.min(99, Math.max(30, Math.round(score)));
}

// 5. ROIC 評分 (投入資本回報率, 0 - 100)
export function calculateRoicScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 50;
  const latestROIC = q[0].roic;
  const avgROIC = q.reduce((acc, curr) => acc + curr.roic, 0) / q.length;

  let score = 50;
  if (latestROIC >= 30) score += 35;
  else if (latestROIC >= 22) score += 28;
  else if (latestROIC >= 15) score += 20;
  else if (latestROIC >= 10) score += 12;
  else score -= 5;

  if (avgROIC >= 20) score += 8;
  else if (avgROIC >= 14) score += 4;

  return Math.min(99, Math.max(30, Math.round(score)));
}

// 6. 現金流評分 (Free Cash Flow, 0 - 100)
export function calculateCashFlowScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 50;
  const positiveFcfQuarters = q.filter(x => x.freeCashFlow > 0).length;
  const latestFCF = q[0].freeCashFlow;
  const latestOCF = q[0].operatingCashFlow;

  let score = 45;
  // Ratio of positive quarters
  score += Math.round((positiveFcfQuarters / q.length) * 28);

  // FCF adequacy
  if (latestFCF > 50) score += 15;
  else if (latestFCF > 15) score += 10;
  else if (latestFCF > 0) score += 5;
  else score -= 10;

  // Operating cash flow healthy
  if (latestOCF > latestFCF) score += 6;

  return Math.min(99, Math.max(30, Math.round(score)));
}

// 7. 負債健康度 (0 - 100)
export function calculateDebtHealthScore(q: QuarterFinancial[]): number {
  if (!q || q.length === 0) return 60;
  const latestDebt = q[0].debtRatio;
  const prevDebt = q[1]?.debtRatio ?? latestDebt;

  let score = 50;
  if (latestDebt <= 30) score += 38;
  else if (latestDebt <= 45) score += 30;
  else if (latestDebt <= 55) score += 20;
  else if (latestDebt <= 65) score += 8;
  else if (latestDebt <= 72) score -= 5;
  else score -= 18;

  if (latestDebt < prevDebt) score += 6;
  else if (latestDebt > prevDebt + 1.5) score -= 6;

  return Math.min(99, Math.max(25, Math.round(score)));
}

// 8. 綜合基本面評分
export function calculateCompositeScore(scores: Omit<FundamentalScores, 'compositeScore'>): number {
  const composite =
    scores.growthScore * 0.22 +
    scores.grossMarginScore * 0.16 +
    scores.operatingMarginScore * 0.14 +
    scores.roeScore * 0.15 +
    scores.roicScore * 0.15 +
    scores.cashFlowScore * 0.10 +
    scores.debtHealthScore * 0.08;
  return Math.round(composite);
}

// 9. 動態估值計算 (PEG 模型 60% + P/E Band 40% 加權算價)
export function calculateDynamicValuation(
  stock: TechStockFinancialData,
  growthScore: number,
  compositeScore: number
): DynamicValuationResult {
  const eps = stock.ttmEps;
  const currentPrice = stock.currentPrice;

  // 1. PEG Model (60% weight)
  // PEG = Price / (EPS * GrowthRate)
  // Peter Lynch 定價標竿:
  // 便宜價: PEG = 0.75
  // 合理價: PEG = 1.05
  // 昂貴價: PEG = 1.45
  // Cap growth rate between 10% and 42% to avoid absurd distortions
  const growthRateForPeg = Math.max(10, Math.min(stock.expectedGrowthRate, 42));

  const pegCheap = Number((eps * growthRateForPeg * 0.75).toFixed(1));
  const pegFair = Number((eps * growthRateForPeg * 1.05).toFixed(1));
  const pegExpensive = Number((eps * growthRateForPeg * 1.45).toFixed(1));

  // 2. P/E Band Model (40% weight)
  // 便宜價 = TTM EPS * PE_Low
  // 合理價 = TTM EPS * PE_Mid
  // 昂貴價 = TTM EPS * PE_High
  const peBandCheap = Number((eps * stock.peLow).toFixed(1));
  const peBandFair = Number((eps * stock.peMid).toFixed(1));
  const peBandExpensive = Number((eps * stock.peHigh).toFixed(1));

  // 3. Weighted Final Prices (60% PEG + 40% PE Band)
  const finalCheapPrice = Math.round(pegCheap * 0.60 + peBandCheap * 0.40);
  const finalFairPrice = Math.round(pegFair * 0.60 + peBandFair * 0.40);
  const finalExpensivePrice = Math.round(pegExpensive * 0.60 + peBandExpensive * 0.40);

  // 4. Upside & Stance
  const upsideToFair = Number((((finalFairPrice - currentPrice) / currentPrice) * 100).toFixed(1));
  const upsideToExpensive = Number((((finalExpensivePrice - currentPrice) / currentPrice) * 100).toFixed(1));

  let valuationStance: ValuationStance;
  let valuationLabel: string;
  let valuationBadgeClass: string;

  if (currentPrice < finalCheapPrice) {
    valuationStance = 'CHEAP';
    valuationLabel = '超值便宜區';
    valuationBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (currentPrice < finalFairPrice) {
    valuationStance = 'FAIR_LOW';
    valuationLabel = '合理偏低區';
    valuationBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
  } else if (currentPrice < finalExpensivePrice) {
    valuationStance = 'FAIR_HIGH';
    valuationLabel = '合理偏高區';
    valuationBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
  } else {
    valuationStance = 'EXPENSIVE';
    valuationLabel = '昂貴警戒區';
    valuationBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
  }

  // 5. 股價成長能力評分 (0-100)
  // 結合基本面成長分數 (40%) + 營收動能 YoY/MoM (30%) + 估值安全邊際 (30%)
  const valuationSafetyScore =
    currentPrice < finalCheapPrice ? 95 :
    currentPrice < finalFairPrice ? 80 :
    currentPrice < finalExpensivePrice ? 62 : 40;

  const momBonus = Math.min(25, Math.max(0, stock.revenueMom * 3 + stock.revenueLatestYoY * 0.2));
  const growthPotentialScore = Math.min(
    99,
    Math.round(growthScore * 0.38 + compositeScore * 0.22 + valuationSafetyScore * 0.25 + momBonus)
  );

  return {
    pegCheap,
    pegFair,
    pegExpensive,
    peBandCheap,
    peBandFair,
    peBandExpensive,
    finalCheapPrice,
    finalFairPrice,
    finalExpensivePrice,
    upsideToFair,
    upsideToExpensive,
    valuationStance,
    valuationLabel,
    valuationBadgeClass,
    growthPotentialScore,
  };
}

// 10. 生成專業操盤手機會與風險洞察
export function generateTraderInsights(stock: TechStockFinancialData, scores: FundamentalScores, valuation: DynamicValuationResult) {
  const opps: string[] = [];
  const risks: string[] = [];

  // Opportunities
  if (scores.grossMarginScore >= 85) {
    opps.push(`毛利率高達 ${stock.quarters[0].grossMargin}%，產品具極高技術護城河與市場獨家話語權`);
  } else if (stock.quarters[0].grossMargin > stock.quarters[1]?.grossMargin) {
    opps.push(`毛利率連季改善 (+${(stock.quarters[0].grossMargin - stock.quarters[1].grossMargin).toFixed(1)}%)，產品組合往高階轉移`);
  }

  if (scores.roicScore >= 85) {
    opps.push(`ROIC 資本回報率達 ${stock.quarters[0].roic}%，每單位資本再投資獲利能力冠絕產業同儕`);
  }

  if (valuation.valuationStance === 'CHEAP' || valuation.valuationStance === 'FAIR_LOW') {
    opps.push(`目前位處【${valuation.valuationLabel}】，距合理價尚有 +${valuation.upsideToFair}% 向上重估空間`);
  } else {
    opps.push(`成長動能強勁 (預估獲利成長 +${stock.expectedGrowthRate}%)，長線業績消化短線估值`);
  }

  if (stock.revenueLatestYoY >= 30) {
    opps.push(`最新單月營收年增達 +${stock.revenueLatestYoY}%，主力訂單進入集中交付拉貨期`);
  }

  // Risks
  if (valuation.valuationStance === 'EXPENSIVE') {
    risks.push(`現價已進入【昂貴警戒區】(本益比 ${stock.currentPe}x)，追高需嚴控停損`);
  } else if (stock.currentPe > stock.peMid) {
    risks.push(`短線本益比高於歷史中位 (${stock.peMid}x)，易受大盤資金輪動回檔修正`);
  }

  if (scores.debtHealthScore < 60) {
    risks.push(`負債比率偏高 (${stock.quarters[0].debtRatio}%)，需留意高利率資本支出利息負擔`);
  }

  if (stock.revenueMom < 0) {
    risks.push(`最新單月營收月增率趨緩 (${stock.revenueMom}%)，需觀察次月拉貨節奏延續性`);
  } else {
    risks.push(`全球雲端大廠 AI 資本支出步調若調整，可能影響供應鏈訂單波動`);
  }

  return {
    opportunities: opps.slice(0, 3),
    risks: risks.slice(0, 2),
  };
}

// 11. 全市場掃描、評分、同業對比與 Top 20 篩選 (支援 Yahoo Finance 即時報價注入)
export function runTechFundamentalScan(
  priceOverrides?: Record<string, { price: number; change?: number; changePercent?: number }>
): AnalyzedTechStock[] {
  // Step 1: Calculate raw scores and dynamic valuations for all candidate stocks
  const analyzedList: AnalyzedTechStock[] = TAIWAN_TECH_STOCKS_DATABASE.map((rawStock: TechStockFinancialData) => {
    const live = priceOverrides?.[rawStock.symbol] || priceOverrides?.[rawStock.code];
    const currentPrice = live?.price != null && live.price > 0 ? live.price : rawStock.currentPrice;
    const change = live?.change != null ? live.change : rawStock.change;
    const changePercent = live?.changePercent != null ? live.changePercent : rawStock.changePercent;
    const currentPe = rawStock.ttmEps > 0 ? Number((currentPrice / rawStock.ttmEps).toFixed(1)) : rawStock.currentPe;

    const stock: TechStockFinancialData = {
      ...rawStock,
      currentPrice,
      change,
      changePercent,
      currentPe,
    };

    const growthScore = calculateGrowthScore(stock.quarters, stock.revenueMom, stock.expectedGrowthRate);
    const grossMarginScore = calculateGrossMarginScore(stock.quarters);
    const operatingMarginScore = calculateOperatingMarginScore(stock.quarters);
    const roeScore = calculateRoeScore(stock.quarters);
    const roicScore = calculateRoicScore(stock.quarters);
    const cashFlowScore = calculateCashFlowScore(stock.quarters);
    const debtHealthScore = calculateDebtHealthScore(stock.quarters);

    const scores: FundamentalScores = {
      growthScore,
      grossMarginScore,
      operatingMarginScore,
      roeScore,
      roicScore,
      cashFlowScore,
      debtHealthScore,
      compositeScore: calculateCompositeScore({
        growthScore,
        grossMarginScore,
        operatingMarginScore,
        roeScore,
        roicScore,
        cashFlowScore,
        debtHealthScore,
      }),
    };

    const valuation = calculateDynamicValuation(stock, growthScore, scores.compositeScore);
    const { opportunities, risks } = generateTraderInsights(stock, scores, valuation);

    return {
      ...stock,
      rank: 0,
      scores,
      valuation,
      opportunities,
      risks,
      peerRankInSector: 0,
      peerCountInSector: 0,
    };
  });

  // Step 2: Peer comparison within each sector group
  const sectorGroups = new Map<TechSector, AnalyzedTechStock[]>();
  analyzedList.forEach((stock: AnalyzedTechStock) => {
    const list = sectorGroups.get(stock.sector) || [];
    list.push(stock);
    sectorGroups.set(stock.sector, list);
  });

  sectorGroups.forEach((stocksInSector: AnalyzedTechStock[]) => {
    // Sort within sector by Growth Potential Score & Composite Score
    stocksInSector.sort((a: AnalyzedTechStock, b: AnalyzedTechStock) => {
      const scoreA = a.valuation.growthPotentialScore * 0.6 + a.scores.compositeScore * 0.4;
      const scoreB = b.valuation.growthPotentialScore * 0.6 + b.scores.compositeScore * 0.4;
      return scoreB - scoreA;
    });

    stocksInSector.forEach((s: AnalyzedTechStock, idx: number) => {
      s.peerRankInSector = idx + 1;
      s.peerCountInSector = stocksInSector.length;
    });
  });

  // Step 3: Overall cross-sector ranking to select the Top 20 stocks
  // Ranking formula: 50% Growth Potential Score + 35% Fundamental Composite Score + 15% Valuation Safety Margin
  analyzedList.sort((a: AnalyzedTechStock, b: AnalyzedTechStock) => {
    const rankScoreA =
      a.valuation.growthPotentialScore * 0.50 +
      a.scores.compositeScore * 0.35 +
      (a.valuation.upsideToFair > 0 ? Math.min(20, a.valuation.upsideToFair * 0.5) : 0);

    const rankScoreB =
      b.valuation.growthPotentialScore * 0.50 +
      b.scores.compositeScore * 0.35 +
      (b.valuation.upsideToFair > 0 ? Math.min(20, b.valuation.upsideToFair * 0.5) : 0);

    return rankScoreB - rankScoreA;
  });

  // Top 20 selection with global ranking
  const top20: AnalyzedTechStock[] = analyzedList.slice(0, 20).map((stock: AnalyzedTechStock, idx: number) => ({
    ...stock,
    rank: idx + 1,
  }));

  return top20;
}
