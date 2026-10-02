import { db } from './index.ts';
import { backtestRecords } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface BacktestRecordInput {
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
}

export async function getUserBacktests(userId: string) {
  try {
    return await db.select().from(backtestRecords)
      .where(eq(backtestRecords.userId, userId))
      .orderBy(desc(backtestRecords.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database getUserBacktests failed:', error);
    throw new Error('Failed to fetch backtest history', { cause: error });
  }
}

export async function saveBacktestRecord(record: BacktestRecordInput) {
  try {
    const inserted = await db.insert(backtestRecords)
      .values({
        userId: record.userId,
        symbol: record.symbol,
        stockName: record.stockName,
        strategyName: record.strategyName,
        parameters: record.parameters,
        dateRange: record.dateRange,
        totalTrades: record.totalTrades,
        winRate: record.winRate,
        totalReturn: record.totalReturn,
        expectancy: record.expectancy,
        profitFactor: record.profitFactor,
        maxDrawdown: record.maxDrawdown,
        tradesSummary: record.tradesSummary,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database saveBacktestRecord failed:', error);
    throw new Error('Failed to save backtest record', { cause: error });
  }
}

export async function deleteBacktestRecord(id: number, userId: string) {
  try {
    return await db.delete(backtestRecords)
      .where(eq(backtestRecords.id, id))
      .returning();
  } catch (error) {
    console.error('Database deleteBacktestRecord failed:', error);
    throw new Error('Failed to delete backtest record', { cause: error });
  }
}
