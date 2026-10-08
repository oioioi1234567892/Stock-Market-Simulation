import {
  TechStockFinancialData,
  QuarterFinancial,
  TechSector,
  TAIWAN_TECH_STOCKS_DATABASE,
} from '../data/techFinancialsData.ts';
import {
  AiStockFinancialAnalysis,
  AiCompetitivenessRating,
  AiTraderVerdict,
  AiDebtHealthStatus,
} from '../types/aiFinancialAnalysis.ts';

/**
 * 專業半導體與科技產業分析師：各板塊代表性風險庫與護城河標竿
 */
const SECTOR_BENCHMARKS: Partial<
  Record<
    TechSector,
    {
      avgGrossMargin: number;
      avgRoe: number;
      avgDebtRatio: number;
      coreMoatMetric: string;
      macroRisks: string[];
    }
  >
> = {
  '晶圓代工': {
    avgGrossMargin: 46.0,
    avgRoe: 23.0,
    avgDebtRatio: 30.0,
    coreMoatMetric: '先進製程奈米數壟斷力與巨額資本支出護城河',
    macroRisks: [
      '地緣政治與全球貿易關稅壁壘限制',
      '先進製程龐大資本支出折舊壓力及電費水資源供應',
      '非AI消費性終端需求復甦速度不及預期',
    ],
  },
  '半導體/IC晶片': {
    avgGrossMargin: 48.0,
    avgRoe: 22.0,
    avgDebtRatio: 28.0,
    coreMoatMetric: '晶片設計專利、晶圓代工夥伴合作黏著度與終端生態系',
    macroRisks: [
      '全球半導體景氣循環及終端消費電子需求波動',
      '先進製程代工報價上漲壓縮晶片利潤空間',
      '國際地緣技術出口管制與技術替代競爭',
    ],
  },
  '先進封裝': {
    avgGrossMargin: 44.0,
    avgRoe: 24.5,
    avgDebtRatio: 32.0,
    coreMoatMetric: 'CoWoS / 晶圓級散熱封裝產能獨佔與台積電供應鏈黏著度',
    macroRisks: [
      '先進封裝設備交期延宕與上游晶圓供應瓶頸',
      'AI GPU晶片世代交替引發舊規格產能閒置',
      '封測材料 (特用化學品/載板) 缺料與漲價風險',
    ],
  },
  'IC設計/晶片': {
    avgGrossMargin: 52.0,
    avgRoe: 26.0,
    avgDebtRatio: 24.0,
    coreMoatMetric: '高算力專利架構、ASIC客製化設計能力與IP矽智財',
    macroRisks: [
      '雲端巨頭 (CSP) 自研ASIC世代迭代與流片成本高昂',
      '晶圓代工漲價侵蝕終端晶片毛利率',
      '智慧型手機與PC換機週期拉長之傳統晶片庫存去化',
    ],
  },
  'AI伺服器/代工': {
    avgGrossMargin: 9.5,
    avgRoe: 21.0,
    avgDebtRatio: 64.0,
    coreMoatMetric: '全球超大規模機櫃組裝驗證 (L11/L12)、全球運籌交付與散熱電源整機直通率',
    macroRisks: [
      'NVIDIA最新GB200/Rubin晶片供貨配額不均及設計微調遞延',
      '高單價伺服器備料導致營運資金龐大、負債比率偏高',
      'CSP雲端巨頭資本支出 (CapEx) 季增率若放緩之訂單抽單波動',
    ],
  },
  '散熱模組': {
    avgGrossMargin: 27.0,
    avgRoe: 22.0,
    avgDebtRatio: 46.0,
    coreMoatMetric: '水冷板 (Cold Plate)、CDU液冷分流器專利及浸沒式散熱良率',
    macroRisks: [
      '原物料銅、鋁金屬價格劇烈波動壓縮毛利率',
      '水冷快接頭 (Quick Disconnect) 漏液品質責任與認證爭議',
      '二線同業擴產引發中低階散熱產品價格競爭',
    ],
  },
  '電源/BBU': {
    avgGrossMargin: 28.5,
    avgRoe: 20.0,
    avgDebtRatio: 45.0,
    coreMoatMetric: '高瓦數伺服器電源轉換效率 (Titanium+) 與高倍率鋰電池BBU整合管理系統',
    macroRisks: [
      '鋰電池芯原物料價格波動與國際電池認證規章變動',
      'GB200 NVL72電源架構升級導致舊模組技術迭代替代',
      '主要資料中心客戶拉貨驗收時程遞延',
    ],
  },
  'ABF載板/PCB': {
    avgGrossMargin: 23.0,
    avgRoe: 17.5,
    avgDebtRatio: 40.0,
    coreMoatMetric: '高層數 (20層+) 大面積高難度載板良率與AI加速卡專用CCL配方',
    macroRisks: [
      'ABF高階載板大廠新產能開出可能引發之同業價格承壓',
      'AI ASIC封裝面積放大導致製程良率爬坡較慢',
      '高頻高速材料 (如Low Dk/Df) 專利受限與日本供應鏈依賴',
    ],
  },
  '重電綠能/電纜': {
    avgGrossMargin: 22.0,
    avgRoe: 15.0,
    avgDebtRatio: 48.0,
    coreMoatMetric: '美國外銷電網強韌認證、超高壓變壓器特許製造能力',
    macroRisks: [
      '原料銅價與矽鋼片價格波動',
      '美國輸配電基礎建設政策補貼審查節奏',
      '新產能開出交期拉長驗收風險',
    ],
  },
  '航運物流/海空運': {
    avgGrossMargin: 25.0,
    avgRoe: 18.0,
    avgDebtRatio: 38.0,
    coreMoatMetric: '全球大航線船舶運力調度、長約客戶合約覆蓋率',
    macroRisks: [
      '地緣政治衝突變化對蘇伊士運河復航與運價指數衝擊',
      '全球新造貨櫃輪運力過剩交付壓力',
      '燃油成本飆漲與國際碳稅法規',
    ],
  },
  '智慧製造/機器人': {
    avgGrossMargin: 35.0,
    avgRoe: 16.0,
    avgDebtRatio: 36.0,
    coreMoatMetric: '高精度減速機、機器視覺演算法與跨產業整合整合能力',
    macroRisks: [
      '製造業資本支出復甦速度不如預期',
      '日圓貶值導致日本同業產品價格競爭優勢',
      'AI人形機器人商業化放量時程遞延',
    ],
  },
};

