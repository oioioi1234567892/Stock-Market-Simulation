import {
  CandleData,
  StrategyConfig,
  BacktestResult,
  TradeRecord,
  EquityPoint,
  OpenPosition,
  StockStrategySignal,
  EntryCondition,
  ExitCondition,
} from '../types/stock.ts';

// =========================================================================
// 8 大進場獨立函式池 (8 Independent Entry Functions)
// =========================================================================

/**
 * 1. 周月金叉 (MA5 > MA20)
 * 前一日 MA5 <= MA20 且當日 MA5 > MA20
 */
export function checkMaGoldenCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.ma5 === undefined || curr.ma20 === undefined || prev.ma5 === undefined || prev.ma20 === undefined) return false;
  return prev.ma5 <= prev.ma20 && curr.ma5 > curr.ma20;
}

/**
 * 2. KD黃金交叉
 * 前一日 K <= D 且當日 K > D
 */
export function checkKdGoldenCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.k === undefined || curr.d === undefined || prev.k === undefined || prev.d === undefined) return false;
  return prev.k <= prev.d && curr.k > curr.d;
}

/**
 * 3. MACD黃金交叉 (OSC 負翻正)
 * 前一日柱狀體 OSC <= 0 且當日 OSC > 0
 */
export function checkMacdGoldenCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.osc === undefined || prev.osc === undefined) return false;
  return prev.osc <= 0 && curr.osc > 0;
}

/**
 * 4. DIF-MACD > 0 (多頭動能延續)
 * 快線大於慢線，柱狀體位於零軸之上
 */
export function checkDifGtMacd(candles: CandleData[], i: number): boolean {
  const curr = candles[i];
  if (curr.osc !== undefined) return curr.osc > 0;
  if (curr.dif !== undefined && curr.macd !== undefined) return curr.dif > curr.macd;
  return false;
}

/**
 * 5. RSI 超賣回升 / 短天期金叉
 * RSI 超賣回升 (前日 < 35 且當日 >= 35) 或站上 50 軸強勢區
 */
export function checkRsiEntry(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.rsi === undefined || prev.rsi === undefined) return false;
  return (prev.rsi < 35 && curr.rsi >= 35) || (prev.rsi <= 50 && curr.rsi > 50);
}

/**
 * 6. 突破過去30日最高價 (海龜動能)
 * 當日收盤價突破過去 30 根 K 線的最高點
 */
export function checkBreakout30dHigh(candles: CandleData[], i: number): boolean {
  if (i < 30) return false;
  const curr = candles[i];
  const past30 = candles.slice(i - 30, i);
  const past30High = Math.max(...past30.map(c => c.high));
  return curr.close > past30High;
}

/**
 * 7. 成交量 > 1.5倍五日平均 (放量攻擊)
 * 成交量突破 5 日均量 1.5 倍且收紅 K
 */
export function checkVolumeSpike(candles: CandleData[], i: number): boolean {
  if (i < 5) return false;
  const curr = candles[i];
  const past5 = candles.slice(i - 5, i);
  const avgVol5 = past5.reduce((acc, c) => acc + c.volume, 0) / 5;
  return curr.volume > avgVol5 * 1.5 && curr.close >= curr.open;
}

/**
 * 8. 股價站上MA20 (月線生命線)
 * 收盤價站穩 20 日均線月線之上
 */
export function checkCloseAboveMa20(candles: CandleData[], i: number): boolean {
  const curr = candles[i];
  if (curr.ma20 === undefined) return false;
  return curr.close > curr.ma20;
}

// =========================================================================
// 7 大出場獨立函式池 (7 Independent Exit Functions)
// =========================================================================

/**
 * 1. 周月死叉 (MA5 < MA20)
 * 前一日 MA5 >= MA20 且當日 MA5 < MA20
 */
export function checkMaDeathCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.ma5 === undefined || curr.ma20 === undefined || prev.ma5 === undefined || prev.ma20 === undefined) return false;
  return prev.ma5 >= prev.ma20 && curr.ma5 < curr.ma20;
}

/**
 * 2. KD死亡交叉
 * 前一日 K >= D 且當日 K < D
 */
