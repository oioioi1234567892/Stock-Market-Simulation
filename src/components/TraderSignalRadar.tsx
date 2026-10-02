import React, { useMemo } from 'react';
import { CandleData, StockQuote } from '../types/stock.ts';
import { Gauge, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Sparkles, BarChart2 } from 'lucide-react';

interface TraderSignalRadarProps {
  candles: CandleData[];
  quote: StockQuote | null;
  stockName: string;
}

export const TraderSignalRadar: React.FC<TraderSignalRadarProps> = ({ candles, quote, stockName }) => {
  const diagnosis = useMemo(() => {
    if (!candles || candles.length < 20) return null;

    const latest = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    const currentPrice = quote?.price ?? latest.close;

    // 1. Moving Averages Check
    const ma5 = latest.ma5 || currentPrice;
    const ma20 = latest.ma20 || currentPrice;
    const ma60 = latest.ma60 || currentPrice;

    const isMaBullish = ma5 > ma20 && ma20 > ma60;
    const isAboveMa20 = currentPrice >= ma20;
    let maScore = 0;
    let maText = '';
    if (isMaBullish && isAboveMa20) {
      maScore = 25;
      maText = '短中長天期均線呈多頭排列，站穩月線強勢格局';
    } else if (isAboveMa20) {
      maScore = 18;
      maText = '站上月線 (MA20) 支撐，多方掌握短線發球權';
    } else {
      maScore = 5;
      maText = '跌破月線轉為弱勢整理，均線壓力待消化';
    }

    // 2. KD Stochastic Oscillator Check
    const k = latest.k ?? 50;
    const d = latest.d ?? 50;
    const prevK = prev.k ?? 50;
    const prevD = prev.d ?? 50;
    const isKdGoldCross = prevK <= prevD && k > d;
    const isKdHighPass = k >= 80 && d >= 80;
    let kdScore = 0;
    let kdText = '';
    if (isKdHighPass) {
      kdScore = 20;
      kdText = 'KD 進入 80 以上高檔強勢鈍化，屬軋空主升段';
    } else if (isKdGoldCross && k < 40) {
      kdScore = 20;
      kdText = 'KD 低檔超賣區強烈黃金交叉，底部買盤進駐';
    } else if (k > d) {
      kdScore = 15;
      kdText = 'K值高於 D值，動能維持多方偏強格局';
    } else {
      kdScore = 5;
      kdText = 'KD 死亡交叉向下修正中，宜待翻揚訊號';
    }

    // 3. MACD Momentum Check
    const osc = latest.osc ?? 0;
    const prevOsc = prev.osc ?? 0;
    const dif = latest.dif ?? 0;
    let macdScore = 0;
    let macdText = '';
    if (dif > 0 && osc > 0 && osc > prevOsc) {
      macdScore = 20;
      macdText = 'MACD 處於零軸上方多頭強勢區，紅柱持續擴張';
    } else if (osc > 0) {
      macdScore = 15;
      macdText = '柱狀體維持紅柱正值，多頭趨勢仍在';
    } else if (osc > prevOsc && osc < 0) {
      macdScore = 12;
      macdText = '綠柱開始收斂縮短，空方力道衰竭即將反轉';
    } else {
      macdScore = 5;
      macdText = 'MACD 綠柱放大，波段動能偏空整理';
    }

    // 4. Volume Surge Check
    const vol5 = candles.slice(-5).reduce((acc, c) => acc + c.volume, 0) / 5;
    const isVolumeSurge = latest.volume >= vol5 * 1.3 && latest.close >= latest.open;
    let volScore = 0;
    let volText = '';
    if (isVolumeSurge) {
      volScore = 18;
      volText = '成交量放大突破 5日均量 1.3倍 且收紅K，主力帶量點火';
    } else if (latest.volume >= vol5) {
      volScore = 12;
      volText = '成交量能溫和擴增，維持健康換手';
    } else {
      volScore = 7;
      volText = '量縮價穩整理格局，等待主力表態突破';
    }

    // 5. Bollinger Bands Check
    const bbUpper = latest.bbUpper;
    const bbLower = latest.bbLower;
    const bbWidth = latest.bbWidth;
    let bbScore = 10;
    let bbText = '布林通道正常通道震盪';
    if (bbUpper && currentPrice >= bbUpper * 0.99) {
      bbScore = 17;
      bbText = '股價緊貼布林上軌或帶量突破，屬於強勢噴發行情';
    } else if (bbWidth && bbWidth < 8) {
      bbScore = 15;
      bbText = '布林通道極度壓縮收斂（帶寬 < 8%），即將迎來重大變盤方向！';
    } else if (bbLower && currentPrice <= bbLower * 1.01) {
      bbScore = 8;
      bbText = '觸及布林下軌支撐區，短線留意乖離過大技術性反彈';
    }

    // Total Score (0 - 100)
    const totalScore = Math.min(100, Math.max(10, maScore + kdScore + macdScore + volScore + bbScore));

    let adviceTitle = '';
    let adviceColor = '';
    let badgeBg = '';

    if (totalScore >= 80) {
      adviceTitle = '🔥 強烈多方攻擊結構 · 順勢抱牢逢拉回偏多';
      adviceColor = 'text-red-400';
      badgeBg = 'bg-red-950/40 border-red-800/60 text-red-300';
    } else if (totalScore >= 62) {
      adviceTitle = '📈 溫和偏多格局 · 沿月線均線分批布局';
      adviceColor = 'text-amber-400';
      badgeBg = 'bg-amber-950/40 border-amber-800/60 text-amber-300';
    } else if (totalScore >= 45) {
      adviceTitle = '⚖️ 區間震盪整理 · 逢高調節低進勿追高';
      adviceColor = 'text-blue-400';
      badgeBg = 'bg-blue-950/40 border-blue-800/60 text-blue-300';
    } else {
      adviceTitle = '🛡️ 空方修正弱勢 · 嚴設停損觀望勿接刀';
      adviceColor = 'text-emerald-400';
      badgeBg = 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300';
    }

    return {
      totalScore,
      adviceTitle,
      adviceColor,
      badgeBg,
      items: [
        { label: '均線型態', text: maText, passed: maScore >= 18 },
        { label: 'KD 指標', text: kdText, passed: kdScore >= 15 },
        { label: 'MACD 動能', text: macdText, passed: macdScore >= 12 },
        { label: '量能潮汐', text: volText, passed: volScore >= 12 },
        { label: '布林通道', text: bbText, passed: bbScore >= 12 },
      ],
    };
  }, [candles, quote]);

  if (!diagnosis) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top Banner */}
      <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <span className="font-bold text-slate-100 text-xs sm:text-sm">
            操盤手多因子量化評分雷達
          </span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
            {stockName}
          </span>
        </div>

        {/* Gauge Score Pill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">操盤多空評分:</span>
          <div className="text-base sm:text-lg font-black font-mono text-amber-300 flex items-baseline">
            <span>{diagnosis.totalScore}</span>
            <span className="text-[10px] text-slate-400 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* Advice Header */}
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs font-semibold ${diagnosis.badgeBg}`}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>{diagnosis.adviceTitle}</span>
          </div>
          <span className="text-[10px] font-normal opacity-80 hidden sm:inline">量化多因子綜合診斷</span>
        </div>

        {/* Technical Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {diagnosis.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-start gap-2.5"
            >
              <div className="shrink-0 mt-0.5">
                {item.passed ? (
                  <CheckCircle2 size={15} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={15} className="text-slate-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-300 text-[11px]">{item.label}</span>
                <span className="text-slate-400 text-[11px] leading-relaxed mt-0.5">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