/**
 * 操盤手演算法：為個股推算全維度 AI 財務分析
 */
export function generateAnalystStockAnalysis(
  stock: TechStockFinancialData,
  allStocksInSector: TechStockFinancialData[] = []
): AiStockFinancialAnalysis {
  const quarters = stock.quarters || [];
  const latestQ = quarters[0] || {
    grossMargin: 20,
    operatingMargin: 10,
    roe: 15,
    roic: 12,
    revenueYoY: 10,
    debtRatio: 40,
    freeCashFlow: 50,
    eps: 2,
  };

  const prevQ = quarters[1] || latestQ;
  const sectorInfo = SECTOR_BENCHMARKS[stock.sector] || {
    avgGrossMargin: 30,
    avgRoe: 20,
    avgDebtRatio: 40,
    coreMoatMetric: '核心技術專利與客戶黏著度',
    macroRisks: ['全球經濟循環波動', '原物料成本上漲', '匯率與關稅風險'],
  };

  // 1. 獲利能力分析 (Profitability)
  const gmSpread = latestQ.grossMargin - sectorInfo.avgGrossMargin;
  const opSpread = latestQ.operatingMargin - 15;
  const gmTrendingUp = latestQ.grossMargin >= prevQ.grossMargin;

  let profitabilityScore = 50;
  if (latestQ.grossMargin >= 50) profitabilityScore += 26;
  else if (latestQ.grossMargin >= 35) profitabilityScore += 18;
  else if (latestQ.grossMargin >= 22) profitabilityScore += 10;
  else if (latestQ.grossMargin < 12 && stock.sector !== 'AI伺服器/代工') profitabilityScore -= 12;

  if (latestQ.operatingMargin >= 35) profitabilityScore += 14;
  else if (latestQ.operatingMargin >= 20) profitabilityScore += 10;
  else if (latestQ.operatingMargin >= 8) profitabilityScore += 5;

  if (gmTrendingUp) profitabilityScore += 6;
  if (gmSpread > 8) profitabilityScore += 6;
  profitabilityScore = Math.min(99, Math.max(30, Math.round(profitabilityScore)));

  const profitabilityAnalysis =
    `最新毛利率 ${latestQ.grossMargin}% (較上季 ${gmTrendingUp ? '↑' : '↓'} ${Math.abs(latestQ.grossMargin - prevQ.grossMargin).toFixed(1)}%)，營益率達 ${latestQ.operatingMargin}%。` +
    (gmSpread > 5
      ? ` 獲利結構顯著優於同業平均 (${sectorInfo.avgGrossMargin}%)，顯示具備強大產品附加價值與客戶端轉嫁能力。`
      : gmSpread >= -3
      ? ` 獲利表現符合產業中高水準，本業獲利轉化能力穩健。`
      : ` 受代工或競爭壓力毛利較為薄利，需倚賴高週轉率與規模經濟驅動營業利益。`);

  // 2. 資產報酬率評估 (Asset Return: ROA / ROE / ROIC)
  const roe = latestQ.roe;
  const roic = latestQ.roic;
  // 推估資產報酬率 ROA ≈ ROE * (1 - 負債比率/100)
  const estimatedRoa = Number((roe * (1 - latestQ.debtRatio / 100)).toFixed(1));

  let assetReturnScore = 50;
  if (roe >= 28) assetReturnScore += 26;
  else if (roe >= 20) assetReturnScore += 18;
  else if (roe >= 14) assetReturnScore += 10;
  else if (roe < 8) assetReturnScore -= 12;

  if (roic >= 24) assetReturnScore += 14;
  else if (roic >= 16) assetReturnScore += 9;
  else if (roic >= 10) assetReturnScore += 4;

  if (estimatedRoa >= 15) assetReturnScore += 8;
  else if (estimatedRoa >= 10) assetReturnScore += 5;
  assetReturnScore = Math.min(99, Math.max(32, Math.round(assetReturnScore)));

  const assetReturnAnalysis =
    `當季年化 ROE 達 ${roe}%、ROIC 資本回報率高達 ${roic}%，推估資產報酬率 (ROA) 為 ${estimatedRoa}%。` +
    (roic >= 20
      ? ` 資本再投資回報率冠絕同儕，管理層資本配置效率極高，具備持續創造經濟增值的超額收益能力。`
      : roic >= 12
      ? ` 資本投入回報良好，資產運用效率高於資本成本 (WACC)，財務體質健康。`
      : ` 資本回報率處於同業均值區間，未來需留意新廠產能擴充後的折舊回收速度。`);

  // 3. 營收增長率趨勢 (Revenue Growth)
  const revYoY = latestQ.revenueYoY;
  const expGrowth = stock.expectedGrowthRate;
  const latestMoM = stock.revenueMom;

  let revenueGrowthScore = 50;
  if (revYoY >= 35) revenueGrowthScore += 24;
  else if (revYoY >= 20) revenueGrowthScore += 16;
  else if (revYoY >= 8) revenueGrowthScore += 8;
  else if (revYoY < 0) revenueGrowthScore -= 12;

  if (expGrowth >= 30) revenueGrowthScore += 14;
  else if (expGrowth >= 18) revenueGrowthScore += 9;
  else if (expGrowth >= 10) revenueGrowthScore += 4;

  if (latestMoM > 0) revenueGrowthScore += 5;
  revenueGrowthScore = Math.min(99, Math.max(30, Math.round(revenueGrowthScore)));

  const revenueGrowthAnalysis =
    `最新季營收年增率 ${revYoY > 0 ? '+' : ''}${revYoY}%，最新單月營收月增率 ${latestMoM > 0 ? '+' : ''}${latestMoM}%，市場共識預估次年度獲利成長率為 +${expGrowth}%。` +
    (revYoY >= 25
      ? ` 營收動能處於高速爬坡階段，受惠 ${stock.catalyst}，訂單能見度極佳。`
      : revYoY >= 5
      ? ` 營收保持溫和穩健擴張，產品滲透率逐步走高。`
      : ` 營收成長暫時處於景氣循環平緩期或高基期調節，需追蹤次季拉貨復甦轉折。`);

  // 4. 負債健康度 (Debt & Financial Health)
  const debtRatio = latestQ.debtRatio;
  const fcf = latestQ.freeCashFlow;

  let debtHealthScore = 55;
  if (debtRatio <= 28) debtHealthScore += 24;
  else if (debtRatio <= 40) debtHealthScore += 16;
  else if (debtRatio <= 55) debtHealthScore += 6;
  else if (debtRatio <= 68) debtHealthScore -= 8;
  else debtHealthScore -= 18;

  if (fcf > 1000) debtHealthScore += 16;
  else if (fcf > 200) debtHealthScore += 10;
  else if (fcf > 0) debtHealthScore += 5;
  else debtHealthScore -= 10;
  debtHealthScore = Math.min(99, Math.max(25, Math.round(debtHealthScore)));

  let debtHealthStatus: AiDebtHealthStatus = 'HEALTHY';
  let debtHealthStatusLabel = '財務穩健安全';
  let debtHealthBadgeClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';

  if (debtHealthScore >= 82) {
    debtHealthStatus = 'EXCELLENT';
    debtHealthStatusLabel = '極度優良健全';
    debtHealthBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (debtHealthScore >= 68) {
    debtHealthStatus = 'HEALTHY';
    debtHealthStatusLabel = '財務穩健安全';
    debtHealthBadgeClass = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  } else if (debtHealthScore >= 52) {
    debtHealthStatus = 'MODERATE';
    debtHealthStatusLabel = '財務平穩可控';
    debtHealthBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else {
    debtHealthStatus = 'CAUTION';
    debtHealthStatusLabel = '需留意現金流/負債';
    debtHealthBadgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }

  const debtHealthAnalysis =
    `負債比率為 ${debtRatio}%，最新單季自由現金流為 ${fcf > 0 ? '+' : ''}${fcf} 億元新台幣。` +
    (debtHealthStatus === 'EXCELLENT'
      ? ` 資產負債表極度潔淨，充沛自由現金流提供強大抗景氣波動韌性與高研發/資本支出防護傘。`
      : debtHealthStatus === 'HEALTHY'
      ? ` 負債比率維持在產業安全健康警戒線以下，現金流量充裕，償債及再投資能力無虞。`
      : debtHealthStatus === 'MODERATE'
      ? ` 負債比率略受資本支出或備料規模增加影響，但營業活動現金流入穩健，財務整體在可控範圍。`
      : ` 負債結構相對偏高，需持續追蹤高利率環境下利息支出負擔及應收帳款週轉率。`);

  // 5. 產業橫向競爭力對比 (Industry Comparison & Moat)
  const peers = allStocksInSector.length > 0
    ? allStocksInSector
    : TAIWAN_TECH_STOCKS_DATABASE.filter(s => s.sector === stock.sector);

  // 計算同業排名
  const sortedPeers = [...peers].sort((a, b) => {
    const aScore = (a.quarters[0]?.grossMargin ?? 0) * 0.4 + (a.quarters[0]?.roe ?? 0) * 0.6;
    const bScore = (b.quarters[0]?.grossMargin ?? 0) * 0.4 + (b.quarters[0]?.roe ?? 0) * 0.6;
    return bScore - aScore;
  });

  const peerRankIndex = sortedPeers.findIndex(s => s.code === stock.code);
  const peerRank = peerRankIndex >= 0 ? peerRankIndex + 1 : 1;
  const peerRankText = `${stock.sector}第 ${peerRank} 名 / 共 ${sortedPeers.length} 檔`;

  // 綜合 AI 競爭力評分 (0-100)
  const compositeScore = Math.round(
    profitabilityScore * 0.30 +
    assetReturnScore * 0.25 +
    revenueGrowthScore * 0.25 +
    debtHealthScore * 0.20
  );

  let competitivenessRating: AiCompetitivenessRating = 'STRONG_MOAT';
  let competitivenessLabel = '領先強勢競爭力';
  let competitivenessBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

  if (compositeScore >= 84 || peerRank === 1) {
    competitivenessRating = 'TOP_TIER';
    competitivenessLabel = '產業頂級統治力';
    competitivenessBadgeClass = 'bg-linear-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border-amber-500/60 shadow-xs';
  } else if (compositeScore >= 72) {
    competitivenessRating = 'STRONG_MOAT';
    competitivenessLabel = '領先強勢競爭力';
    competitivenessBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (compositeScore >= 58) {
    competitivenessRating = 'PEER_AVERAGE';
    competitivenessLabel = '同業中游持平';
    competitivenessBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
  } else {
    competitivenessRating = 'LAGGING';
    competitivenessLabel = '競爭面臨考驗';
    competitivenessBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
  }

  const competitivenessMoat =
    `${stock.subCategory}領域。橫向對比同板塊競爭對手，核心競爭優勢在於：${stock.description}。催化動能由「${stock.catalyst}」驅動，` +
    (peerRank === 1
      ? `穩居該賽道龍頭龍頭地位，擁有技術定義權與產業最高溢價。`
      : `在細分利基市場具備高度不可替代性與供應鏈份額保障。`);

  // 6. 未來三大核心風險 (Future Key Risks)
  const futureRisks = [
    sectorInfo.macroRisks[0] || '半導體及科技景氣循環震盪與地緣政治供應鏈調整風險',
    sectorInfo.macroRisks[1] || '客戶端拉貨節奏放緩或關鍵料件供應瓶頸導致交付遞延',
    `特定大客戶營收集中度較高，以及新一代製程/產能擴張之固定資產折舊壓力`,
  ];

  const riskWarningSign =
    `若單月營收年增率跌破 0% 或單季毛利率連續 2 季下滑超過 2.5 個百分點，為操盤手下行警訊。`;

  // 7. 操盤手綜合研判結論 (Trader Stance & Recommendation)
  let traderVerdict: AiTraderVerdict = 'BUY_ON_DIP';
  let traderVerdictLabel = '逢低戰略布局';
  let traderVerdictBadgeClass = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60';
  let traderSummary = '';

  if (competitivenessRating === 'TOP_TIER' && debtHealthStatus !== 'CAUTION') {
    traderVerdict = 'CORE_ALLOCATION';
    traderVerdictLabel = '核心強勢配置';
    traderVerdictBadgeClass = 'bg-blue-600/40 text-blue-200 border-blue-400 shadow-sm';
    traderSummary = `作為【${stock.sector}】核心旗艦標的，具備頂級獲利品質與深厚技術護城河。建議納入科技板塊中長線核心多頭組合，遇市場非理性回檔為優先布局窗口。`;
  } else if (compositeScore >= 70) {
    traderVerdict = 'BUY_ON_DIP';
    traderVerdictLabel = '逢低戰略布局';
    traderVerdictBadgeClass = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/60';
    traderSummary = `基本面成長性充沛，資本回報率高於同儕平均。逢均線支撐或回測技術整理區間時分批戰略布局，博取次年度業績釋放溢價。`;
  } else if (compositeScore >= 55) {
    traderVerdict = 'NEUTRAL_WATCH';
    traderVerdictLabel = '中立區間觀察';
    traderVerdictBadgeClass = 'bg-amber-600/30 text-amber-300 border-amber-500/60';
    traderSummary = `財務體質穩健但短線營收或獲利動能趨平，建議以箱型震盪思維看待，靜待下一波營收跳升或新產品放量訊號確認。`;
  } else {
    traderVerdict = 'DEFENSIVE_AVOID';
    traderVerdictLabel = '防禦性減碼觀望';
    traderVerdictBadgeClass = 'bg-rose-600/30 text-rose-300 border-rose-500/60';
    traderSummary = `同業競爭劇烈或負債現金流壓力稍大，防禦性減碼為宜，等待毛利率結構性好轉再行審視。`;
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    code: stock.code,
    sector: stock.sector,
    subCategory: stock.subCategory,
    currentPrice: stock.currentPrice,
    changePercent: stock.changePercent,

    competitivenessRating,
    competitivenessLabel,
    competitivenessScore: compositeScore,
    competitivenessBadgeClass,
    competitivenessMoat,
    peerRankText,

    profitabilityScore,
    grossMarginLatest: latestQ.grossMargin,
    operatingMarginLatest: latestQ.operatingMargin,
    ttmEps: stock.ttmEps,
    profitabilityAnalysis,

    assetReturnScore,
    roeLatest: latestQ.roe,
    roicLatest: latestQ.roic,
    estimatedRoa,
    assetReturnAnalysis,

    revenueGrowthScore,
    revenueLatestYoY: latestQ.revenueYoY,
    expectedGrowthRate: expGrowth,
    revenueGrowthAnalysis,

    debtHealthScore,
    debtRatioLatest: latestQ.debtRatio,
    freeCashFlowLatest: latestQ.freeCashFlow,
    debtHealthStatus,
    debtHealthStatusLabel,
    debtHealthBadgeClass,
    debtHealthAnalysis,

    futureRisks,
    riskWarningSign,

    traderVerdict,
    traderVerdictLabel,
    traderVerdictBadgeClass,
    traderSummary,

    generatedAt: new Date().toISOString(),
    source: 'analyst_engine',
  };
}

/**
 * 批次生成全科技股資料庫的 AI 財務分析字典
 */
export function generateAllStocksAnalystAnalysis(): Record<string, AiStockFinancialAnalysis> {
  const result: Record<string, AiStockFinancialAnalysis> = {};
  const stocks = TAIWAN_TECH_STOCKS_DATABASE;

  stocks.forEach(stock => {
    const peers = stocks.filter(s => s.sector === stock.sector);
    result[stock.symbol] = generateAnalystStockAnalysis(stock, peers);
  });

  return result;
}
