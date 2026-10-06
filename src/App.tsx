import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StockQuote, CandleData, TradeRecord, WatchlistItem, StrategyConfig } from './types/stock.ts';
import { fetchStockQuote, fetchStockHistory, getWatchlist, addWatchlist, deleteWatchlist } from './services/api.ts';
import { evaluateStrategySignal, DEFAULT_STRATEGY } from './utils/backtestEngine.ts';
import { Header } from './components/Header.tsx';
import { StockSummary } from './components/StockSummary.tsx';
import { InteractiveChart } from './components/InteractiveChart.tsx';
import { StrategyBacktester } from './components/StrategyBacktester.tsx';
import { WatchlistManager } from './components/WatchlistManager.tsx';
import { TechFundamentalScanner } from './components/TechFundamentalScanner.tsx';
import { PythonScriptModal } from './components/PythonScriptModal.tsx';
import { RiskCalculatorModal } from './components/RiskCalculatorModal.tsx';
import { MobileNav, ActiveMobileTab } from './components/MobileNav.tsx';
import { RefreshCw, TrendingUp, Sparkles, LineChart } from 'lucide-react';

export default function App() {
  // Active Stock State
  const [currentSymbol, setCurrentSymbol] = useState<string>('2330.TW');
  const [stockName, setStockName] = useState<string>('台積電');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [twoYearCandles, setTwoYearCandles] = useState<CandleData[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<TradeRecord[]>([]);

  // Timeframe range state (default 2y daily K-line)
  const [currentRange, setCurrentRange] = useState<string>('2y');
  const [currentInterval] = useState<string>('1d');

  // Loading & Error States
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(true);
  const [isCandlesLoading, setIsCandlesLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Watchlist state for fast starring
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);

  // Modals & Active Strategy
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [activeStrategy, setActiveStrategy] = useState<StrategyConfig>(DEFAULT_STRATEGY);

  // Desktop Active View & Mobile Active Tab
  const [desktopActiveView, setDesktopActiveView] = useState<'trading' | 'fundamentals'>('fundamentals');
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveMobileTab>('fundamentals');

  // Fetch Watchlist for active stock starring check
  const refreshWatchlist = useCallback(async () => {
    try {
      const items = await getWatchlist();
      setUserWatchlist(items);
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  const isInWatchlist = userWatchlist.some(w => w.symbol === currentSymbol);

  const handleToggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        const found = userWatchlist.find(w => w.symbol === currentSymbol);
        if (found) {
          await deleteWatchlist(found.id);
          setUserWatchlist(prev => prev.filter(w => w.symbol !== currentSymbol));
        }
      } else {
        const res = await addWatchlist({
          symbol: currentSymbol,
          name: stockName,
          market: 'TWSE',
          notes: '快速自選標記',
        });
        if (res.item) {
          setUserWatchlist(prev => [res.item, ...prev]);
        }
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  // Fetch Quote
  const loadQuote = useCallback(async (sym: string) => {
    try {
      setIsQuoteLoading(true);
      const data = await fetchStockQuote(sym);
      setQuote(data);
      if (data.name) setStockName(data.name);
    } catch (e: any) {
      console.error('loadQuote error:', e);
    } finally {
      setIsQuoteLoading(false);
    }
  }, []);

  // Fetch Historical Candles
  const loadCandles = useCallback(async (sym: string, range: string, interval: string) => {
    try {
      setIsCandlesLoading(true);
      setErrorMsg(null);
      const data = await fetchStockHistory(sym, range, interval);
      setCandles(data.candles);
      if (range === '2y') {
        setTwoYearCandles(data.candles);
      }
      if (!data.candles || data.candles.length === 0) {
        setErrorMsg('未能獲得走勢');
      }
    } catch (e: any) {
      console.error('loadCandles error:', e);
      setErrorMsg('未能獲得走勢');
    } finally {
      setIsCandlesLoading(false);
    }
  }, []);

  // Ensure 2-year daily candles are always loaded for backtesting when symbol changes
  useEffect(() => {
    let isCancelled = false;
    const fetchTwoYearHistory = async () => {
      try {
        const data = await fetchStockHistory(currentSymbol, '2y', '1d');
        if (!isCancelled && data.candles && data.candles.length > 0) {
          setTwoYearCandles(data.candles);
        }
      } catch (err) {
        console.error('Failed to load 2y candles for backtest', err);
      }
    };
    fetchTwoYearHistory();
    return () => { isCancelled = true; };
  }, [currentSymbol]);

  // Reload data when symbol, range or interval changes
  useEffect(() => {
    loadQuote(currentSymbol);
    loadCandles(currentSymbol, currentRange, currentInterval);
  }, [currentSymbol, currentRange, currentInterval, loadQuote, loadCandles]);

  // Handle Stock Selection
  const handleSelectStock = (symbol: string, name: string) => {
    setCurrentSymbol(symbol);
    setStockName(name);
    setDesktopActiveView('trading');
    setActiveMobileTab('chart');
  };

  // Compute active stock strategy signal & quantitative metrics (winRate, expectancy, MDD)
  const currentStrategySignal = useMemo(() => {
    const c = twoYearCandles.length > 0 ? twoYearCandles : candles;
    if (!c || c.length < 35) return undefined;
    return evaluateStrategySignal(c, activeStrategy || DEFAULT_STRATEGY, currentSymbol, stockName);
  }, [twoYearCandles, candles, activeStrategy, currentSymbol, stockName]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 sm:pb-8">
      {/* Top Header with Navigation & Live Market Clock */}
      <Header
        currentSymbol={currentSymbol}
        onSelectStock={handleSelectStock}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        activeView={desktopActiveView}
        onSwitchView={(v) => {
          setDesktopActiveView(v);
          if (v === 'fundamentals') setActiveMobileTab('fundamentals');
          else setActiveMobileTab('chart');
        }}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3.5 sm:gap-4">
        {/* Mobile View Tab Filter Switcher */}
        <div className="sm:hidden flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs gap-1 shadow-sm">
          <button
            onClick={() => {
              setActiveMobileTab('fundamentals');
              setDesktopActiveView('fundamentals');
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
              activeMobileTab === 'fundamentals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} className={activeMobileTab === 'fundamentals' ? 'text-amber-300' : 'text-amber-400'} />
            <span>財報估值</span>
          </button>
          <button
            onClick={() => {
              setActiveMobileTab('chart');
              setDesktopActiveView('trading');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
              activeMobileTab === 'chart'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            K線指標
          </button>
          <button
            onClick={() => {
              setActiveMobileTab('backtest');
              setDesktopActiveView('trading');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
              activeMobileTab === 'backtest'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            量化回測
          </button>
          <button
            onClick={() => {
              setActiveMobileTab('watchlist');
              setDesktopActiveView('trading');
            }}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
              activeMobileTab === 'watchlist'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            自選池
          </button>
        </div>

        {/* 1. Tech Fundamental Scanner & Dynamic Valuation Page View */}
        <div className={`${
          activeMobileTab === 'fundamentals' || (desktopActiveView === 'fundamentals' && activeMobileTab !== 'chart' && activeMobileTab !== 'backtest' && activeMobileTab !== 'watchlist')
            ? 'block'
            : 'hidden'
        }`}>
          <TechFundamentalScanner onSelectStockForChart={handleSelectStock} />
        </div>

        {/* 2. Live Trading Terminal & Backtest System View */}
        <div className={`${
          desktopActiveView === 'trading' || (activeMobileTab !== 'fundamentals' && desktopActiveView !== 'fundamentals')
            ? 'flex flex-col gap-3.5 sm:gap-4'
            : 'hidden'
        }`}>
          {/* Real-time Quote Summary Banner */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <TrendingUp size={14} className="text-red-400" />
                即時行情監控面板 · 整合 Yahoo Finance 即時串接
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    loadQuote(currentSymbol);
                    loadCandles(currentSymbol, currentRange, currentInterval);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  title="重新整理數據"
                >
                  <RefreshCw size={12} className={isQuoteLoading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">重新整理</span>
                </button>
              </div>
            </div>

            <StockSummary
              quote={quote}
              isLoading={isQuoteLoading}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlist}
              strategySignal={currentStrategySignal}
            />
          </div>

          {/* Desktop & Mobile Chart Section */}
          <div className={`${activeMobileTab === 'chart' || desktopActiveView === 'trading' ? 'block' : 'hidden sm:block'}`}>
            <InteractiveChart
              candles={candles}
              symbol={currentSymbol}
              stockName={stockName}
              trades={backtestTrades}
              isLoading={isCandlesLoading}
              selectedRange={currentRange}
              onRangeChange={setCurrentRange}
              error={errorMsg}
            />
          </div>

          {/* Strategy Backtest Section */}
          <div className={`${activeMobileTab === 'backtest' || desktopActiveView === 'trading' ? 'block' : 'hidden sm:block'}`}>
            <StrategyBacktester
              candles={twoYearCandles.length > 0 ? twoYearCandles : candles}
              symbol={currentSymbol}
              stockName={stockName}
              onOpenPythonModal={(strat) => {
                if (strat) setActiveStrategy(strat);
                setIsPythonModalOpen(true);
              }}
              onTradesGenerated={setBacktestTrades}
              onStrategyChange={setActiveStrategy}
            />
          </div>

          {/* Watchlist & History */}
          <div className={`${activeMobileTab === 'watchlist' || desktopActiveView === 'trading' ? 'block' : 'hidden sm:block'}`}>
            <WatchlistManager
              currentSymbol={currentSymbol}
              onSelectStock={handleSelectStock}
              activeStrategy={activeStrategy}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileNav
        activeTab={activeMobileTab}
        onChangeTab={(tab) => {
          setActiveMobileTab(tab);
          if (tab === 'fundamentals') setDesktopActiveView('fundamentals');
          else setDesktopActiveView('trading');
        }}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
      />

      {/* Python Script Export Modal */}
      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        symbol={currentSymbol}
        stockName={stockName}
        strategy={activeStrategy}
      />

      {/* Top Trader Risk Management & Position Sizing Calculator Modal */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        symbol={currentSymbol}
        stockName={stockName}
        currentPrice={quote?.price || 100}
      />
    </div>
  );
}
