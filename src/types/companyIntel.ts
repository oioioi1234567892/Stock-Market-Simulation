export interface GroundingSource {
  title: string;
  url: string;
}

export interface CompanyIntelReport {
  symbol: string;
  name: string;
  code: string;
  updatedAt: string;
  source: 'google_search_grounding' | 'verified_financial_database';
  executiveSummary: string;
  rndProgress: {
    title: string;
    highlights: string[];
  };
  financialHighlights: {
    title: string;
    quarter: string;
    highlights: string[];
  };
  futureDirection: {
    title: string;
    highlights: string[];
  };
  pros: string[]; // 核心優點 (Pros / Strengths)
  cons: string[]; // 核心缺點與潛在風險 (Cons / Risks)
  traderTakeaway: string; // 操盤手評語 (Trader's Conclusion)
  groundingSources?: GroundingSource[];
}