export function checkKdDeathCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.k === undefined || curr.d === undefined || prev.k === undefined || prev.d === undefined) return false;
  return prev.k >= prev.d && curr.k < curr.d;
}

/**
 * 3. MACD死亡交叉
 * 柱狀體由正翻負 (前一日 OSC >= 0 且當日 OSC < 0)
 */
export function checkMacdDeathCross(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.osc === undefined || prev.osc === undefined) return false;
  return prev.osc >= 0 && curr.osc < 0;
}

/**
 * 4. DIF-MACD < 0
 * 快線向下跌破慢線，空頭動能發散
 */
export function checkDifLtMacd(candles: CandleData[], i: number): boolean {
  const curr = candles[i];
  if (curr.osc !== undefined) return curr.osc < 0;
  if (curr.dif !== undefined && curr.macd !== undefined) return curr.dif < curr.macd;
  return false;
}

/**
 * 5. RSI 超買回檔
 * 前日 RSI >= 70 且當日向下跌破 70，或極端超買警戒
 */
export function checkRsiExit(candles: CandleData[], i: number): boolean {
  if (i < 1) return false;
  const curr = candles[i];
  const prev = candles[i - 1];
  if (curr.rsi === undefined || prev.rsi === undefined) return false;
  return (prev.rsi >= 70 && curr.rsi < 70) || curr.rsi >= 80;
}

/**
 * 6. 跌破過去30日高價防守線
 * 收盤價跌破過去 30 日高點回撤 3% 防守線，或跌破過去 30 日低點
 */
export function checkBreakdown30dHigh(candles: CandleData[], i: number): boolean {
  if (i < 30) return false;
  const curr = candles[i];
  const past30 = candles.slice(i - 30, i);
  const past30High = Math.max(...past30.map(c => c.high));
  const past30Low = Math.min(...past30.map(c => c.low));
  return curr.close < past30High * 0.97 || curr.close < past30Low;
}

/**
 * 7. 股價跌破MA20
 * 收盤價向下跌破 20 日月線生命線
 */
export function checkCloseBelowMa20(candles: CandleData[], i: number): boolean {
  const curr = candles[i];
  if (curr.ma20 === undefined) return false;
  return curr.close < curr.ma20;
}

// =========================================================================
// 動態風控獨立函式 (Dynamic ATR Risk Control Functions)
// =========================================================================

/**
 * ATR 初始停損 (ATR Initial Stop Loss)
 * 停損價格 = 進場價格 - (倍數 * 進場時 ATR(14))
 */
export function checkAtrInitialStop(
  current: CandleData,
  entryPrice: number,
  entryAtr: number,
  multiplier: number
): { triggered: boolean; exitPrice: number; reason: string } {
  if (multiplier <= 0 || entryAtr <= 0) {
    return { triggered: false, exitPrice: 0, reason: '' };
  }

  const stopPrice = Number((entryPrice - multiplier * entryAtr).toFixed(2));
  if (current.low <= stopPrice) {
    const exitPrice = current.open < stopPrice ? current.open : stopPrice;
    return {
      triggered: true,
      exitPrice: Number(exitPrice.toFixed(2)),
      reason: `ATR 初始停損 (${multiplier}x ATR: $${stopPrice})`,
    };
  }
  return { triggered: false, exitPrice: 0, reason: '' };
}

/**
 * ATR 動態移動停利 (ATR Trailing Stop Profit)
 * 移動停利價格 = 持股期間最高價 - (倍數 * 當前 ATR(14))
 */
export function checkAtrTrailingStop(
  current: CandleData,
  highestPriceSinceEntry: number,
  currentAtr: number,
  multiplier: number
): { triggered: boolean; exitPrice: number; reason: string } {
  if (multiplier <= 0 || currentAtr <= 0) {
    return { triggered: false, exitPrice: 0, reason: '' };
  }

  const trailingStopPrice = Number((highestPriceSinceEntry - multiplier * currentAtr).toFixed(2));
  if (current.low <= trailingStopPrice) {
    const exitPrice = current.open < trailingStopPrice ? current.open : trailingStopPrice;
    return {
      triggered: true,
      exitPrice: Number(exitPrice.toFixed(2)),
      reason: `ATR 動態移動停利 (${multiplier}x ATR: $${trailingStopPrice})`,
    };
  }
  return { triggered: false, exitPrice: 0, reason: '' };
}

