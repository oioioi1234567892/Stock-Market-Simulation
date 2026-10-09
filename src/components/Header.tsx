import React, { useState, useRef, useEffect } from 'react';
import { POPULAR_TAIWAN_STOCKS, TaiwanStockInfo, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { Search, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentSymbol: string;
  onSelectStock: (symbol: string, name: string) => void;
  activeView?: 'trading' | 'fundamentals';
  onSwitchView?: (view: 'trading' | 'fundamentals') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectStock,
  activeView = 'trading',
  onSwitchView,
}) => {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Taiwan market trading status (09:00 - 13:30 Taiwan Time GMT+8, Mon-Fri)
  const getMarketStatus = () => {
    const now = new Date();
    const twTime = new Date(now.getTime() + 8 * 3600 * 1000);
    const day = twTime.getUTCDay();
    const hours = twTime.getUTCHours();
    const mins = twTime.getUTCMinutes();
    const totalMins = hours * 60 + mins;

    const isWeekday = day >= 1 && day <= 5;
    const isTradingHours = totalMins >= 9 * 60 && totalMins <= 13 * 60 + 30;

    if (isWeekday && isTradingHours) {
      return { text: '台股盤中 (09:00~13:30)', active: true };
    }
    return { text: '台股收盤 / 盤後撮合', active: false };
  };

  const marketStatus = getMarketStatus();

  const lowerQuery = query.toLowerCase().trim();
  const filteredStocks = lowerQuery
    ? POPULAR_TAIWAN_STOCKS.filter(
        s => s.code.toLowerCase().includes(lowerQuery) ||
             s.name.toLowerCase().includes(lowerQuery) ||
             s.symbol.toLowerCase().includes(lowerQuery) ||
             s.aliases?.some(a => a.toLowerCase().includes(lowerQuery))
      )
    : POPULAR_TAIWAN_STOCKS.slice(0, 10);

  const handlePickStock = (s: TaiwanStockInfo) => {
    // Dismiss mobile soft keyboard
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
    onSelectStock(s.symbol, s.name);
    setSearchOpen(false);
    setQuery('');
  };

  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
    const clean = query.trim().toUpperCase();
    const matched = POPULAR_TAIWAN_STOCKS.find(
      s => s.code.toUpperCase() === clean ||
           s.name === query.trim() ||
           s.symbol.toUpperCase() === clean ||
           s.aliases?.some(a => a.toUpperCase() === clean || a === query.trim())
    );
    if (matched) {
      onSelectStock(matched.symbol, matched.name);
    } else {
      const resolved = resolveTaiwanSymbol(query);
      onSelectStock(resolved.symbol, resolved.name);
    }
    setSearchOpen(false);
    setQuery('');
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        (searchContainerRef.current && searchContainerRef.current.contains(target)) ||
        (mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(target)) ||
        (mobileSearchBtnRef.current && mobileSearchBtnRef.current.contains(target))
      ) {
        return;
      }
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand & Market Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-red-500 to-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-base">
              台
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-sm sm:text-base tracking-tight">
                台股智選量化操盤室
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{marketStatus.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher: Live Trading vs Tech Fundamentals */}
        {onSwitchView && (
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs shadow-xs">
            <button
              onClick={() => onSwitchView('trading')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeView === 'trading'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              即時行情與回測
            </button>
            <button
              onClick={() => onSwitchView('fundamentals')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'fundamentals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={12} className={activeView === 'fundamentals' ? 'text-amber-300' : 'text-amber-400'} />
              <span>AI 精選個股 (Top 20)</span>
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xs hidden lg:block">
          <form onSubmit={handleDirectSearch} className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜尋台股代號/名稱 (如 2330, 鴻海, 廣達)..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </form>

          {/* Search Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              <div className="p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                熱門台股標的
              </div>
              {filteredStocks.map(stock => (
                <div
                  key={stock.symbol}
                  onClick={() => handlePickStock(stock)}
                  className={`p-2.5 flex items-center justify-between hover:bg-slate-800/80 cursor-pointer transition-colors ${
                    currentSymbol === stock.symbol ? 'bg-blue-950/40 text-blue-400' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{stock.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{stock.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {stock.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{stock.market}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Tools: Mobile Search */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            ref={mobileSearchBtnRef}
            onClick={() => setSearchOpen(!searchOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
              searchOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
            title="搜尋台股"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div ref={mobileSearchContainerRef} className="lg:hidden px-3 pb-3 bg-slate-950 border-b border-slate-800 shadow-2xl animate-fadeIn">
          <form onSubmit={handleDirectSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                autoFocus
                type="search"
                enterKeyHint="search"
                placeholder="輸入台股代號或名稱 (如 2330, 鴻海, 3324)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              搜尋
            </button>
          </form>

          <div className="max-h-56 overflow-y-auto mt-2 divide-y divide-slate-800/60 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
            <div className="p-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/60 flex items-center justify-between">
              <span>{lowerQuery ? '搜尋結果' : '熱門標的快速選股'}</span>
              <span className="text-[10px] text-slate-500 font-normal">點選立即載入圖表</span>
            </div>
            {filteredStocks.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => handlePickStock(stock)}
                className={`p-2.5 flex items-center justify-between text-xs cursor-pointer active:bg-blue-900/60 hover:bg-slate-800/80 transition-colors ${
                  currentSymbol === stock.symbol ? 'bg-blue-950/50 text-blue-400 font-semibold' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{stock.name}</span>
                  <span className="font-mono text-slate-400 text-xs">{stock.code}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({stock.symbol})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {stock.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{stock.market}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
