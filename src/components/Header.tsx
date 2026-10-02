import React, { useState, useRef, useEffect } from 'react';
import { POPULAR_TAIWAN_STOCKS, TaiwanStockInfo } from '../data/taiwanStocks.ts';
import { Search, TrendingUp, User, LogOut, Shield, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentSymbol: string;
  onSelectStock: (symbol: string, name: string) => void;
  user: any;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenRiskCalc?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSelectStock,
  user,
  onOpenAuth,
  onSignOut,
}) => {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Taiwan market trading status (09:00 - 13:30 Taiwan Time GMT+8, Mon-Fri)
  const getMarketStatus = () => {
    // Current time in UTC
    const now = new Date();
    // UTC+8 offset
    const twTime = new Date(now.getTime() + 8 * 3600 * 1000);
    const day = twTime.getUTCDay();
    const hours = twTime.getUTCHours();
    const mins = twTime.getUTCMinutes();
    const totalMins = hours * 60 + mins;

    const isWeekday = day >= 1 && day <= 5;
    const isTradingHours = totalMins >= 9 * 60 && totalMins <= 13 * 60 + 30;

    if (isWeekday && isTradingHours) {
      return { text: '台股交易中 (09:00~13:30)', active: true };
    }
    return { text: '台股已收盤 / 盤後撮合', active: false };
  };

  const marketStatus = getMarketStatus();

  const filteredStocks = query
    ? POPULAR_TAIWAN_STOCKS.filter(
        s => s.code.includes(query) || s.name.includes(query) || s.symbol.toLowerCase().includes(query.toLowerCase())
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
      s => s.code === clean || s.name === clean || s.symbol.toUpperCase() === clean
    );
    if (matched) {
      onSelectStock(matched.symbol, matched.name);
    } else {
      // Direct symbol e.g. 2330
      const symbol = clean.includes('.') ? clean : `${clean}.TW`;
      onSelectStock(symbol, clean);
    }
    setSearchOpen(false);
    setQuery('');
  };

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

        {/* Search Bar / Modal Trigger */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm hidden sm:block">
          <form onSubmit={handleDirectSearch} className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋股票 (例: 2330 台積電、2454)"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 transition-colors"
            />
          </form>

          {/* Autocomplete Dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 max-h-64 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                熱門權值與指標股
              </div>
              {filteredStocks.map(stock => (
                <div
                  key={stock.symbol}
                  onClick={() => handlePickStock(stock)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800/70 flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{stock.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{stock.symbol}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                    {stock.category}
                  </span>
                </div>
              ))}
              <div
                onClick={() => setSearchOpen(false)}
                className="px-2 py-1 text-[10px] text-center text-slate-500 hover:text-slate-400 border-t border-slate-800/80 mt-1 cursor-pointer"
              >
                關閉選單
              </div>
            </div>
          )}
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Search size={18} />
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.displayName ? user.displayName[0] : 'U'}
                </div>
                <span className="hidden md:inline font-medium text-xs max-w-[100px] truncate">
                  {user.displayName || user.email}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                  <div className="px-2 py-1 text-slate-400 border-b border-slate-800">
                    <span className="block font-semibold text-slate-200 truncate">{user.displayName}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{user.email}</span>
                  </div>
                  <div className="px-2 py-1 text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>專業操盤室高效存儲已就緒</span>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut size={13} />
                    <span>登出帳號</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <User size={13} />
              <span>登入 / 同步</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="sm:hidden px-3 pb-3 bg-slate-950 border-b border-slate-800">
          <form onSubmit={handleDirectSearch} className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              autoFocus
              type="text"
              placeholder="輸入台股代號或名稱 (例如 2330)"
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
