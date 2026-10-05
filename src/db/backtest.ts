export async function getUserBacktests(userId: string) {
  return [];
}

export async function saveBacktestRecord(record: {
  userId: string;
  symbol: string;
  stockName: string;
  strategyName: string;
  parameters: string;
  dateRange: string;
  totalTrades: number;
  winRate: string;
  totalReturn: string;
  expectancy: string;
  profitFactor: string;
  maxDrawdown: string;
  tradesSummary: string;
}) {
  return {
    id: Date.now(),
    ...record,
    createdAt: new Date(),
  };
}

export async function deleteBacktestRecord(id: number, userId: string) {
  return true;
}
