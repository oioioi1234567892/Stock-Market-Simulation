/**
 * Cookie 快取儲存模組 (支援使用者勾選的自訂策略與自選投資組合股票)
 */
import { StrategyConfig, WatchlistItem, EntryCondition, ExitCondition } from '../types/stock.ts';

const STRATEGY_COOKIE_NAME = 'remix_trader_strategy';
const WATCHLIST_COOKIE_NAME = 'remix_trader_watchlist';

/**
 * 寫入 Cookie (預設保存 365 天，SameSite=Lax，全站有效)
 */
export function setCookie(name: string, value: any, days: number = 365): void {
  if (typeof document === 'undefined') return;
  try {
    const jsonStr = JSON.stringify(value);
    const encodedValue = encodeURIComponent(jsonStr);
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${encodeURIComponent(name)}=${encodedValue}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn(`[CookieStorage] Failed to set cookie "${name}":`, err);
  }
}

/**
 * 讀取 Cookie 並自動解析 JSON
 */
export function getCookie<T = any>(name: string): T | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    const targetName = encodeURIComponent(name) + '=';

    for (let c of cookies) {
      c = c.trim();
      if (c.indexOf(targetName) === 0) {
        const encodedValue = c.substring(targetName.length);
        const jsonStr = decodeURIComponent(encodedValue);
        return JSON.parse(jsonStr) as T;
      }
    }
  } catch (err) {
    console.warn(`[CookieStorage] Failed to get/parse cookie "${name}":`, err);
  }
  return null;
}

/**
 * 刪除 Cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/; SameSite=Lax`;
}

// ==========================================
// 1. 使用者勾選之量化策略 Cookie 快取
// ==========================================

export interface CompactStrategyCookie {
  name: string;
  entryLogic: 'AND' | 'OR';
  exitLogic: 'AND' | 'OR';
  enabledEntryTypes: string[];
  enabledExitTypes: string[];
  atrInitialStopMultiplier: number;
  atrTrailingStopMultiplier: number;
  initialCapital: number;
  updatedAt: string;
}

/**
 * 儲存使用者勾選的策略至 Cookie 快取 (同時同步 localStorage 作為高容量備援)
 */
export function saveStrategyToCookie(strategy: StrategyConfig): void {
  if (!strategy) return;

  const compact: CompactStrategyCookie = {
    name: strategy.name,
    entryLogic: strategy.entryLogic,
    exitLogic: strategy.exitLogic,
    enabledEntryTypes: strategy.entryConditions.filter(c => c.enabled).map(c => c.type),
    enabledExitTypes: strategy.exitConditions.filter(c => c.enabled).map(c => c.type),
    atrInitialStopMultiplier: strategy.atrInitialStopMultiplier,
    atrTrailingStopMultiplier: strategy.atrTrailingStopMultiplier,
    initialCapital: strategy.initialCapital,
    updatedAt: new Date().toISOString(),
  };

  // 1. 寫入 Cookie
  setCookie(STRATEGY_COOKIE_NAME, compact, 365);

  // 2. 雙重持久化寫入 localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('remix_saved_strategy_config', JSON.stringify(strategy));
    } catch (_) {}
  }
}

/**
 * 從 Cookie 快取讀取使用者勾選的策略
 */
export function loadStrategyFromCookie(
  defaultEntryConditions: EntryCondition[],
  defaultExitConditions: ExitCondition[]
): StrategyConfig | null {
  // 1. 優先從 Cookie 讀取
  let cookieData = getCookie<CompactStrategyCookie>(STRATEGY_COOKIE_NAME);

  // 2. 若 Cookie 為空，嘗試從 localStorage 備援讀取
  if (!cookieData && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('remix_saved_strategy_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) {
          return parsed as StrategyConfig;
        }
      }
    } catch (_) {}
  }

  if (!cookieData) return null;

  // 重構為完整的 StrategyConfig 物件，將勾選狀態套用到條件池
  const entryConditions: EntryCondition[] = defaultEntryConditions.map(cond => ({
    ...cond,
    enabled: Array.isArray(cookieData?.enabledEntryTypes)
      ? cookieData.enabledEntryTypes.includes(cond.type)
      : cond.enabled,
  }));

  const exitConditions: ExitCondition[] = defaultExitConditions.map(cond => ({
    ...cond,
    enabled: Array.isArray(cookieData?.enabledExitTypes)
      ? cookieData.enabledExitTypes.includes(cond.type)
      : cond.enabled,
  }));

  return {
    name: cookieData.name || '自訂量化回測策略',
    entryLogic: cookieData.entryLogic || 'AND',
    exitLogic: cookieData.exitLogic || 'OR',
    entryConditions,
    exitConditions,
    atrInitialStopMultiplier: cookieData.atrInitialStopMultiplier ?? 2.0,
    atrTrailingStopMultiplier: cookieData.atrTrailingStopMultiplier ?? 3.0,
    initialCapital: cookieData.initialCapital ?? 1000000,
    positionSizing: 'ALL_IN',
    transactionFeePct: 0.1425,
    taxPct: 0.3,
  };
}

// ==========================================
// 2. 自選投資組合股票清單 Cookie 快取
// ==========================================

export interface CompactWatchlistStock {
  id: number;
  symbol: string;
  name: string;
  market: string;
  targetBuyPrice?: string | null;
  targetSellPrice?: string | null;
  notes?: string | null;
}

/**
 * 儲存自選投資組合中的股票至 Cookie 快取 (同時同步 localStorage)
 */
export function saveWatchlistToCookie(items: WatchlistItem[]): void {
  if (!Array.isArray(items)) return;

  const compactList: CompactWatchlistStock[] = items.map(item => ({
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    market: item.market || 'TWSE',
    targetBuyPrice: item.targetBuyPrice || null,
    targetSellPrice: item.targetSellPrice || null,
    notes: item.notes || null,
  }));

  // 1. 寫入 Cookie (限制儲存最新 25 檔以保持 Cookie 輕量)
  setCookie(WATCHLIST_COOKIE_NAME, compactList.slice(0, 25), 365);

  // 2. 雙重持久化寫入 localStorage (支援全部項目)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('tw_stock_watchlist_v1', JSON.stringify(items));
    } catch (_) {}
  }
}

/**
 * 從 Cookie 快取讀取自選投資組合中的股票
 */
export function loadWatchlistFromCookie(): WatchlistItem[] | null {
  // 1. 優先從 Cookie 讀取
  const cookieData = getCookie<CompactWatchlistStock[]>(WATCHLIST_COOKIE_NAME);
  if (Array.isArray(cookieData) && cookieData.length > 0) {
    return cookieData.map(c => ({
      id: c.id,
      userId: 'local',
      symbol: c.symbol,
      name: c.name,
      market: c.market || 'TWSE',
      targetBuyPrice: c.targetBuyPrice || null,
      targetSellPrice: c.targetSellPrice || null,
      notes: c.notes || null,
    }));
  }

  // 2. 若 Cookie 為空，嘗試從 localStorage 備援讀取
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('tw_stock_watchlist_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 同步補回 Cookie
          saveWatchlistToCookie(parsed);
          return parsed;
        }
      }
    } catch (_) {}
  }

  return null;
}