// =========================================================================
// 量化回測主引擎 (Backtest Execution Engine)
// =========================================================================

export function runBacktest(
  candles: CandleData[],
  strategy: StrategyConfig,
  symbol: string,
  stockName: string
): BacktestResult {
  if (!candles || candles.length < 35) {
    throw new Error('回測需要至少 35 根 K 線數據以計算各項指標');
  }

  const {
    entryLogic = 'AND',
    exitLogic = 'OR',
    entryConditions,
    exitConditions,
    atrInitialStopMultiplier = 2.0,
    atrTrailingStopMultiplier = 3.0,
    initialCapital = 1000000,
    transactionFeePct = 0.1425,
    taxPct = 0.3,
  } = strategy;

  const feeRate = transactionFeePct / 100;
  const taxRate = taxPct / 100;

  let capital = initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';
  let entryIndex = 0;
  let entryAtr = 0;
  let positionShares = 0;
  let highestPriceSinceEntry = 0;

  const trades: TradeRecord[] = [];
  const equityCurve: EquityPoint[] = [];

  let peakEquity = capital;

  // Start after warm-up period for MA60 and 30-day lookback
  const startIndex = Math.min(60, Math.floor(candles.length / 3));

  for (let i = startIndex; i < candles.length; i++) {
    const current = candles[i];

    if (inPosition) {
      if (current.high > highestPriceSinceEntry) {
        highestPriceSinceEntry = current.high;
      }

      let shouldExit = false;
      let exitPrice = current.close;
      let exitReason = '策略出場信號';

      // 1. 動態風控優先：ATR 初始停損 (checkAtrInitialStop)
      if (atrInitialStopMultiplier > 0) {
        const initialStop = checkAtrInitialStop(current, entryPrice, entryAtr, atrInitialStopMultiplier);
        if (initialStop.triggered) {
          shouldExit = true;
          exitPrice = initialStop.exitPrice;
          exitReason = initialStop.reason;
        }
      }

      // 2. 動態風控優先：ATR 動態移動停利 (checkAtrTrailingStop)
      if (!shouldExit && atrTrailingStopMultiplier > 0) {
        const currentAtr = current.atr || entryAtr;
        const trailingStop = checkAtrTrailingStop(current, highestPriceSinceEntry, currentAtr, atrTrailingStopMultiplier);
        if (trailingStop.triggered) {
          shouldExit = true;
          exitPrice = trailingStop.exitPrice;
          exitReason = trailingStop.reason;
        }
      }

      // 3. 7 大出場獨立函式池檢查 (支援 AND / OR 邏輯運算)
      if (!shouldExit) {
        const activeExitConditions = exitConditions.filter(c => c.enabled);
        if (activeExitConditions.length > 0) {
          const exitCheckResults = activeExitConditions.map(cond => {
            switch (cond.type) {
              case 'checkMaDeathCross': return checkMaDeathCross(candles, i);
              case 'checkKdDeathCross': return checkKdDeathCross(candles, i);
              case 'checkMacdDeathCross': return checkMacdDeathCross(candles, i);
              case 'checkDifLtMacd': return checkDifLtMacd(candles, i);
              case 'checkRsiExit': return checkRsiExit(candles, i);
              case 'checkBreakdown30dHigh': return checkBreakdown30dHigh(candles, i);
              case 'checkCloseBelowMa20': return checkCloseBelowMa20(candles, i);
              default: return false;
            }
          });

          // exitLogic: 'AND' (嚴格交集，全條件符合) 或 'OR' (靈活聯集，任一條件成立)
          const isExitConditionMet = exitLogic === 'AND'
            ? exitCheckResults.every(Boolean)
            : exitCheckResults.some(Boolean);

          if (isExitConditionMet) {
            shouldExit = true;
            exitPrice = current.close;
            exitReason = exitLogic === 'AND'
              ? '出場條件嚴格交集(AND)全數成立'
              : '出場條件靈活聯集(OR)條件成立';
          }
        }
      }

      // 執行出場平倉
      if (shouldExit) {
        const grossProceeds = exitPrice * positionShares;
        const exitFee = grossProceeds * feeRate;
        const exitTax = grossProceeds * taxRate;
        const netProceeds = grossProceeds - exitFee - exitTax;

        const costBasis = entryPrice * positionShares;
        const tradeReturnAmount = netProceeds - costBasis;
        const tradeReturnPct = (tradeReturnAmount / costBasis) * 100;

        capital += netProceeds;
        inPosition = false;

        trades.push({
          id: `trade-${trades.length + 1}`,
          entryDate,
          entryPrice: Number(entryPrice.toFixed(2)),
          exitDate: current.time,
          exitPrice: Number(exitPrice.toFixed(2)),
          shares: positionShares,
          holdingDays: i - entryIndex,
          returnPct: Number(tradeReturnPct.toFixed(2)),
          returnAmount: Number(tradeReturnAmount.toFixed(0)),
          exitReason,
          isWin: tradeReturnAmount > 0,
        });
      }
    } else {
      // 8 大進場獨立函式池檢查 (支援 AND / OR 邏輯運算)
      const activeEntryConditions = entryConditions.filter(c => c.enabled);
      if (activeEntryConditions.length > 0) {
        const entryCheckResults = activeEntryConditions.map(cond => {
          switch (cond.type) {
            case 'checkMaGoldenCross': return checkMaGoldenCross(candles, i);
            case 'checkKdGoldenCross': return checkKdGoldenCross(candles, i);
            case 'checkMacdGoldenCross': return checkMacdGoldenCross(candles, i);
            case 'checkDifGtMacd': return checkDifGtMacd(candles, i);
            case 'checkRsiEntry': return checkRsiEntry(candles, i);
            case 'checkBreakout30dHigh': return checkBreakout30dHigh(candles, i);
            case 'checkVolumeSpike': return checkVolumeSpike(candles, i);
            case 'checkCloseAboveMa20': return checkCloseAboveMa20(candles, i);
            default: return false;
          }
        });

        // entryLogic: 'AND' (嚴格交集，全條件符合) 或 'OR' (靈活聯集，任一條件成立)
        const isEntryConditionMet = entryLogic === 'AND'
          ? entryCheckResults.every(Boolean)
          : entryCheckResults.some(Boolean);

        if (isEntryConditionMet && capital > 0) {
          entryPrice = current.close;
          entryDate = current.time;
          entryIndex = i;
          entryAtr = current.atr || Math.max(1, current.high - current.low);
          highestPriceSinceEntry = current.high;

          // 取消整股(1000股)限制：支援精準股數 / 零股自由交易機制 (以 1 股為單位)
          const costPerShare = entryPrice * (1 + feeRate);
          let targetShares = Math.floor(capital / costPerShare);

          if (strategy.positionSizing === 'FIXED_SHARES' && strategy.fixedShares && strategy.fixedShares > 0) {
            targetShares = Math.min(strategy.fixedShares, targetShares);
          }

          if (targetShares >= 1) {
            positionShares = targetShares;
            const totalBuyCost = positionShares * entryPrice * (1 + feeRate);
            capital -= totalBuyCost;
            inPosition = true;
          }
        }
      }
    }

    // 計算當日資產淨值 (Mark-to-Market Equity)
    const currentEquity = inPosition ? capital + positionShares * current.close : capital;
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const currentDD = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;

    equityCurve.push({
      date: current.time,
      equity: Math.round(currentEquity),
      drawdownPct: Number(currentDD.toFixed(2)),
    });
  }

  // 期末若仍有未平倉部位：不自動強制平倉（除非盤中已觸及停損、停利、出場條件）
  let openPosition: OpenPosition | null = null;
  const lastBar = candles[candles.length - 1];

  if (inPosition) {
    const costBasis = entryPrice * positionShares;
    const currentVal = lastBar.close * positionShares;
    const unrealizedPnl = currentVal - costBasis;
    const unrealizedPnlPct = Number(((unrealizedPnl / costBasis) * 100).toFixed(2));

    openPosition = {
      entryDate,
      entryPrice: Number(entryPrice.toFixed(2)),
      shares: positionShares,
      holdingDays: candles.length - 1 - entryIndex,
      currentPrice: Number(lastBar.close.toFixed(2)),
      currentValue: Math.round(currentVal),
      unrealizedReturnPct: unrealizedPnlPct,
      unrealizedReturnAmount: Math.round(unrealizedPnl),
    };

    // 記錄未平倉持股於 trades，標記 status: 'OPEN'，不強制平倉
    trades.push({
      id: `trade-${trades.length + 1}`,
      entryDate,
      entryPrice: Number(entryPrice.toFixed(2)),
      exitDate: '',
      exitPrice: Number(lastBar.close.toFixed(2)),
      shares: positionShares,
      holdingDays: candles.length - 1 - entryIndex,
      returnPct: unrealizedPnlPct,
      returnAmount: Math.round(unrealizedPnl),
      exitReason: '未達出場條件（續抱中）',
      isWin: unrealizedPnl > 0,
      status: 'OPEN',
    });
  }

  // 回測績效指標統計 (以已結算之平倉交易統計勝率與獲利因子)
  const closedTrades = trades.filter(t => t.status !== 'OPEN');
  const totalTrades = closedTrades.length;
  const winningTradesList = closedTrades.filter(t => t.isWin);
  const losingTradesList = closedTrades.filter(t => !t.isWin);

  const winningTrades = winningTradesList.length;
  const losingTrades = losingTradesList.length;
  const winRate = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(2)) : 0;

  // 期末資產總淨值 = 現金餘額 + 未平倉部位最新市值 (Mark-to-Market Total Equity)
  const finalEquity = inPosition ? capital + positionShares * lastBar.close : capital;
  const totalReturnPct = Number((((finalEquity - initialCapital) / initialCapital) * 100).toFixed(2));

  // 年化複合成長率 CAGR
  const totalDays = (new Date(candles[candles.length - 1].time).getTime() - new Date(candles[startIndex].time).getTime()) / (1000 * 3600 * 24);
  const years = Math.max(0.1, totalDays / 365);
  const cagrPct = Number(((Math.pow(Math.max(0.01, finalEquity / initialCapital), 1 / years) - 1) * 100).toFixed(2));

  // 獲利因子 Profit Factor
  const totalGrossProfit = winningTradesList.reduce((acc, t) => acc + t.returnAmount, 0);
  const totalGrossLoss = Math.abs(losingTradesList.reduce((acc, t) => acc + t.returnAmount, 0));
  const profitFactor = totalGrossLoss > 0 ? Number((totalGrossProfit / totalGrossLoss).toFixed(2)) : totalGrossProfit > 0 ? 99.99 : 0;

  // 平均單筆獲利與虧損率
  const averageWinPct = winningTrades > 0 ? Number((winningTradesList.reduce((acc, t) => acc + t.returnPct, 0) / winningTrades).toFixed(2)) : 0;
  const averageLossPct = losingTrades > 0 ? Number((losingTradesList.reduce((acc, t) => acc + t.returnPct, 0) / losingTrades).toFixed(2)) : 0;
  const winLossRatio = Math.abs(averageLossPct) > 0 ? Number((averageWinPct / Math.abs(averageLossPct)).toFixed(2)) : averageWinPct > 0 ? 99 : 0;

  // 期望值 (Expectancy)
  const winRateDecimal = winRate / 100;
  const lossRateDecimal = 1 - winRateDecimal;
  const expectancyPct = Number((winRateDecimal * averageWinPct - lossRateDecimal * Math.abs(averageLossPct)).toFixed(2));

  const avgWinAmount = winningTrades > 0 ? totalGrossProfit / winningTrades : 0;
  const avgLossAmount = losingTrades > 0 ? totalGrossLoss / losingTrades : 0;
  const expectancyAmount = Math.round(winRateDecimal * avgWinAmount - lossRateDecimal * avgLossAmount);

  // 最大回撤 MDD
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    if (point.drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = point.drawdownPct;
    }
  }

  return {
    symbol,
    stockName,
    strategyName: strategy.name,
    dateRange: {
      start: candles[startIndex].time,
      end: candles[candles.length - 1].time,
    },
    initialCapital,
    finalCapital: Math.round(finalEquity),
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalReturnPct,
    cagrPct,
    profitFactor,
    expectancyPct,
    expectancyAmount,
    averageWinPct,
    averageLossPct,
    winLossRatio,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    trades,
    equityCurve,
    openPosition,
  };
}

