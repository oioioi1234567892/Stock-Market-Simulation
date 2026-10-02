import React from 'react';
import { CandlestickChart, Activity, Sparkles, Calculator, Bookmark } from 'lucide-react';

export type ActiveMobileTab = 'chart' | 'depth' | 'radar' | 'backtest' | 'watchlist';

interface MobileNavProps {
  activeTab: ActiveMobileTab;
  onChangeTab: (tab: ActiveMobileTab) => void;
  onOpenRiskCalc?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-1 py-1 flex items-center justify-around safe-area-bottom">
      <button
        onClick={() => onChangeTab('chart')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'chart' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CandlestickChart size={18} />
        <span className="text-[10px] mt-0.5">K線技術</span>
      </button>

      <button
        onClick={() => onChangeTab('depth')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'depth' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Activity size={18} />
        <span className="text-[10px] mt-0.5">五檔盤口</span>
      </button>

      <button
        onClick={() => onChangeTab('radar')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'radar' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles size={18} />
        <span className="text-[10px] mt-0.5">信號雷達</span>
      </button>

      <button
        onClick={() => onChangeTab('backtest')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'backtest' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calculator size={18} />
        <span className="text-[10px] mt-0.5">策略回測</span>
      </button>

      <button
        onClick={() => onChangeTab('watchlist')}
        className={`flex-1 flex flex-col items-center py-1 transition-colors ${
          activeTab === 'watchlist' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Bookmark size={18} />
        <span className="text-[10px] mt-0.5">自選股</span>
      </button>
    </nav>
  );
};
