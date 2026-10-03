import { CandleData, StockQuote } from '../types/stock.ts';
import { POPULAR_TAIWAN_STOCKS, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { calculateIndicators } from '../utils/indicators.ts';

// Deterministic Pseudo-Random Number Generator based on seed
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

// Approximate baseline prices for key Taiwan stocks
const BASE_PRICES: Record<string, { price: number; name: string; volatility: number; trend: number }> = {
  '2330.TW': { price: 995, name: '台積電', volatility: 0.016, trend: 0.0008 },
  '2454.TW': { price: 1315, name: '聯發科', volatility: 0.02, trend: 0.0006 },
  '2317.TW': { price: 202.5, name: '鴻海', volatility: 0.018, trend: 0.0009 },
  '2382.TW': { price: 285, name: '廣達', volatility: 0.022, trend: 0.0007 },
  '3231.TW': { price: 112, name: '緯創', volatility: 0.024, trend: 0.0005 },
  '2603.TW': { price: 198.5, name: '長榮', volatility: 0.025, trend: 0.0004 },
  '0050.TW': { price: 184, name: '元大台灣50', volatility: 0.011, trend: 0.0006 },
  '0056.TW': { price: 38.2, name: '元大高股息', volatility: 0.009, trend: 0.0003 },
  '2308.TW': { price: 385, name: '台達電', volatility: 0.017, trend: 0.0005 },
  '2881.TW': { price: 89.5, name: '富邦金', volatility: 0.012, trend: 0.0004 },
  '2882.TW': { price: 65.2, name: '國泰金', volatility: 0.013, trend: 0.0004 },
  '1519.TW': { price: 638, name: '華城', volatility: 0.035, trend: 0.001 },
  '6669.TW': { price: 2150, name: '緯穎', volatility: 0.025, trend: 0.0008 },
  '3661.TW': { price: 2480, name: '世芯-KY', volatility: 0.032, trend: 0.0006 },
};

/**
 * Generate 2 years of realistic daily historical candles for a Taiwan stock
 */
export function generateFallbackCandles(symbol: string, range: string = '2y'): CandleData[] {
  const resolved = resolveTaiwanSymbol(symbol);
  const targetSymbol = resolved.symbol;
  const base = BASE_PRICES[targetSymbol] || {
    price: 150 + (stringToSeed(targetSymbol) % 300),
    name: resolved.name,
    volatility: 0.02,
    trend: 0.0005,
  };

  const seed = stringToSeed(targetSymbol);
  const random = createSeededRandom(seed);

  // Total trading days based on range
  let totalDays = 500; // ~2 years
  if (range === '1mo') totalDays = 22;
  else if (range === '3mo') totalDays = 66;
  else if (range === '6mo') totalDays = 130;
  else if (range === '1y') totalDays = 250;
  else if (range === '5y') totalDays = 1250;

  const now = new Date();
  const rawCandles: CandleData[] = [];

  // Generate trading dates going backwards excluding weekends
  const tradingDates: string[] = [];
  const curDate = new Date(now);
  while (tradingDates.length < totalDays) {
    curDate.setDate(curDate.getDate() - 1);
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const y = curDate.getFullYear();
      const m = String(curDate.getMonth() + 1).padStart(2, '0');
      const d = String(curDate.getDate()).padStart(2, '0');
      tradingDates.push(`${y}-${m}-${d}`);
    }
  }
  tradingDates.reverse();

  // Initial price 2 years ago worked backwards from current target base price
  let currentPrice = base.price * Math.exp(-base.trend * totalDays);
  currentPrice = Math.max(10, currentPrice);

  for (let i = 0; i < tradingDates.length; i++) {
    const dateStr = tradingDates[i];
    // Geometric Brownian Motion with cyclical waves
    const cycle = Math.sin((i / 30) * Math.PI) * 0.004 + Math.cos((i / 80) * Math.PI) * 0.006;
    const dailyReturn = (random() - 0.485) * base.volatility * 2 + base.trend + cycle;
    
    // Taiwan 10% daily limit clamp
    const clampedReturn = Math.max(-0.098, Math.min(0.098, dailyReturn));
    const openPrice = currentPrice;
    const closePrice = Math.max(5, Number((openPrice * (1 + clampedReturn)).toFixed(2)));

    const highFactor = 1 + random() * (base.volatility * 1.4);
    const lowFactor = 1 - random() * (base.volatility * 1.4);
    const highPrice = Math.max(openPrice, closePrice, Number((Math.max(openPrice, closePrice) * highFactor).toFixed(2)));
    const lowPrice = Math.min(openPrice, closePrice, Number((Math.min(openPrice, closePrice) * lowFactor).toFixed(2)));

    // Realistic volume in shares (roughly 5K to 60K shares per day)
    const baseVolume = 12000000;
    const volVariance = 0.5 + random() * 1.2;
    const volume = Math.round(baseVolume * volVariance);

    rawCandles.push({
      time: dateStr,
      open: openPrice,
      high: highPrice,
      low: lowPrice,
      close: closePrice,
      volume,
    });

    currentPrice = closePrice;
  }

  // Calculate standard technical indicators (MA5, MA20, MA60, KD, MACD, Bollinger Bands)
  return calculateIndicators(rawCandles);
}

/**
 * Generate fallback real-time quote for a stock
 */
export function generateFallbackQuote(symbol: string): StockQuote {
  const resolved = resolveTaiwanSymbol(symbol);
  const candles = generateFallbackCandles(symbol, '1mo');
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2] || lastCandle;

  const price = lastCandle.close;
  const prevClose = prevCandle.close;
  const change = Number((price - prevClose).toFixed(2));
  const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

  return {
    symbol: resolved.symbol,
    name: resolved.name,
    price,
    change,
    changePercent,
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    previousClose: prevClose,
    volume: lastCandle.volume,
    marketCap: price * 25930000000,
    peRatio: 22.5,
    week52High: Number((price * 1.25).toFixed(2)),
    week52Low: Number((price * 0.72).toFixed(2)),
    timestamp: Date.now(),
  };
}
