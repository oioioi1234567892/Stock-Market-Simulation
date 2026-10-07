export interface MarketFinancialProgress {
  currentYear: number;
  currentQuarter: string; // e.g. "2026Q3"
  auditedQuarter: string; // e.g. "2026Q2" (最新法定已審定公告季報)
  stageName: string; // e.g. "2026 年第 3 季 (Q3) 財報與自結獲利揭露期"
  deadline: string; // e.g. "Q3 財報法定申報截止日為 11 月 14 日"
  nextMilestone: string; // e.g. "台積電/聯發科/AI伺服器龍頭法說會高峰期，全體上市公司於 11/14 前申報完畢"
  progressPercent: number; // e.g. 75
  quarterSequence: string[]; // 8 trailing quarters: ["2026Q3", "2026Q2", "2026Q1", "2025Q4", "2025Q3", "2025Q2", "2025Q1", "2024Q4"]
  lastSyncTimestamp: number;
}

/**
 * Dynamically computes the current statutory financial reporting stage,
 * disclosure deadlines, and the 8 consecutive trailing quarters sequence
 * according to Taiwan securities regulations (TWSE / TPEx).
 * 
 * Automatically shifts forward with time, ensuring the system never becomes outdated.
 */
export function calculateMarketFinancialProgress(refDate: Date = new Date()): MarketFinancialProgress {
  const year = refDate.getFullYear();
  const month = refDate.getMonth() + 1; // 1-12
  const day = refDate.getDate();

  let latestQuarter = '';
  let auditedQuarter = '';
  let stageName = '';
  let deadline = '';
  let nextMilestone = '';
  let progressPercent = 75;

  // Taiwan reporting cycle:
  // Q1 deadline: May 15
  // Q2 deadline: Aug 14
  // Q3 deadline: Nov 14
  // Annual (Q4) deadline: Mar 31 of next year
  if (month >= 10 || (month === 9 && day >= 25)) {
    latestQuarter = `${year}Q3`;
    auditedQuarter = `${year}Q2`;
    stageName = `${year} 年第 3 季 (Q3) 財報與自結獲利揭露期`;
    deadline = 'Q3 財報法定申報截止日為 11 月 14 日';
    nextMilestone = '台積電/聯發科/AI伺服器龍頭法說會高峰期，全體上市公司於 11/14 前公告完整財報';
    progressPercent = 75;
  } else if (month >= 7 || (month === 6 && day >= 25)) {
    latestQuarter = `${year}Q2`;
    auditedQuarter = `${year}Q1`;
    stageName = `${year} 年第 2 季 (Q2 半年報) 揭露期`;
    deadline = '半年報法定申報截止日為 8 月 14 日';
    nextMilestone = '8/14 前完成半年報審定，下半年 AI 供應鏈出貨展望';
    progressPercent = 50;
  } else if (month >= 4 || (month === 3 && day >= 25)) {
    latestQuarter = `${year}Q1`;
    auditedQuarter = `${year - 1}Q4`;
    stageName = `${year} 年第 1 季 (Q1) 季報揭露期`;
    deadline = 'Q1 財報法定申報截止日為 5 月 15 日';
    nextMilestone = '5/15 前全體上市櫃公司申報 Q1 季報，檢視首季獲利達標率';
    progressPercent = 25;
  } else {
    latestQuarter = `${year - 1}Q4`;
    auditedQuarter = `${year - 1}Q3`;
    stageName = `${year - 1} 年度 (Q4 全年報) 揭露期`;
    deadline = '年度財報法定申報截止日為 3 月 31 日';
    nextMilestone = '3/31 前公告全年度經會計師查核之財務報告與董事會股利政策';
    progressPercent = 100;
  }

  // Generate 8 consecutive trailing quarters starting from latestQuarter
  const quarterSequence: string[] = [];
  let curY = parseInt(latestQuarter.slice(0, 4), 10);
  let curQ = parseInt(latestQuarter.slice(5), 10);

  for (let i = 0; i < 8; i++) {
    quarterSequence.push(`${curY}Q${curQ}`);
    curQ -= 1;
    if (curQ === 0) {
      curQ = 4;
      curY -= 1;
    }
  }

  return {
    currentYear: year,
    currentQuarter: latestQuarter,
    auditedQuarter,
    stageName,
    deadline,
    nextMilestone,
    progressPercent,
    quarterSequence,
    lastSyncTimestamp: Date.now(),
  };
}

/**
 * Dynamically aligns a stock's 8-quarter financial report array to match the current market financial progress.
 */
export function alignStockQuartersToMarketProgress<T extends { quarters: { quarter: string; [k: string]: any }[] }>(
  stock: T,
  progress: MarketFinancialProgress
): T {
  if (!stock || !stock.quarters) return stock;
  const alignedQuarters = stock.quarters.map((q, idx) => ({
    ...q,
    quarter: progress.quarterSequence[idx] || q.quarter,
  }));
  return {
    ...stock,
    quarters: alignedQuarters,
  };
}
