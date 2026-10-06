import express, { Request, Response } from 'express';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { POPULAR_TAIWAN_STOCKS, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { calculateIndicators } from '../utils/indicators.ts';
import { CandleData } from '../types/stock.ts';
import { generateFallbackCandles, generateFallbackQuote } from '../services/clientStockFallback.ts';

dotenv.config();

export const app = express();

app.use(express.json());

// CORS & Path normalization for Vercel Serverless
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  // If Vercel stripped `/api` prefix, normalize it so routes match
  if (!req.url.startsWith('/api') && (req.url.startsWith('/stocks') || req.url.startsWith('/watchlist') || req.url.startsWith('/backtests'))) {
    req.url = '/api' + req.url;
  }
  next();
});

const yahooFinance = new YahooFinance();

// In-memory cache for historical candles to ensure instant responsiveness & reduce Yahoo rate-limits
interface CachedCandles {
  timestamp: number;
  candles: CandleData[];
}
const candleCache = new Map<string, CachedCandles>();

/**
 * Fetch historical candles directly from Yahoo Finance with indicator calculations
 */
async function fetchCandlesFromYahoo(rawSymbol: string, range = '2y', interval = '1d'): Promise<CandleData[]> {
  const resolved = resolveTaiwanSymbol(rawSymbol);
  const primarySymbol = resolved.symbol;

  // Build candidate list with market suffix auto-fallback (.TW <-> .TWO)
  const symbolsToTry = [primarySymbol];
  if (primarySymbol.endsWith('.TW')) {
    symbolsToTry.push(primarySymbol.replace(/\.TW$/, '.TWO'));
  } else if (primarySymbol.endsWith('.TWO')) {
    symbolsToTry.push(primarySymbol.replace(/\.TWO$/, '.TW'));
  }

  for (const targetSymbol of symbolsToTry) {
    // Extra safety: Check if ticker is valid format (e.g. 2330.TW, 00631L.TW, 00708L.TW, 6412.TW, 3324.TWO)
    if (!targetSymbol || /[^\x00-\x7F]/.test(targetSymbol) || !/^[0-9]{4,6}[A-Z]?\.TW(O)?$/i.test(targetSymbol)) {
      continue;
    }

    const cacheKey = `${targetSymbol}:${range}:${interval}`;
    const cached = candleCache.get(cacheKey);
    // Cache for 5 minutes
    if (cached && Date.now() - cached.timestamp < 300000 && cached.candles.length > 0) {
      return cached.candles;
    }

    try {
      const now = new Date();
      let startDate = new Date();
      if (range === '1mo') startDate.setMonth(now.getMonth() - 1);
      else if (range === '3mo') startDate.setMonth(now.getMonth() - 3);
      else if (range === '6mo') startDate.setMonth(now.getMonth() - 6);
      else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);
      else if (range === '5y') startDate.setFullYear(now.getFullYear() - 5);
      else startDate.setFullYear(now.getFullYear() - 2);

      const period1Str = startDate.toISOString().split('T')[0];
      const chartRes = await Promise.race([
        yahooFinance.chart(targetSymbol, {
          period1: period1Str,
          interval: interval as any,
        }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Yahoo Finance timeout')), 6000)),
      ]);

      if (!chartRes || !chartRes.quotes || chartRes.quotes.length === 0) {
        continue;
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

      if (rawCandles.length === 0) {
        continue;
      }

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
    } catch {
      // Try next market candidate (e.g. .TWO if .TW failed)
    }
  }

  // Return empty array when Yahoo has no historical data so the app can display "未能獲得走勢"
  return [];
}

// 1. Search Taiwan stocks
app.get('/api/stocks/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json(POPULAR_TAIWAN_STOCKS.slice(0, 15));
  }
  const filtered = POPULAR_TAIWAN_STOCKS.filter(
    s => s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query) || s.symbol.toLowerCase().includes(query) || s.aliases?.some(a => a.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    const resolved = resolveTaiwanSymbol(query);
    return res.json([
      {
        code: resolved.symbol.replace(/\.TW(O)?/, ''),
        name: resolved.name,
        symbol: resolved.symbol,
        market: resolved.market,
        category: '自選個股',
      },
    ]);
  }
  res.json(filtered);
});

