export interface TaiwanStockInfo {
  code: string;
  name: string;
  symbol: string; // e.g. 2330.TW or 6488.TWO
  market: 'TWSE' | 'TPEx';
  category: string;
}

export const POPULAR_TAIWAN_STOCKS: TaiwanStockInfo[] = [
  // 半導體 & 晶圓代工
  { code: '2330', name: '台積電', symbol: '2330.TW', market: 'TWSE', category: '半導體' },
  { code: '2454', name: '聯發科', symbol: '2454.TW', market: 'TWSE', category: '半導體' },
  { code: '2303', name: '聯電', symbol: '2303.TW', market: 'TWSE', category: '半導體' },
  { code: '3711', name: '日月光投控', symbol: '3711.TW', market: 'TWSE', category: '半導體' },
  { code: '2379', name: '瑞昱', symbol: '2379.TW', market: 'TWSE', category: '半導體' },
  { code: '3034', name: '聯詠', symbol: '3034.TW', market: 'TWSE', category: '半導體' },
  { code: '3661', name: '世芯-KY', symbol: '3661.TW', market: 'TWSE', category: '高價IC' },
  { code: '6488', name: '環球晶', symbol: '6488.TWO', market: 'TPEx', category: '半導體' },

  // AI 伺服器 & 代工
  { code: '2317', name: '鴻海', symbol: '2317.TW', market: 'TWSE', category: 'AI代工' },
  { code: '2382', name: '廣達', symbol: '2382.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '3231', name: '緯創', symbol: '3231.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '6669', name: '緯穎', symbol: '6669.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2356', name: '英業達', symbol: '2356.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2376', name: '技嘉', symbol: '2376.TW', market: 'TWSE', category: 'AI主機板' },
  { code: '2357', name: '華碩', symbol: '2357.TW', market: 'TWSE', category: '品牌PC' },
  { code: '2308', name: '台達電', symbol: '2308.TW', market: 'TWSE', category: '電源綠能' },

  // 重電 & 綠能
  { code: '1519', name: '華城', symbol: '1519.TW', market: 'TWSE', category: '重電設備' },
  { code: '1503', name: '士電', symbol: '1503.TW', market: 'TWSE', category: '重電設備' },
  { code: '1513', name: '中興電', symbol: '1513.TW', market: 'TWSE', category: '重電設備' },

  // 航運 & 傳產
  { code: '2603', name: '長榮', symbol: '2603.TW', market: 'TWSE', category: '航運' },
  { code: '2609', name: '陽明', symbol: '2609.TW', market: 'TWSE', category: '航運' },
  { code: '2615', name: '萬海', symbol: '2615.TW', market: 'TWSE', category: '航運' },
  { code: '2002', name: '中鋼', symbol: '2002.TW', market: 'TWSE', category: '鋼鐵' },

  // 金融族群
  { code: '2881', name: '富邦金', symbol: '2881.TW', market: 'TWSE', category: '金融保險' },
  { code: '2882', name: '國泰金', symbol: '2882.TW', market: 'TWSE', category: '金融保險' },
  { code: '2891', name: '中信金', symbol: '2891.TW', market: 'TWSE', category: '金融銀行' },
  { code: '2886', name: '兆豐金', symbol: '2886.TW', market: 'TWSE', category: '金融金控' },

  // 人氣 ETF
  { code: '0050', name: '元大台灣50', symbol: '0050.TW', market: 'TWSE', category: '核心ETF' },
  { code: '0056', name: '元大高股息', symbol: '0056.TW', market: 'TWSE', category: '高股息ETF' },
  { code: '00878', name: '國泰永續高股息', symbol: '00878.TW', market: 'TWSE', category: '高股息ETF' },
  { code: '00919', name: '群益台灣精選高息', symbol: '00919.TW', market: 'TWSE', category: '高股息ETF' },
  { code: '00929', name: '復華台灣科技優息', symbol: '00929.TW', market: 'TWSE', category: '高股息ETF' },
];

export function resolveTaiwanSymbol(input: string): { symbol: string; name: string; market: 'TWSE' | 'TPEx' } {
  const clean = input.trim().toUpperCase();
  const matched = POPULAR_TAIWAN_STOCKS.find(
    s => s.code === clean || s.symbol.toUpperCase() === clean || s.name === clean
  );
  if (matched) {
    return { symbol: matched.symbol, name: matched.name, market: matched.market };
  }

  // If ends with .TW or .TWO
  if (clean.endsWith('.TW')) {
    const code = clean.replace('.TW', '');
    return { symbol: clean, name: `${code}`, market: 'TWSE' };
  }
  if (clean.endsWith('.TWO')) {
    const code = clean.replace('.TWO', '');
    return { symbol: clean, name: `${code}`, market: 'TPEx' };
  }

  // Default to TWSE .TW
  return { symbol: `${clean}.TW`, name: clean, market: 'TWSE' };
}
