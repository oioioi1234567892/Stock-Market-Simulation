import React from 'react';
import { CandlestickChart, PlayCircle, Bookmark, Sparkles, Scale } from 'lucide-react';

export type ActiveMobileTab = 'chart' | 'backtest' | 'fundamentals' | 'margin' | 'watchlist';

interface MobileNavProps {
  activeTab: ActiveMobileTab;
  onChangeTab: (tab: ActiveMobileTab) => void;
  watchlistCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onChangeTab, watchlistCount }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-1 py-1 flex items-center justify-around safe-area-bottom shadow-2xl">
      <button
        onClick={() => onChangeTab('chart')}
        className={`flex-1 flex flex-col items-center py-1 transition-all ${
          activeTab === 'chart' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CandlestickChart size={17} className={activeTab === 'chart' ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-0.5 tracking-tight">K線技術</span>
      </button>

      <button
        onClick={() => onChangeTab('backtest')}
        className={`flex-1 flex flex-col items-center py-1 transition-all ${
          activeTab === 'backtest' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PlayCircle size={17} className={activeTab === 'backtest' ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-0.5 tracking-tight">量化回測</span>
      </button>

      <button
        onClick={() => onChangeTab('fundamentals')}
        className={`flex-1 flex flex-col items-center py-1 transition-all ${
          activeTab === 'fundamentals' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Sparkles size={17} className={activeTab === 'fundamentals' ? 'text-blue-400' : 'text-amber-400'} />
          <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-75" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">產業策略</span>
      </button>

      <button
        onClick={() => onChangeTab('margin')}
        className={`flex-1 flex flex-col items-center py-1 transition-all ${
          activeTab === 'margin' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Scale size={17} className={activeTab === 'margin' ? 'text-amber-400 stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-0.5 tracking-tight font-medium">籌碼維持率</span>
      </button>

      <button
        onClick={() => onChangeTab('watchlist')}
        className={`flex-1 flex flex-col items-center py-1 transition-all relative ${
          activeTab === 'watchlist' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Bookmark size={17} className={activeTab === 'watchlist' ? 'stroke-[2.5]' : ''} />
          {typeof watchlistCount === 'number' && watchlistCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-blue-600 text-[9px] font-mono font-bold text-white rounded-full leading-none min-w-[14px] text-center shadow-xs">
              {watchlistCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">自選池</span>
      </button>
    </nav>
  );
};

