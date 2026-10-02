import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Calculator, ArrowRight, DollarSign, AlertTriangle, CheckCircle, Percent } from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  stockName: string;
  currentPrice: number;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  symbol,
  stockName,
  currentPrice,
}) => {
  // Account Capital & Risk
  const [totalCapital, setTotalCapital] = useState<number>(1000000); // 100萬 NTD
  const [riskPercent, setRiskPercent] = useState<number>(2); // 2% 最大單筆風險

  // Entry, Stop Loss, Take Profit
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 100);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    Number(((currentPrice || 100) * 0.94).toFixed(2)) // 預設 -6% 停損
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    Number(((currentPrice || 100) * 1.15).toFixed(2)) // 預設 +15% 停利
  );

  // Broker Discount & Day Trading
  const [commissionDiscount, setCommissionDiscount] = useState<number>(0.28); // 2.8折
  const [isDayTrading, setIsDayTrading] = useState<boolean>(false); // 當沖證交稅 0.15%

  // Update when currentPrice changes
  React.useEffect(() => {
    if (currentPrice > 0) {
      setEntryPrice(currentPrice);
      setStopLossPrice(Number((currentPrice * 0.94).toFixed(2)));
      setTakeProfitPrice(Number((currentPrice * 1.15).toFixed(2)));
    }
  }, [currentPrice]);

  // Calculations
  const calculation = useMemo(() => {
    // Max acceptable loss in NT$
    const maxRiskAmount = totalCapital * (riskPercent / 100);

    // Per share loss from entry to stop loss
    const perShareRisk = Math.max(0.01, entryPrice - stopLossPrice);

    // Raw shares from risk budget
    const rawShares = Math.floor(maxRiskAmount / perShareRisk);

    // Max affordable shares with total capital
    const maxAffordableShares = Math.floor(totalCapital / (entryPrice * 1.001425));

    // Constrained shares (1 lot = 1000 shares in Taiwan)
    const allowedShares = Math.min(rawShares, maxAffordableShares);
    const suggestedLots = Math.max(0, Math.floor(allowedShares / 1000));
    const finalShares = suggestedLots * 1000;

    // Fees & Tax
    const standardFeeRate = 0.001425;
    const actualBuyFeeRate = standardFeeRate * commissionDiscount;
    const taxRate = isDayTrading ? 0.0015 : 0.003; // 當沖 0.15% vs 現股 0.3%

    // Buy cost
    const buyGross = finalShares * entryPrice;
    const buyFee = Math.max(20, Math.floor(buyGross * actualBuyFeeRate));
    const totalBuyCost = buyGross + buyFee;

    // Stop Loss Exit
    const stopLossGross = finalShares * stopLossPrice;
    const stopLossFee = Math.max(20, Math.floor(stopLossGross * actualBuyFeeRate));
    const stopLossTax = Math.floor(stopLossGross * taxRate);
    const stopLossNetCash = stopLossGross - stopLossFee - stopLossTax;
    const actualStopLossAmount = totalBuyCost - stopLossNetCash;
    const stopLossPct = totalBuyCost > 0 ? (actualStopLossAmount / totalBuyCost) * 100 : 0;

    // Take Profit Exit
    const takeProfitGross = finalShares * takeProfitPrice;
    const takeProfitFee = Math.max(20, Math.floor(takeProfitGross * actualBuyFeeRate));
    const takeProfitTax = Math.floor(takeProfitGross * taxRate);
    const takeProfitNetCash = takeProfitGross - takeProfitFee - takeProfitTax;
    const netProfitAmount = takeProfitNetCash - totalBuyCost;
    const takeProfitPct = totalBuyCost > 0 ? (netProfitAmount / totalBuyCost) * 100 : 0;

    // Risk / Reward Ratio
    const riskRewardRatio = actualStopLossAmount > 0 ? (netProfitAmount / actualStopLossAmount).toFixed(2) : '0';

    // Break-even price calculation:
    // Net cash = Exit * (1 - actualFee - tax) = Entry * (1 + actualFee)
    const breakEvenPrice = Number(
      (entryPrice * (1 + actualBuyFeeRate) / (1 - actualBuyFeeRate - taxRate)).toFixed(2)
    );
    const breakEvenSpread = Number((breakEvenPrice - entryPrice).toFixed(2));

    // Capital usage %
    const capitalUsagePct = totalCapital > 0 ? ((totalBuyCost / totalCapital) * 100).toFixed(1) : '0';

    return {
      maxRiskAmount,
      suggestedLots,
      finalShares,
      totalBuyCost,
      actualStopLossAmount,
      stopLossPct: stopLossPct.toFixed(2),
      netProfitAmount,
      takeProfitPct: takeProfitPct.toFixed(2),
      riskRewardRatio,
      breakEvenPrice,
      breakEvenSpread,
      capitalUsagePct,
    };
  }, [
    totalCapital,
    riskPercent,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    commissionDiscount,
    isDayTrading,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto text-slate-100">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                操盤手風控與部位計算機
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {stockName} ({symbol})
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">頂級操盤哲學：部位依風險決定，嚴格控制最大下檔虧損</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 text-xs">
          {/* Quick Info Badge */}
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-blue-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={15} className="text-blue-400" />
              <span>當前市價: <strong className="font-mono text-white text-sm">${entryPrice}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">精確保本出場價:</span>
              <strong className="font-mono text-amber-300 text-xs">
                ${calculation.breakEvenPrice} (+{calculation.breakEvenSpread})
              </strong>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Account Capital */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-medium flex items-center justify-between">
                <span>總操盤資金 (TWD)</span>
                <span className="text-[10px] text-slate-500">帳戶可運用額度</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="50000"
                  value={totalCapital}
                  onChange={e => setTotalCapital(Math.max(10000, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-500 font-mono">元</span>
              </div>
            </div>

            {/* Risk Tolerence */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-medium flex items-center justify-between">
                <span>單筆承擔最大風險</span>
                <span className="text-emerald-400 font-mono font-bold">
                  ${Math.round(calculation.maxRiskAmount).toLocaleString()} 元
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 5].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPercent(pct)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      riskPercent === pct
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Price */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-medium">預計進場價 (元)</label>
              <input
                type="number"
                step="0.1"
                value={entryPrice}
                onChange={e => setEntryPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-blue-500"
              />
            </div>

            {/* Stop Loss Price */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-rose-400 font-medium flex items-center gap-1">
                  <span>🛑 預設停損價 (元)</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setStopLossPrice(Number((entryPrice * 0.95).toFixed(2)))}
                    className="text-slate-400 hover:text-rose-300 underline"
                  >
                    -5%
                  </button>
                  <button
                    type="button"
                    onClick={() => setStopLossPrice(Number((entryPrice * 0.93).toFixed(2)))}
                    className="text-slate-400 hover:text-rose-300 underline"
                  >
                    -7%
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={stopLossPrice}
                onChange={e => setStopLossPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-rose-900/60 rounded-lg px-3 py-2 text-rose-300 font-mono text-sm focus:border-rose-500"
              />
            </div>

            {/* Take Profit Price */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-emerald-400 font-medium flex items-center gap-1">
                  <span>🎯 目標停利價 (元)</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTakeProfitPrice(Number((entryPrice * 1.10).toFixed(2)))}
                    className="text-slate-400 hover:text-emerald-300 underline"
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTakeProfitPrice(Number((entryPrice * 1.18).toFixed(2)))}
                    className="text-slate-400 hover:text-emerald-300 underline"
                  >
                    +18%
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={takeProfitPrice}
                onChange={e => setTakeProfitPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-emerald-900/60 rounded-lg px-3 py-2 text-emerald-300 font-mono text-sm focus:border-emerald-500"
              />
            </div>

            {/* Fee Discount & Day Trade Mode */}
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-medium">券商手續費折讓 & 交易型態</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={commissionDiscount}
                  onChange={e => setCommissionDiscount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-200 text-xs font-mono"
                >
                  <option value={0.28}>網路券商 (2.8折)</option>
                  <option value={0.5}>標準優惠 (5折)</option>
                  <option value={0.6}>常見優惠 (6折)</option>
                  <option value={1}>全額原價 (無折)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsDayTrading(!isDayTrading)}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    isDayTrading
                      ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {isDayTrading ? '當沖 (稅0.15%)' : '現股波段 (稅0.3%)'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <span className="text-slate-400 text-xs">建議最高下單張數</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono flex items-baseline gap-1 mt-0.5">
                  <span>{calculation.suggestedLots}</span>
                  <span className="text-sm font-sans text-slate-400 font-normal">張</span>
                  <span className="text-xs text-slate-500 font-mono">({calculation.finalShares.toLocaleString()} 股)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-400 text-xs">總建倉資金 / 資金佔比</span>
                <div className="text-base font-bold font-mono text-slate-200">
                  ${Math.round(calculation.totalBuyCost).toLocaleString()} 元
                </div>
                <div className="text-xs font-mono text-slate-400">
                  佔帳戶 <strong className="text-white">{calculation.capitalUsagePct}%</strong>
                </div>
              </div>
            </div>

            {/* Risk vs Reward Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
              <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-2.5 flex flex-col">
                <span className="text-[10px] text-rose-400 font-sans">停損最大虧損</span>
                <span className="text-sm font-bold text-rose-300">
                  -${Math.round(calculation.actualStopLossAmount).toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-400 font-sans">-{calculation.stopLossPct}%</span>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5 flex flex-col">
                <span className="text-[10px] text-emerald-400 font-sans">停利預期獲利</span>
                <span className="text-sm font-bold text-emerald-300">
                  +${Math.round(calculation.netProfitAmount).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 font-sans">+{calculation.takeProfitPct}%</span>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-2.5 flex flex-col">
                <span className="text-[10px] text-blue-400 font-sans">風險報酬比</span>
                <span className="text-sm font-bold text-blue-300">
                  1 : {calculation.riskRewardRatio}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {Number(calculation.riskRewardRatio) >= 2.5 ? '⭐️ 極佳交易機會' : '合理賠率'}
                </span>
              </div>

              <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg p-2.5 flex flex-col">
                <span className="text-[10px] text-amber-400 font-sans">保本價格門檻</span>
                <span className="text-sm font-bold text-amber-300">
                  ${calculation.breakEvenPrice}
                </span>
                <span className="text-[10px] text-amber-400 font-sans">
                  漲 +{calculation.breakEvenSpread} 打平交易成本
                </span>
              </div>
            </div>
          </div>

          {/* Trader Golden Rule Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">頂級操盤手實戰鐵律：</strong>
              <span>
                部位是依照「停損距離」反向計算出來的，絕非憑感覺一次買滿。只要每次嚴格將單筆虧損壓在總資產的 1~2% 以內，連續看錯 10 次也不會重傷本金！
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            完成試算並返回
          </button>
        </div>
      </div>
    </div>
  );
};
