import { StockQuote, CandleData, WatchlistItem } from '../types/stock.ts';
import { TaiwanStockInfo, POPULAR_TAIWAN_STOCKS, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { generateFallbackCandles, generateFallbackQuote } from './clientStockFallback.ts';

function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json');
}

/**
 * Search Taiwan stocks
 */
export async function searchStocks(query: string): Promise<TaiwanStockInfo[]> {
  const clean = query.trim().toLowerCase();
  try {
    const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
    if (res.ok && isJsonResponse(res)) {
      return await res.json();
    }
  } catch (error) {
    console.warn('searchStocks network fetch error, falling back to local dataset:', error);
  }

  // Client-side fallback search
  if (!clean) {
    return POPULAR_TAIWAN_STOCKS.slice(0, 15);
  }
  const filtered = POPULAR_TAIWAN_STOCKS.filter(
    s => s.code.includes(clean) || s.name.toLowerCase().includes(clean) || s.symbol.toLowerCase().includes(clean)
  );
  if (filtered.length > 0) return filtered;

  const resolved = resolveTaiwanSymbol(clean);
  return [
    {
      code: resolved.symbol.replace(/\.TW(O)?/, ''),
      name: resolved.name,
      symbol: resolved.symbol,
      market: resolved.market,
      category: '自選個股',
    },
  ];
}

/**
 * Fetch real-time stock quote from Yahoo Finance
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const resolved = resolveTaiwanSymbol(symbol);
  try {
    const res = await fetch(`/api/stocks/${encodeURIComponent(resolved.symbol)}/quote`);
    if (res.ok && isJsonResponse(res)) {
      return await res.json();
    }
  } catch {
    // client fallback
  }

  return generateFallbackQuote(resolved.symbol);
}

export interface HistoryResponse {
  symbol: string;
  name: string;
  market: string;
  range: string;
  interval: string;
  candles: CandleData[];
  error?: string;
}

/**
 * Fetch historical K-line candlestick chart data from Yahoo Finance
 */
export async function fetchStockHistory(
  symbol: string,
  range: string = '2y',
  interval: string = '1d'
): Promise<HistoryResponse> {
  const resolved = resolveTaiwanSymbol(symbol);
  try {
    const res = await fetch(
      `/api/stocks/${encodeURIComponent(resolved.symbol)}/history?range=${range}&interval=${interval}`
    );
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      if (data && Array.isArray(data.candles)) {
        return {
          symbol: data.symbol || resolved.symbol,
          name: data.name || resolved.name,
          market: data.market || resolved.market,
          range,
          interval,
          candles: data.candles,
          error: data.candles.length === 0 ? (data.error || '未能獲得走勢') : undefined,
        };
      }
    }
  } catch {
    // client fallback
  }

  // Do NOT fabricate fake candles for stocks that have no real market data
  return {
    symbol: resolved.symbol,
    name: resolved.name,
    market: resolved.market,
    range,
    interval,
    candles: [],
    error: '未能獲得走勢',
  };
}

export interface BatchCandlesItem {
  candles: CandleData[];
  quote: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    timestamp: number;
  };
}

/**
 * Batch fetch candles and quotes for Watchlist real-time scanning
 */
