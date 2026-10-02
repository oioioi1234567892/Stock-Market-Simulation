import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getUserWatchlist, addToWatchlist, removeFromWatchlist } from './src/db/watchlist.ts';
import { getUserBacktests, saveBacktestRecord, deleteBacktestRecord } from './src/db/backtest.ts';
import { POPULAR_TAIWAN_STOCKS, resolveTaiwanSymbol } from './src/data/taiwanStocks.ts';
import { calculateIndicators } from './src/utils/indicators.ts';
import { CandleData } from './src/types/stock.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const yahooFinance = new YahooFinance();

// 1. Search Taiwan stocks
app.get('/api/stocks/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json(POPULAR_TAIWAN_STOCKS.slice(0, 15));
  }
  const filtered = POPULAR_TAIWAN_STOCKS.filter(
    s => s.code.includes(query) || s.name.toLowerCase().includes(query) || s.symbol.toLowerCase().includes(query)
  );

  // If no match in popular, return synthesized symbol
  if (filtered.length === 0) {
    const resolved = resolveTaiwanSymbol(query);
    return res.json([
      {
        code: resolved.symbol.replace(/\.TW(O)?/, ''),
        name: resolved.name,
        symbol: resolved.symbol,
        market: resolved.market,
        category: '自選個股',
      }
    ]);
  }
  res.json(filtered);
});

