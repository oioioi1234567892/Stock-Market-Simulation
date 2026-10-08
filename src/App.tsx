import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StockQuote, CandleData, TradeRecord, WatchlistItem, StrategyConfig } from './types/stock.ts';
import { fetchStockQuote, fetchStockHistory, getWatchlist, addWatchlist, deleteWatchlist } from './services/api.ts';
import { evaluateStrategySignal, DEFAULT_STRATEGY, DEFAULT_ENTRY_CONDITIONS, DEFAULT_EXIT_CONDITIONS } from './utils/backtestEngine.ts';
import { loadStrategyFromCookie } from './utils/cookieStorage.ts';
import { Header } from './components/Header.tsx';
import { StockSummary } from './components/StockSummary.tsx';
import { InteractiveChart } from './components/InteractiveChart.tsx';
import { StrategyBacktester } from './components/StrategyBacktester.tsx';
import { WatchlistManager } from './components/WatchlistManager.tsx';
import { TechFundamentalScanner } from './components/TechFundamentalScanner.tsx';
import { PythonScriptModal } from './components/PythonScriptModal.tsx';
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

  // Real-time yfinance sync state
  const [isRealtimeRefreshing, setIsRealtimeRefreshing] = useState<boolean>(false);
  const [lastQuoteTime, setLastQuoteTime] = useState<Date | null>(() => new Date());

  // Auto-refresh state (自動更新股價：每 15 秒自動從 yfinance 連線更新)
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(15);

  // Watchlist state for fast starring
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);

  // Modals & Active Strategy (初始化優先讀取 Cookie 快取中的自訂量化策略)
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [activeStrategy, setActiveStrategy] = useState<StrategyConfig>(() => {
    return loadStrategyFromCookie(DEFAULT_ENTRY_CONDITIONS, DEFAULT_EXIT_CONDITIONS) || DEFAULT_STRATEGY;
  });

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
      setLastQuoteTime(new Date());
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

  // Real-time yfinance fetch & refresh function (即時從 yfinance 同步最新報價與2年K線)
  const handleRefreshRealtime = useCallback(async () => {
    try {
      setIsRealtimeRefreshing(true);
      setErrorMsg(null);

      // 1. 從 yfinance 獲取最新即時股價 (繞過快取)
      const quotePromise = fetchStockQuote(currentSymbol, true);
      // 2. 從 yfinance 獲取最新2年K線 (繞過快取並縫合最新盤中價)
      const twoYearPromise = fetchStockHistory(currentSymbol, '2y', '1d', true);
      // 3. 若當前圖表週期非 2y 1d，一併獲取對應走勢
      const activeCandlesPromise =
        currentRange === '2y' && currentInterval === '1d'
          ? twoYearPromise
          : fetchStockHistory(currentSymbol, currentRange, currentInterval, true);

      const [freshQuote, fresh2y, freshActive] = await Promise.all([
        quotePromise,
        twoYearPromise,
        activeCandlesPromise,
      ]);

      if (freshQuote) {
        setQuote(freshQuote);
        if (freshQuote.name) setStockName(freshQuote.name);
      }
      if (fresh2y && fresh2y.candles && fresh2y.candles.length > 0) {
        setTwoYearCandles(fresh2y.candles);
      }
      if (freshActive && freshActive.candles && freshActive.candles.length > 0) {
        setCandles(freshActive.candles);
      }
      setLastQuoteTime(new Date());
    } catch (err) {
      console.error('Failed to update live price from yfinance:', err);
    } finally {
      setIsRealtimeRefreshing(false);
    }
  }, [currentSymbol, currentRange, currentInterval]);

  // Auto-refresh interval effect: 每 15 秒自動從 yfinance 連線更新股價
  useEffect(() => {
    if (!isAutoRefresh) return;

    const timer = setInterval(() => {
      // 避免視窗切至背景時無效消耗請求
      if (typeof document !== 'undefined' && document.hidden) return;

      setAutoRefreshCountdown(prev => {
        if (prev <= 1) {
          handleRefreshRealtime();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefresh, handleRefreshRealtime]);

  // 切換開啟／暫停自動更新
  const handleToggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => {
      const next = !prev;
      if (next) {
        setAutoRefreshCountdown(15);
        handleRefreshRealtime();
      }
      return next;
    });
  }, [handleRefreshRealtime]);

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
    loadQuote(symbol);
    loadCandles(symbol, currentRange, currentInterval);
    if (typeof window !== 'undefined') {
      // On mobile, scroll to top/chart smoothly so user sees the newly loaded stock chart immediately
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
            <span>AI財報</span>
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <TrendingUp size={14} className="text-red-400" />
                <span>即時行情監控面板 · 整合 Yahoo Finance (yfinance) 盤中串接</span>
              </span>
              <div className="flex items-center gap-2">
                {lastQuoteTime && (
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    連線時間：{lastQuoteTime.toLocaleTimeString('zh-TW', { hour12: false })}
                  </span>
                )}
                <button
                  onClick={handleToggleAutoRefresh}
                  className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs font-semibold active:scale-95 border ${
                    isAutoRefresh
                      ? 'bg-emerald-950/80 border-emerald-600/70 hover:bg-emerald-900/80 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                  title={
                    isAutoRefresh
                      ? '自動更新已開啟（每 15 秒自動從 yfinance 連線抓取最新盤中價），點擊可暫停'
                      : '點擊啟動自動更新（每 15 秒自動從 yfinance 連線抓取最新盤中價）'
                  }
                >
                  {isAutoRefresh ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                  )}
                  <RefreshCw size={12} className={isRealtimeRefreshing ? 'animate-spin text-emerald-400' : ''} />
                  <span>
                    {isRealtimeRefreshing
                      ? '自動更新中...'
                      : isAutoRefresh
                      ? `自動更新中 (${autoRefreshCountdown}s)`
                      : '自動更新：已暫停'}
                  </span>
                </button>
              </div>
            </div>

            <StockSummary
              quote={quote}
              isLoading={isQuoteLoading}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={handleToggleWatchlist}
              strategySignal={currentStrategySignal}
              onRefreshQuote={handleRefreshRealtime}
              isRefreshingQuote={isRealtimeRefreshing}
              lastQuoteTime={lastQuoteTime}
            />
          </div>

          {/* Desktop & Mobile Chart Section */}
          <div className={`${activeMobileTab === 'chart' ? 'block' : 'hidden sm:block'}`}>
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
          <div className={`${activeMobileTab === 'backtest' ? 'block' : 'hidden sm:block'}`}>
            <StrategyBacktester
              candles={twoYearCandles.length > 0 ? twoYearCandles : candles}
              symbol={currentSymbol}
              stockName={stockName}
              livePrice={quote?.price}
              onRefreshRealtime={handleRefreshRealtime}
              isRefreshingRealtime={isRealtimeRefreshing}
              lastQuoteTime={lastQuoteTime}
              onOpenPythonModal={(strat) => {
                if (strat) setActiveStrategy(strat);
                setIsPythonModalOpen(true);
              }}
              onTradesGenerated={setBacktestTrades}
              onStrategyChange={setActiveStrategy}
            />
          </div>

          {/* Watchlist & History */}
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
        onChangeTab={(tab) => {
          setActiveMobileTab(tab);
          if (tab === 'fundamentals') setDesktopActiveView('fundamentals');
          else setDesktopActiveView('trading');
        }}
      />

      {/* Python Script Export Modal */}
      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        symbol={currentSymbol}
        stockName={stockName}
        strategy={activeStrategy}
      />
    </div>
  );
}