export const DEFAULT_ENTRY_CONDITIONS: EntryCondition[] = [
  {
    id: 'entry-1',
    type: 'checkMaGoldenCross',
    name: '周月金叉 (MA5>MA20)',
    description: 'MA5 向上突破 MA20 月線瞬間（單日穿透觸發型。若中途停利出場，需待死叉後重新金叉方能再次進場）',
    enabled: true,
  },
  {
    id: 'entry-2',
    type: 'checkKdGoldenCross',
    name: 'KD黃金交叉',
    description: 'KD 指標 K值由下往上穿越 D值 (9,3,3)',
    enabled: false,
  },
  {
    id: 'entry-3',
    type: 'checkMacdGoldenCross',
    name: 'MACD黃金交叉 (OSC 負翻正)',
    description: 'MACD 柱狀體由負翻正，短波多頭動能啟動',
    enabled: false,
  },
  {
    id: 'entry-4',
    type: 'checkDifGtMacd',
    name: 'DIF-MACD>0 (多頭動能延續)',
    description: '快線位於慢線上方，柱體大於 0 多方強勢控盤',
    enabled: false,
  },
  {
    id: 'entry-5',
    type: 'checkRsiEntry',
    name: 'RSI 超賣回升 / 短天期金叉',
    description: 'RSI 自超賣區(<35)回升翻揚或突破 50 中軸多方強勢區',
    enabled: false,
  },
  {
    id: 'entry-6',
    type: 'checkBreakout30dHigh',
    name: '突破過去30日最高價 (海龜動能)',
    description: '收盤價突破過去 30 根 K 線最高點 (海龜交易突破法)',
    enabled: true,
  },
  {
    id: 'entry-7',
    type: 'checkVolumeSpike',
    name: '成交量>1.5倍五日平均 (放量攻擊)',
    description: '當日成交量突破 5 日均量 1.5 倍且收紅 K 實體線',
    enabled: false,
  },
  {
    id: 'entry-8',
    type: 'checkCloseAboveMa20',
    name: '股價站上MA20 (月線生命線)',
    description: '收盤價穩固站在 20 日月線生命線之上',
    enabled: true,
  },
];

