import React, { useState, useRef, useEffect } from 'react';
import { POPULAR_TAIWAN_STOCKS, TaiwanStockInfo, resolveTaiwanSymbol } from '../data/taiwanStocks.ts';
import { Search, TrendingUp, ShieldCheck, Calculator, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentSymbol: string;
  onSelectStock: (symbol: string, name: string) => void;
  onOpenRiskCalc?: () => void;
  activeView?: 'trading' | 'fundamentals';
  onSwitchView?: (view: 'trading' | 'fundamentals') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectStock,
  onOpenRiskCalc,
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
    onSelectStock(s.symbol, s.name);
    setSearchOpen(false);
    setQuery('');
  };

  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
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

  // Close dropdown on click outside
  const searchContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
              <span>科技股財報估值 (Top 20)</span>
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

        {/* Right Tools: Risk Calc */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Risk Calculator Action Button */}
          {onOpenRiskCalc && (
            <button
              onClick={onOpenRiskCalc}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="操盤風控試算器"
            >
              <Calculator size={13} className="text-amber-400" />
              <span className="hidden sm:inline">風控試算</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="lg:hidden px-3 pb-3 bg-slate-950 border-b border-slate-800">
          <form onSubmit={handleDirectSearch} className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="輸入台股代號或名稱 (例如 2330, 鴻海, 3017)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100"
            />
          </form>
          <div className="max-h-48 overflow-y-auto mt-2 divide-y divide-slate-800/60 bg-slate-900 rounded-lg border border-slate-800">
            {filteredStocks.map(stock => (
              <div
                key={stock.symbol}
                onClick={() => handlePickStock(stock)}
                className="p-2 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{stock.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{stock.symbol}</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-1 py-0.5 rounded">
                  {stock.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
