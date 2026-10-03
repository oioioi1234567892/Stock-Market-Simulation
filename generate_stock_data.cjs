// Generate realistic Taiwan stock historical candles for 7 top stocks
const fs = require('fs');

const STOCKS = [
  { code: '2330', name: '台積電', symbol: '2330.TW', startPrice: 620, endPrice: 1025, volBase: 35000, trend: [ {ratio: 0.15, price: 720}, {ratio: 0.35, price: 830}, {ratio: 0.55, price: 970}, {ratio: 0.7, price: 1080}, {ratio: 0.85, price: 920}, {ratio: 1.0, price: 1025} ] },
  { code: '2317', name: '鴻海', symbol: '2317.TW', startPrice: 104, endPrice: 205, volBase: 85000, trend: [ {ratio: 0.15, price: 106}, {ratio: 0.3, price: 145}, {ratio: 0.5, price: 215}, {ratio: 0.7, price: 180}, {ratio: 0.85, price: 218}, {ratio: 1.0, price: 205} ] },
  { code: '2454', name: '聯發科', symbol: '2454.TW', startPrice: 930, endPrice: 1380, volBase: 12000, trend: [ {ratio: 0.2, price: 1100}, {ratio: 0.45, price: 1320}, {ratio: 0.65, price: 1500}, {ratio: 0.8, price: 1210}, {ratio: 1.0, price: 1380} ] },
  { code: '2603', name: '長榮', symbol: '2603.TW', startPrice: 148, endPrice: 210, volBase: 45000, trend: [ {ratio: 0.2, price: 175}, {ratio: 0.45, price: 228}, {ratio: 0.65, price: 185}, {ratio: 0.8, price: 215}, {ratio: 1.0, price: 210} ] },
  { code: '3231', name: '緯創', symbol: '3231.TW', startPrice: 96, endPrice: 122, volBase: 60000, trend: [ {ratio: 0.25, price: 125}, {ratio: 0.5, price: 108}, {ratio: 0.75, price: 118}, {ratio: 1.0, price: 122} ] },
  { code: '2308', name: '台達電', symbol: '2308.TW', startPrice: 298, endPrice: 395, volBase: 15000, trend: [ {ratio: 0.25, price: 335}, {ratio: 0.5, price: 388}, {ratio: 0.75, price: 420}, {ratio: 1.0, price: 395} ] },
  { code: '0050', name: '元大台灣50', symbol: '0050.TW', startPrice: 135, endPrice: 191, volBase: 25000, trend: [ {ratio: 0.2, price: 148}, {ratio: 0.4, price: 168}, {ratio: 0.65, price: 196}, {ratio: 0.8, price: 178}, {ratio: 1.0, price: 191} ] }
];

// Generate trading days between 2024-10-01 and 2026-10-02 (~500 business days)
const tradingDays = [];
let currDate = new Date('2024-10-01');
const targetDate = new Date('2026-10-02');

while (currDate <= targetDate) {
  const dayOfWeek = currDate.getDay();
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    const y = currDate.getFullYear();
    const m = String(currDate.getMonth() + 1).padStart(2, '0');
    const d = String(currDate.getDate()).padStart(2, '0');
    tradingDays.push(`${y}-${m}-${d}`);
  }
  currDate.setDate(currDate.getDate() + 1);
}

// Pseudo random with seed for deterministic and realistic charts
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const allData = {};

STOCKS.forEach((stock, sIdx) => {
  let seed = 1000 + sIdx * 500;
  const candles = [];
  let currentPrice = stock.startPrice;
  const N = tradingDays.length;

  for (let i = 0; i < N; i++) {
    const ratio = i / (N - 1);
    // Find target trend price
    let target = stock.endPrice;
    for (let t of stock.trend) {
      if (ratio <= t.ratio) {
        target = t.price;
        break;
      }
    }

    const drift = (target - currentPrice) / Math.max(1, (N - i) * 0.4);
    const noise = (seededRandom(seed++) - 0.48) * (currentPrice * 0.024);
    const dailyChange = drift + noise;
    
    const open = Number((currentPrice + (seededRandom(seed++) - 0.5) * (currentPrice * 0.008)).toFixed(2));
    const close = Number(Math.max(1, currentPrice + dailyChange).toFixed(2));
    const high = Number((Math.max(open, close) + Math.abs(seededRandom(seed++) * (currentPrice * 0.016))).toFixed(2));
    const low = Number((Math.min(open, close) - Math.abs(seededRandom(seed++) * (currentPrice * 0.016))).toFixed(2));
    
    // Volume spikes on big move days
    const pctChange = Math.abs((close - open) / open);
    const volMult = 1 + pctChange * 18 + (seededRandom(seed++) * 0.5);
    const volume = Math.round(stock.volBase * volMult);

    candles.push({
      time: tradingDays[i],
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
  }

  allData[stock.symbol] = {
    code: stock.code,
    name: stock.name,
    symbol: stock.symbol,
    candles
  };
});

fs.writeFileSync('embedded_stock_data.json', JSON.stringify(allData));
console.log(`Generated data for ${STOCKS.length} stocks, ${tradingDays.length} trading days each.`);
