import express, { Request, Response } from 'express';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { POPULAR_TAIWAN_STOCKS, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { calculateIndicators } from '../utils/indicators.ts';
import { CandleData } from '../types/stock.ts';
import { generateFallbackCandles, generateFallbackQuote } from '../services/clientStockFallback.ts';
import { calculateMarketFinancialProgress } from '../utils/marketFinancialCalendar.ts';
import { TAIWAN_TECH_STOCKS_DATABASE } from '../data/techFinancialsData.ts';
import { GoogleGenAI } from '@google/genai';
import {
  generateAnalystStockAnalysis,
  generateAllStocksAnalystAnalysis,
} from '../utils/aiFinancialAnalystEngine.ts';
import { AiStockFinancialAnalysis } from '../types/aiFinancialAnalysis.ts';

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
 * Fetch historical candles directly from Yahoo Finance with indicator calculations and real-time quote stitching
 */
async function fetchCandlesFromYahoo(
  rawSymbol: string,
  range = '2y',
  interval = '1d',
  bypassCache = false
): Promise<CandleData[]> {
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
    // Cache for 20 seconds for real-time responsiveness, or skip if bypassCache requested
    if (!bypassCache && cached && Date.now() - cached.timestamp < 20000 && cached.candles.length > 0) {
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

      // 即時同步：嘗試獲取 Yahoo Finance 最新即時盤中報價，無縫縫合至最後一根 K 線，確保回測與即時行情絕對準確
      try {
        const liveQ = await Promise.race([
          yahooFinance.quote(targetSymbol),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Live quote timeout')), 2500)),
        ]);
        if (liveQ && liveQ.regularMarketPrice != null && uniqueCandles.length > 0) {
          const lastCandle = uniqueCandles[uniqueCandles.length - 1];
          const livePrice = Number(liveQ.regularMarketPrice.toFixed(2));
          lastCandle.close = livePrice;
          if (liveQ.regularMarketDayHigh != null) {
            lastCandle.high = Math.max(lastCandle.high, liveQ.regularMarketDayHigh);
          }
          if (liveQ.regularMarketDayLow != null) {
            lastCandle.low = Math.min(lastCandle.low, liveQ.regularMarketDayLow);
          }
          if (liveQ.regularMarketVolume != null && liveQ.regularMarketVolume > 0) {
            lastCandle.volume = Math.max(lastCandle.volume, liveQ.regularMarketVolume);
          }
        }
      } catch (_) {
        // Continue with chart candles
      }

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
    const bypassCache = req.query.refresh === 'true';

    const candlesWithIndicators = await fetchCandlesFromYahoo(targetSymbol, range, interval, bypassCache);

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

// 6. Real-Time Tech Stocks Financial Summary & Market Reporting Calendar Sync
app.get('/api/stocks/financials/tech-summary', async (_req: Request, res: Response) => {
  try {
    const progress = calculateMarketFinancialProgress(new Date());
    const symbols = TAIWAN_TECH_STOCKS_DATABASE.map(s => s.symbol);

    const resolvedMap = new Map<string, { symbol: string; name: string }>();
    symbols.forEach(s => {
      resolvedMap.set(s, resolveTaiwanSymbol(s));
    });

    const uniqueSymbols = Array.from(new Set(Array.from(resolvedMap.values()).map(r => r.symbol)));
    let rawQuotes: any[] = [];
    try {
      rawQuotes = await Promise.race([
        yahooFinance.quote(uniqueSymbols),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Yahoo batch quote timeout')), 5000)),
      ]);
    } catch {
      // fallback
    }

    const quoteMap = new Map<string, any>();
    if (Array.isArray(rawQuotes)) {
      rawQuotes.forEach(q => {
        if (q && q.symbol) quoteMap.set(q.symbol, q);
      });
    }

    const quotes: Record<string, any> = {};
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
        quotes[rawSym] = {
          symbol: resolved.symbol,
          name: resolved.name,
          price,
          change,
          changePercent,
          peRatio: q.trailingPE,
          timestamp: Date.now(),
        };
      } else {
        const fallback = generateFallbackQuote(resolved.symbol);
        quotes[rawSym] = {
          symbol: resolved.symbol,
          name: resolved.name,
          price: fallback.price,
          change: fallback.change,
          changePercent: fallback.changePercent,
          timestamp: Date.now(),
        };
      }
    });

    res.json({
      progress,
      quotes,
      timestamp: Date.now(),
      status: 'synchronized',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 8. AI Agent 專業財報分析師推算 API (Gemini-3.8-flash + Analyst Engine)
const aiAnalysisCache = new Map<string, { data: AiStockFinancialAnalysis; timestamp: number }>();

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 8.1 單一標的 AI Agent 深入推算 (獲利能力、資產報酬率、營收增長率、負債健康度、產業競爭力、未來風險)
app.post('/api/ai/financial-analysis', async (req: Request, res: Response) => {
  try {
    const { symbol: rawSymbol, forceRefresh } = req.body;
    if (!rawSymbol) {
      return res.status(400).json({ error: '請提供股票代號或 Symbol' });
    }

    const resolved = resolveTaiwanSymbol(rawSymbol);
    const stock = TAIWAN_TECH_STOCKS_DATABASE.find(
      s => s.symbol === resolved.symbol || s.code === resolved.symbol.replace(/\.TW(O)?/, '')
    ) || {
      code: resolved.symbol.replace(/\.TW(O)?/, ''),
      name: resolved.name,
      symbol: resolved.symbol,
      sector: '晶圓代工' as const,
      subCategory: '科技核心標的',
      currentPrice: 100,
      change: 0,
      changePercent: 0,
      ttmEps: 5,
      currentPe: 20,
      peLow: 15,
      peMid: 20,
      peHigh: 25,
      expectedGrowthRate: 15,
      revenueMom: 2,
      revenueLatestYoY: 15,
      description: '台股關鍵科技供應鏈個股。',
      catalyst: '終端產業升級與全球科技需求。',
      quarters: [],
    };

    const peers = TAIWAN_TECH_STOCKS_DATABASE.filter(s => s.sector === stock.sector);

    // 檢查快取 (15 分鐘快取，除非 forceRefresh)
    const cached = aiAnalysisCache.get(stock.symbol);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 900000) {
      return res.json({ analysis: cached.data, cached: true });
    }

    // 基礎分析師推算模型 (高保證備援)
    const baseAnalysis = generateAnalystStockAnalysis(stock, peers);

    const ai = getGeminiClient();
    if (!ai) {
      // 若未配置 GEMINI_API_KEY，直接使用內建頂級操盤分析師模型
      aiAnalysisCache.set(stock.symbol, { data: baseAnalysis, timestamp: Date.now() });
      return res.json({ analysis: baseAnalysis, cached: false, provider: 'analyst_engine' });
    }

    // 透過 Gemini-3.8-flash 模型深入推算
    try {
      const quartersSummary = (stock.quarters || []).slice(0, 4).map(q => ({
        quarter: q.quarter,
        revenueYoY: `${q.revenueYoY}%`,
        grossMargin: `${q.grossMargin}%`,
        operatingMargin: `${q.operatingMargin}%`,
        roe: `${q.roe}%`,
        roic: `${q.roic}%`,
        debtRatio: `${q.debtRatio}%`,
        fcf: `${q.freeCashFlow}億`,
        eps: q.eps,
      }));

      const peerNames = peers.map(p => `${p.name}(${p.code}, 毛利${p.quarters[0]?.grossMargin}%, ROE${p.quarters[0]?.roe}%)`).join('、');

      const prompt = `你是一位華爾街與台北頂級避險基金的首席科技股財報分析師兼資深操盤手。
請針對以下台灣科技股的最新財務數據進行專業深度研判：

【分析標的】: ${stock.name} (${stock.code}, ${stock.symbol})
【所屬產業板塊】: ${stock.sector} (${stock.subCategory})
【現價/漲跌】: 現價 ${stock.currentPrice} 元 (漲跌幅 ${stock.changePercent}%)
【TTM EPS / 次年預估獲利增長率】: TTM EPS ${stock.ttmEps} 元，預期成長 +${stock.expectedGrowthRate}%
【最新單月營收動能】: 月增率 ${stock.revenueMom}%，年增率 ${stock.revenueLatestYoY}%
【最近 4 季關鍵財報序列】:
${JSON.stringify(quartersSummary, null, 2)}
【同板塊主要競爭同儕】:
${peerNames}

請嚴格以繁體中文，評估以下面向並產出 JSON 格式：
1. 獲利能力 (毛利率、營益率品質、附加價值)
2. 資產報酬率 (ROA/ROE/ROIC 資本配置效益)
3. 營收增長率 (動能趨勢與可持續性)
4. 負債健康度 (負債比率、自由現金流、財務安全性)
5. 產業橫向競爭力判斷 (與同業對比之護城河、產能定價權、競爭力評級: TOP_TIER 或 STRONG_MOAT 或 PEER_AVERAGE 或 LAGGING)
6. 未來三大具體關鍵風險 (實質風險因子供操盤手監控)
7. 操盤手綜合立場 (CORE_ALLOCATION 或 BUY_ON_DIP 或 NEUTRAL_WATCH 或 DEFENSIVE_AVOID)

請只輸出以下合法 JSON 物件，不要有 markdown 以外的雜訊：
{
  "competitivenessRating": "TOP_TIER" | "STRONG_MOAT" | "PEER_AVERAGE" | "LAGGING",
  "competitivenessLabel": "字串，例如 產業頂級統治力 或 領先強勢競爭力",
  "competitivenessScore": 85,
  "competitivenessMoat": "1-2句核心護城河精闢總結",
  "profitabilityScore": 90,
  "profitabilityAnalysis": "2-3句深度解析獲利能力",
  "assetReturnScore": 88,
  "assetReturnAnalysis": "2-3句深度解析ROA/ROE/ROIC資本回報",
  "revenueGrowthScore": 86,
  "revenueGrowthAnalysis": "2-3句深度解析營收成長動能",
  "debtHealthScore": 85,
  "debtHealthStatus": "EXCELLENT" | "HEALTHY" | "MODERATE" | "CAUTION",
  "debtHealthAnalysis": "2-3句深度解析負債與現金流健康度",
  "futureRisks": ["風險1具體描述", "風險2具體描述", "風險3具體描述"],
  "riskWarningSign": "操盤手核心監控警戒指標",
  "traderVerdict": "CORE_ALLOCATION" | "BUY_ON_DIP" | "NEUTRAL_WATCH" | "DEFENSIVE_AVOID",
  "traderVerdictLabel": "核心強勢配置 或 逢低戰略布局 等",
  "traderSummary": "2-3句頂級操盤手實戰總結建議"
}`;

      const aiResponse = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6500)
        ),
      ]);

      const text = aiResponse.text || '';
      const parsed = JSON.parse(text);

      const enrichedAnalysis: AiStockFinancialAnalysis = {
        ...baseAnalysis,
        competitivenessRating: parsed.competitivenessRating || baseAnalysis.competitivenessRating,
        competitivenessLabel: parsed.competitivenessLabel || baseAnalysis.competitivenessLabel,
        competitivenessScore: Number(parsed.competitivenessScore) || baseAnalysis.competitivenessScore,
        competitivenessMoat: parsed.competitivenessMoat || baseAnalysis.competitivenessMoat,
        profitabilityScore: Number(parsed.profitabilityScore) || baseAnalysis.profitabilityScore,
        profitabilityAnalysis: parsed.profitabilityAnalysis || baseAnalysis.profitabilityAnalysis,
        assetReturnScore: Number(parsed.assetReturnScore) || baseAnalysis.assetReturnScore,
        assetReturnAnalysis: parsed.assetReturnAnalysis || baseAnalysis.assetReturnAnalysis,
        revenueGrowthScore: Number(parsed.revenueGrowthScore) || baseAnalysis.revenueGrowthScore,
        revenueGrowthAnalysis: parsed.revenueGrowthAnalysis || baseAnalysis.revenueGrowthAnalysis,
        debtHealthScore: Number(parsed.debtHealthScore) || baseAnalysis.debtHealthScore,
        debtHealthStatus: parsed.debtHealthStatus || baseAnalysis.debtHealthStatus,
        debtHealthAnalysis: parsed.debtHealthAnalysis || baseAnalysis.debtHealthAnalysis,
        futureRisks: Array.isArray(parsed.futureRisks) && parsed.futureRisks.length > 0 ? parsed.futureRisks : baseAnalysis.futureRisks,
        riskWarningSign: parsed.riskWarningSign || baseAnalysis.riskWarningSign,
        traderVerdict: parsed.traderVerdict || baseAnalysis.traderVerdict,
        traderVerdictLabel: parsed.traderVerdictLabel || baseAnalysis.traderVerdictLabel,
        traderSummary: parsed.traderSummary || baseAnalysis.traderSummary,
        source: 'gemini',
        generatedAt: new Date().toISOString(),
      };

      aiAnalysisCache.set(stock.symbol, { data: enrichedAnalysis, timestamp: Date.now() });
      return res.json({ analysis: enrichedAnalysis, cached: false, provider: 'gemini-3.8-flash' });
    } catch (geminiErr: any) {
      console.warn('Gemini generateContent error, falling back to base analyst engine:', geminiErr?.message);
      aiAnalysisCache.set(stock.symbol, { data: baseAnalysis, timestamp: Date.now() });
      return res.json({ analysis: baseAnalysis, cached: false, provider: 'analyst_engine_fallback' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8.2 全科技股批次推算清單 API
app.get('/api/ai/batch-analysis', async (_req: Request, res: Response) => {
  try {
    const all = generateAllStocksAnalystAnalysis();
    // 整合快取中已被 Gemini 分析的資料
    aiAnalysisCache.forEach((cached, symbol) => {
      if (all[symbol]) {
        all[symbol] = cached.data;
      }
    });
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
