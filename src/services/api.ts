import { auth } from '../lib/firebase.ts';
import { StockQuote, CandleData, WatchlistItem } from '../types/stock.ts';
import { TaiwanStockInfo } from '../data/taiwanStocks.ts';

async function getAuthHeader(): Promise<Record<string, string>> {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.error('Failed to get auth token', e);
    }
  }
  return {};
}

export async function searchStocks(query: string): Promise<TaiwanStockInfo[]> {
  try {
    const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return await res.json();
  } catch (error) {
    console.error('searchStocks error:', error);
    return [];
  }
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/quote`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `無法取得 ${symbol} 行情`);
  }
  return await res.json();
}

export interface HistoryResponse {
  symbol: string;
  name: string;
  market: string;
  range: string;
  interval: string;
  candles: CandleData[];
}

export async function fetchStockHistory(
  symbol: string,
  range: string = '1y',
  interval: string = '1d'
): Promise<HistoryResponse> {
  const res = await fetch(
    `/api/stocks/${encodeURIComponent(symbol)}/history?range=${range}&interval=${interval}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `無法取得 ${symbol} 歷史 K 線數據`);
  }
  return await res.json();
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

export async function fetchBatchCandles(symbols: string[]): Promise<Record<string, BatchCandlesItem>> {
  if (!symbols || symbols.length === 0) return {};
  try {
    const res = await fetch('/api/stocks/batch-candles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    if (!res.ok) throw new Error('Batch candles failed');
    return await res.json();
  } catch (e) {
    console.error('fetchBatchCandles error:', e);
    return {};
  }
}

// Watchlist API with local storage backup
const LOCAL_WATCHLIST_KEY = 'taiwan_stocks_pro_watchlist';
const LOCAL_BACKTESTS_KEY = 'taiwan_stocks_pro_backtests';

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch('/api/watchlist', {
      headers: { ...authHeader },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(data));
        } catch (_) {}
        return data;
      }
    }
  } catch (e) {
    console.warn('Network getWatchlist failed, checking local backup:', e);
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  return [];
}

export async function addWatchlist(item: {
  symbol: string;
  name: string;
  market?: string;
  targetBuyPrice?: string;
  targetSellPrice?: string;
  notes?: string;
}): Promise<any> {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Network addWatchlist failed, updating local:', e);
  }

  // Local fallback
  const localItem: WatchlistItem = {
    id: Date.now(),
    userId: 'guest',
    symbol: item.symbol,
    name: item.name,
    market: item.market || 'TWSE',
    targetBuyPrice: item.targetBuyPrice || null,
    targetSellPrice: item.targetSellPrice || null,
    notes: item.notes || null,
  };
  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    const list: WatchlistItem[] = cached ? JSON.parse(cached) : [];
    const updated = [localItem, ...list.filter(w => w.symbol !== localItem.symbol)];
    localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(updated));
  } catch (_) {}

  return { success: true, item: localItem };
}

export async function deleteWatchlist(id: number): Promise<void> {
  const authHeader = await getAuthHeader();
  try {
    await fetch(`/api/watchlist/${id}`, {
      method: 'DELETE',
      headers: { ...authHeader },
    });
  } catch (e) {
    console.warn('deleteWatchlist network failed:', e);
  }

  try {
    const cached = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (cached) {
      const list: WatchlistItem[] = JSON.parse(cached);
      const filtered = list.filter(w => w.id !== id);
      localStorage.setItem(LOCAL_WATCHLIST_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}
}

// Backtest Records API with local storage backup
export async function getBacktestRecords(): Promise<any[]> {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch('/api/backtests', {
      headers: { ...authHeader },
    });
    if (res.ok) {
      const records = await res.json();
      if (Array.isArray(records) && records.length > 0) {
        try {
          localStorage.setItem(LOCAL_BACKTESTS_KEY, JSON.stringify(records));
        } catch (_) {}
        return records;
      }
    }
  } catch (e) {
    console.warn('Network getBacktestRecords failed:', e);
  }

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
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch('/api/backtests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      return result;
    }
  } catch (e) {
    console.warn('Network saveBacktest failed, writing to local:', e);
  }

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
  const authHeader = await getAuthHeader();
  try {
    await fetch(`/api/backtests/${id}`, {
      method: 'DELETE',
      headers: { ...authHeader },
    });
  } catch (e) {
    console.warn('deleteBacktest network failed:', e);
  }

  try {
    const cached = localStorage.getItem(LOCAL_BACKTESTS_KEY);
    if (cached) {
      const list = JSON.parse(cached);
      const filtered = list.filter((b: any) => b.id !== id);
      localStorage.setItem(LOCAL_BACKTESTS_KEY, JSON.stringify(filtered));
    }
  } catch (_) {}
}

export async function syncUserProfile(): Promise<void> {
  const authHeader = await getAuthHeader();
  if (auth.currentUser) {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({
        displayName: auth.currentUser.displayName,
      }),
    });
  }
}
