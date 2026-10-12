export interface TaiwanStockInfo {
  code: string;
  name: string;
  symbol: string; // e.g. 2330.TW or 6488.TWO
  market: 'TWSE' | 'TPEx';
  category: string;
  aliases?: string[];
}

// 櫃買中心 (TPEx 上櫃股票與債券ETF)，Yahoo Finance 使用 .TWO 後綴
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
  '3324', // 雙鴻
  '8069', // 元太
  '5483', // 中美晶
  '6446', // 藥華藥
  '4743', // 合一
  '6223', // 旺矽
  '3680', // 家登
  '3260', // 威剛
  '3264', // 欣銓
  '3483', // 力致
  '3548', // 兆利
  '3693', // 營邦
  '4979', // 華星光
  '4977', // 眾達-KY
  '6510', // 精測
  '6515', // 茂達
  '6176', // 瑞儀
  '6214', // 精誠
  '6245', // 立端
  '6547', // 高端疫苗
  '5351', // 鈺創
  '5457', // 宣德
  '5371', // 中光電
  '3081', // 聯亞
  '4128', // 中天
  '4736', // 泰博
  '8086', // 宏捷科
  '8936', // 國統
  '00679B', // 元大美債20年
  '00687B', // 國泰20年美債
  '00937B', // 群益ESG投等債20+
  '00933B', // 國泰10Y+金融債
  '00720B', // 元大投資級公司債
  '00751B', // 元大AAA至A公司債
  '00772B', // 中信高評級公司債
]);

