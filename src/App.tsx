import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './lib/firebase.ts';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { StockQuote, CandleData, TradeRecord, WatchlistItem, StrategyConfig } from './types/stock.ts';
import { fetchStockQuote, fetchStockHistory, syncUserProfile, getWatchlist, addWatchlist, deleteWatchlist } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { StockSummary } from './components/StockSummary.tsx';
import { InteractiveChart } from './components/InteractiveChart.tsx';
import { FiveLevelDepth } from './components/FiveLevelDepth.tsx';
import { TraderSignalRadar } from './components/TraderSignalRadar.tsx';
import { StrategyBacktester } from './components/StrategyBacktester.tsx';
import { WatchlistManager } from './components/WatchlistManager.tsx';
import { PythonScriptModal } from './components/PythonScriptModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { MobileNav, ActiveMobileTab } from './components/MobileNav.tsx';
import { RefreshCw, TrendingUp, Activity, Sparkles } from 'lucide-react';

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

  // Auth & Modals
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [activeStrategy, setActiveStrategy] = useState<StrategyConfig | undefined>();

  // Mobile Active Tab
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveMobileTab>('chart');

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncUserProfile();
        } catch (e) {
          console.error('Failed to sync profile', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Watchlist for active stock starring check
  const refreshWatchlist = useCallback(async () => {
    try {
      const items = await getWatchlist();
      setUserWatchlist(items);
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshWatchlist();
  }, [user, refreshWatchlist]);

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
    // Switch to chart view on mobile when picking a stock
    setActiveMobileTab('chart');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 sm:pb-8">
      {/* Top Header */}
      <Header
        currentSymbol={currentSymbol}
        onSelectStock={handleSelectStock}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3.5 sm:gap-4">
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
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-md transition-colors"
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
            onOpenDepth={() => setActiveMobileTab('depth')}
          />
        </div>

        {/* Mobile View Tab Filter Switcher */}
        <div className="sm:hidden flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs gap-1">
          <button
            onClick={() => setActiveMobileTab('chart')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-center transition-all ${
              activeMobileTab === 'chart' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
            }`}
          >
            K線指標
          </button>
          <button
            onClick={() => setActiveMobileTab('depth')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-center transition-all ${
              activeMobileTab === 'depth' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
            }`}
          >
            五檔盤口
          </button>
          <button
            onClick={() => setActiveMobileTab('radar')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-center transition-all ${
              activeMobileTab === 'radar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
            }`}
          >
            信號雷達
          </button>
          <button
            onClick={() => setActiveMobileTab('backtest')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-center transition-all ${
              activeMobileTab === 'backtest' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
            }`}
          >
            量化回測
          </button>
          <button
            onClick={() => setActiveMobileTab('watchlist')}
            className={`flex-1 py-1.5 rounded-md font-semibold text-center transition-all ${
              activeMobileTab === 'watchlist' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
            }`}
          >
            自選股
          </button>
        </div>

        {/* Desktop View Layout / Responsive Views */}
        <div className="flex flex-col gap-5">
          {/* Chart Section (Visible on desktop or when mobile activeTab === 'chart') */}
          <div className={`${activeMobileTab === 'chart' ? 'block' : 'hidden sm:block'}`}>
            <InteractiveChart
              candles={candles}
              symbol={currentSymbol}
              stockName={stockName}
              trades={backtestTrades}
              isLoading={isCandlesLoading}
              selectedRange={currentRange}
              onRangeChange={setCurrentRange}
            />
          </div>

          {/* Desktop & Mobile Dual Pro Panels: Five-Depth Order Book & Signal Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Five-Depth Order Book (Visible on desktop or when mobile activeTab === 'depth') */}
            <div className={`${activeMobileTab === 'depth' ? 'block' : 'hidden sm:block'}`}>
              <FiveLevelDepth quote={quote} stockName={stockName} />
            </div>

            {/* Signal Radar (Visible on desktop or when mobile activeTab === 'radar') */}
            <div className={`${activeMobileTab === 'radar' ? 'block' : 'hidden sm:block'}`}>
              <TraderSignalRadar candles={candles} quote={quote} stockName={stockName} />
            </div>
          </div>

          {/* Strategy Backtest Section (Visible on desktop or when mobile activeTab === 'backtest') */}
          <div className={`${activeMobileTab === 'backtest' ? 'block' : 'hidden sm:block'}`}>
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

          {/* Watchlist & History (Visible on desktop or when mobile activeTab === 'watchlist') */}
          <div className={`${activeMobileTab === 'watchlist' ? 'block' : 'hidden sm:block'}`}>
            <WatchlistManager
              currentSymbol={currentSymbol}
              onSelectStock={handleSelectStock}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Google Sign-in Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          loadQuote(currentSymbol);
          refreshWatchlist();
        }}
      />
    </div>
  );
}