// 2. Real-time quote for a stock directly from Yahoo Finance
app.get('/api/stocks/:symbol/quote', async (req: Request, res: Response) => {
  try {
    const symbolParam = req.params.symbol;
    const resolved = resolveTaiwanSymbol(symbolParam);
    const primarySymbol = resolved.symbol;

    const symbolsToTry = [primarySymbol];
    if (primarySymbol.endsWith('.TW')) {
      symbolsToTry.push(primarySymbol.replace(/\.TW$/, '.TWO'));
    } else if (primarySymbol.endsWith('.TWO')) {
      symbolsToTry.push(primarySymbol.replace(/\.TWO$/, '.TW'));
    }

    let quote: any = null;
    let targetSymbol = primarySymbol;

    for (const sym of symbolsToTry) {
      if (!sym || /[^\x00-\x7F]/.test(sym) || !/^[0-9]{4,6}[A-Z]?\.TW(O)?$/i.test(sym)) {
        continue;
      }

      try {
        const q = await Promise.race([
          yahooFinance.quote(sym),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Yahoo quote timeout')), 4000)),
        ]);
        if (q && q.regularMarketPrice != null) {
          quote = q;
          targetSymbol = sym;
          break;
        }
      } catch {
        // try next candidate
      }
    }

    if (!quote || quote.regularMarketPrice == null) {
      const fallback = generateFallbackQuote(primarySymbol);
      return res.json(fallback);
    }

    const price = quote.regularMarketPrice ?? 0;
    const prevClose = quote.regularMarketPreviousClose ?? price;
    const change = quote.regularMarketChange ?? Number((price - prevClose).toFixed(2));
    const changePercent = quote.regularMarketChangePercent ?? (prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0);

    const displayName = resolved.name && resolved.name !== targetSymbol && resolved.name !== targetSymbol.replace(/\.TW(O)?/i, '')
      ? resolved.name
      : (quote.shortName || quote.longName || resolved.name);

    res.json({
      symbol: targetSymbol,
      name: displayName,
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
  } catch {
    const fallback = generateFallbackQuote(req.params.symbol);
    res.json(fallback);
  }
});

// 3. Historical K-line candlestick chart data from Yahoo Finance
app.get('/api/stocks/:symbol/history', async (req: Request, res: Response) => {
  try {
    const symbolParam = req.params.symbol;
    const resolved = resolveTaiwanSymbol(symbolParam);
    const targetSymbol = resolved.symbol;
    const range = (req.query.range as string) || '2y';
    const interval = ((req.query.interval as string) || '1d') as '1d' | '1wk' | '1mo';

    const candlesWithIndicators = await fetchCandlesFromYahoo(targetSymbol, range, interval);

    if (!candlesWithIndicators || candlesWithIndicators.length === 0) {
      return res.json({
        symbol: targetSymbol,
        name: resolved.name,
        market: resolved.market,
        range,
        interval,
        candles: [],
        error: '未能獲得走勢',
      });
    }

    res.json({
      symbol: targetSymbol,
      name: resolved.name,
      market: resolved.market,
      range,
      interval,
      candles: candlesWithIndicators,
    });
  } catch {
    const resolved = resolveTaiwanSymbol(req.params.symbol);
    res.json({
      symbol: resolved.symbol,
      name: resolved.name,
      market: resolved.market,
      range: req.query.range || '2y',
      interval: req.query.interval || '1d',
      candles: [],
      error: '未能獲得走勢',
    });
  }
});

// 4. Batch Candles and Quotes for Watchlist
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
          const candles = await fetchCandlesFromYahoo(resolved.symbol, '1y', '1d');
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
        } catch {
          // Gracefully continue with remaining symbols
        }
      })
    );

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Batch Quotes for Real-Time Valuation & Market Cards
app.post('/api/stocks/batch-quotes', async (req: Request, res: Response) => {
  try {
    const symbols = req.body.symbols as string[];
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.json({});
    }

    const resolvedMap = new Map<string, { symbol: string; name: string }>();
    symbols.forEach(s => {
      const r = resolveTaiwanSymbol(s);
      resolvedMap.set(s, r);
    });

    const uniqueSymbols = Array.from(new Set(Array.from(resolvedMap.values()).map(r => r.symbol)));

    let rawQuotes: any[] = [];
    try {
      rawQuotes = await Promise.race([
        yahooFinance.quote(uniqueSymbols),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Yahoo batch quote timeout')), 6000)),
      ]);
    } catch {
      // Gracefully continue with fallback
    }

    const quoteMap = new Map<string, any>();
    if (Array.isArray(rawQuotes)) {
      rawQuotes.forEach(q => {
        if (q && q.symbol) {
          quoteMap.set(q.symbol, q);
        }
      });
    }

    const results: Record<string, {
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      open?: number;
      high?: number;
      low?: number;
      volume?: number;
      peRatio?: number;
      timestamp: number;
    }> = {};

    symbols.forEach(rawSym => {
      const resolved = resolvedMap.get(rawSym) || resolveTaiwanSymbol(rawSym);
      const q = quoteMap.get(resolved.symbol);
      if (q && q.regularMarketPrice != null) {
        const price = Number(q.regularMarketPrice.toFixed(2));
        const prevClose = q.regularMarketPreviousClose ?? price;
        const change = q.regularMarketChange != null ? Number(q.regularMarketChange.toFixed(2)) : Number((price - prevClose).toFixed(2));
        const changePercent = q.regularMarketChangePercent != null
          ? Number(q.regularMarketChangePercent.toFixed(2))
          : (prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0);

        results[rawSym] = {
          symbol: resolved.symbol,
          name: resolved.name,
          price,
          change,
          changePercent,
          open: q.regularMarketOpen,
          high: q.regularMarketDayHigh,
          low: q.regularMarketDayLow,
          volume: q.regularMarketVolume,
          peRatio: q.trailingPE,
          timestamp: Date.now(),
        };
      } else {
        const fallback = generateFallbackQuote(resolved.symbol);
        results[rawSym] = {
          symbol: resolved.symbol,
          name: resolved.name,
          price: fallback.price,
          change: fallback.change,
          changePercent: fallback.changePercent,
          timestamp: Date.now(),
        };
      }
    });

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. Watchlist API (In-memory fallback for high-speed local persistence)
interface MemoryWatchlistItem {
  id: number;
  userId: string;
  symbol: string;
  name: string;
  market: string;
  targetBuyPrice: string | null;
  targetSellPrice: string | null;
  notes: string | null;
  createdAt: string;
}

let nextWatchlistId = 100;
const memoryWatchlists: MemoryWatchlistItem[] = POPULAR_TAIWAN_STOCKS.slice(0, 6).map((item, idx) => ({
  id: idx + 1,
  userId: 'local',
  symbol: item.symbol,
  name: item.name,
  market: item.market,
  targetBuyPrice: null,
  targetSellPrice: null,
  notes: `${item.category} 核心標的`,
  createdAt: new Date().toISOString(),
}));

app.get('/api/watchlist', (_req: Request, res: Response) => {
  res.json(memoryWatchlists);
});

app.post('/api/watchlist', (req: Request, res: Response) => {
  const { symbol, name, market, targetBuyPrice, targetSellPrice, notes } = req.body;
  if (!symbol || !name) {
    return res.status(400).json({ error: '股票代號與名稱為必填' });
  }
  const existingIdx = memoryWatchlists.findIndex(w => w.symbol === symbol);
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
    userId: 'local',
    symbol,
    name,
    market: market || 'TWSE',
    targetBuyPrice: targetBuyPrice ? String(targetBuyPrice) : null,
    targetSellPrice: targetSellPrice ? String(targetSellPrice) : null,
    notes: notes || null,
    createdAt: new Date().toISOString(),
  };
  memoryWatchlists.unshift(newItem);
  res.json({ success: true, item: newItem });
});

app.delete('/api/watchlist/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = memoryWatchlists.findIndex(w => w.id === id);
  if (idx >= 0) {
    memoryWatchlists.splice(idx, 1);
  }
  res.json({ success: true });
});

// 7. Backtest History API
let nextBacktestId = 1;
const memoryBacktests: any[] = [];

app.get('/api/backtests', (_req: Request, res: Response) => {
  res.json(memoryBacktests);
});

app.post('/api/backtests', (req: Request, res: Response) => {
  const newRecord = {
    id: nextBacktestId++,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  memoryBacktests.unshift(newRecord);
  res.json({ success: true, record: newRecord });
});

app.delete('/api/backtests/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = memoryBacktests.findIndex(b => b.id === id);
  if (idx >= 0) {
    memoryBacktests.splice(idx, 1);
  }
  res.json({ success: true });
});

// 8. Auth sync compatibility
app.post('/api/auth/sync', (req: Request, res: Response) => {
  res.json({ success: true, user: req.body });
});
