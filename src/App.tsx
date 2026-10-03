import React, { useState, useEffect, useCallback } from 'react';
import { StockQuote, CandleData, TradeRecord, WatchlistItem, StrategyConfig } from './types/stock.ts';
import { fetchStockQuote, fetchStockHistory, getWatchlist, addWatchlist, deleteWatchlist } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { StockSummary } from './components/StockSummary.tsx';
import { InteractiveChart } from './components/InteractiveChart.tsx';
import { FiveLevelDepth } from './components/FiveLevelDepth.tsx';
import { TraderSignalRadar } from './components/TraderSignalRadar.tsx';
import { StrategyBacktester } from './components/StrategyBacktester.tsx';
import { WatchlistManager } from './components/WatchlistManager.tsx';
import { PythonScriptModal } from './components/PythonScriptModal.tsx';
import { RiskCalculatorModal } from './components/RiskCalculatorModal.tsx';
import { MobileNav, ActiveMobileTab } from './components/MobileNav.tsx';
import { RefreshCw, TrendingUp, Activity, Sparkles, ShieldCheck } from 'lucide-react';

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

  // Modals & Tools
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState<boolean>(false);
  const [activeStrategy, setActiveStrategy] = useState<StrategyConfig | undefined>();

  // Mobile Active Tab
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveMobileTab>('chart');

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

  // Fetch Quote from Yahoo Finance
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

  // Fetch Historical Candles from Yahoo Finance
  const loadCandles = useCallback(async (sym: string, range: string, interval: string) => {
    try {
      setIsCandlesLoading(true);
      setErrorMsg(null);
      const data = await fetchStockHistory(sym, range, interval);
      setCandles(data.candles);
      if (range === '2y') {
        setTwoYearCandles(data.candles);
      }
    } catch (e: any) {
      console.error('loadCandles error:', e);
      setErrorMsg(e.message || '無法取得歷史 K 線行情');
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
    setActiveMobileTab('chart');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16 sm:pb-6">
      {/* Top Navbar */}
      <Header
        currentSymbol={currentSymbol}
        onSelectStock={handleSelectStock}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-4 flex flex-col gap-3">
        {/* Error Notification Banner if any */}
        {errorMsg && (
          <div className="bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs px-3 py-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{errorMsg} (已啟用高保真備援技術分析數據流)</span>
            </div>
            <button
              onClick={() => {
                loadQuote(currentSymbol);
                loadCandles(currentSymbol, currentRange, currentInterval);
              }}
              className="text-amber-200 underline text-xs hover:text-white"
            >
              重新整理
            </button>
          </div>
        )}

        {/* Top Stock Summary Bar */}
        <StockSummary
          quote={quote}
          isLoading={isQuoteLoading}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
          onOpenDepth={() => setActiveMobileTab('depth')}
        />

        {/* Mobile & Desktop View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Main Chart Column (3 Cols on Desktop / Shown when activeTab === 'chart') */}
          <div className={`lg:col-span-3 flex flex-col gap-3 ${activeMobileTab === 'chart' ? 'block' : 'hidden lg:flex'}`}>
            <InteractiveChart
              candles={candles}
              symbol={currentSymbol}
              stockName={stockName}
              trades={backtestTrades}
              isLoading={isCandlesLoading}
              selectedRange={currentRange}
              onRangeChange={(range: string) => {
                setCurrentRange(range);
                loadCandles(currentSymbol, range, currentInterval);
              }}
              onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
            />
          </div>

          {/* Right Sidebar Column (1 Col on Desktop) - Tape Depth & Signal Radar */}
          <div className="flex flex-col gap-3">
            {/* Five Level Depth (Visible on desktop or when activeMobileTab === 'depth') */}
            <div className={`${activeMobileTab === 'depth' ? 'block' : 'hidden lg:block'}`}>
              <FiveLevelDepth quote={quote} stockName={stockName} />
            </div>

            {/* Trader Signal Radar (Visible on desktop or when activeMobileTab === 'radar') */}
            <div className={`${activeMobileTab === 'radar' ? 'block' : 'hidden lg:block'}`}>
              <TraderSignalRadar
                candles={twoYearCandles.length > 0 ? twoYearCandles : candles}
                quote={quote}
                stockName={stockName}
              />
            </div>
          </div>
        </div>

        {/* Lower Section: Backtesting Lab & Watchlist Management */}
        <div className="flex flex-col gap-3">
          {/* Strategy Backtesting Lab (Visible on desktop or when mobile activeTab === 'backtest') */}
          <div className={`${activeMobileTab === 'backtest' ? 'block' : 'hidden sm:block'}`}>
            <StrategyBacktester
              candles={twoYearCandles.length > 0 ? twoYearCandles : candles}
              symbol={currentSymbol}
              stockName={stockName}
              onOpenPythonModal={() => setIsPythonModalOpen(true)}
              onTradesGenerated={setBacktestTrades}
              onStrategyChange={setActiveStrategy}
            />
          </div>

          {/* Watchlist & History (Visible on desktop or when mobile activeTab === 'watchlist') */}
          <div className={`${activeMobileTab === 'watchlist' ? 'block' : 'hidden sm:block'}`}>
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
        onChangeTab={setActiveMobileTab}
      />

      {/* Python Script Export Modal */}
      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        symbol={currentSymbol}
        stockName={stockName}
        strategy={activeStrategy}
      />

      {/* Risk & Position Sizing Calculator Modal */}
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
