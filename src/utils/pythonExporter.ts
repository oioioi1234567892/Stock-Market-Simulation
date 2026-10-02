import { StrategyConfig } from '../types/stock.ts';

export function generatePythonScript(
  symbol: string,
  stockName: string,
  strategy: StrategyConfig
): string {
  const activeEntries = strategy.entryConditions.filter(c => c.enabled);
  const activeExits = strategy.exitConditions.filter(c => c.enabled);

  return `"""
台股量化操盤室 - 自動生成 Python / Plotly Dash 量化回測腳本
標的: ${symbol} (${stockName})
策略名稱: ${strategy.name}
進場邏輯: ${strategy.entryLogic} (${strategy.entryLogic === 'AND' ? '嚴格交集，全條件符合' : '靈活聯集，任一條件成立'})
出場邏輯: ${strategy.exitLogic} (${strategy.exitLogic === 'AND' ? '嚴格交集，全條件符合' : '靈活聯集，任一條件成立'})
動態風控: ATR 初始停損 (${strategy.atrInitialStopMultiplier > 0 ? `${strategy.atrInitialStopMultiplier}x ATR` : '停用'}) | ATR 動態移動停利 (${strategy.atrTrailingStopMultiplier > 0 ? `${strategy.atrTrailingStopMultiplier}x ATR` : '停用'})
"""

import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import datetime

# 1. 抓取 Yahoo Finance 歷史數據
symbol = "${symbol}"
print(f"正在從 Yahoo Finance 下載 {symbol} 歷史行情數據...")
df = yf.download(symbol, start="2023-01-01", end=datetime.date.today().strftime("%Y-%m-%d"))

if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

df = df.dropna()

# 2. 計算技術指標 (MA, KD, MACD, RSI, ATR)
df['MA5'] = df['Close'].rolling(window=5).mean()
df['MA20'] = df['Close'].rolling(window=20).mean()
df['MA60'] = df['Close'].rolling(window=60).mean()

# KD (9, 3, 3)
low_9 = df['Low'].rolling(window=9).min()
high_9 = df['High'].rolling(window=9).max()
rsv = 100 * ((df['Close'] - low_9) / (high_9 - low_9).replace(0, np.nan)).fillna(50)
k_list, d_list = [], []
curr_k, curr_d = 50.0, 50.0
for val in rsv:
    curr_k = (2/3) * curr_k + (1/3) * val
    curr_d = (2/3) * curr_d + (1/3) * curr_k
    k_list.append(curr_k)
    d_list.append(curr_d)
df['K'] = k_list
df['D'] = d_list

# MACD (12, 26, 9)
ema12 = df['Close'].ewm(span=12, adjust=False).mean()
ema26 = df['Close'].ewm(span=26, adjust=False).mean()
df['DIF'] = ema12 - ema26
df['MACD'] = df['DIF'].ewm(span=9, adjust=False).mean()
df['OSC'] = df['DIF'] - df['MACD']

# RSI (14)
delta = df['Close'].diff()
gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
rs = gain / loss.replace(0, np.nan)
df['RSI'] = 100 - (100 / (1 + rs)).fillna(50)

# ATR (14)
high_low = df['High'] - df['Low']
high_close = (df['High'] - df['Close'].shift()).abs()
low_close = (df['Low'] - df['Close'].shift()).abs()
tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
df['ATR'] = tr.rolling(window=14).mean()

# 3. 獨立函式池 (8 大進場 + 7 大出場 + 動態風控)

def check_ma_golden_cross(df, i):
    return df['MA5'].iloc[i-1] <= df['MA20'].iloc[i-1] and df['MA5'].iloc[i] > df['MA20'].iloc[i]

def check_kd_golden_cross(df, i):
    return df['K'].iloc[i-1] <= df['D'].iloc[i-1] and df['K'].iloc[i] > df['D'].iloc[i]

def check_macd_golden_cross(df, i):
    return df['OSC'].iloc[i-1] <= 0 and df['OSC'].iloc[i] > 0

def check_dif_gt_macd(df, i):
    return df['OSC'].iloc[i] > 0

def check_rsi_entry(df, i):
    return (df['RSI'].iloc[i-1] < 35 and df['RSI'].iloc[i] >= 35) or (df['RSI'].iloc[i-1] <= 50 and df['RSI'].iloc[i] > 50)

def check_breakout_30d_high(df, i):
    if i < 30: return False
    past_30_high = df['High'].iloc[i-30:i].max()
    return df['Close'].iloc[i] > past_30_high

def check_volume_spike(df, i):
    if i < 5: return False
    vol_ma5 = df['Volume'].iloc[i-5:i].mean()
    return df['Volume'].iloc[i] > vol_ma5 * 1.5 and df['Close'].iloc[i] >= df['Open'].iloc[i]

def check_close_above_ma20(df, i):
    return df['Close'].iloc[i] > df['MA20'].iloc[i]

# 7 大出場函式
def check_ma_death_cross(df, i):
    return df['MA5'].iloc[i-1] >= df['MA20'].iloc[i-1] and df['MA5'].iloc[i] < df['MA20'].iloc[i]

def check_kd_death_cross(df, i):
    return df['K'].iloc[i-1] >= df['D'].iloc[i-1] and df['K'].iloc[i] < df['D'].iloc[i]

def check_macd_death_cross(df, i):
    return df['OSC'].iloc[i-1] >= 0 and df['OSC'].iloc[i] < 0

def check_dif_lt_macd(df, i):
    return df['OSC'].iloc[i] < 0

def check_rsi_exit(df, i):
    return (df['RSI'].iloc[i-1] >= 70 and df['RSI'].iloc[i] < 70) or df['RSI'].iloc[i] >= 80

def check_breakdown_30d_high(df, i):
    if i < 30: return False
    past_30_high = df['High'].iloc[i-30:i].max()
    past_30_low = df['Low'].iloc[i-30:i].min()
    return df['Close'].iloc[i] < past_30_high * 0.97 or df['Close'].iloc[i] < past_30_low

def check_close_below_ma20(df, i):
    return df['Close'].iloc[i] < df['MA20'].iloc[i]

# 動態風控獨立函式
def check_atr_initial_stop(current_low, entry_price, entry_atr, multiplier):
    if multiplier <= 0 or entry_atr <= 0: return False, 0
    stop_price = entry_price - multiplier * entry_atr
    return current_low <= stop_price, stop_price

def check_atr_trailing_stop(current_low, highest_price, current_atr, multiplier):
    if multiplier <= 0 or current_atr <= 0: return False, 0
    trailing_price = highest_price - multiplier * current_atr
    return current_low <= trailing_price, trailing_price

# 4. 回測執行引擎
initial_capital = ${strategy.initialCapital}
capital = initial_capital
atr_initial_mult = ${strategy.atrInitialStopMultiplier}
atr_trailing_mult = ${strategy.atrTrailingStopMultiplier}
fee_rate = ${strategy.transactionFeePct} / 100.0
tax_rate = ${strategy.taxPct} / 100.0

in_position = False
entry_price = 0.0
entry_atr = 0.0
entry_date = None
shares = 0
highest_price = 0.0
trades = []

entry_rules = [
${activeEntries.map(c => `    "${c.type}",`).join('\n')}
]
entry_logic = "${strategy.entryLogic}"

exit_rules = [
${activeExits.map(c => `    "${c.type}",`).join('\n')}
]
exit_logic = "${strategy.exitLogic}"

func_map = {
    'checkMaGoldenCross': check_ma_golden_cross,
    'checkKdGoldenCross': check_kd_golden_cross,
    'checkMacdGoldenCross': check_macd_golden_cross,
    'checkDifGtMacd': check_dif_gt_macd,
    'checkRsiEntry': check_rsi_entry,
    'checkBreakout30dHigh': check_breakout_30d_high,
    'checkVolumeSpike': check_volume_spike,
    'checkCloseAboveMa20': check_close_above_ma20,
    'checkMaDeathCross': check_ma_death_cross,
    'checkKdDeathCross': check_kd_death_cross,
    'checkMacdDeathCross': check_macd_death_cross,
    'checkDifLtMacd': check_dif_lt_macd,
    'checkRsiExit': check_rsi_exit,
    'checkBreakdown30dHigh': check_breakdown_30d_high,
    'checkCloseBelowMa20': check_close_below_ma20,
}

for i in range(60, len(df)):
    current = df.iloc[i]
    date = df.index[i].strftime("%Y-%m-%d")

    if in_position:
        if current['High'] > highest_price:
            highest_price = current['High']

        should_exit = False
        exit_price = current['Close']
        exit_reason = "指標信號平倉"

        # 動態風控 1: ATR 初始停損
        init_triggered, stop_p = check_atr_initial_stop(current['Low'], entry_price, entry_atr, atr_initial_mult)
        if init_triggered:
            should_exit = True
            exit_price = min(current['Open'], stop_p)
            exit_reason = f"ATR 初始停損 ({atr_initial_mult}x ATR: {stop_p:.2f})"

        # 動態風控 2: ATR 動態移動停利
        if not should_exit:
            curr_atr = current['ATR'] if pd.notna(current['ATR']) else entry_atr
            trail_triggered, trail_p = check_atr_trailing_stop(current['Low'], highest_price, curr_atr, atr_trailing_mult)
            if trail_triggered:
                should_exit = True
                exit_price = min(current['Open'], trail_p)
                exit_reason = f"ATR 動態移動停利 ({atr_trailing_mult}x ATR: {trail_p:.2f})"

        # 出場條件判斷 (AND / OR)
        if not should_exit and len(exit_rules) > 0:
            exit_results = [func_map[r](df, i) for r in exit_rules if r in func_map]
            exit_met = all(exit_results) if exit_logic == 'AND' else any(exit_results)
            if exit_met:
                should_exit = True
                exit_price = current['Close']
                exit_reason = f"指標出場 ({exit_logic})"

        if should_exit:
            gross = exit_price * shares
            net = gross * (1 - fee_rate - tax_rate)
            ret_pct = ((net - entry_price * shares) / (entry_price * shares)) * 100
            capital += net
            trades.append({
                'entry_date': entry_date,
                'entry_price': entry_price,
                'exit_date': date,
                'exit_price': exit_price,
                'return_pct': ret_pct,
                'reason': exit_reason
            })
            in_position = False

    else:
        # 進場條件判斷 (AND / OR)
        if len(entry_rules) > 0:
            entry_results = [func_map[r](df, i) for r in entry_rules if r in func_map]
            entry_met = all(entry_results) if entry_logic == 'AND' else any(entry_results)
            if entry_met and capital > 0:
                entry_price = current['Close']
                entry_atr = current['ATR'] if pd.notna(current['ATR']) else (current['High'] - current['Low'])
                entry_date = date
                highest_price = current['High']
                # 取消整股(1000股)限制，支援精確股數/零股全額資金利用
                cost_per_share = entry_price * (1 + fee_rate)
                max_shares = int(capital // cost_per_share)
                if max_shares >= 1:
                    shares = max_shares
                    capital -= shares * entry_price * (1 + fee_rate)
                    in_position = True

# 期末部位不自動平倉（除非已觸及停損、停利、出場條件）
final_equity = capital + (shares * df.iloc[-1]['Close'] if in_position else 0)
if in_position:
    unrealized_pnl = shares * (df.iloc[-1]['Close'] - entry_price)
    unrealized_pct = (unrealized_pnl / (shares * entry_price)) * 100
    print(f"期末持倉中 (未平倉): 進場日 {entry_date}, 成本: {entry_price:.2f} 元, 持有 {shares:,} 股, 最新市價: {df.iloc[-1]['Close']:.2f} 元")
    print(f"未實現損益: NT$ {unrealized_pnl:,.0f} ({unrealized_pct:+.2f}%)")

print(f"回測完成！已平倉交易 {len(trades)} 筆。最終總資產淨值: NT$ {final_equity:,.0f} 元")
trades_df = pd.DataFrame(trades)
if not trades_df.empty:
    print(trades_df.tail(10))
`;
}