export const POPULAR_TAIWAN_STOCKS: TaiwanStockInfo[] = [
  // 1. 本次用戶指定重點標的 & 電源零組件
  { code: '6282', name: '康舒', symbol: '6282.TW', market: 'TWSE', category: '電子零組件', aliases: ['康舒科技', 'AcBel', '6282', '6282.TW'] },
  { code: '00685L', name: '群益臺灣加權正2', symbol: '00685L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['群益台灣加權正二', '群益加權正2', '群益正2', '臺灣加權正2', '00685L', '00685L.TW'] },
  { code: '00686R', name: '群益臺灣加權反1', symbol: '00686R.TW', market: 'TWSE', category: '反向型ETF', aliases: ['群益台灣加權反一', '群益加權反1', '群益反1', '00686R', '00686R.TW'] },

  // 2. 晶圓代工 & 先進半導體
  { code: '2330', name: '台積電', symbol: '2330.TW', market: 'TWSE', category: '半導體', aliases: ['TSMC', '台積'] },
  { code: '2454', name: '聯發科', symbol: '2454.TW', market: 'TWSE', category: 'IC設計', aliases: ['發哥', 'MTK'] },
  { code: '2303', name: '聯電', symbol: '2303.TW', market: 'TWSE', category: '半導體' },
  { code: '5347', name: '世界先進', symbol: '5347.TWO', market: 'TPEx', category: '半導體', aliases: ['世界'] },
  { code: '6770', name: '力積電', symbol: '6770.TW', market: 'TWSE', category: '半導體' },
  { code: '6488', name: '環球晶', symbol: '6488.TWO', market: 'TPEx', category: '半導體' },

  // 3. 先進封裝 CoWoS / 封測 / 設備
  { code: '3711', name: '日月光投控', symbol: '3711.TW', market: 'TWSE', category: '先進封裝', aliases: ['日月光', 'ASE'] },
  { code: '2449', name: '京元電子', symbol: '2449.TW', market: 'TWSE', category: '先進封裝', aliases: ['京元電'] },
  { code: '3583', name: '辛耘', symbol: '3583.TW', market: 'TWSE', category: '先進封裝' },
  { code: '3131', name: '弘塑', symbol: '3131.TWO', market: 'TPEx', category: '先進封裝' },
  { code: '6187', name: '萬潤', symbol: '6187.TWO', market: 'TPEx', category: '先進封裝' },
  { code: '3680', name: '家登', symbol: '3680.TWO', market: 'TPEx', category: '半導體設備', aliases: ['家登精密'] },

  // 4. IC設計 / ASIC / 高速傳輸
  { code: '3661', name: '世芯-KY', symbol: '3661.TW', market: 'TWSE', category: '高價IC', aliases: ['世芯', 'Alchip'] },
  { code: '3443', name: '創意', symbol: '3443.TW', market: 'TWSE', category: 'IC設計' },
  { code: '5274', name: '信驊', symbol: '5274.TWO', market: 'TPEx', category: '高價IC', aliases: ['股王信驊'] },
  { code: '5269', name: '祥碩', symbol: '5269.TW', market: 'TWSE', category: 'IC設計' },
  { code: '2379', name: '瑞昱', symbol: '2379.TW', market: 'TWSE', category: 'IC設計', aliases: ['螃蟹卡'] },
  { code: '3034', name: '聯詠', symbol: '3034.TW', market: 'TWSE', category: 'IC設計' },
  { code: '3035', name: '智原', symbol: '3035.TW', market: 'TWSE', category: 'IC設計' },
  { code: '4966', name: '譜瑞-KY', symbol: '4966.TWO', market: 'TPEx', category: 'IC設計' },
  { code: '3529', name: '力旺', symbol: '3529.TWO', market: 'TPEx', category: 'IC設計' },
  { code: '8299', name: '群聯', symbol: '8299.TWO', market: 'TPEx', category: '快閃記憶體' },
  { code: '2408', name: '南亞科', symbol: '2408.TW', market: 'TWSE', category: '記憶體' },
  { code: '2344', name: '華邦電', symbol: '2344.TW', market: 'TWSE', category: '記憶體' },
  { code: '3260', name: '威剛', symbol: '3260.TWO', market: 'TPEx', category: '記憶體模組' },

  // 5. AI 伺服器 & 代工製造
  { code: '2317', name: '鴻海', symbol: '2317.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Foxconn', '海公公'] },
  { code: '2382', name: '廣達', symbol: '2382.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Quanta'] },
  { code: '3231', name: '緯創', symbol: '3231.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '6669', name: '緯穎', symbol: '6669.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2356', name: '英業達', symbol: '2356.TW', market: 'TWSE', category: 'AI伺服器' },
  { code: '2376', name: '技嘉', symbol: '2376.TW', market: 'TWSE', category: 'AI伺服器', aliases: ['Gigabyte'] },
  { code: '2357', name: '華碩', symbol: '2357.TW', market: 'TWSE', category: '品牌PC', aliases: ['ASUS'] },
  { code: '2377', name: '微星', symbol: '2377.TW', market: 'TWSE', category: 'AI主機板', aliases: ['MSI'] },

  // 6. 機殼 / 水冷散熱 / CPO光通訊
  { code: '3013', name: '晟銘電', symbol: '3013.TW', market: 'TWSE', category: '電腦週邊', aliases: ['晟銘', '3013'] },
  { code: '3017', name: '奇鋐', symbol: '3017.TW', market: 'TWSE', category: '散熱模組', aliases: ['AVC'] },
  { code: '3324', name: '雙鴻', symbol: '3324.TWO', market: 'TPEx', category: '散熱模組', aliases: ['Auras'] },
  { code: '3653', name: '健策', symbol: '3653.TW', market: 'TWSE', category: '散熱均熱片' },
  { code: '2421', name: '建準', symbol: '2421.TW', market: 'TWSE', category: '散熱模組' },
  { code: '8996', name: '高力', symbol: '8996.TW', market: 'TWSE', category: '散熱水冷' },
  { code: '6442', name: '光聖', symbol: '6442.TW', market: 'TWSE', category: 'CPO光通訊', aliases: ['光聖科技', '6442'] },
  { code: '3450', name: '聯鈞', symbol: '3450.TW', market: 'TWSE', category: 'CPO光通訊', aliases: ['聯鈞光電', '3450'] },
  { code: '4979', name: '華星光', symbol: '4979.TWO', market: 'TPEx', category: '光通訊模組' },
  { code: '4977', name: '眾達-KY', symbol: '4977.TWO', market: 'TPEx', category: 'CPO光通訊' },
  { code: '6805', name: '富世達', symbol: '6805.TW', market: 'TWSE', category: '軸承鉸鏈' },
  { code: '3548', name: '兆利', symbol: '3548.TWO', market: 'TPEx', category: '折疊軸承' },
  { code: '3693', name: '營邦', symbol: '3693.TWO', market: 'TPEx', category: '伺服器機箱' },

  // 7. 電源供應器 / 綠能BBU
  { code: '2308', name: '台達電', symbol: '2308.TW', market: 'TWSE', category: '電源綠能', aliases: ['Delta'] },
  { code: '2301', name: '光寶科', symbol: '2301.TW', market: 'TWSE', category: '電源綠能', aliases: ['LiteOn'] },
  { code: '6412', name: '群電', symbol: '6412.TW', market: 'TWSE', category: '電源綠能', aliases: ['群光電能'] },

  // 8. ABF載板 & 高階PCB & 被動元件
  { code: '3037', name: '欣興', symbol: '3037.TW', market: 'TWSE', category: 'ABF載板' },
  { code: '2383', name: '台光電', symbol: '2383.TW', market: 'TWSE', category: '高階PCB', aliases: ['CCL'] },
  { code: '2368', name: '金像電', symbol: '2368.TW', market: 'TWSE', category: '高階PCB' },
  { code: '8046', name: '南電', symbol: '8046.TW', market: 'TWSE', category: 'ABF載板' },
  { code: '3189', name: '景碩', symbol: '3189.TW', market: 'TWSE', category: 'ABF載板' },
  { code: '6274', name: '台燿', symbol: '6274.TWO', market: 'TPEx', category: '高階PCB' },
  { code: '4958', name: '臻鼎-KY', symbol: '4958.TW', market: 'TWSE', category: '軟板PCB' },
  { code: '2327', name: '國巨', symbol: '2327.TW', market: 'TWSE', category: '被動元件', aliases: ['Yageo'] },
  { code: '2492', name: '華新科', symbol: '2492.TW', market: 'TWSE', category: '被動元件' },

  // 9. 網通 & 機殼連接器 & 光學鏡頭
  { code: '2345', name: '智邦', symbol: '2345.TW', market: 'TWSE', category: '網通設備' },
  { code: '3665', name: '貿聯-KY', symbol: '3665.TW', market: 'TWSE', category: '連接線材', aliases: ['貿聯'] },
  { code: '3008', name: '大立光', symbol: '3008.TW', market: 'TWSE', category: '光學鏡頭', aliases: ['股王大立光', 'Largan'] },
  { code: '3406', name: '玉晶光', symbol: '3406.TW', market: 'TWSE', category: '光學鏡頭' },
  { code: '8069', name: '元太', symbol: '8069.TWO', market: 'TPEx', category: '電子紙', aliases: ['E Ink'] },
  { code: '2409', name: '友達', symbol: '2409.TW', market: 'TWSE', category: '光電面板', aliases: ['AUO'] },
  { code: '3481', name: '群創', symbol: '3481.TW', market: 'TWSE', category: '光電面板', aliases: ['Innolux'] },

  // 10. 重電 & 綠能設備
  { code: '1519', name: '華城', symbol: '1519.TW', market: 'TWSE', category: '重電設備' },
  { code: '1503', name: '士電', symbol: '1503.TW', market: 'TWSE', category: '重電設備' },
  { code: '1513', name: '中興電', symbol: '1513.TW', market: 'TWSE', category: '重電設備' },
  { code: '1514', name: '亞力', symbol: '1514.TW', market: 'TWSE', category: '重電設備' },

  // 11. 航運 & 傳產鋼鐵塑化
  { code: '2603', name: '長榮', symbol: '2603.TW', market: 'TWSE', category: '航運', aliases: ['長榮海運'] },
  { code: '2609', name: '陽明', symbol: '2609.TW', market: 'TWSE', category: '航運', aliases: ['陽明海運'] },
  { code: '2615', name: '萬海', symbol: '2615.TW', market: 'TWSE', category: '航運', aliases: ['萬海航運'] },
  { code: '2618', name: '長榮航', symbol: '2618.TW', market: 'TWSE', category: '航運航空', aliases: ['長榮航空'] },
  { code: '2610', name: '華航', symbol: '2610.TW', market: 'TWSE', category: '航運航空', aliases: ['中華航空'] },
  { code: '2002', name: '中鋼', symbol: '2002.TW', market: 'TWSE', category: '鋼鐵' },
  { code: '1101', name: '台泥', symbol: '1101.TW', market: 'TWSE', category: '水泥綠能' },
  { code: '1301', name: '台塑', symbol: '1301.TW', market: 'TWSE', category: '塑膠' },
  { code: '1303', name: '南亞', symbol: '1303.TW', market: 'TWSE', category: '塑膠' },
  { code: '1326', name: '台化', symbol: '1326.TW', market: 'TWSE', category: '塑膠化纖' },
  { code: '6505', name: '台塑化', symbol: '6505.TW', market: 'TWSE', category: '油電燃氣' },
  { code: '1216', name: '統一', symbol: '1216.TW', market: 'TWSE', category: '食品' },
  { code: '2912', name: '統一超', symbol: '2912.TW', market: 'TWSE', category: '連鎖超商', aliases: ['7-11'] },
  { code: '2207', name: '和泰車', symbol: '2207.TW', market: 'TWSE', category: '汽車' },

  // 12. 金融族群 & 券商
  { code: '2881', name: '富邦金', symbol: '2881.TW', market: 'TWSE', category: '金融保險' },
  { code: '2882', name: '國泰金', symbol: '2882.TW', market: 'TWSE', category: '金融保險' },
  { code: '2891', name: '中信金', symbol: '2891.TW', market: 'TWSE', category: '金融銀行' },
  { code: '2886', name: '兆豐金', symbol: '2886.TW', market: 'TWSE', category: '金融金控' },
  { code: '2884', name: '玉山金', symbol: '2884.TW', market: 'TWSE', category: '金融銀行' },
  { code: '2892', name: '第一金', symbol: '2892.TW', market: 'TWSE', category: '金融官股' },
  { code: '2880', name: '華南金', symbol: '2880.TW', market: 'TWSE', category: '金融官股' },
  { code: '2885', name: '元大金', symbol: '2885.TW', market: 'TWSE', category: '金融證券' },
  { code: '2887', name: '台新金', symbol: '2887.TW', market: 'TWSE', category: '金融銀行' },
  { code: '2890', name: '永豐金', symbol: '2890.TW', market: 'TWSE', category: '金融金控' },
  { code: '2883', name: '凱基金', symbol: '2883.TW', market: 'TWSE', category: '金融證券', aliases: ['開發金', '凱基金控', '中華開發'] },
  { code: '5880', name: '合庫金', symbol: '5880.TW', market: 'TWSE', category: '金融官股' },
  { code: '6005', name: '群益證', symbol: '6005.TW', market: 'TWSE', category: '證券商', aliases: ['群益金鼎證券', '群益證券'] },

  // 13. 生技醫療 CDMO & 智慧製造機器人
  { code: '6472', name: '保瑞', symbol: '6472.TW', market: 'TWSE', category: '生技醫療' },
  { code: '1795', name: '美時', symbol: '1795.TW', market: 'TWSE', category: '生技醫療' },
  { code: '6446', name: '藥華藥', symbol: '6446.TWO', market: 'TPEx', category: '生技新藥' },
  { code: '4583', name: '台灣精銳', symbol: '4583.TW', market: 'TWSE', category: '智慧製造', aliases: ['精銳', '減速機'] },
  { code: '2359', name: '所羅門', symbol: '2359.TW', market: 'TWSE', category: '機器人視覺', aliases: ['所羅門'] },
  { code: '2049', name: '上銀', symbol: '2049.TW', market: 'TWSE', category: '工業機器人' },
  { code: '3293', name: '鈊象', symbol: '3293.TWO', market: 'TPEx', category: '數位遊戲', aliases: ['鈊象電子'] },
  { code: '2731', name: '雄獅', symbol: '2731.TW', market: 'TWSE', category: '觀光旅遊' },

  // 14. 人氣原型 ETF
  { code: '0050', name: '元大台灣50', symbol: '0050.TW', market: 'TWSE', category: '核心ETF', aliases: ['台灣50', '0050'] },
  { code: '006208', name: '富邦台50', symbol: '006208.TW', market: 'TWSE', category: '核心ETF', aliases: ['富邦台灣50', '006208'] },
  { code: '0056', name: '元大高股息', symbol: '0056.TW', market: 'TWSE', category: '高股息ETF', aliases: ['0056'] },
  { code: '00878', name: '國泰永續高股息', symbol: '00878.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00878'] },
  { code: '00919', name: '群益台灣精選高息', symbol: '00919.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00919', '群益高息'] },
  { code: '00929', name: '復華台灣科技優息', symbol: '00929.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00929'] },
  { code: '00713', name: '元大台灣高息低波', symbol: '00713.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00713', '高息低波'] },
  { code: '00915', name: '凱基優選高股息30', symbol: '00915.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00915'] },
  { code: '00918', name: '大華優利高填息30', symbol: '00918.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00918'] },
  { code: '00939', name: '統一台灣高息動能', symbol: '00939.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00939'] },
  { code: '00940', name: '元大台灣價值高息', symbol: '00940.TW', market: 'TWSE', category: '高股息ETF', aliases: ['00940'] },
  { code: '00881', name: '國泰台灣5G+', symbol: '00881.TW', market: 'TWSE', category: '科技ETF', aliases: ['00881'] },
  { code: '00850', name: '元大臺灣ESG永續', symbol: '00850.TW', market: 'TWSE', category: 'ESG永續ETF', aliases: ['00850'] },

  // 15. 槓桿型 & 反向型 & 海外/債券 ETF
  { code: '00631L', name: '元大台灣50正2', symbol: '00631L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['50正2', '台灣50正2', '元大台灣50正2', '00631L'] },
  { code: '00632R', name: '元大台灣50反1', symbol: '00632R.TW', market: 'TWSE', category: '反向型ETF', aliases: ['50反1', '台灣50反1', '元大台灣50反1', '00632R'] },
  { code: '00675L', name: '富邦臺灣加權正2', symbol: '00675L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['加權正2', '富邦加權正2', '00675L'] },
  { code: '00708L', name: '元大S&P黃金正2', symbol: '00708L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['黃金正2', 'S&P黃金正2', '00708L'] },
  { code: '00670L', name: '富邦NASDAQ正2', symbol: '00670L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['那指正2', '00670L'] },
  { code: '00715L', name: '期街口布蘭特正2', symbol: '00715L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['原油正2', '布蘭特正2', '00715L'] },
  { code: '00680L', name: '元大美債20正2', symbol: '00680L.TW', market: 'TWSE', category: '槓桿型ETF', aliases: ['美債正2', '00680L'] },
  { code: '00679B', name: '元大美債20年', symbol: '00679B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['美債20年', '00679B'] },
  { code: '00687B', name: '國泰20年美債', symbol: '00687B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['國泰美債20年', '00687B'] },
  { code: '00937B', name: '群益ESG投等債20+', symbol: '00937B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['群益投等債', '00937B'] },
  { code: '00933B', name: '國泰10Y+金融債', symbol: '00933B.TWO', market: 'TPEx', category: '債券ETF', aliases: ['國泰金融債', '00933B'] },
  { code: '00757', name: '統一FANG+', symbol: '00757.TW', market: 'TWSE', category: '海外科技ETF', aliases: ['FANG+', '00757'] },
  { code: '00662', name: '富邦NASDAQ-100', symbol: '00662.TW', market: 'TWSE', category: '海外科技ETF', aliases: ['那斯達克', '00662'] },
  { code: '00830', name: '國泰費城半導體', symbol: '00830.TW', market: 'TWSE', category: '海外科技ETF', aliases: ['費半', '00830'] },
];

/**
 * 快速在本地資料庫中搜尋台股（代號、名稱、別名、拼音與大寫代號）
 * 若輸入純數字代號（如 6282、8069）或 ETF 代號（如 00685L），保證返回候選標的，支援全台股新增。
 */
export function searchTaiwanStocks(query: string): TaiwanStockInfo[] {
  if (!query) {
    return POPULAR_TAIWAN_STOCKS.slice(0, 15);
  }

  const clean = query.trim().toUpperCase();
  const lower = query.trim().toLowerCase();

  // 1. 如果輸入包含括號代號，如「康舒(6282)」或「群益台灣加權正二(00685L)」
  const bracketMatch = query.match(/[\(（]([0-9]{4,6}[A-Z]?)[\)）]/i);
  const extractedCode = bracketMatch ? bracketMatch[1].toUpperCase() : null;

  // 2. 搜尋既有資料庫
  const matched = POPULAR_TAIWAN_STOCKS.filter(s => {
    if (extractedCode && s.code.toUpperCase() === extractedCode) return true;
    return (
      s.code.toUpperCase().includes(clean) ||
      s.symbol.toUpperCase().includes(clean) ||
      s.name.toLowerCase().includes(lower) ||
      s.name.includes(query.trim()) ||
      s.category.includes(query.trim()) ||
      s.aliases?.some(a => a.toLowerCase().includes(lower) || a.toUpperCase().includes(clean) || a.includes(query.trim()))
    );
  });

  // 3. 如果用戶輸入了有效的台股代號（4-6碼數字加選配字母），且資料庫未包含該代號
  // 自動生成即時候選標的，確保可新增全台股所有上市櫃股票與 ETF
  const codeCandidate = extractedCode || (clean.replace(/\.TW(O)?$/i, ''));
  if (/^[0-9]{4,6}[A-Z]?$/i.test(codeCandidate)) {
    const upperCode = codeCandidate.toUpperCase();
    const alreadyExists = matched.some(m => m.code.toUpperCase() === upperCode);
    if (!alreadyExists) {
      const isTPEx = clean.endsWith('.TWO') || KNOWN_TPEX_CODES.has(upperCode);
      const customCandidate: TaiwanStockInfo = {
        code: upperCode,
        name: query.replace(/[\(（][0-9A-Z]+[\)）]/i, '').trim() || upperCode,
        symbol: isTPEx ? `${upperCode}.TWO` : `${upperCode}.TW`,
        market: isTPEx ? 'TPEx' : 'TWSE',
        category: '台股標的',
        aliases: [upperCode],
      };
      return [customCandidate, ...matched];
    }
  }

  return matched;
}

/**
 * 完整解析任何輸入（股票代號、中文名稱、英文代號、含括號代號如 康舒(6282)）
 * 轉化為絕對合法的 Yahoo Finance 符號（.TW 或 .TWO）
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
    // Ignore URI decode errors
  }

  const raw = decoded;
  const clean = raw.toUpperCase();

  // 1. 如果輸入含有括號代號，如「康舒(6282)」、「群益台灣加權正二(00685L)」
  const bracketMatch = raw.match(/[\(（]([0-9]{4,6}[A-Z]?)[\)）]/i);
  if (bracketMatch) {
    const code = bracketMatch[1].toUpperCase();
    const foundByCode = POPULAR_TAIWAN_STOCKS.find(s => s.code.toUpperCase() === code);
    if (foundByCode) {
      return { symbol: foundByCode.symbol, name: foundByCode.name, market: foundByCode.market };
    }
    const isTPEx = KNOWN_TPEX_CODES.has(code);
    const pureName = raw.replace(/[\(（][0-9A-Z]+[\)）]/i, '').trim();
    return {
      symbol: isTPEx ? `${code}.TWO` : `${code}.TW`,
      name: pureName || code,
      market: isTPEx ? 'TPEx' : 'TWSE',
    };
  }

  // 2. 精確比對資料庫（代號、完整 symbol、中文名稱、別名）
  const directMatch = POPULAR_TAIWAN_STOCKS.find(
    s => s.code.toUpperCase() === clean ||
         s.symbol.toUpperCase() === clean ||
         s.name === raw ||
         s.name.toUpperCase() === clean ||
         s.aliases?.some(a => a === raw || a.toUpperCase() === clean)
  );
  if (directMatch) {
    return { symbol: directMatch.symbol, name: directMatch.name, market: directMatch.market };
  }

  // 3. 去除 .TW 或 .TWO 後綴
  const root = clean.replace(/\.TW(O)?$/i, '').trim();
  const rawRoot = raw.replace(/\.TW(O)?$/i, '').trim();

  // 再檢測去後綴後的 root
  const rootMatch = POPULAR_TAIWAN_STOCKS.find(
    s => s.code.toUpperCase() === root ||
         s.name === rawRoot ||
         s.aliases?.some(a => a === rawRoot || a.toUpperCase() === root)
  );
  if (rootMatch) {
    return { symbol: rootMatch.symbol, name: rootMatch.name, market: rootMatch.market };
  }

  // 4. 若 root 為純數字/英文字母的股票代號（例如 "6282"、"00685L"、"8069"、"2330"）
  if (/^[0-9]{4,6}[A-Z]?$/i.test(root)) {
    const upperRoot = root.toUpperCase();
    // 檢查是否有同代號之台股標的
    const matchedByCode = POPULAR_TAIWAN_STOCKS.find(s => s.code.toUpperCase() === upperRoot);
    if (matchedByCode) {
      return { symbol: matchedByCode.symbol, name: matchedByCode.name, market: matchedByCode.market };
    }

    const isTPEx = clean.endsWith('.TWO') || KNOWN_TPEX_CODES.has(upperRoot);
    return {
      symbol: isTPEx ? `${upperRoot}.TWO` : `${upperRoot}.TW`,
      name: upperRoot,
      market: isTPEx ? 'TPEx' : 'TWSE',
    };
  }

  // 5. 模糊比對中文包含關係
  const fuzzyMatch = POPULAR_TAIWAN_STOCKS.find(s =>
    (s.name.length >= 2 && rawRoot.includes(s.name)) ||
    (rawRoot.length >= 2 && s.name.includes(rawRoot)) ||
    s.aliases?.some(a => (a.length >= 2 && rawRoot.includes(a)) || (rawRoot.length >= 2 && a.includes(rawRoot)))
  );
  if (fuzzyMatch) {
    return { symbol: fuzzyMatch.symbol, name: fuzzyMatch.name, market: fuzzyMatch.market };
  }

  // 6. 若包含中文但未比對到，嘗試提取其中可能的連續 4-6 碼代號
  const anyCodeInside = raw.match(/([0-9]{4,6}[A-Z]?)/i);
  if (anyCodeInside) {
    const foundCode = anyCodeInside[1].toUpperCase();
    const isTPEx = KNOWN_TPEX_CODES.has(foundCode);
    return {
      symbol: isTPEx ? `${foundCode}.TWO` : `${foundCode}.TW`,
      name: raw,
      market: isTPEx ? 'TPEx' : 'TWSE',
    };
  }

  // 7. 最後防線：若為純 ASCII 英文代號
  if (/^[A-Z0-9\.]+$/i.test(clean)) {
    const isTPEx = clean.endsWith('.TWO');
    const normalized = root.replace(/[^A-Z0-9]/g, '');
    return {
      symbol: isTPEx ? `${normalized}.TWO` : `${normalized}.TW`,
      name: raw,
      market: isTPEx ? 'TPEx' : 'TWSE',
    };
  }

  // 8. 若完全無法識別的非ASCII字串，預設傳回台積電權值標桿
  return {
    symbol: '2330.TW',
    name: raw,
    market: 'TWSE',
  };
}
