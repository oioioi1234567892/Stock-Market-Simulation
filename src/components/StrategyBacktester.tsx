import React, { useState, useMemo, useEffect } from 'react';
import {
  CandleData,
  StrategyConfig,
  BacktestResult,
  EntryCondition,
  ExitCondition,
  TradeRecord,
  EntryConditionType,
  ExitConditionType,
} from '../types/stock.ts';
import { runBacktest } from '../utils/backtestEngine.ts';
import { saveBacktest } from '../services/api.ts';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Sliders,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';

interface StrategyBacktesterProps {
  candles: CandleData[];
  symbol: string;
  stockName: string;
  onOpenPythonModal: (strategy?: StrategyConfig) => void;
  onRecordSaved?: () => void;
  onTradesGenerated?: (trades: TradeRecord[]) => void;
  onStrategyChange?: (strategy: StrategyConfig) => void;
}

// 8 大進場獨立函式預設清單
const DEFAULT_ENTRY_CONDITIONS: EntryCondition[] = [
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

// 7 大出場獨立函式預設清單
const DEFAULT_EXIT_CONDITIONS: ExitCondition[] = [
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

export const StrategyBacktester: React.FC<StrategyBacktesterProps> = ({
  candles,
  symbol,
  stockName,
  onOpenPythonModal,
  onRecordSaved,
  onTradesGenerated,
  onStrategyChange,
}) => {
  // Strategy Configuration State
  const [strategyName, setStrategyName] = useState<string>('海龜30日突破動量量化策略');
  const [entryLogic, setEntryLogic] = useState<'AND' | 'OR'>('AND');
  const [exitLogic, setExitLogic] = useState<'AND' | 'OR'>('OR');
  const [entryConditions, setEntryConditions] = useState<EntryCondition[]>(DEFAULT_ENTRY_CONDITIONS);
  const [exitConditions, setExitConditions] = useState<ExitCondition[]>(DEFAULT_EXIT_CONDITIONS);

  // 動態風控獨立函式參數 (ATR Multipliers)
  const [atrInitialStopMultiplier, setAtrInitialStopMultiplier] = useState<number>(2.0); // 2.0x ATR
  const [atrTrailingStopMultiplier, setAtrTrailingStopMultiplier] = useState<number>(3.0); // 3.0x ATR
  const [initialCapital, setInitialCapital] = useState<number>(1000000); // 1,000,000 TWD

  // Backtest Run State
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Tab in Results (summary vs trades)
  const [activeTab, setActiveTab] = useState<'summary' | 'trades'>('summary');
  const [chartViewMode, setChartViewMode] = useState<'equity' | 'drawdown'>('equity');
  const [hoverEquityIndex, setHoverEquityIndex] = useState<number | null>(null);

  // Calculate current ATR from candle data for reference
  const currentAtr = useMemo(() => {
    if (!candles || candles.length === 0) return 0;
    const last = candles[candles.length - 1];
    if (last.atr && last.atr > 0) return last.atr;
    return Math.max(last.high - last.low, 1);
  }, [candles]);

  const currentPrice = useMemo(() => {
    if (!candles || candles.length === 0) return 0;
    return candles[candles.length - 1].close;
  }, [candles]);

  // Construct StrategyConfig object
  const currentConfig: StrategyConfig = useMemo(() => ({
    name: strategyName,
    entryLogic,
    exitLogic,
    entryConditions,
    exitConditions,
    atrInitialStopMultiplier,
    atrTrailingStopMultiplier,
    initialCapital,
    positionSizing: 'ALL_IN',
    transactionFeePct: 0.1425,
    taxPct: 0.3,
  }), [
    strategyName,
    entryLogic,
    exitLogic,
    entryConditions,
    exitConditions,
    atrInitialStopMultiplier,
    atrTrailingStopMultiplier,
    initialCapital,
  ]);

  // Sync strategy config with parent for portfolio/watchlist real-time signal analysis
  useEffect(() => {
    if (onStrategyChange) {
      onStrategyChange(currentConfig);
    }
  }, [currentConfig, onStrategyChange]);

  // Auto-run initial backtest when candles or stock changes
  useEffect(() => {
    if (candles && candles.length >= 35) {
      try {
        const initialResult = runBacktest(candles, currentConfig, symbol, stockName);
        setResult(initialResult);
        if (onTradesGenerated) {
          onTradesGenerated(initialResult.trades);
        }
      } catch (err) {
        console.error('Auto backtest initialization error', err);
      }
    }
  }, [candles, symbol, stockName]);

  // Presets designed by Pro Trader
  const loadPreset = (preset: 'turtle' | 'ma_kd' | 'macd_vol' | 'rsi_reversal') => {
    if (preset === 'turtle') {
      setStrategyName('海龜30日強勢突破 + 月線多頭動態風控');
      setEntryLogic('AND');
      setExitLogic('OR');
      setEntryConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkBreakout30dHigh' || c.type === 'checkCloseAboveMa20',
        }))
      );
      setExitConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkCloseBelowMa20' || c.type === 'checkBreakdown30dHigh',
        }))
      );
      setAtrInitialStopMultiplier(2.0);
      setAtrTrailingStopMultiplier(3.0);
    } else if (preset === 'ma_kd') {
      setStrategyName('周月均線金叉 + KD短線共振波段');
      setEntryLogic('AND');
      setExitLogic('OR');
      setEntryConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkMaGoldenCross' || c.type === 'checkKdGoldenCross',
        }))
      );
      setExitConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkMaDeathCross' || c.type === 'checkKdDeathCross',
        }))
      );
      setAtrInitialStopMultiplier(2.0);
      setAtrTrailingStopMultiplier(3.0);
    } else if (preset === 'macd_vol') {
      setStrategyName('MACD柱狀翻正 + 1.5倍爆量攻擊');
      setEntryLogic('AND');
      setExitLogic('OR');
      setEntryConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkMacdGoldenCross' || c.type === 'checkVolumeSpike' || c.type === 'checkDifGtMacd',
        }))
      );
      setExitConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkMacdDeathCross' || c.type === 'checkDifLtMacd',
        }))
      );
      setAtrInitialStopMultiplier(1.5);
      setAtrTrailingStopMultiplier(2.5);
    } else if (preset === 'rsi_reversal') {
      setStrategyName('RSI超賣翻揚 + 站穩月線強勢波');
      setEntryLogic('AND');
      setExitLogic('OR');
      setEntryConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkRsiEntry' || c.type === 'checkCloseAboveMa20',
        }))
      );
      setExitConditions(prev =>
        prev.map(c => ({
          ...c,
          enabled: c.type === 'checkRsiExit' || c.type === 'checkCloseBelowMa20',
        }))
      );
      setAtrInitialStopMultiplier(2.0);
      setAtrTrailingStopMultiplier(3.5);
    }
  };

  // Run Backtest Function
  const handleRunBacktest = () => {
    setErrorMsg(null);
    setIsCalculating(true);
    setSaveSuccess(false);

    setTimeout(() => {
      try {
        const backtestResult = runBacktest(candles, currentConfig, symbol, stockName);
        setResult(backtestResult);
        if (onTradesGenerated) {
          onTradesGenerated(backtestResult.trades);
        }
      } catch (err: any) {
        setErrorMsg(err.message || '回測計算發生錯誤，請檢查條件設定');
      } finally {
        setIsCalculating(false);
      }
    }, 80);
  };

  // Save to Database / Local Storage
  const handleSaveToDatabase = async () => {
    if (!result) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await saveBacktest({
        symbol: result.symbol,
        stockName: result.stockName,
        strategyName: result.strategyName,
        parameters: {
          entryLogic,
          exitLogic,
          entryConditions: entryConditions.filter(c => c.enabled).map(c => c.type),
          exitConditions: exitConditions.filter(c => c.enabled).map(c => c.type),
          atrInitialStopMultiplier,
          atrTrailingStopMultiplier,
          initialCapital,
        },
        dateRange: `${result.dateRange.start} ~ ${result.dateRange.end}`,
        totalTrades: result.totalTrades,
        winRate: `${result.winRate}%`,
        totalReturn: `${result.totalReturnPct}%`,
        expectancy: `${result.expectancyPct}%`,
        profitFactor: `${result.profitFactor}`,
        maxDrawdown: `${result.maxDrawdownPct}%`,
        tradesSummary: {
          winningTrades: result.winningTrades,
          losingTrades: result.losingTrades,
          winLossRatio: result.winLossRatio,
          tradeCount: result.trades.length,
        },
      });

      setSaveSuccess(true);
      if (onRecordSaved) onRecordSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || '儲存回測紀錄失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const activeEntryCount = entryConditions.filter(c => c.enabled).length;
  const activeExitCount = exitConditions.filter(c => c.enabled).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col gap-4 p-3.5 sm:p-5 text-slate-200 shadow-xl">
      {/* 頂部標題與快速範本工具列 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="text-blue-400" size={20} />
              <span>自訂義量化策略回測系統</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/70 border border-blue-800/60 text-blue-300">
              獨立函式池 + AND/OR 邏輯運算
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            標的：<span className="text-slate-100 font-semibold">{stockName} ({symbol})</span> · 回測兩年歷史股價走勢 · 8大進場函式 · 7大出場函式 · ATR動態風控
          </p>
        </div>

        {/* 操盤手預設範本快速載入 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles size={13} className="text-amber-400" />
            操盤手範本:
          </span>
          <button
            onClick={() => loadPreset('turtle')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            🏆 海龜30日突破
          </button>
          <button
            onClick={() => loadPreset('ma_kd')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            ⚡ 均線+KD共振
          </button>
          <button
            onClick={() => loadPreset('macd_vol')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            🚀 MACD翻正+爆量
          </button>
          <button
            onClick={() => loadPreset('rsi_reversal')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            🛡️ RSI超賣反轉
          </button>
        </div>
      </div>

      {/* 核心策略參數配置區 (8進場 + 7出場 + 動態風控) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 左側：8 大進場獨立函式池 (5 欄寬度) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="font-semibold text-sm text-slate-100">8 大進場獨立函式池</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono">
                {activeEntryCount}/8
              </span>
            </div>

            {/* 進場 AND / OR 運算切換 */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEntryLogic('AND')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  entryLogic === 'AND'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="全部勾選條件皆符合才進場"
              >
                AND (嚴格交集)
              </button>
              <button
                type="button"
                onClick={() => setEntryLogic('OR')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  entryLogic === 'OR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="任一勾選條件符合即進場"
              >
                OR (靈活聯集)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>邏輯：{entryLogic === 'AND' ? '須同時滿足全部勾選條件' : '滿足任一勾選條件即進場'}</span>
            <button
              onClick={() => setEntryConditions(prev => prev.map(c => ({ ...c, enabled: true })))}
              className="text-emerald-400 hover:underline text-[10px]"
            >
              全選
            </button>
          </div>

          {/* 8 大進場函式勾選清單 */}
          <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
            {entryConditions.map(cond => (
              <label
                key={cond.id}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${
                  cond.enabled
                    ? 'bg-emerald-950/20 border-emerald-800/60 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={cond.enabled}
                  onChange={e => {
                    setEntryConditions(prev =>
                      prev.map(c => (c.id === cond.id ? { ...c, enabled: e.target.checked } : c))
                    );
                  }}
                  className="mt-1 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className={`text-xs font-semibold ${cond.enabled ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {cond.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1 rounded">
                      {cond.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {cond.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 中間：7 大出場獨立函式池 (4 欄寬度) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={16} className="text-amber-400" />
              <span className="font-semibold text-sm text-slate-100">7 大出場獨立函式池</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-mono">
                {activeExitCount}/7
              </span>
            </div>

            {/* 出場 AND / OR 運算切換 */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setExitLogic('AND')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  exitLogic === 'AND'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="全部勾選條件皆符合才出場"
              >
                AND (嚴格交集)
              </button>
              <button
                type="button"
                onClick={() => setExitLogic('OR')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  exitLogic === 'OR'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="任一勾選條件符合即平倉"
              >
                OR (靈活聯集)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>邏輯：{exitLogic === 'AND' ? '須同時滿足全部勾選條件才平倉' : '滿足任一勾選條件即出場平倉'}</span>
            <button
              onClick={() => setExitConditions(prev => prev.map(c => ({ ...c, enabled: true })))}
              className="text-amber-400 hover:underline text-[10px]"
            >
              全選
            </button>
          </div>

          {/* 7 大出場函式勾選清單 */}
          <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
            {exitConditions.map(cond => (
              <label
                key={cond.id}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${
                  cond.enabled
                    ? 'bg-amber-950/20 border-amber-800/60 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={cond.enabled}
                  onChange={e => {
                    setExitConditions(prev =>
                      prev.map(c => (c.id === cond.id ? { ...c, enabled: e.target.checked } : c))
                    );
                  }}
                  className="mt-1 rounded border-slate-700 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className={`text-xs font-semibold ${cond.enabled ? 'text-amber-300' : 'text-slate-300'}`}>
                      {cond.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1 rounded">
                      {cond.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {cond.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 右側：動態風控獨立函式池 (4 欄寬度) */}
        <div className="lg:col-span-4 flex flex-col gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-purple-400" />
              動態風控獨立函式池
            </span>
            <span className="text-[10px] text-purple-300 bg-purple-950/70 border border-purple-800/60 px-1.5 py-0.5 rounded">
              ATR 動態調節
            </span>
          </div>

          {/* 當前真實 ATR 波動度參考卡片 */}
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Activity size={14} className="text-cyan-400" />
              <span>當前 ATR(14) 波動度:</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-cyan-300 text-sm">
                NT$ {currentAtr.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                約佔股價 {currentPrice > 0 ? ((currentAtr / currentPrice) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          {/* 動態風控 1: checkAtrInitialStop */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-200">checkAtrInitialStop</span>
                <span className="text-[10px] text-red-400 bg-red-950/60 px-1 rounded">初始停損</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-400">
                {atrInitialStopMultiplier > 0 ? `${atrInitialStopMultiplier}x ATR` : '停用'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              停損價 = 進場價格 - (倍數 × 進場日 ATR)。波動大給予寬容度，波動小嚴密截斷虧損。
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {[0, 1.5, 2.0, 2.5, 3.0].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAtrInitialStopMultiplier(val)}
                  className={`flex-1 py-1 text-xs rounded font-mono transition-colors ${
                    atrInitialStopMultiplier === val
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {val === 0 ? '停用' : `${val}x`}
                </button>
              ))}
            </div>
            {atrInitialStopMultiplier > 0 && currentAtr > 0 && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                以現價計算約折讓 NT$ {(currentAtr * atrInitialStopMultiplier).toFixed(2)} 點
              </span>
            )}
          </div>

          {/* 動態風控 2: checkAtrTrailingStop */}
          <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-200">checkAtrTrailingStop</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded">動態移動停利</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {atrTrailingStopMultiplier > 0 ? `${atrTrailingStopMultiplier}x ATR` : '停用'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              移動停利價 = 持股期間最高價 - (倍數 × 當前 ATR)。由最高峰回檔鎖住利潤，讓獲利奔馳。
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {[0, 2.0, 2.5, 3.0, 4.0].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAtrTrailingStopMultiplier(val)}
                  className={`flex-1 py-1 text-xs rounded font-mono transition-colors ${
                    atrTrailingStopMultiplier === val
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {val === 0 ? '停用' : `${val}x`}
                </button>
              ))}
            </div>
            {atrTrailingStopMultiplier > 0 && currentAtr > 0 && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                創高後自最高點回撤 NT$ {(currentAtr * atrTrailingStopMultiplier).toFixed(2)} 時鎖利出場
              </span>
            )}
          </div>

          {/* 回測資金與交易費用說明 */}
          <div className="flex flex-col gap-1 text-[11px] bg-slate-900/40 p-2 rounded border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">回測本金:</span>
              <span className="font-mono text-slate-200 font-semibold">NT$ {initialCapital.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">交易模式:</span>
              <span className="text-emerald-400 font-medium">自由股數/零股機制 (已取消整股限制)</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>交易成本規格:</span>
              <span>手續費 0.1425% · 證交稅 0.3%</span>
            </div>
          </div>

          {/* 操盤回測操作按鈕 */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <button
              onClick={handleRunBacktest}
              disabled={isCalculating || !candles || candles.length < 35}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Play size={16} className={isCalculating ? 'animate-spin' : ''} />
              <span>{isCalculating ? '量化引擎運算中...' : '執行量化回測'}</span>
            </button>

            <button
              onClick={() => onOpenPythonModal(currentConfig)}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="匯出 Python / Plotly Dash 腳本"
            >
              <FileCode2 size={16} className="text-yellow-400" />
              <span className="hidden sm:inline">Python 腳本</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 回測績效報表區塊 (四大核心指標 + 次要專業指標 + 資產權益圖 + 逐筆成交明細) */}
      {result && (
        <div className="flex flex-col gap-3.5 mt-2 border-t border-slate-800/80 pt-4">
          {/* 回測結果標題列與儲存按鈕 */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-slate-100">
                  {result.strategyName}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/80 border border-blue-800 text-blue-300">
                  兩年歷史走勢 ({result.dateRange.start} ~ {result.dateRange.end})
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">
                進場邏輯: {entryLogic} ({activeEntryCount}項) · 出場邏輯: {exitLogic} ({activeExitCount}項) · ATR動態風控: 初始{atrInitialStopMultiplier > 0 ? `${atrInitialStopMultiplier}x` : '停用'} / 移動停利{atrTrailingStopMultiplier > 0 ? `${atrTrailingStopMultiplier}x` : '停用'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs rounded-lg flex items-center gap-1.5 text-slate-200 transition-colors cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">已儲存回測紀錄</span>
                  </>
                ) : (
                  <>
                    <Save size={14} className="text-blue-400" />
                    <span>{isSaving ? '儲存中...' : '儲存回測紀錄'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 操盤手 6 大核心量化績效指標 (交易次數、策略勝率、累積收益率、期望值、最大回測、年化報酬) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* 1. 交易次數 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">交易次數</span>
                <span className="text-[10px] text-slate-500 font-mono">Trades</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100 my-1">
                {result.totalTrades} <span className="text-xs font-normal text-slate-400">筆</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="text-red-400">勝 {result.winningTrades}</span>
                <span>/</span>
                <span className="text-emerald-400">負 {result.losingTrades}</span>
              </div>
            </div>

            {/* 2. 策略勝率 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">策略勝率</span>
                <span className="text-[10px] text-slate-500 font-mono">Win Rate</span>
              </div>
              <div
                className={`text-2xl font-bold font-mono my-1 ${
                  result.winRate >= 50 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {result.winRate}%
              </div>
              <div className="text-[11px] text-slate-400">
                賺賠比: <strong className="text-slate-200 font-mono">{result.winLossRatio}</strong>
              </div>
            </div>

            {/* 3. 累積收益率 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">累積收益率</span>
                <span className="text-[10px] text-slate-500 font-mono">Total Return</span>
              </div>
              <div
                className={`text-2xl font-bold font-mono my-1 ${
                  result.totalReturnPct >= 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {result.totalReturnPct >= 0 ? `+${result.totalReturnPct}%` : `${result.totalReturnPct}%`}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate" title={`期末: NT$ ${result.finalCapital.toLocaleString()}`}>
                期末: NT$ {result.finalCapital.toLocaleString()}
              </div>
            </div>

            {/* 4. 期望值 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">期望值</span>
                <span className="text-[10px] text-slate-500 font-mono">Expectancy</span>
              </div>
              <div
                className={`text-2xl font-bold font-mono my-1 ${
                  result.expectancyPct >= 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {result.expectancyPct >= 0 ? `+${result.expectancyPct}%` : `${result.expectancyPct}%`}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate" title={`每筆: NT$ ${result.expectancyAmount.toLocaleString()}`}>
                每筆期望: NT$ {result.expectancyAmount.toLocaleString()}
              </div>
            </div>

            {/* 5. 最大回測 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">最大回測</span>
                <span className="text-[10px] text-slate-500 font-mono">MDD</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 my-1">
                -{result.maxDrawdownPct}%
              </div>
              <div className="text-[11px] text-slate-400">
                歷史最大資金回撤
              </div>
            </div>

            {/* 6. 年化報酬 */}
            <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">年化報酬</span>
                <span className="text-[10px] text-slate-500 font-mono">CAGR</span>
              </div>
              <div
                className={`text-2xl font-bold font-mono my-1 ${
                  result.cagrPct >= 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {result.cagrPct >= 0 ? `+${result.cagrPct}%` : `${result.cagrPct}%`}
              </div>
              <div className="text-[11px] text-slate-400">
                兩年年化複合成長
              </div>
            </div>
          </div>

          {/* 次要操盤手專業量化指標 (獲利因子、平均獲利、平均虧損、回測區間) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 font-mono">
            <div className="flex items-center justify-between px-2">
              <span className="text-slate-400">獲利因子 (Profit Factor):</span>
              <strong className="text-slate-200">{result.profitFactor}</strong>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-slate-400">平均單筆獲利:</span>
              <strong className="text-red-400">+{result.averageWinPct}%</strong>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-slate-400">平均單筆虧損:</span>
              <strong className="text-emerald-400">{result.averageLossPct}%</strong>
            </div>
            <div className="flex items-center justify-between px-2">
              <span className="text-slate-400">回測本金:</span>
              <strong className="text-slate-200">NT$ {result.initialCapital.toLocaleString()}</strong>
            </div>
          </div>

          {/* 當前期末部位持倉狀態提示 (未觸發出場條件，真實抱牢) */}
          {result.openPosition && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-emerald-300">期末持倉中（未觸發停損/停利/出場條件，維持真實持股）</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-mono">
                <div>
                  <span className="text-slate-400">進場日: </span>
                  <span className="text-slate-200">{result.openPosition.entryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">成本: </span>
                  <span className="text-slate-200">${result.openPosition.entryPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400">持股: </span>
                  <span className="text-sky-300 font-bold">{result.openPosition.shares.toLocaleString()} 股</span>
                </div>
                <div>
                  <span className="text-slate-400">最新收盤: </span>
                  <span className="text-slate-200">${result.openPosition.currentPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400">未實現損益: </span>
                  <span className={`font-bold ${result.openPosition.unrealizedReturnAmount >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.openPosition.unrealizedReturnAmount >= 0 ? '+' : ''}{result.openPosition.unrealizedReturnAmount.toLocaleString()} 元 ({result.openPosition.unrealizedReturnPct >= 0 ? '+' : ''}{result.openPosition.unrealizedReturnPct}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 子導覽：資產權益圖 vs 逐筆成交明細 */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1 mt-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              資產權益走勢圖 (Equity Curve)
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'trades'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              逐筆成交明細 ({result.trades.filter(t => t.status !== 'OPEN').length} 筆平倉{result.openPosition ? ' · 1 筆持倉中' : ''})
            </button>
          </div>

          {/* 視圖 1: 資產權益走勢圖 */}
          {activeTab === 'summary' && (
            <div className="w-full bg-slate-950/95 rounded-2xl border border-slate-800/90 p-3.5 sm:p-5 flex flex-col gap-3.5 shadow-2xl relative">
              {/* Header Container (div:nth-of-type(1)) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
                <span className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <Activity size={18} className="text-blue-400" />
                  <span>兩年資產權益走勢曲線 (Equity Curve)</span>
                </span>

                {/* Interactive Dynamic Metrics & View Mode Switcher */}
                {(() => {
                  const curve = result.equityCurve;
                  if (!curve || curve.length === 0) return null;
                  const activePoint =
                    hoverEquityIndex !== null && hoverEquityIndex >= 0 && hoverEquityIndex < curve.length
                      ? curve[hoverEquityIndex]
                      : curve[curve.length - 1];
                  const pnl = activePoint.equity - result.initialCapital;
                  const pnlPct = Number(((pnl / result.initialCapital) * 100).toFixed(2));
                  const isHovering = hoverEquityIndex !== null;

                  return (
                    <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
                      {/* Metric Tag Badges */}
                      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
                        <span className="text-slate-400">
                          {isHovering ? `📅 ${activePoint.date}` : `期末 (${activePoint.date})`}:
                        </span>
                        <span className="font-bold text-slate-100">
                          NT$ {activePoint.equity.toLocaleString()}
                        </span>
                        <span
                          className={`font-semibold ${
                            pnlPct >= 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {pnlPct >= 0 ? `+${pnlPct}%` : `${pnlPct}%`}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400">
                          回撤: <strong className="text-emerald-400">-{activePoint.drawdownPct}%</strong>
                        </span>
                      </div>

                      {/* Mode Toggle: Equity vs Drawdown */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setChartViewMode('equity')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                            chartViewMode === 'equity'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📈 權益淨值
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartViewMode('drawdown')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                            chartViewMode === 'drawdown'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📉 水下回撤
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Chart Plot Container (div:nth-of-type(2)) */}
              <div className="w-full h-64 sm:h-72 relative select-none">
                <svg
                  className="w-full h-full cursor-crosshair overflow-visible"
                  viewBox="0 0 800 240"
                  preserveAspectRatio="none"
                  onPointerMove={(e) => {
                    const curve = result.equityCurve;
                    if (!curve || curve.length === 0) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX = e.clientX - rect.left;
                    const svgW = rect.width;
                    const viewBoxX = (relX / svgW) * 800;
                    const plotLeft = 72;
                    const plotW = 704;
                    const ratio = Math.max(0, Math.min(1, (viewBoxX - plotLeft) / plotW));
                    const idx = Math.round(ratio * (curve.length - 1));
                    setHoverEquityIndex(idx);
                  }}
                  onPointerLeave={() => setHoverEquityIndex(null)}
                >
                  <defs>
                    {/* Linear Gradient for Equity Area */}
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Linear Gradient for Drawdown Area */}
                    <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.0" />
                      <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.5" />
                    </linearGradient>

                    {/* Filter Glow */}
                    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* SVG Content Generator */}
                  {(() => {
                    const curve = result.equityCurve;
                    if (!curve || curve.length === 0) {
                      return (
                        <text x="400" y="120" textAnchor="middle" fill="#64748b" fontSize="13">
                          暫無足夠權益數據
                        </text>
                      );
                    }

                    const width = 800;
                    const height = 240;
                    const marginLeft = 72;
                    const marginRight = 24;
                    const marginTop = 24;
                    const marginBottom = 34;
                    const plotW = width - marginLeft - marginRight;
                    const plotH = height - marginTop - marginBottom;

                    if (chartViewMode === 'drawdown') {
                      // Drawdown Mode (0% at top down to maxDD * 1.15)
                      const maxDD = Math.max(5, ...curve.map(p => p.drawdownPct));
                      const yMaxDD = maxDD * 1.15;
                      const yForDD = (dd: number) => marginTop + (dd / yMaxDD) * plotH;
                      const xForIdx = (idx: number) => marginLeft + (idx / Math.max(1, curve.length - 1)) * plotW;

                      const ddPoints = curve
                        .map((p, i) => `${xForIdx(i).toFixed(1)},${yForDD(p.drawdownPct).toFixed(1)}`)
                        .join(' ');
                      const ddArea = `M ${xForIdx(0).toFixed(1)} ${marginTop} ` +
                        curve.map((p, i) => `L ${xForIdx(i).toFixed(1)} ${yForDD(p.drawdownPct).toFixed(1)}`).join(' ') +
                        ` L ${xForIdx(curve.length - 1).toFixed(1)} ${marginTop} Z`;

                      const gridLines = [0, 0.33, 0.66, 1];

                      return (
                        <g>
                          {/* Grid & Y Labels */}
                          {gridLines.map((ratio, idx) => {
                            const y = marginTop + ratio * plotH;
                            const ddVal = (ratio * yMaxDD).toFixed(1);
                            return (
                              <g key={idx}>
                                <line
                                  x1={marginLeft}
                                  y1={y}
                                  x2={marginLeft + plotW}
                                  y2={y}
                                  stroke="#1e293b"
                                  strokeDasharray="3 3"
                                />
                                <text
                                  x={marginLeft - 8}
                                  y={y + 3.5}
                                  textAnchor="end"
                                  fill="#64748b"
                                  fontSize="10"
                                  fontFamily="monospace"
                                >
                                  -{ddVal}%
                                </text>
                              </g>
                            );
                          })}

                          {/* 0% Top Line */}
                          <line
                            x1={marginLeft}
                            y1={marginTop}
                            x2={marginLeft + plotW}
                            y2={marginTop}
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />
                          <text x={marginLeft + 4} y={marginTop - 6} fill="#3b82f6" fontSize="10" fontFamily="monospace">
                            新高水準面 (0% 回撤)
                          </text>

                          {/* Shaded Underwater Area */}
                          <path d={ddArea} fill="url(#drawdownGrad)" />

                          {/* Drawdown Line */}
                          <polyline fill="none" stroke="#f43f5e" strokeWidth="2" points={ddPoints} />

                          {/* Date Axis */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const ptIdx = Math.min(curve.length - 1, Math.round(ratio * (curve.length - 1)));
                            const x = xForIdx(ptIdx);
                            const anchor = idx === 0 ? 'start' : idx === 4 ? 'end' : 'middle';
                            return (
                              <text
                                key={idx}
                                x={x}
                                y={marginTop + plotH + 18}
                                textAnchor={anchor}
                                fill="#64748b"
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {curve[ptIdx].date.slice(2)}
                              </text>
                            );
                          })}

                          {/* Hover Crosshair in DD mode */}
                          {hoverEquityIndex !== null && hoverEquityIndex < curve.length && (
                            <g>
                              <line
                                x1={xForIdx(hoverEquityIndex)}
                                y1={marginTop}
                                x2={xForIdx(hoverEquityIndex)}
                                y2={marginTop + plotH}
                                stroke="#f43f5e"
                                strokeDasharray="3 3"
                                strokeWidth="1.5"
                              />
                              <circle
                                cx={xForIdx(hoverEquityIndex)}
                                cy={yForDD(curve[hoverEquityIndex].drawdownPct)}
                                r="4.5"
                                fill="#f43f5e"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                            </g>
                          )}
                        </g>
                      );
                    }

                    // Default: Equity Mode
                    const equities = curve.map(p => p.equity);
                    const initCap = result.initialCapital;
                    const minE = Math.min(...equities, initCap) * 0.97;
                    const maxE = Math.max(...equities, initCap) * 1.03;
                    const rangeE = maxE - minE || 1;

                    const yForEq = (eq: number) => marginTop + plotH - ((eq - minE) / rangeE) * plotH;
                    const xForIdx = (idx: number) => marginLeft + (idx / Math.max(1, curve.length - 1)) * plotW;
                    const baselineY = yForEq(initCap);

                    const eqPoints = curve
                      .map((p, i) => `${xForIdx(i).toFixed(1)},${yForEq(p.equity).toFixed(1)}`)
                      .join(' ');
                    const areaPath = `M ${xForIdx(0).toFixed(1)} ${marginTop + plotH} ` +
                      curve.map((p, i) => `L ${xForIdx(i).toFixed(1)} ${yForEq(p.equity).toFixed(1)}`).join(' ') +
                      ` L ${xForIdx(curve.length - 1).toFixed(1)} ${marginTop + plotH} Z`;

                    // Peak equity identification
                    const peakEq = Math.max(...equities);
                    const peakIdx = equities.indexOf(peakEq);
                    const peakX = xForIdx(peakIdx);
                    const peakY = yForEq(peakEq);

                    // 4 Grid Levels
                    const gridRatios = [0, 0.33, 0.66, 1];

                    return (
                      <g>
                        {/* Horizontal Gridlines & Y-Axis Scale Labels */}
                        {gridRatios.map((ratio, idx) => {
                          const y = marginTop + ratio * plotH;
                          const eqVal = maxE - ratio * (maxE - minE);
                          const formattedVal =
                            eqVal >= 1000000
                              ? `${(eqVal / 10000).toFixed(0)}萬`
                              : `${(eqVal / 1000).toFixed(0)}k`;
                          return (
                            <g key={idx}>
                              <line
                                x1={marginLeft}
                                y1={y}
                                x2={marginLeft + plotW}
                                y2={y}
                                stroke="#1e293b"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={marginLeft - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                fill="#64748b"
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                {formattedVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Initial Capital Baseline (Amber Dashed) */}
                        <line
                          x1={marginLeft}
                          y1={baselineY}
                          x2={marginLeft + plotW}
                          y2={baselineY}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                          strokeWidth="1.2"
                          opacity="0.65"
                        />
                        <text
                          x={marginLeft + 6}
                          y={baselineY - 5}
                          fill="#f59e0b"
                          fontSize="9.5"
                          opacity="0.9"
                          fontFamily="monospace"
                        >
                          初始本金 NT$ {(initCap / 10000).toFixed(0)}萬
                        </text>

                        {/* Gradient Area Fill */}
                        <path d={areaPath} fill="url(#equityGrad)" />

                        {/* Equity Curve Line */}
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          filter="url(#glowEffect)"
                          points={eqPoints}
                        />

                        {/* Peak Equity Pin Marker */}
                        {peakIdx >= 0 && (
                          <g>
                            <circle cx={peakX} cy={peakY} r="4" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" />
                            <rect
                              x={Math.max(marginLeft, Math.min(width - 120, peakX - 45))}
                              y={Math.max(4, peakY - 22)}
                              width="90"
                              height="16"
                              rx="3"
                              fill="#1e293b"
                              stroke="#ca8a04"
                              strokeWidth="0.8"
                              opacity="0.9"
                            />
                            <text
                              x={Math.max(marginLeft, Math.min(width - 120, peakX - 45)) + 45}
                              y={Math.max(4, peakY - 22) + 11}
                              textAnchor="middle"
                              fill="#fde047"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              峰值 NT$ {(peakEq / 10000).toFixed(1)}萬
                            </text>
                          </g>
                        )}

                        {/* X-Axis Date Ticks (5 points) */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                          const ptIdx = Math.min(curve.length - 1, Math.round(ratio * (curve.length - 1)));
                          const x = xForIdx(ptIdx);
                          const anchor = idx === 0 ? 'start' : idx === 4 ? 'end' : 'middle';
                          return (
                            <text
                              key={idx}
                              x={x}
                              y={marginTop + plotH + 18}
                              textAnchor={anchor}
                              fill="#64748b"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {curve[ptIdx].date.slice(2)}
                            </text>
                          );
                        })}

                        {/* Active Hover / Touch Indicator */}
                        {hoverEquityIndex !== null && hoverEquityIndex < curve.length && (
                          <g>
                            {/* Vertical Crosshair Line */}
                            <line
                              x1={xForIdx(hoverEquityIndex)}
                              y1={marginTop}
                              x2={xForIdx(hoverEquityIndex)}
                              y2={marginTop + plotH}
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                              strokeWidth="1.2"
                              opacity="0.85"
                            />
                            {/* Horizontal Line to Y-Axis */}
                            <line
                              x1={marginLeft}
                              y1={yForEq(curve[hoverEquityIndex].equity)}
                              x2={xForIdx(hoverEquityIndex)}
                              y2={yForEq(curve[hoverEquityIndex].equity)}
                              stroke="#e2e8f0"
                              strokeDasharray="2 2"
                              strokeWidth="1"
                              opacity="0.5"
                            />
                            {/* Intersection Circle */}
                            <circle
                              cx={xForIdx(hoverEquityIndex)}
                              cy={yForEq(curve[hoverEquityIndex].equity)}
                              r="5"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* 視圖 2: 逐筆成交明細列表 */}
          {activeTab === 'trades' && (
            <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">進場日</th>
                    <th className="py-2.5 px-3">進場價</th>
                    <th className="py-2.5 px-3">出場日</th>
                    <th className="py-2.5 px-3">出場價</th>
                    <th className="py-2.5 px-3">部位股數</th>
                    <th className="py-2.5 px-3">持股天數</th>
                    <th className="py-2.5 px-3">報酬率</th>
                    <th className="py-2.5 px-3">獲利金額</th>
                    <th className="py-2.5 px-3">出場觸發原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.trades.map((t, idx) => (
                    <tr
                      key={t.id || idx}
                      className={
                        t.status === 'OPEN'
                          ? 'bg-emerald-950/30 border-l-2 border-emerald-500 hover:bg-emerald-900/20'
                          : 'hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-2 px-3">{t.entryDate}</td>
                      <td className="py-2 px-3 text-slate-200">{t.entryPrice}</td>
                      <td className="py-2 px-3">
                        {t.status === 'OPEN' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50">
                            未平倉續抱
                          </span>
                        ) : (
                          t.exitDate
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-200">
                        {t.status === 'OPEN' ? `${t.exitPrice} (市價)` : t.exitPrice}
                      </td>
                      <td className="py-2 px-3 text-sky-300 font-semibold">{t.shares.toLocaleString()} 股</td>
                      <td className="py-2 px-3 text-slate-400">{t.holdingDays}天</td>
                      <td className={`py-2 px-3 font-semibold ${t.returnPct >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.returnPct >= 0 ? `+${t.returnPct}%` : `${t.returnPct}%`}
                        {t.status === 'OPEN' && <span className="text-[10px] text-slate-400 block font-normal">(未實現)</span>}
                      </td>
                      <td className={`py-2 px-3 font-semibold ${t.returnAmount >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.returnAmount >= 0 ? `+${t.returnAmount.toLocaleString()}` : t.returnAmount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{t.exitReason}</td>
                    </tr>
                  ))}
                  {result.trades.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                        在此條件設定下無進場交易觸發，建議切換 OR 邏輯或放寬進場條件
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