// 2. Real-time quote for a stock
app.get('/api/stocks/:symbol/quote', async (req: Request, res: Response) => {
  try {
    const symbolParam = req.params.symbol;
    const resolved = resolveTaiwanSymbol(symbolParam);
    const targetSymbol = resolved.symbol;

    let quote: any = null;
    try {
      quote = await yahooFinance.quote(targetSymbol);
    } catch (err) {
      console.warn(`Yahoo quote error for ${targetSymbol}, falling back to chart query:`, err);
    }

    if (!quote) {
      // Fallback: try chart to extract last price
      const chartRes = await yahooFinance.chart(targetSymbol, { period1: '2024-01-01', interval: '1d' });
      const lastQuote = chartRes.quotes && chartRes.quotes.length > 0 ? chartRes.quotes[chartRes.quotes.length - 1] : null;
      const prevQuote = chartRes.quotes && chartRes.quotes.length > 1 ? chartRes.quotes[chartRes.quotes.length - 2] : null;

      if (!lastQuote) {
        return res.status(404).json({ error: `無法取得 ${targetSymbol} 行情數據` });
      }

      const price = lastQuote.close || lastQuote.adjclose || 0;
      const prevClose = prevQuote ? (prevQuote.close || price) : price;
      const change = Number((price - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

      return res.json({
        symbol: targetSymbol,
        name: resolved.name,
        price,
        change,
        changePercent,
        open: lastQuote.open || price,
        high: lastQuote.high || price,
        low: lastQuote.low || price,
        previousClose: prevClose,
        volume: lastQuote.volume || 0,
        timestamp: new Date(lastQuote.date).getTime(),
      });
    }

    const price = quote.regularMarketPrice ?? 0;
    const prevClose = quote.regularMarketPreviousClose ?? price;
    const change = quote.regularMarketChange ?? Number((price - prevClose).toFixed(2));
    const changePercent = quote.regularMarketChangePercent ?? (prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0);

    res.json({
      symbol: targetSymbol,
      name: resolved.name || quote.shortName || quote.symbol,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      open: quote.regularMarketOpen ?? price,
      high: quote.regularMarketDayHigh ?? price,
      low: quote.regularMarketDayLow ?? price,
      previousClose: prevClose,
      volume: quote.regularMarketVolume ?? 0,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      week52High: quote.fiftyTwoWeekHigh,
      week52Low: quote.fiftyTwoWeekLow,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error fetching stock quote:', error);
    res.status(500).json({ error: error.message || '取得股票行情失敗' });
  }
});

// In-memory cache for historical candles to ensure instant responsiveness
interface CachedCandles {
  timestamp: number;
  candles: CandleData[];
}
const candleCache = new Map<string, CachedCandles>();

async function fetchCandlesForSymbol(targetSymbol: string, range = '1y', interval = '1d'): Promise<CandleData[]> {
  const cacheKey = `${targetSymbol}:${range}:${interval}`;
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 180000) {
    return cached.candles;
  }

  const now = new Date();
  let startDate = new Date();
  if (range === '1mo') startDate.setMonth(now.getMonth() - 1);
  else if (range === '3mo') startDate.setMonth(now.getMonth() - 3);
  else if (range === '6mo') startDate.setMonth(now.getMonth() - 6);
  else if (range === '2y') startDate.setFullYear(now.getFullYear() - 2);
  else if (range === '5y') startDate.setFullYear(now.getFullYear() - 5);
  else startDate.setFullYear(now.getFullYear() - 1);

  const period1Str = startDate.toISOString().split('T')[0];
  const chartRes = await yahooFinance.chart(targetSymbol, {
    period1: period1Str,
    interval: interval as any,
  });

  if (!chartRes || !chartRes.quotes || chartRes.quotes.length === 0) {
    throw new Error(`找不到 ${targetSymbol} 的歷史 K 線數據`);
  }

  const rawCandles: CandleData[] = chartRes.quotes
    .filter((q: any) => q.open !== null && q.close !== null && q.high !== null && q.low !== null)
    .map((q: any) => {
      const d = new Date(q.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const timeStr = `${y}-${m}-${day}`;

      return {
        time: timeStr,
        open: Number(q.open.toFixed(2)),
        high: Number(q.high.toFixed(2)),
        low: Number(q.low.toFixed(2)),
        close: Number(q.close.toFixed(2)),
        volume: Number(q.volume || 0),
        adjClose: q.adjclose ? Number(q.adjclose.toFixed(2)) : undefined,
      };
    });

  const uniqueCandles: CandleData[] = [];
  const seenDates = new Set<string>();
  for (const c of rawCandles) {
    if (!seenDates.has(c.time)) {
      seenDates.add(c.time);
      uniqueCandles.push(c);
    }
  }
  uniqueCandles.sort((a, b) => a.time.localeCompare(b.time));
  const candlesWithIndicators = calculateIndicators(uniqueCandles);

  candleCache.set(cacheKey, { timestamp: Date.now(), candles: candlesWithIndicators });
  return candlesWithIndicators;
}

// 3. Historical K-line candlestick chart data + calculated indicators (KD, MACD, MA)
app.get('/api/stocks/:symbol/history', async (req: Request, res: Response) => {
  try {
    const symbolParam = req.params.symbol;
    const resolved = resolveTaiwanSymbol(symbolParam);
    const targetSymbol = resolved.symbol;
    const range = (req.query.range as string) || '1y'; // 3mo, 6mo, 1y, 2y, 5y
    const interval = ((req.query.interval as string) || '1d') as '1d' | '1wk' | '1mo';

    const candlesWithIndicators = await fetchCandlesForSymbol(targetSymbol, range, interval);

    res.json({
      symbol: targetSymbol,
      name: resolved.name,
      market: resolved.market,
      range,
      interval,
      candles: candlesWithIndicators,
    });
  } catch (error: any) {
    console.error('Error fetching historical chart:', error);
    res.status(500).json({ error: error.message || '取得歷史 K 線數據失敗' });
  }
});

// 3.1 Batch Candles and Quotes for Watchlist real-time strategy analysis
app.post('/api/stocks/batch-candles', async (req: Request, res: Response) => {
  try {
    const symbols = req.body.symbols as string[];
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.json({});
    }

    const results: Record<string, { candles: CandleData[]; quote: any }> = {};
    await Promise.all(
      symbols.map(async (rawSym) => {
        try {
          const resolved = resolveTaiwanSymbol(rawSym);
          const candles = await fetchCandlesForSymbol(resolved.symbol, '1y', '1d');
          if (candles && candles.length > 0) {
            const last = candles[candles.length - 1];
            const prev = candles.length > 1 ? candles[candles.length - 2] : last;
            const change = Number((last.close - prev.close).toFixed(2));
            const changePercent = prev.close > 0 ? Number(((change / prev.close) * 100).toFixed(2)) : 0;
            results[rawSym] = {
              candles,
              quote: {
                symbol: resolved.symbol,
                name: resolved.name,
                price: last.close,
                change,
                changePercent,
                open: last.open,
                high: last.high,
                low: last.low,
                volume: last.volume,
                timestamp: Date.now(),
              },
            };
          }
        } catch (err: any) {
          console.warn(`Batch fetch failed for ${rawSym}:`, err.message);
        }
      })
    );

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// In-memory fallback repository when Cloud SQL is not configured (Do not enable Cloud SQL)
interface MemoryWatchlistItem {
  id: number;
  userId: string;
  symbol: string;
  name: string;
  market: string;
  targetBuyPrice: string | null;
  targetSellPrice: string | null;
  notes: string | null;
  createdAt: Date;
}

let nextWatchlistId = 100;
const memoryWatchlists: MemoryWatchlistItem[] = POPULAR_TAIWAN_STOCKS.slice(0, 8).map((item, idx) => ({
  id: idx + 1,
  userId: 'guest',
  symbol: item.symbol,
  name: item.name,
  market: item.market,
  targetBuyPrice: null,
  targetSellPrice: null,
  notes: `${item.category} 核心權值股`,
  createdAt: new Date(),
}));

let nextBacktestId = 1;
const memoryBacktests: any[] = [];
const memoryUsers = new Map<string, any>();

const hasSqlDb = Boolean(process.env.SQL_HOST);

// 4. User Profile Sync
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@anonymous.user`;
    const displayName = req.body.displayName || req.user!.name || null;

    if (!hasSqlDb) {
      const user = { uid, email, displayName, updatedAt: new Date() };
      memoryUsers.set(uid, user);
      return res.json({ success: true, user });
    }

    const user = await getOrCreateUser(uid, email, displayName);
    res.json({ success: true, user });
  } catch (error: any) {
    console.warn('Auth sync falling back to memory:', error.message);
    const uid = req.user?.uid || 'guest';
    const user = { uid, email: req.user?.email || '', displayName: req.body?.displayName || null };
    memoryUsers.set(uid, user);
    res.json({ success: true, user });
  }
});

// 5. Watchlist API
app.get('/api/watchlist', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user ? req.user.uid : 'guest';

    if (!hasSqlDb) {
      const userItems = memoryWatchlists.filter(w => w.userId === userId || (userId === 'guest' && w.userId === 'guest'));
      return res.json(userItems);
    }

    if (!req.user) {
      return res.json(memoryWatchlists.filter(w => w.userId === 'guest'));
    }

    const items = await getUserWatchlist(req.user.uid);
    res.json(items);
  } catch (error: any) {
    console.warn('Watchlist fetch falling back to memory:', error.message);
    const userId = req.user ? req.user.uid : 'guest';
    const userItems = memoryWatchlists.filter(w => w.userId === userId || w.userId === 'guest');
    res.json(userItems);
  }
});

app.post('/api/watchlist', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, name, market, targetBuyPrice, targetSellPrice, notes } = req.body;
    if (!symbol || !name) {
      return res.status(400).json({ error: '股票代號與名稱為必填' });
    }

    const userId = req.user ? req.user.uid : 'guest';

    if (!hasSqlDb) {
      // Find existing
      const existingIdx = memoryWatchlists.findIndex(w => w.userId === userId && w.symbol === symbol);
      if (existingIdx >= 0) {
        memoryWatchlists[existingIdx] = {
          ...memoryWatchlists[existingIdx],
          name,
          market: market || 'TWSE',
          targetBuyPrice: targetBuyPrice || null,
          targetSellPrice: targetSellPrice || null,
          notes: notes || null,
        };
        return res.json({ success: true, item: memoryWatchlists[existingIdx] });
      }

      const newItem: MemoryWatchlistItem = {
        id: nextWatchlistId++,
        userId,
        symbol,
        name,
        market: market || 'TWSE',
        targetBuyPrice: targetBuyPrice ? String(targetBuyPrice) : null,
        targetSellPrice: targetSellPrice ? String(targetSellPrice) : null,
        notes: notes || null,
        createdAt: new Date(),
      };
      memoryWatchlists.unshift(newItem);
      return res.json({ success: true, item: newItem });
    }

    const item = await addToWatchlist({
      userId,
      symbol,
      name,
      market: market || 'TWSE',
      targetBuyPrice: targetBuyPrice ? String(targetBuyPrice) : undefined,
      targetSellPrice: targetSellPrice ? String(targetSellPrice) : undefined,
      notes: notes || undefined,
    });

    res.json({ success: true, item });
  } catch (error: any) {
    console.warn('Watchlist add falling back to memory:', error.message);
    const { symbol, name, market, targetBuyPrice, targetSellPrice, notes } = req.body;
    const userId = req.user ? req.user.uid : 'guest';
    const newItem: MemoryWatchlistItem = {
      id: nextWatchlistId++,
      userId,
      symbol,
      name,
      market: market || 'TWSE',
      targetBuyPrice: targetBuyPrice ? String(targetBuyPrice) : null,
      targetSellPrice: targetSellPrice ? String(targetSellPrice) : null,
      notes: notes || null,
      createdAt: new Date(),
    };
    memoryWatchlists.unshift(newItem);
    res.json({ success: true, item: newItem });
  }
});

app.delete('/api/watchlist/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user ? req.user.uid : 'guest';

    if (!hasSqlDb) {
      const idx = memoryWatchlists.findIndex(w => w.id === id);
      if (idx >= 0) {
        memoryWatchlists.splice(idx, 1);
      }
      return res.json({ success: true });
    }

    await removeFromWatchlist(id, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.warn('Watchlist delete falling back to memory:', error.message);
    const id = Number(req.params.id);
    const idx = memoryWatchlists.findIndex(w => w.id === id);
    if (idx >= 0) {
      memoryWatchlists.splice(idx, 1);
    }
    res.json({ success: true });
  }
});

// 6. Backtest History API
app.get('/api/backtests', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user ? req.user.uid : 'guest';

    if (!hasSqlDb) {
      const records = memoryBacktests.filter(b => b.userId === userId || userId === 'guest');
      return res.json(records);
    }

    if (!req.user) {
      return res.json([]);
    }
    const records = await getUserBacktests(req.user.uid);
    res.json(records);
  } catch (error: any) {
    console.warn('Backtest fetch falling back to memory:', error.message);
    const userId = req.user ? req.user.uid : 'guest';
    const records = memoryBacktests.filter(b => b.userId === userId || userId === 'guest');
    res.json(records);
  }
});

app.post('/api/backtests', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user ? req.user.uid : 'guest';
    const {
      symbol,
      stockName,
      strategyName,
      parameters,
      dateRange,
      totalTrades,
      winRate,
      totalReturn,
      expectancy,
      profitFactor,
      maxDrawdown,
      tradesSummary,
    } = req.body;

    if (!hasSqlDb) {
      const newRecord = {
        id: nextBacktestId++,
        userId,
        symbol,
        stockName,
        strategyName,
        parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
        dateRange,
        totalTrades: Number(totalTrades),
        winRate: String(winRate),
        totalReturn: String(totalReturn),
        expectancy: String(expectancy),
        profitFactor: String(profitFactor),
        maxDrawdown: String(maxDrawdown),
        tradesSummary: typeof tradesSummary === 'string' ? tradesSummary : JSON.stringify(tradesSummary),
        createdAt: new Date(),
      };
      memoryBacktests.unshift(newRecord);
      return res.json({ success: true, record: newRecord });
    }

    const record = await saveBacktestRecord({
      userId,
      symbol,
      stockName,
      strategyName,
      parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
      dateRange,
      totalTrades: Number(totalTrades),
      winRate: String(winRate),
      totalReturn: String(totalReturn),
      expectancy: String(expectancy),
      profitFactor: String(profitFactor),
      maxDrawdown: String(maxDrawdown),
      tradesSummary: typeof tradesSummary === 'string' ? tradesSummary : JSON.stringify(tradesSummary),
    });

    res.json({ success: true, record });
  } catch (error: any) {
    console.warn('Save backtest falling back to memory:', error.message);
    const userId = req.user ? req.user.uid : 'guest';
    const newRecord = {
      id: nextBacktestId++,
      userId,
      ...req.body,
      createdAt: new Date(),
    };
    memoryBacktests.unshift(newRecord);
    res.json({ success: true, record: newRecord });
  }
});

app.delete('/api/backtests/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user ? req.user.uid : 'guest';

    if (!hasSqlDb) {
      const idx = memoryBacktests.findIndex(b => b.id === id);
      if (idx >= 0) {
        memoryBacktests.splice(idx, 1);
      }
      return res.json({ success: true });
    }

    await deleteBacktestRecord(id, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.warn('Delete backtest falling back to memory:', error.message);
    const id = Number(req.params.id);
    const idx = memoryBacktests.findIndex(b => b.id === id);
    if (idx >= 0) {
      memoryBacktests.splice(idx, 1);
    }
    res.json({ success: true });
  }
});

// Vite Middleware for Frontend serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
