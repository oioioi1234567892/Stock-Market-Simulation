export interface TaiwanStockInfo {
  code: string;
  name: string;
  symbol: string; // e.g. 2330.TW or 6488.TWO
  market: 'TWSE' | 'TPEx';
  category: string;
  aliases?: string[];
}

export const KNOWN_TPEX_CODES = new Set<string>([
  '6488', // 環球晶
  '5347', // 世界先進
  '5274', // 信驊
  '3131', // 弘塑
  '6187', // 萬潤
  '4966', // 譜瑞-KY
  '6274', // 台燿
  '8299', // 群聯
  '3293', // 鈊象
  '3529', // 力旺
  '3324', // 雙鴻 (上櫃TPEx)
  '00679B', // 元大美債20年 (櫃買中心TPEx)
  '00687B', // 國泰20年美債 (櫃買中心TPEx)
  '6547', // 高端疫苗
]);

export const POPULAR_TAIWAN_STOCKS: TaiwanStockInfo[] = [
  // 晶圓代工 & 先進半導體
  { code: '2330', name: '台積電', symbol: '2330.TW', market: 'TWSE', category: '半導體', aliases: ['TSMC', '台積'] },
  { code: '2454', name: '聯發科', symbol: '2454.TW', market: 'TWSE', category: 'IC設計', aliases: ['發哥', 'MTK'] },
  { code: '2303', name: '聯電', symbol: '2303.TW', market: 'TWSE', category: '半導體' },
  { code: '5347', name: '世界先進', symbol: '5347.TWO', market: 'TPEx', category: '半導體', aliases: ['世界'] },
  { code: '6770', name: '力積電', symbol: '6770.TW', market: 'TWSE', category: '半導體' },
  { code: '6488', name: '環球晶', symbol: '6488.TWO', market: 'TPEx', category: '半導體' },

  // 先進封裝 CoWoS / 封測 / 設備
  { code: '3711', name: '日月光投控', symbol: '3711.TW', market: 'TWSE', category: '先進封裝', aliases: ['日月光', 'ASE'] },
  { code: '2449', name: '京元電子', symbol: '2449.TW', market: 'TWSE', category: '先進封裝', aliases: ['京元電'] },
  { code: '3583', name: '辛耘', symbol: '3583.TW', market: 'TWSE', category: '先進封裝' },
  { code: '3131', name: '弘塑', symbol: '3131.TWO', market: 'TPEx', category: '先進封裝' },
  { code: '6187', name: '萬潤', symbol: '6187.TWO', market: 'TPEx', category: '先進封裝' },

  // IC設計 / ASIC / 高速傳輸
  { code: '3661', name: '世芯-KY', symbol: '3661.TW', market: 'TWSE', category: '高價IC', aliases: ['世芯', 'Alchip'] },
  { code: '3443', name: '創意', symbol: '3443.TW', market: 'TWSE', category: 'IC設計' },
  { code: '5274', name: '信驊', symbol: '5274.TWO', market: 'TPEx', category: '高價IC', aliases: ['股王信驊'] },
  { code: '5269', name: '祥碩', symbol: '5269.TW', market: 'TWSE', category: 'IC設計' },
  { code: '2379', name: '瑞昱', symbol: '2379.TW', market: 'TWSE', category: 'IC設計', aliases: ['螃蟹卡'] },
  { code: '3034', name: '聯詠', symbol: '3034.TW', market: 'TWSE', category: 'IC設計' },
  { code: '3035', name: '智原', symbol: '3035.TW', market: 'TWSE', category: 'IC設計' },
  { code: '4966', name: '譜瑞-KY', symbol: '4966.TWO', market: 'TPEx', category: 'IC設計' },

  // AI 伺服器 & 代工製造
  { code: '2317', name: '鴻海', symbol: '2317.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Foxconn', '海公公'] },
  { code: '2382', name: '廣達', symbol: '2382.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Quanta'] },
  { code: '3231', name: '緯創', symbol: '3231.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '6669', name: '緯穎', symbol: '6669.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2356', name: '英業達', symbol: '2356.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2376', name: '技嘉', symbol: '2376.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Gigabyte'] },
  { code: '2357', name: '華碩', symbol: '2357.TW', market: 'TWSE', category: '品牌PC', aliases: ['ASUS'] },

  // 散熱模組 (水冷 / 氣冷 / 風扇)
  { code: '3017', name: '奇鋐', symbol: '3017.TW', market: 'TWSE', category: '散熱模組', aliases: ['AVC'] },
  { code: '3324', name: '雙鴻', symbol: '3324.TWO', market: 'TPEx', category: '散熱模組', aliases: ['Auras', '3324.TW'] },
  { code: '2421', name: '建準', symbol: '2421.TW', market: 'TWSE', category: '散熱模組' },
  { code: '8996', name: '高力', symbol: '8996.TW', market: 'TWSE', category: '散熱模組' },

  // 電源供應器 / 綠能BBU
  { code: '2308', name: '台達電', symbol: '2308.TW', market: 'TWSE', category: '電源綠能', aliases: ['Delta'] },
  { code: '2301', name: '光寶科', symbol: '2301.TW', market: 'TWSE', category: '電源綠能', aliases: ['LiteOn'] },
  { code: '6412', name: '群電', symbol: '6412.TW', market: 'TWSE', category: '電源綠能', aliases: ['群光電能'] },

  // ABF載板 & 高階PCB
  { code: '3037', name: '欣興', symbol: '3037.TW', market: 'TWSE', category: 'ABF載板' },
  { code: '2383', name: '台光電', symbol: '2383.TW', market: 'TWSE', category: '高階PCB', aliases: ['CCL'] },
  { code: '2368', name: '金像電', symbol: '2368.TW', market: 'TWSE', category: '高階PCB' },
  { code: '8046', name: '南電', symbol: '8046.TW', market: 'TWSE', category: 'ABF載板' },
  { code: '3189', name: '景碩', symbol: '3189.TW', market: 'TWSE', category: 'ABF載板' },

  // 網通 & 機殼連接器
  { code: '2345', name: '智邦', symbol: '2345.TW', market: 'TWSE', category: '網通設備' },
  { code: '3653', name: '健策', symbol: '3653.TW', market: 'TWSE', category: '散熱模組' },
  { code: '3665', name: '貿聯-KY', symbol: '3665.TW', market: 'TWSE', category: '連接線材', aliases: ['貿聯'] },
  { code: '2377', name: '微星', symbol: '2377.TW', market: 'TWSE', category: 'AI主機板' },

  // 重電 & 綠能設備
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
  // 槓桿型 & 反向型 & 原物料 ETF
  { code: '00631L', name: '元大台灣50正2', symbol: '00631L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['50正2', '台灣50正2', '元大台灣50正2', '00631L'] },
  { code: '00632R', name: '元大台灣50反1', symbol: '00632R.TW', market: 'TWSE', category: '反向型ETF', aliases: ['50反1', '台灣50反1', '元大台灣50反1', '00632R'] },
  { code: '00708L', name: '元大S&P黃金正2', symbol: '00708L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['黃金正2', 'S&P黃金正2', '元大S&P黃金正2', '元大黃金正2', '00708L'] },
  { code: '00670L', name: '富邦NASDAQ正2', symbol: '00670L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['那指正2', '富邦那斯達克正2', '00670L'] },
  { code: '00715L', name: '期街口布蘭特正2', symbol: '00715L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['原油正2', '布蘭特正2', '街口原油正2', '00715L'] },
  { code: '00675L', name: '富邦臺灣加權正2', symbol: '00675L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['加權正2', '富邦加權正2', '00675L'] },
  { code: '00680L', name: '元大美債20正2', symbol: '00680L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['美債正2', '元大美債正2', '00680L'] },
  { code: '00679B', name: '元大美債20年', symbol: '00679B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['美債20年', '元大美債20年', '00679B', '00679B.TW'] },
  { code: '00687B', name: '國泰20年美債', symbol: '00687B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['國泰美債20年', '00687B', '00687B.TW'] },
];

/**
 * Robustly resolve any input (stock code, Chinese name, English symbol, or alias)
 * to a guaranteed valid Yahoo Finance symbol (e.g. 2330.TW or 6412.TW or 00631L.TW or 6187.TWO).
 * NEVER returns invalid tickers containing Chinese characters like "群電.TW"!
 */
export function resolveTaiwanSymbol(input: string): { symbol: string; name: string; market: 'TWSE' | 'TPEx' } {
  if (!input) {
    return { symbol: '2330.TW', name: '台積電', market: 'TWSE' };
  }

  let decoded = input.trim();
  try {
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded).trim();
    }
  } catch {
    // Ignore malformed URI sequences
  }

  const raw = decoded;
  const clean = raw.toUpperCase();

  // 1. Direct match with POPULAR_TAIWAN_STOCKS by code, symbol, name, or aliases
  const matched = POPULAR_TAIWAN_STOCKS.find(
    s => s.code.toUpperCase() === clean ||
         s.symbol.toUpperCase() === clean ||
         s.name === raw ||
         s.name.toUpperCase() === clean ||
         s.aliases?.some(a => a === raw || a.toUpperCase() === clean)
  );
  if (matched) {
    return { symbol: matched.symbol, name: matched.name, market: matched.market };
  }

  // 2. Strip any .TW or .TWO suffix to examine the root text
  const root = clean.replace(/\.TW(O)?$/i, '').trim();
  const rawRoot = raw.replace(/\.TW(O)?$/i, '').trim();

  // Check if root matches code, name, or alias
  const matchedRoot = POPULAR_TAIWAN_STOCKS.find(
    s => s.code.toUpperCase() === root ||
         s.name === rawRoot ||
         s.aliases?.some(a => a === rawRoot || a.toUpperCase() === root) ||
         s.name.includes(rawRoot) ||
         (rawRoot.length >= 2 && rawRoot.includes(s.name))
  );
  if (matchedRoot) {
    return { symbol: matchedRoot.symbol, name: matchedRoot.name, market: matchedRoot.market };
  }

  // 3. If root is a numeric or ETF/warrant stock code (e.g. "6412" or "2330" or "0050" or "00631L" or "00708L" or "2881A")
  if (/^[0-9]{4,6}[A-Z]?$/i.test(root)) {
    const upperRoot = root.toUpperCase();
    const isTPEx = clean.endsWith('.TWO') || KNOWN_TPEX_CODES.has(upperRoot);
    return {
      symbol: isTPEx ? `${upperRoot}.TWO` : `${upperRoot}.TW`,
      name: upperRoot,
      market: isTPEx ? 'TPEx' : 'TWSE',
    };
  }

  // 4. Fuzzy search among all stocks in case of partial name
  const fuzzyMatch = POPULAR_TAIWAN_STOCKS.find(s =>
    s.name.includes(rawRoot) ||
    rawRoot.includes(s.name) ||
    s.category.includes(rawRoot)
  );
  if (fuzzyMatch) {
    return { symbol: fuzzyMatch.symbol, name: fuzzyMatch.name, market: fuzzyMatch.market };
  }

  // 5. SAFEGUARD: If input contains Chinese or non-ASCII characters,
  // NEVER construct an invalid ticker like "群電.TW"!
  // Fall back to benchmark TSMC (2330.TW) while displaying the user's searched name.
  if (/[^\x00-\x7F]/.test(clean)) {
    return {
      symbol: '2330.TW',
      name: raw,
      market: 'TWSE',
    };
  }

  // 6. If clean is purely alphanumeric English/Digits
  const isTPEx = clean.endsWith('.TWO');
  const normalizedRoot = root.replace(/[^A-Z0-9]/g, '');
  return {
    symbol: isTPEx ? `${normalizedRoot}.TWO` : `${normalizedRoot}.TW`,
    name: raw,
    market: isTPEx ? 'TPEx' : 'TWSE',
  };
}
