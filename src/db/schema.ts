import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Users table (synced with Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Watchlist for Taiwan stocks (e.g. 2330.TW, 2454.TW)
export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // UID of user
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  market: text('market').default('TWSE'), // TWSE or TPEx
  targetBuyPrice: text('target_buy_price'),
  targetSellPrice: text('target_sell_price'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Backtest records for storing user backtesting history and performance metrics
export const backtestRecords = pgTable('backtest_records', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  stockName: text('stock_name').notNull(),
  strategyName: text('strategy_name').notNull(),
  parameters: text('parameters').notNull(), // JSON string: { entryRules, exitRules, stopLossPct, takeProfitPct, trailingStopPct }
  dateRange: text('date_range').notNull(),
  totalTrades: integer('total_trades').notNull(),
  winRate: text('win_rate').notNull(),
  totalReturn: text('total_return').notNull(),
  expectancy: text('expectancy').notNull(),
  profitFactor: text('profit_factor').notNull(),
  maxDrawdown: text('max_drawdown').notNull(),
  tradesSummary: text('trades_summary').notNull(), // JSON string: trade log items
  createdAt: timestamp('created_at').defaultNow(),
});