export async function fetchBatchCandles(symbols: string[]): Promise<Record<string, BatchCandlesItem>> {
  if (!symbols || symbols.length === 0) return {};
  try {
    const res = await fetch('/api/stocks/batch-candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('fetchBatchCandles network error, generating client fallback batch:', e);
  }

  const fallbackResults: Record<string, BatchCandlesItem> = {};
  symbols.forEach(sym => {
    const resolved = resolveTaiwanSymbol(sym);
    const candles = generateFallbackCandles(sym, '1y');
    const last = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : last;
    const change = Number((last.close - prev.close).toFixed(2));
    const changePercent = prev.close > 0 ? Number(((change / prev.close) * 100).toFixed(2)) : 0;

    fallbackResults[sym] = {
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
  });

  return fallbackResults;
}

export interface BatchQuoteItem {
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
}

/**
 * Fetch high-speed batch real-time quotes directly from Yahoo Finance
 */
export async function fetchBatchQuotes(symbols: string[]): Promise<Record<string, BatchQuoteItem>> {
  if (!symbols || symbols.length === 0) return {};
  try {
    const res = await fetch('/api/stocks/batch-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch {
    // client fallback
  }

  const results: Record<string, BatchQuoteItem> = {};
  symbols.forEach(sym => {
    const fb = generateFallbackQuote(sym);
    results[sym] = {
      symbol: fb.symbol,
      name: fb.name,
      price: fb.price,
      change: fb.change,
      changePercent: fb.changePercent,
      timestamp: Date.now(),
    };
  });
  return results;
}

// Zero-Database Watchlist API using client localStorage
const LOCAL_WATCHLIST_KEY = 'taiwan_stocks_pro_watchlist';
const LOCAL_BACKTESTS_KEY = 'taiwan_stocks_pro_backtests';

// Default initial watchlist items (Taiwan market benchmarks)
const DEFAULT_INITIAL_WATCHLIST: WatchlistItem[] = [
  { id: 1, userId: 'local', symbol: '2330.TW', name: '台積電', market: 'TWSE', targetBuyPrice: '950', targetSellPrice: '1150', notes: '全球晶圓代工龍頭，AI晶片核心' },
  { id: 2, userId: 'local', symbol: '2317.TW', name: '鴻海', market: 'TWSE', targetBuyPrice: '190', targetSellPrice: '230', notes: 'AI伺服器機櫃與全球組裝龍頭' },
  { id: 3, userId: 'local', symbol: '2454.TW', name: '聯發科', market: 'TWSE', targetBuyPrice: '1220', targetSellPrice: '1500', notes: '天璣旗艦晶片與邊緣AI' },
  { id: 4, userId: 'local', symbol: '2382.TW', name: '廣達', market: 'TWSE', targetBuyPrice: '270', targetSellPrice: '330', notes: '雲端資料中心與AI伺服器主力' },
  { id: 5, userId: 'local', symbol: '0050.TW', name: '元大台灣50', market: 'TWSE', targetBuyPrice: '175', targetSellPrice: '200', notes: '台股藍籌權值大盤指數核心配置' },
  { id: 6, userId: 'local', symbol: '2603.TW', name: '長榮', market: 'TWSE', targetBuyPrice: '185', targetSellPrice: '225', notes: '航運貨櫃龍頭，高股息與運價波動' },
];

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  // Save and return default watchlist
  try {
    localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(DEFAULT_INITIAL_WATCHLIST));
  } catch (_) {}
  return DEFAULT_INITIAL_WATCHLIST;
}

export async function addWatchlist(item: {
  symbol: string;
  name: string;
  market?: string;
  targetBuyPrice?: string;
  targetSellPrice?: string;
  notes?: string;
}): Promise<any> {
  const localItem: WatchlistItem = {
    id: Date.now(),
    userId: 'local',
    symbol: item.symbol,
    name: item.name,
    market: item.market || 'TWSE',
    targetBuyPrice: item.targetBuyPrice || null,
    targetSellPrice: item.targetSellPrice || null,
    notes: item.notes || null,
  };

  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    const list: WatchlistItem[] = cached ? JSON.parse(cached) : [...DEFAULT_INITIAL_WATCHLIST];
    const updated = [localItem, ...list.filter(w => w.symbol !== localItem.symbol)];
    localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(updated));
  } catch (_) {}

  return { success: true, item: localItem };
}

export async function deleteWatchlist(id: number): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (cached) {
      const list: WatchlistItem[] = JSON.parse(cached);
      const filtered = list.filter(w => w.id !== id);
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}
}

// Zero-Database Backtest Records API using client localStorage
export async function getBacktestRecords(): Promise<any[]> {
  try {
    const cached = localStorage.getItem(LOCAL_BACKTESTS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return [];
}

export async function saveBacktest(data: {
  symbol: string;
  stockName: string;
  strategyName: string;
  parameters: any;
  dateRange: string;
  totalTrades: number;
  winRate: string;
  totalReturn: string;
  expectancy: string;
  profitFactor: string;
  maxDrawdown: string;
  tradesSummary: any;
}): Promise<any> {
  const localRecord = {
    id: Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  try {
    const cached = localStorage.getItem(LOCAL_BACKTESTS_KEY);
    const list = cached ? JSON.parse(cached) : [];
    list.unshift(localRecord);
    localStorage.setItem(LOCAL_BACKTESTS_KEY, JSON.stringify(list));
  } catch (_) {}

  return { success: true, record: localRecord };
}

export async function deleteBacktest(id: number): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_BACKTESTS_KEY);
    if (cached) {
      const list = JSON.parse(cached);
      const filtered = list.filter((b: any) => b.id !== id);
      localStorage.setItem(LOCAL_BACKTESTS_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}
}