export const DEFAULT_EXIT_CONDITIONS: ExitCondition[] = [
  {
    id: 'exit-1',
    type: 'checkMaDeathCross',
    name: '周月死叉 (MA5<MA20)',
    description: 'MA5 均線向下跌破 MA20 月線轉弱',
    enabled: true,
  },
  {
    id: 'exit-2',
    type: 'checkKdDeathCross',
    name: 'KD死亡交叉',
    description: 'KD 指標 K值由上往下跌破 D值 (高檔動能背離)',
    enabled: false,
  },
  {
    id: 'exit-3',
    type: 'checkMacdDeathCross',
    name: 'MACD死亡交叉',
    description: 'MACD 柱狀體由正翻負，多方動能竭盡',
    enabled: false,
  },
  {
    id: 'exit-4',
    type: 'checkDifLtMacd',
    name: 'DIF-MACD<0',
    description: '快線向下跌破慢線，空頭動能擴散',
    enabled: false,
  },
  {
    id: 'exit-5',
    type: 'checkRsiExit',
    name: 'RSI 超買回檔',
    description: 'RSI 自 70 超買區向下跌破，或觸及 80 極度鈍化警戒',
    enabled: false,
  },
  {
    id: 'exit-6',
    type: 'checkBreakdown30dHigh',
    name: '跌破過去30日高價防守線',
    description: '自 30 日波段最高點回撤達 3% 防守線或跌破 30 日低點',
    enabled: false,
  },
  {
    id: 'exit-7',
    type: 'checkCloseBelowMa20',
    name: '股價跌破MA20',
    description: '收盤價向下跌破 20 日月線生命線支撐',
    enabled: true,
  },
];

