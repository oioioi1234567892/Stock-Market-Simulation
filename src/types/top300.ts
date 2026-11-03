import { CandleData, StockStrategySignal } from './stock.ts';

export interface Top300StockItem {
  rank: number;
  code: string;
  name: string;
  symbol: string;
  market: 'TWSE' | 'TPEx';
  industry: string;
  close: number;
  change: number;
  changePercent: number;
  volumeShares: number;
  turnoverYi: number;
  marketCap: number; // 市值 (億元新台幣)
  candles?: CandleData[];
  strategySignal?: StockStrategySignal;
}

export interface Top300MarketCapResponse {
  summary: {
    totalCount: number;
    totalMarketCapYi: number;
    averageChangePercent: number;
    date: string;
    dataSource: string;
    isRealData: boolean;
  };
  stocks: Top300StockItem[];
  candlesMap?: Record<string, CandleData[]>;
}
