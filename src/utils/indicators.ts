import { CandleData } from '../types/stock.ts';

export function calculateIndicators(candles: CandleData[]): CandleData[] {
  if (!candles || candles.length === 0) return [];

  const result: CandleData[] = candles.map(c => ({ ...c }));
  const n = result.length;

  // 1. Moving Averages (MA5, MA10, MA20, MA60)
  for (let i = 0; i < n; i++) {
    // MA5
    if (i >= 4) {
      let sum = 0;
      for (let j = 0; j < 5; j++) sum += result[i - j].close;
      result[i].ma5 = Number((sum / 5).toFixed(2));
    }
    // MA10
    if (i >= 9) {
      let sum = 0;
      for (let j = 0; j < 10; j++) sum += result[i - j].close;
      result[i].ma10 = Number((sum / 10).toFixed(2));
    }
    // MA20
    if (i >= 19) {
      let sum = 0;
      for (let j = 0; j < 20; j++) sum += result[i - j].close;
      result[i].ma20 = Number((sum / 20).toFixed(2));
    }
    // MA60
    if (i >= 59) {
      let sum = 0;
      for (let j = 0; j < 60; j++) sum += result[i - j].close;
      result[i].ma60 = Number((sum / 60).toFixed(2));
    }
  }

  // 2. KD (Stochastic Oscillator 9, 3, 3) - Standard Taiwan Formula
  let prevK = 50;
  let prevD = 50;
  for (let i = 0; i < n; i++) {
    const period = 9;
    const startIdx = Math.max(0, i - period + 1);
    let minLow = result[startIdx].low;
    let maxHigh = result[startIdx].high;

    for (let j = startIdx + 1; j <= i; j++) {
      if (result[j].low < minLow) minLow = result[j].low;
      if (result[j].high > maxHigh) maxHigh = result[j].high;
    }

    let rsv = 50;
    if (maxHigh > minLow) {
      rsv = ((result[i].close - minLow) / (maxHigh - minLow)) * 100;
    }

    const currentK = (2 / 3) * prevK + (1 / 3) * rsv;
    const currentD = (2 / 3) * prevD + (1 / 3) * currentK;

    result[i].k = Number(currentK.toFixed(2));
    result[i].d = Number(currentD.toFixed(2));

    prevK = currentK;
    prevD = currentD;
  }

  // 3. MACD (12, 26, 9)
  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);
  const k9 = 2 / (9 + 1);

  let ema12 = result[0].close;
  let ema26 = result[0].close;
  let macdSignal = 0;

  for (let i = 0; i < n; i++) {
    const close = result[i].close;
    if (i === 0) {
      ema12 = close;
      ema26 = close;
      result[i].dif = 0;
      result[i].macd = 0;
      result[i].osc = 0;
      macdSignal = 0;
    } else {
      ema12 = close * k12 + ema12 * (1 - k12);
      ema26 = close * k26 + ema26 * (1 - k26);
      const dif = ema12 - ema26;
      macdSignal = dif * k9 + macdSignal * (1 - k9);
      const osc = dif - macdSignal;

      result[i].dif = Number(dif.toFixed(2));
      result[i].macd = Number(macdSignal.toFixed(2));
      result[i].osc = Number(osc.toFixed(2));
    }
  }

  // 4. RSI (14)
  const rsiPeriod = 14;
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < n; i++) {
    const change = result[i].close - result[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= rsiPeriod) {
      avgGain += gain / rsiPeriod;
      avgLoss += loss / rsiPeriod;
      if (i === rsiPeriod) {
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(2));
      }
    } else {
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(2));
    }
  }

  // 5. Bollinger Bands (20 periods, 2 standard deviations)
  for (let i = 19; i < n; i++) {
    const ma = result[i].ma20;
    if (ma !== undefined) {
      let sumSqDiff = 0;
      for (let j = 0; j < 20; j++) {
        const diff = result[i - j].close - ma;
        sumSqDiff += diff * diff;
      }
      const stdDev = Math.sqrt(sumSqDiff / 20);
      result[i].bbMiddle = ma;
      result[i].bbUpper = Number((ma + 2 * stdDev).toFixed(2));
      result[i].bbLower = Number((ma - 2 * stdDev).toFixed(2));
      if (ma > 0) {
        result[i].bbWidth = Number((((result[i].bbUpper! - result[i].bbLower!) / ma) * 100).toFixed(2));
      }
    }
  }

  // 6. ATR (Average True Range, 14 periods)
  const atrPeriod = 14;
  let trSum = 0;
  for (let i = 0; i < n; i++) {
    let tr = result[i].high - result[i].low;
    if (i > 0) {
      const prevClose = result[i - 1].close;
      const h_pc = Math.abs(result[i].high - prevClose);
      const l_pc = Math.abs(result[i].low - prevClose);
      tr = Math.max(tr, h_pc, l_pc);
    }

    if (i < atrPeriod) {
      trSum += tr;
      if (i === atrPeriod - 1) {
        result[i].atr = Number((trSum / atrPeriod).toFixed(2));
      }
    } else {
      const prevAtr = result[i - 1].atr ?? (trSum / atrPeriod);
      const currentAtr = (prevAtr * (atrPeriod - 1) + tr) / atrPeriod;
      result[i].atr = Number(currentAtr.toFixed(2));
    }
  }

  return result;
}