export const DEFAULT_STRATEGY: StrategyConfig = {
  name: '海龜30日突破動量量化策略',
  entryLogic: 'AND',
  exitLogic: 'OR',
  entryConditions: DEFAULT_ENTRY_CONDITIONS,
  exitConditions: DEFAULT_EXIT_CONDITIONS,
  atrInitialStopMultiplier: 2.0,
  atrTrailingStopMultiplier: 3.0,
  initialCapital: 1000000,
  positionSizing: 'ALL_IN',
  transactionFeePct: 0.1425,
  taxPct: 0.3,
};

export function evaluateStrategySignal(
  candles: CandleData[],
  strategy: StrategyConfig,
  symbol: string,
  name: string
): StockStrategySignal {
  if (!candles || candles.length < 35) {
    return {
      status: 'WAIT',
      statusLabel: '空手觀望',
      statusDesc: 'K線數據不足',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      winRate: 0,
      expectancyPct: 0,
      expectancyAmount: 0,
      maxDrawdownPct: 0,
      totalTrades: 0,
      profitFactor: 0,
      totalReturnPct: 0,
    };
  }

  try {
    const result = runBacktest(candles, strategy, symbol, name);
    const lastBar = candles[candles.length - 1];

    const stats = {
      winRate: result.winRate,
      expectancyPct: result.expectancyPct,
      expectancyAmount: result.expectancyAmount,
      maxDrawdownPct: result.maxDrawdownPct,
      totalTrades: result.totalTrades,
      profitFactor: result.profitFactor,
      totalReturnPct: result.totalReturnPct,
    };

    // 1. 若目前處於持倉狀態 (openPosition)
    if (result.openPosition) {
      if (result.openPosition.entryDate === lastBar.time) {
        return {
          status: 'BUY',
          statusLabel: '買入訊號',
          statusDesc: `今日滿足進場條件 · 買進價 $${result.openPosition.entryPrice}`,
          badgeClass: 'bg-red-500/20 text-red-300 border-red-500/60 shadow-xs',
          entryDate: result.openPosition.entryDate,
          entryPrice: result.openPosition.entryPrice,
          holdingDays: 0,
          returnPct: result.openPosition.unrealizedReturnPct,
          ...stats,
        };
      } else {
        return {
          status: 'HOLD',
          statusLabel: '持倉續抱',
          statusDesc: `已持股 ${result.openPosition.holdingDays}天 · 未實現 ${result.openPosition.unrealizedReturnPct >= 0 ? '+' : ''}${result.openPosition.unrealizedReturnPct}%`,
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-xs',
          entryDate: result.openPosition.entryDate,
          entryPrice: result.openPosition.entryPrice,
          holdingDays: result.openPosition.holdingDays,
          returnPct: result.openPosition.unrealizedReturnPct,
          ...stats,
        };
      }
    }

    // 2. 若目前無部位，檢查今日是否剛好觸發停損/停利/出場平倉
    if (result.trades && result.trades.length > 0) {
      const closedTrades = result.trades.filter(t => t.status !== 'OPEN');
      if (closedTrades.length > 0) {
        const lastTrade = closedTrades[closedTrades.length - 1];
        if (lastTrade.exitDate === lastBar.time) {
          return {
            status: 'SELL',
            statusLabel: '賣出訊號',
            statusDesc: `今日觸發出場平倉 · $${lastTrade.exitPrice} (${lastTrade.exitReason})`,
            badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-xs',
            exitPrice: lastTrade.exitPrice,
            returnPct: lastTrade.returnPct,
            ...stats,
          };
        }
      }
    }

    // 3. 否則為無部位且今日未觸發進場之觀望狀態
    return {
      status: 'WAIT',
      statusLabel: '空手觀望',
      statusDesc: '未達進場條件 · 靜待訊號',
      badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
      ...stats,
    };
  } catch (err) {
    console.warn(`Evaluation error for ${symbol}:`, err);
    return {
      status: 'WAIT',
      statusLabel: '空手觀望',
      statusDesc: '條件未觸發',
      badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
      winRate: 0,
      expectancyPct: 0,
      expectancyAmount: 0,
      maxDrawdownPct: 0,
      totalTrades: 0,
      profitFactor: 0,
      totalReturnPct: 0,
    };
  }
}
