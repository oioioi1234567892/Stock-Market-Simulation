export interface HeatmapStockItem {
  code: string;
  name: string;
  symbol: string;
  market: 'TWSE' | 'TPEx';
  industry: string;
  industryCode: string;
  close: number;
  change: number;
  changePercent: number;        // 當日漲跌幅 %
  weeklyChangePercent: number;  // 1週 (5日) 累積漲跌幅 %
  monthlyChangePercent?: number; // 1個月漲跌幅 %
  volume: number;               // 成交股數
  volumeShares: number;         // 成交張數
  turnover: number;             // 成交金額 (元)
  turnoverYi: number;           // 成交金額 (億元)
  weeklyTurnoverYi: number;     // 1週成交金額 (億元)
  marketCap: number;            // 市值 (億元)
  marketCapRank?: number;
  rsi6?: number;                // 6日 RSI 技術指標
  peRatio?: number;
  dividendYield?: number;
}

export interface HeatmapSectorItem {
  id: string;                   // 產業代碼 (01~38, 91)
  name: string;                 // 產業名稱 (半導體業、電子零組件業...)
  weeklyChangePercent: number;  // 1週加權漲跌幅 %
  todayChangePercent: number;   // 當日加權漲跌幅 %
  monthlyChangePercent: number; // 1個月加權漲跌幅 %
  totalTurnoverYi: number;      // 成交金額 (億元)
  weeklyTurnoverYi: number;     // 1週成交金額 (億元)
  totalMarketCapYi: number;     // 總市值 (億元)
  volumeSharePercent: number;   // 佔全市場成交量 %
  marketCapSharePercent: number;// 佔全市場市值 %
  stockCount: number;           // 包含股票數
  advanceCount: number;         // 上漲家數
  declineCount: number;         // 下跌家數
  unchangedCount: number;       // 持平家數
  stocks: HeatmapStockItem[];   // 產業旗下所有個股
}

export interface MarketHeatmapResponse {
  summary: {
    totalStocks: number;         // 約 1,954 檔上市櫃股票
    totalIndustries: number;     // 35 個產業
    marketWeeklyChange: number;  // 1週大盤平均漲跌幅 %
    marketTodayChange: number;   // 當日大盤漲跌幅 %
    totalTurnoverYi: number;     // 全市場成交總額 (億元)
    weeklyTotalTurnoverYi: number; // 全市場 1週總成交 (億元)
    totalMarketCapYi: number;    // 全市場總市值 (億元)
    totalAdvanceCount: number;   // 全市場上漲家數
    totalDeclineCount: number;   // 全市場下跌家數
    totalUnchangedCount: number; // 全市場持平家數
    updateDate: string;          // 盤面日期 (民國/西元)
    dataSource: string;          // 證交所 TWSE + 櫃買中心 TPEx 官方即時盤面
    isRealData: boolean;
  };
  sectors: HeatmapSectorItem[];
}
