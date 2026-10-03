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
async function fetchCandlesFromYahoo(targetSymbol: string, range = '2y', interval = '1d'): Promise<CandleData[]> {
  const cacheKey = `${targetSymbol}:${range}:${interval}`;
  const cached = candleCache.get(cacheKey);
  // Cache for 5 minutes
  if (cached && Date.now() - cached.timestamp < 300000) {
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
      throw new Error(`找不到 ${targetSymbol} 的歷史數據`);
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
  } catch (err: any) {
    console.warn(`Yahoo historical chart query for ${targetSymbol} failed or timed out:`, err.message);
    const fallback = generateFallbackCandles(targetSymbol, range);
    candleCache.set(cacheKey, { timestamp: Date.now(), candles: fallback });
    return fallback;
  }
}

// 1. Search Taiwan stocks
app.get('/api/stocks/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json(POPULAR_TAIWAN_STOCKS.slice(0, 15));
  }
  const filtered = POPULAR_TAIWAN_STOCKS.filter(
    s => s.code.includes(query) || s.name.toLowerCase().includes(query) || s.symbol.toLowerCase().includes(query)
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
    const targetSymbol = resolved.symbol;

    let quote: any = null;
    try {
      quote = await Promise.race([
        yahooFinance.quote(targetSymbol),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Yahoo quote timeout')), 4000)),
      ]);
    } catch (err: any) {
      console.warn(`Yahoo quote error for ${targetSymbol}:`, err.message);
    }

    if (!quote) {
      const fallback = generateFallbackQuote(targetSymbol);
      return res.json(fallback);
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
    console.warn('Quote error handled with fallback:', error);
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

    res.json({
      symbol: targetSymbol,
      name: resolved.name,
      market: resolved.market,
      range,
      interval,
      candles: candlesWithIndicators,
    });
  } catch (error: any) {
    console.warn('Historical chart fetch handled with fallback:', error);
    const resolved = resolveTaiwanSymbol(req.params.symbol);
    const fallback = generateFallbackCandles(req.params.symbol, (req.query.range as string) || '2y');
    res.json({
      symbol: resolved.symbol,
      name: resolved.name,
      market: resolved.market,
      range: req.query.range || '2y',
      interval: req.query.interval || '1d',
      candles: fallback,
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
