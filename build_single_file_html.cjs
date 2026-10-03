const fs = require('fs');

const embeddedData = JSON.parse(fs.readFileSync('embedded_stock_data.json', 'utf8'));

// Format embedded data as a compact JS string
const embeddedDataJs = JSON.stringify(embeddedData);

const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-TW" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Remix 台股智選量化操盤室</title>
  <meta name="description" content="專業級台灣個股即時行情分析、互動式 K 線與 KD/MACD 指標、自訂量化交易策略回測與自選股追蹤系統。" />
  <meta property="og:title" content="Remix 台股智選量化操盤室" />
  <meta property="og:description" content="專業級台灣個股即時行情分析、互動式 K 線與 KD/MACD 指標、自訂量化交易策略回測與自選股追蹤系統。" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            twRed: '#ef4444',
            twGreen: '#10b981',
            navyDark: '#0b0f19',
            cardBg: '#111827',
            panelBorder: '#1f2937'
          }
        }
      }
    };
  </script>

  <!-- TradingView Lightweight Charts CDN -->
  <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>

  <style>
    /* Custom Scrollbar for financial terminal feel */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0f19; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
    
    /* Touch target optimizations for mobile trading */
    button, input, select { -webkit-tap-highlight-color: transparent; }
    
    /* Smooth transitions */
    .tab-active { border-color: #3b82f6; color: #60a5fa; background: rgba(59, 130, 246, 0.1); }
    .metric-card { background: linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%); }
  </style>
</head>
<body class="bg-[#080c14] text-slate-100 min-h-screen font-sans antialiased pb-20 md:pb-6 select-none md:select-auto">

  <!-- Top App Navigation & Market Header -->
  <header class="sticky top-0 z-40 bg-[#0b0f19]/95 backdrop-blur border-b border-slate-800 px-3 py-2.5">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
      <!-- Logo & Stock Name -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-sm shrink-0">
          台
        </div>
        <div class="truncate">
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm md:text-base font-bold tracking-tight text-white truncate" id="hdrStockName">台積電</h1>
            <span class="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium" id="hdrStockCode">2330.TW</span>
            <span class="text-[10px] px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hidden sm:inline-block">上市</span>
          </div>
          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="text-base md:text-lg font-bold" id="hdrPrice">1,025.00</span>
            <span class="font-bold flex items-center gap-0.5 text-red-400" id="hdrChange">+18.00 (+1.79%)</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Watchlist star toggle -->
        <button id="btnToggleWatchlistStar" title="加入/移出自選" class="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-yellow-400 border border-slate-700 transition">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>

        <!-- Download Single File HTML -->
        <button id="btnDownloadHtml" title="下載此 Single File HTML 獨立檔案" class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600/30 transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          <span class="font-medium">下載單檔 HTML</span>
        </button>

        <!-- Run Backtest Quick Button -->
        <button id="btnRunBacktestHeader" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition active:scale-95">
          <svg class="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>執行回測</span>
        </button>
      </div>
    </div>

    <!-- Quick Stock Switcher Pills (Horizontal Scroll for Mobile) -->
    <div class="max-w-7xl mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar" id="stockQuickPills">
      <!-- Generated via JS -->
    </div>
  </header>

  <!-- Desktop Grid & Mobile Container -->
  <main class="max-w-7xl mx-auto px-2 md:px-4 py-3">

    <!-- Active Mobile View Selector (for small screens) -->
    <div class="md:hidden flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 mb-3 text-xs">
      <button class="flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn active bg-blue-600 text-white" data-tab="chart">📊 K線主圖</button>
      <button class="flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn text-slate-400 hover:text-white" data-tab="strategy">⚡ 策略設定</button>
      <button class="flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn text-slate-400 hover:text-white" data-tab="watchlist">⭐ 自選雷達</button>
      <button class="flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn text-slate-400 hover:text-white" data-tab="trades">📋 成交明細</button>
    </div>

    <!-- MAIN TWO COLUMN WORKSPACE (Responsive) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">

      <!-- LEFT COLUMN: Chart + Performance Metrics Cards (lg:col-span-8) -->
      <section id="paneChartAndMetrics" class="lg:col-span-8 flex flex-col gap-3">
        
        <!-- CHART CONTAINER CARD -->
        <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative shadow-lg">
          <!-- Chart Header Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                TradingView 專業圖表
              </span>
              <!-- Legend Pills -->
              <div class="hidden sm:flex items-center gap-2 text-[11px] font-mono">
                <span class="text-yellow-400">MA5</span>
                <span class="text-purple-400">MA20</span>
                <span class="text-cyan-400">MA60</span>
              </div>
            </div>

            <!-- Subchart Switcher Buttons -->
            <div class="flex items-center gap-1 text-xs">
              <span class="text-slate-400 text-[11px] mr-1 hidden sm:inline">副圖:</span>
              <button class="subchart-btn px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 font-medium" data-sub="vol">量 (Vol)</button>
              <button class="subchart-btn px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white font-medium" data-sub="rsi">RSI</button>
              <button class="subchart-btn px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white font-medium" data-sub="kd">KD</button>
              <button class="subchart-btn px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white font-medium" data-sub="macd">MACD</button>
            </div>
          </div>

          <!-- Crosshair Hover Status Bar -->
          <div id="chartHoverBar" class="text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-2 py-1 px-2 rounded bg-slate-900/60 border border-slate-800 min-h-[26px]">
            <span class="text-slate-400">十字游標:</span>
            <span id="hoverInfoText">滑鼠移動或觸控 K 線查看即時數值與策略訊號</span>
          </div>

          <!-- Main Candlestick Chart Canvas Element -->
          <div id="mainChartContainer" class="w-full h-[320px] md:h-[400px] relative"></div>

          <!-- Subchart Indicator Canvas Element -->
          <div id="subChartContainer" class="w-full h-[120px] md:h-[140px] relative border-t border-slate-800/80"></div>
        </div>

        <!-- 8 CORE PERFORMANCE METRICS CARDS (Expectancy, Win Rate, Total Return, MDD, etc.) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <!-- Total Return % -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>總回報率</span>
              <span class="text-xs">📈</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-red-400" id="cardTotalReturn">+0.00%</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardTotalProfit">NT$ +0</div>
          </div>

          <!-- Win Rate % -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>勝率</span>
              <span class="text-xs">🎯</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-emerald-400" id="cardWinRate">0.0%</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardWinCount">0 勝 / 0 負</div>
          </div>

          <!-- Expectancy (期望值) -->
          <div class="metric-card p-3 rounded-xl border border-blue-900/50 bg-blue-950/20 relative overflow-hidden">
            <div class="text-[11px] font-medium text-blue-300 flex items-center justify-between">
              <span>期望值 (單筆)</span>
              <span class="text-xs">⚡</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-blue-400" id="cardExpectancy">+0.00%</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardExpectancyAmount">NT$ +0 / 筆</div>
          </div>

          <!-- Max Drawdown (MDD) -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>最大回撤 (MDD)</span>
              <span class="text-xs">🛡️</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-amber-400" id="cardMDD">-0.00%</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardPeakEquity">峰值保護良好</div>
          </div>

          <!-- Position Status (期末持倉狀態：續抱/買進/賣出/觀望) -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden col-span-2">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>當前策略持股狀態 (期末不強平)</span>
              <span class="text-xs">💼</span>
            </div>
            <div class="mt-1 text-sm sm:text-base font-bold flex items-center gap-1.5" id="cardPositionStatus">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span class="text-slate-300 font-medium">計算中...</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5 truncate" id="cardPositionDetail">期末部位維持抱牢，未實現損益計入總淨值</div>
          </div>

          <!-- Profit Factor & Win/Loss Ratio -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>盈虧比 (PF)</span>
              <span class="text-xs">⚖️</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-indigo-400" id="cardProfitFactor">0.00</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardWinLossRatio">賺賠比 0.00</div>
          </div>

          <!-- Total Trades -->
          <div class="metric-card p-3 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div class="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>總交易次數</span>
              <span class="text-xs">🔢</span>
            </div>
            <div class="mt-1 text-lg sm:text-xl font-bold font-mono text-slate-200" id="cardTotalTrades">0 筆</div>
            <div class="text-[10px] text-slate-400 font-mono" id="cardAvgHolding">平均抱牢 0 天</div>
          </div>
        </div>

        <!-- OPEN POSITION BANNER (When held at period end) -->
        <div id="bannerOpenPosition" class="hidden bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span class="font-bold text-emerald-300">期末部位續抱中（未達出場條件，不強制平倉）</span>
              <div class="text-[11px] text-slate-300 font-mono" id="openPosDesc">進場: 2026-09-15 @ 995.00 · 持股: 1,000 股 · 抱牢: 12 天</div>
            </div>
          </div>
          <div class="text-right font-mono">
            <div class="text-xs text-slate-400">當前未實現損益</div>
            <div class="text-sm font-bold text-emerald-400" id="openPosReturn">+NT$ 30,000 (+3.01%)</div>
          </div>
        </div>

        <!-- TRADE HISTORY TABLE (Responsive, foldable) -->
        <div id="paneTradesTable" class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span>📋 逐筆成交明細</span>
              <span class="text-[11px] font-normal text-slate-400" id="tradeListCount">(0 筆交易)</span>
            </h3>
            <span class="text-[11px] text-slate-400">每股自由交易 · 期末抱牢不強平</span>
          </div>

          <div class="overflow-x-auto max-h-[280px]">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                <tr>
                  <th class="py-2 px-2.5">進場日</th>
                  <th class="py-2 px-2.5">進場價</th>
                  <th class="py-2 px-2.5">出場日</th>
                  <th class="py-2 px-2.5">出場價</th>
                  <th class="py-2 px-2.5">部位股數</th>
                  <th class="py-2 px-2.5">天數</th>
                  <th class="py-2 px-2.5 text-right">報酬率</th>
                  <th class="py-2 px-2.5 text-right">損益金額</th>
                  <th class="py-2 px-2.5">出場原因</th>
                </tr>
              </thead>
              <tbody id="tradesTableBody" class="divide-y divide-slate-800/60 text-slate-300">
                <!-- Injected via JS -->
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- RIGHT COLUMN: Quantitative Strategy Config & Watchlist Radar (lg:col-span-4) -->
      <section class="lg:col-span-4 flex flex-col gap-3">

        <!-- 1. WATCHLIST (自選投資組合) - 依用戶要求升級 -->
        <div id="paneWatchlist" class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-lg">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>⭐ 自選投資組合</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">策略即時雷達</span>
              </h2>
              <p class="text-[10px] text-slate-400 mt-0.5">依左側勾選策略計算各股【勝率/期望值/回測/狀態】</p>
            </div>
            <button id="btnRefreshWatchlist" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition" title="重新掃描全自選股策略">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>

          <!-- Watchlist Items Container -->
          <div class="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5" id="watchlistContainer">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- 2. QUANTITATIVE STRATEGY CONFIGURATION (自訂量化回測系統) -->
        <div id="paneStrategyConfig" class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>⚡ 自訂量化交易策略</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">自由多重勾選</span>
              </h2>
              <p class="text-[10px] text-slate-400 mt-0.5">點選條件即時回測，期末部位不強制平倉</p>
            </div>
            
            <!-- Logic Mode Toggle: AND vs OR -->
            <div class="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
              <button id="btnLogicAnd" class="px-2 py-0.5 rounded text-white bg-blue-600 font-bold transition">AND 嚴格</button>
              <button id="btnLogicOr" class="px-2 py-0.5 rounded text-slate-400 hover:text-white transition">OR 靈活</button>
            </div>
          </div>

          <!-- Entry Conditions Checklist -->
          <div class="flex flex-col gap-2">
            <span class="text-[11px] font-semibold text-slate-400">進場訊號池 (符合條件即建立部位)：</span>
            
            <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs">
              <input type="checkbox" id="chkEntryMa" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700" />
              <div class="flex-1">
                <span class="font-bold text-slate-200">均線黃金交叉</span>
                <span class="text-[10px] text-slate-400 ml-1">(MA5 突破 MA20 月線)</span>
              </div>
            </label>

            <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs">
              <input type="checkbox" id="chkEntryKd" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700" />
              <div class="flex-1">
                <span class="font-bold text-slate-200">KD 指標低檔黃金交叉</span>
                <span class="text-[10px] text-slate-400 ml-1">(K值 向上穿越 D值)</span>
              </div>
            </label>

            <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs">
              <input type="checkbox" id="chkEntryMacd" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700" />
              <div class="flex-1">
                <span class="font-bold text-slate-200">MACD 翻紅動能發散</span>
                <span class="text-[10px] text-slate-400 ml-1">(OSC 由負翻正或 DIF>MACD)</span>
              </div>
            </label>

            <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs">
              <input type="checkbox" id="chkEntryBreakout" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700" />
              <div class="flex-1">
                <span class="font-bold text-slate-200">強勢創近 30 日新高</span>
                <span class="text-[10px] text-slate-400 ml-1">(海龜突破波段高點)</span>
              </div>
            </label>

            <label class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs">
              <input type="checkbox" id="chkEntryRsi" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700" />
              <div class="flex-1">
                <span class="font-bold text-slate-200">RSI 超賣反轉突破 50</span>
                <span class="text-[10px] text-slate-400 ml-1">(動能重回多方掌控)</span>
              </div>
            </label>
          </div>

          <!-- Risk Control & Exit Strategies -->
          <div class="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span class="text-[11px] font-semibold text-slate-400">出場條件與風控機制：</span>

            <!-- Dynamic ATR Stop Loss -->
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input type="checkbox" id="chkStopLossAtr" checked class="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-800 border-slate-700" />
                  <span>動態 ATR 初始停損</span>
                </label>
                <span class="font-mono text-red-400 text-xs font-bold" id="valAtrMultiplier">2.0 x ATR</span>
              </div>
              <input type="range" id="sliderAtr" min="1.0" max="4.0" step="0.5" value="2.0" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>

            <!-- Trailing Stop (移動停利) -->
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input type="checkbox" id="chkTrailingStop" checked class="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700" />
                  <span>移動停利 (高點回檔平倉)</span>
                </label>
                <span class="font-mono text-amber-400 text-xs font-bold" id="valTrailingStop">8 %</span>
              </div>
              <input type="range" id="sliderTrailing" min="3" max="20" step="1" value="8" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            </div>

            <!-- Take Profit Target -->
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input type="checkbox" id="chkTakeProfit" class="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700" />
                  <span>固定目標停利</span>
                </label>
                <span class="font-mono text-emerald-400 text-xs font-bold" id="valTakeProfit">15 %</span>
              </div>
              <input type="range" id="sliderTakeProfit" min="5" max="40" step="5" value="15" class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
          </div>

          <!-- Position Sizing & Period-End Notice -->
          <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">交易模式:</span>
              <span class="text-slate-200 font-mono font-bold">零股/精準自由股數 (已取消1000股限制)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">期末未平倉:</span>
              <span class="text-emerald-400 font-bold">不強制平倉 · 市值續抱計算</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">交易手續費率:</span>
              <span class="text-slate-300 font-mono">0.1425% (手續費) + 0.3% (證交稅)</span>
            </div>
          </div>

          <!-- Run Backtest Action Button -->
          <button id="btnExecuteBacktest" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>立即執行量化回測與全股掃描</span>
          </button>
        </div>

      </section>

    </div>
  </main>

  <!-- Mobile Bottom Sticky Navigation Bar -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur border-t border-slate-800 flex items-center justify-around py-2 px-1 text-[10px]">
    <button class="mobile-nav-item active flex flex-col items-center gap-0.5 text-blue-400" data-tab="chart">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
      <span>K線主圖</span>
    </button>
    <button class="mobile-nav-item flex flex-col items-center gap-0.5 text-slate-400 hover:text-white" data-tab="strategy">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      <span>策略設定</span>
    </button>
    <button class="mobile-nav-item flex flex-col items-center gap-0.5 text-slate-400 hover:text-white" data-tab="watchlist">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
      <span>自選雷達</span>
    </button>
    <button class="mobile-nav-item flex flex-col items-center gap-0.5 text-slate-400 hover:text-white" data-tab="trades">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
      <span>逐筆成交</span>
    </button>
  </nav>

  <!-- EMBEDDED K-LINE DATASET FOR 7 TOP STOCKS -->
  <script>
    // Hardcoded high-fidelity daily K-line datasets (zero network fetch, 100% Vercel compatible)
    window.EMBEDDED_STOCK_DATA = ${embeddedDataJs};
  </script>

  <!-- PURE JAVASCRIPT QUANTITATIVE BACKTEST ENGINE & TRADINGVIEW UI LOGIC -->
  <script>
    (function() {
      // Current Application State
      let currentSymbol = '2330.TW';
      let activeSubchart = 'vol'; // 'vol' | 'rsi' | 'kd' | 'macd'
      let entryLogic = 'AND'; // 'AND' | 'OR'
      let watchlistSymbols = ['2330.TW', '2317.TW', '2454.TW', '2603.TW', '3231.TW', '2308.TW', '0050.TW'];

      // Lightweight Charts instances
      let mainChart = null;
      let subChart = null;
      let candleSeries = null;
      let ma5Series = null;
      let ma20Series = null;
      let ma60Series = null;
      let volumeSeries = null;
      let rsiSeries = null;
      let kSeries = null;
      let dSeries = null;
      let macdHistSeries = null;
      let difSeries = null;
      let demSeries = null;

      // Current Backtest Output Cache
      let currentBacktestResult = null;
      let currentCandles = [];

      // =========================================================================
      // 1. Technical Indicators Calculation in Pure JavaScript
      // =========================================================================
      function calculateTechnicalIndicators(candles) {
        const n = candles.length;
        if (n === 0) return [];

        const result = candles.map(c => ({ ...c }));

        // 1.1 Simple Moving Averages (MA5, MA20, MA60)
        for (let i = 0; i < n; i++) {
          if (i >= 4) {
            let sum5 = 0;
            for (let j = 0; j < 5; j++) sum5 += result[i - j].close;
            result[i].ma5 = Number((sum5 / 5).toFixed(2));
          }
          if (i >= 19) {
            let sum20 = 0;
            for (let j = 0; j < 20; j++) sum20 += result[i - j].close;
            result[i].ma20 = Number((sum20 / 20).toFixed(2));
          }
          if (i >= 59) {
            let sum60 = 0;
            for (let j = 0; j < 60; j++) sum60 += result[i - j].close;
            result[i].ma60 = Number((sum60 / 60).toFixed(2));
          }
        }

        // 1.2 RSI (14)
        let avgGain = 0;
        let avgLoss = 0;
        for (let i = 1; i < n; i++) {
          const diff = result[i].close - result[i - 1].close;
          const gain = diff > 0 ? diff : 0;
          const loss = diff < 0 ? Math.abs(diff) : 0;

          if (i <= 14) {
            avgGain += gain;
            avgLoss += loss;
            if (i === 14) {
              avgGain /= 14;
              avgLoss /= 14;
              const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
              result[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(2));
            }
          } else {
            avgGain = (avgGain * 13 + gain) / 14;
            avgLoss = (avgLoss * 13 + loss) / 14;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(2));
          }
        }

        // 1.3 KD (9, 3, 3)
        let lastK = 50;
        let lastD = 50;
        for (let i = 0; i < n; i++) {
          if (i >= 8) {
            let highest9 = -Infinity;
            let lowest9 = Infinity;
            for (let j = 0; j < 9; j++) {
              highest9 = Math.max(highest9, result[i - j].high);
              lowest9 = Math.min(lowest9, result[i - j].low);
            }
            const rsv = highest9 === lowest9 ? 50 : ((result[i].close - lowest9) / (highest9 - lowest9)) * 100;
            lastK = (2 / 3) * lastK + (1 / 3) * rsv;
            lastD = (2 / 3) * lastD + (1 / 3) * lastK;
            result[i].k = Number(lastK.toFixed(2));
            result[i].d = Number(lastD.toFixed(2));
          }
        }

        // 1.4 MACD (12, 26, 9)
        let ema12 = result[0].close;
        let ema26 = result[0].close;
        let dem = 0;
        for (let i = 0; i < n; i++) {
          const c = result[i].close;
          ema12 = (c * 2 / 13) + (ema12 * 11 / 13);
          ema26 = (c * 2 / 27) + (ema26 * 25 / 27);
          const dif = ema12 - ema26;
          result[i].dif = Number(dif.toFixed(2));

          if (i === 0) dem = dif;
          else dem = (dif * 2 / 10) + (dem * 8 / 10);

          result[i].macd = Number(dem.toFixed(2));
          result[i].osc = Number((dif - dem).toFixed(2));
        }

        // 1.5 ATR (14)
        for (let i = 0; i < n; i++) {
          if (i === 0) {
            result[i].atr = Number((result[i].high - result[i].low).toFixed(2));
          } else {
            const tr = Math.max(
              result[i].high - result[i].low,
              Math.abs(result[i].high - result[i - 1].close),
              Math.abs(result[i].low - result[i - 1].close)
            );
            const prevAtr = result[i - 1].atr || tr;
            result[i].atr = Number(((prevAtr * 13 + tr) / 14).toFixed(2));
          }
        }

        return result;
      }

      // =========================================================================
      // 2. Quantitative Strategy Backtest Engine in Pure JavaScript
      // =========================================================================
      function runStrategyBacktest(candles, options) {
        if (!candles || candles.length < 30) return null;

        const initialCapital = 1000000; // NT$ 1,000,000
        const feeRate = 0.001425; // 0.1425% 買賣手續費
        const taxRate = 0.003;    // 0.3% 賣出證券交易稅

        let capital = initialCapital;
        let inPosition = false;
        let positionShares = 0;
        let entryPrice = 0;
        let entryDate = '';
        let entryIndex = 0;
        let entryAtr = 0;
        let highestSinceEntry = 0;

        const trades = [];
        const equityCurve = [];
        let peakEquity = initialCapital;

        for (let i = 25; i < candles.length; i++) {
          const curr = candles[i];
          const prev = candles[i - 1];

          if (inPosition) {
            highestSinceEntry = Math.max(highestSinceEntry, curr.high);

            // Exit conditions check
            let exitTriggered = false;
            let exitReason = '';

            // Exit 1: Dynamic ATR Stop Loss
            if (options.stopLossAtr && entryAtr > 0) {
              const stopPrice = entryPrice - options.atrMultiplier * entryAtr;
              if (curr.low <= stopPrice) {
                exitTriggered = true;
                exitReason = '動態ATR停損 (' + options.atrMultiplier + 'x)';
              }
            }

            // Exit 2: Trailing Stop (移動停利)
            if (!exitTriggered && options.trailingStop) {
              const trailStopPrice = highestSinceEntry * (1 - options.trailingPct / 100);
              if (curr.low <= trailStopPrice) {
                exitTriggered = true;
                exitReason = '移動停利 (高點回檔' + options.trailingPct + '%)';
              }
            }

            // Exit 3: Fixed Target Take Profit
            if (!exitTriggered && options.takeProfit) {
              const targetPrice = entryPrice * (1 + options.takeProfitPct / 100);
              if (curr.high >= targetPrice) {
                exitTriggered = true;
                exitReason = '目標停利 (+' + options.takeProfitPct + '%)';
              }
            }

            // Exit 4: MA Death Cross (MA5 < MA20)
            if (!exitTriggered && prev.ma5 >= prev.ma20 && curr.ma5 < curr.ma20) {
              exitTriggered = true;
              exitReason = '均線死亡交叉 (MA5跌破MA20)';
            }

            // Execute Exit
            if (exitTriggered) {
              const exitPrice = curr.close;
              const grossProceeds = positionShares * exitPrice;
              const exitFee = grossProceeds * feeRate;
              const exitTax = grossProceeds * taxRate;
              const netProceeds = grossProceeds - exitFee - exitTax;
              capital += netProceeds;

              const totalCost = positionShares * entryPrice * (1 + feeRate);
              const pnl = netProceeds - totalCost;
              const returnPct = Number(((pnl / totalCost) * 100).toFixed(2));

              trades.push({
                id: 'trade-' + (trades.length + 1),
                entryDate,
                entryPrice,
                exitDate: curr.time,
                exitPrice,
                shares: positionShares,
                holdingDays: i - entryIndex,
                returnPct,
                returnAmount: Math.round(pnl),
                exitReason,
                isWin: pnl > 0,
                status: 'CLOSED'
              });

              inPosition = false;
              positionShares = 0;
            }
          } else {
            // Check Entry Conditions
            const entryChecks = [];

            // Condition 1: MA Golden Cross (MA5 > MA20)
            if (options.entryMa) {
              const isCross = prev.ma5 <= prev.ma20 && curr.ma5 > curr.ma20;
              entryChecks.push(isCross);
            }

            // Condition 2: KD Golden Cross
            if (options.entryKd) {
              const isKdCross = prev.k <= prev.d && curr.k > curr.d;
              entryChecks.push(isKdCross);
            }

            // Condition 3: MACD Momentum Turn Red
            if (options.entryMacd) {
              const isMacdCross = (prev.osc <= 0 && curr.osc > 0) || (curr.dif > curr.macd && curr.osc > 0);
              entryChecks.push(isMacdCross);
            }

            // Condition 4: Breakout 30-day High
            if (options.entryBreakout) {
              let highest30 = -Infinity;
              for (let j = 1; j <= 30; j++) highest30 = Math.max(highest30, candles[i - j].high);
              entryChecks.push(curr.close > highest30);
            }

            // Condition 5: RSI Momentum
            if (options.entryRsi) {
              const isRsiRebound = (prev.rsi <= 50 && curr.rsi > 50) || (prev.rsi < 35 && curr.rsi >= 35);
              entryChecks.push(isRsiRebound);
            }

            let shouldEnter = false;
            if (entryChecks.length > 0) {
              shouldEnter = entryLogic === 'AND' ? entryChecks.every(Boolean) : entryChecks.some(Boolean);
            }

            if (shouldEnter && capital > 0) {
              entryPrice = curr.close;
              entryDate = curr.time;
              entryIndex = i;
              entryAtr = curr.atr || (curr.high - curr.low);
              highestSinceEntry = curr.high;

              // 精準自由股數 (支援零股，以 1 股為單位，取消1000股限制)
              const costPerShare = entryPrice * (1 + feeRate);
              const targetShares = Math.floor(capital / costPerShare);

              if (targetShares >= 1) {
                positionShares = targetShares;
                const buyCost = positionShares * entryPrice * (1 + feeRate);
                capital -= buyCost;
                inPosition = true;
              }
            }
          }

          // Mark to Market Equity Curve
          const mtmEquity = inPosition ? capital + positionShares * curr.close : capital;
          peakEquity = Math.max(peakEquity, mtmEquity);
          const currentDD = peakEquity > 0 ? ((peakEquity - mtmEquity) / peakEquity) * 100 : 0;
          equityCurve.push({
            date: curr.time,
            equity: Math.round(mtmEquity),
            drawdownPct: Number(currentDD.toFixed(2))
          });
        }

        // =========================================================================
        // 【核心邏輯 1】：期末部位不自動平倉！除非觸及停損停利，否則保持抱牢持倉中
        // =========================================================================
        let openPosition = null;
        const lastBar = candles[candles.length - 1];

        if (inPosition) {
          const costBasis = positionShares * entryPrice;
          const currentVal = positionShares * lastBar.close;
          const unrealizedPnl = currentVal - costBasis;
          const unrealizedPnlPct = Number(((unrealizedPnl / costBasis) * 100).toFixed(2));

          openPosition = {
            entryDate,
            entryPrice,
            shares: positionShares,
            holdingDays: candles.length - 1 - entryIndex,
            currentPrice: lastBar.close,
            currentValue: Math.round(currentVal),
            unrealizedReturnPct: unrealizedPnlPct,
            unrealizedReturnAmount: Math.round(unrealizedPnl)
          };

          // 記錄期末抱牢持股，status 為 'OPEN'，不強制平倉
          trades.push({
            id: 'trade-' + (trades.length + 1),
            entryDate,
            entryPrice,
            exitDate: '',
            exitPrice: lastBar.close,
            shares: positionShares,
            holdingDays: candles.length - 1 - entryIndex,
            returnPct: unrealizedPnlPct,
            returnAmount: Math.round(unrealizedPnl),
            exitReason: '未達出場條件（續抱中）',
            isWin: unrealizedPnl > 0,
            status: 'OPEN'
          });
        }

        // 回測統計指標
        const closedTrades = trades.filter(t => t.status !== 'OPEN');
        const winningTrades = closedTrades.filter(t => t.isWin);
        const losingTrades = closedTrades.filter(t => !t.isWin);

        const totalTradesCount = closedTrades.length;
        const winCount = winningTrades.length;
        const winRate = totalTradesCount > 0 ? Number(((winCount / totalTradesCount) * 100).toFixed(2)) : 0;

        // 期末資產淨值 (含未平倉部位市值)
        const finalEquity = inPosition ? capital + positionShares * lastBar.close : capital;
        const totalReturnPct = Number((((finalEquity - initialCapital) / initialCapital) * 100).toFixed(2));
        const totalProfitAmount = Math.round(finalEquity - initialCapital);

        // 盈虧比 (Profit Factor)
        const grossProfit = winningTrades.reduce((acc, t) => acc + t.returnAmount, 0);
        const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.returnAmount, 0));
        const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

        // 期望值 (Expectancy)
        const avgWinPct = winCount > 0 ? winningTrades.reduce((acc, t) => acc + t.returnPct, 0) / winCount : 0;
        const avgLossPct = losingTrades.length > 0 ? losingTrades.reduce((acc, t) => acc + t.returnPct, 0) / losingTrades.length : 0;
        const winLossRatio = Math.abs(avgLossPct) > 0 ? Number((avgWinPct / Math.abs(avgLossPct)).toFixed(2)) : avgWinPct > 0 ? 99 : 0;

        const winRateDecimal = winRate / 100;
        const lossRateDecimal = 1 - winRateDecimal;
        const expectancyPct = Number((winRateDecimal * avgWinPct - lossRateDecimal * Math.abs(avgLossPct)).toFixed(2));

        const avgWinAmt = winCount > 0 ? grossProfit / winCount : 0;
        const avgLossAmt = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
        const expectancyAmount = Math.round(winRateDecimal * avgWinAmt - lossRateDecimal * avgLossAmt);

        // 最大回撤 (MDD)
        let maxDD = 0;
        equityCurve.forEach(pt => {
          if (pt.drawdownPct > maxDD) maxDD = pt.drawdownPct;
        });

        // 當前持股狀態判定
        let currentSignal = 'OBSERVE'; // 'HOLD' | 'BUY' | 'SELL' | 'OBSERVE'
        if (inPosition) {
          currentSignal = 'HOLD';
        } else {
          const lastTrade = trades[trades.length - 1];
          if (lastTrade && lastTrade.exitDate === lastBar.time) {
            currentSignal = 'SELL';
          }
        }

        return {
          totalReturnPct,
          totalProfitAmount,
          winRate,
          winCount,
          lossCount: losingTrades.length,
          expectancyPct,
          expectancyAmount,
          maxDrawdownPct: maxDD,
          profitFactor,
          winLossRatio,
          totalTrades: trades.length,
          closedTradesCount: totalTradesCount,
          trades,
          openPosition,
          currentSignal,
          finalEquity
        };
      }

      // =========================================================================
      // 3. User Interface Rendering & Strategy Scanning
      // =========================================================================

      function getStrategyOptionsFromUI() {
        return {
          entryMa: document.getElementById('chkEntryMa').checked,
          entryKd: document.getElementById('chkEntryKd').checked,
          entryMacd: document.getElementById('chkEntryMacd').checked,
          entryBreakout: document.getElementById('chkEntryBreakout').checked,
          entryRsi: document.getElementById('chkEntryRsi').checked,
          stopLossAtr: document.getElementById('chkStopLossAtr').checked,
          atrMultiplier: parseFloat(document.getElementById('sliderAtr').value),
          trailingStop: document.getElementById('chkTrailingStop').checked,
          trailingPct: parseFloat(document.getElementById('sliderTrailing').value),
          takeProfit: document.getElementById('chkTakeProfit').checked,
          takeProfitPct: parseFloat(document.getElementById('sliderTakeProfit').value)
        };
      }

      // Update Watchlist UI with Real-time Strategy Signal & Metrics (勝率、期望值、最大回測)
      function updateWatchlistUI() {
        const container = document.getElementById('watchlistContainer');
        if (!container) return;

        const options = getStrategyOptionsFromUI();
        container.innerHTML = '';

        watchlistSymbols.forEach(sym => {
          const stock = window.EMBEDDED_STOCK_DATA[sym];
          if (!stock) return;

          // Run backtest for this stock using current strategy options
          const enrichedCandles = calculateTechnicalIndicators(stock.candles);
          const res = runStrategyBacktest(enrichedCandles, options);

          const lastCandle = stock.candles[stock.candles.length - 1];
          const prevCandle = stock.candles[stock.candles.length - 2];
          const change = lastCandle.close - prevCandle.close;
          const changePct = ((change / prevCandle.close) * 100).toFixed(2);
          const isUp = change >= 0;

          // Status Badge Determination
          let statusBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">⚪ 觀望</span>';
          if (res.openPosition) {
            statusBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 animate-pulse">🟢 持有中</span>';
          } else if (res.currentSignal === 'BUY') {
            statusBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/60">🔺 買入訊號</span>';
          } else if (res.currentSignal === 'SELL') {
            statusBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">🔻 賣出訊號</span>';
          }

          const isCurrentActive = sym === currentSymbol;

          const itemEl = document.createElement('div');
          itemEl.className = 'p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ' + 
            (isCurrentActive ? 'bg-blue-950/40 border-blue-500/70 shadow-md shadow-blue-500/10' : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700');

          itemEl.onclick = () => switchActiveStock(sym);

          itemEl.innerHTML = \`
            <!-- Stock Name, Symbol & Price -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 truncate">
                <span class="font-bold text-xs text-white truncate">\${stock.name}</span>
                <span class="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">\${stock.code}</span>
                \${statusBadge}
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-xs \${isUp ? 'text-red-400' : 'text-emerald-400'}">\${lastCandle.close.toFixed(2)}</span>
                <span class="text-[10px] ml-1 \${isUp ? 'text-red-400' : 'text-emerald-400'}">\${isUp ? '+' : ''}\${changePct}%</span>
              </div>
            </div>

            <!-- Strategy Specific Quantitative Metrics: 勝率, 期望值, 最大回測 (取代目標買/賣/量) -->
            <div class="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60 text-[10px] font-mono">
              <div class="bg-slate-950/40 px-1.5 py-0.5 rounded flex flex-col">
                <span class="text-slate-400 text-[9px]">勝率</span>
                <span class="font-bold \${res.winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'}">\${res.winRate}%</span>
              </div>
              <div class="bg-slate-950/40 px-1.5 py-0.5 rounded flex flex-col">
                <span class="text-slate-400 text-[9px]">期望值</span>
                <span class="font-bold \${res.expectancyPct >= 0 ? 'text-blue-400' : 'text-slate-300'}">\${res.expectancyPct >= 0 ? '+' : ''}\${res.expectancyPct}%</span>
              </div>
              <div class="bg-slate-950/40 px-1.5 py-0.5 rounded flex flex-col">
                <span class="text-slate-400 text-[9px]">最大回測</span>
                <span class="font-bold text-amber-400">-\${res.maxDrawdownPct}%</span>
              </div>
            </div>
          \`;

          container.appendChild(itemEl);
        });
      }

      // Update Main Metrics Cards
      function updateMetricsCards(res) {
        if (!res) return;

        // Total Return
        const elTotalReturn = document.getElementById('cardTotalReturn');
        const elTotalProfit = document.getElementById('cardTotalProfit');
        elTotalReturn.innerText = (res.totalReturnPct >= 0 ? '+' : '') + res.totalReturnPct.toFixed(2) + '%';
        elTotalReturn.className = 'mt-1 text-lg sm:text-xl font-bold font-mono ' + (res.totalReturnPct >= 0 ? 'text-red-400' : 'text-emerald-400');
        elTotalProfit.innerText = 'NT$ ' + (res.totalProfitAmount >= 0 ? '+' : '') + res.totalProfitAmount.toLocaleString();

        // Win Rate
        document.getElementById('cardWinRate').innerText = res.winRate.toFixed(1) + '%';
        document.getElementById('cardWinCount').innerText = res.winCount + ' 勝 / ' + res.lossCount + ' 負';

        // Expectancy
        const elExpectancy = document.getElementById('cardExpectancy');
        elExpectancy.innerText = (res.expectancyPct >= 0 ? '+' : '') + res.expectancyPct.toFixed(2) + '%';
        elExpectancy.className = 'mt-1 text-lg sm:text-xl font-bold font-mono ' + (res.expectancyPct >= 0 ? 'text-blue-400' : 'text-slate-400');
        document.getElementById('cardExpectancyAmount').innerText = 'NT$ ' + (res.expectancyAmount >= 0 ? '+' : '') + res.expectancyAmount.toLocaleString() + ' / 筆';

        // MDD
        document.getElementById('cardMDD').innerText = '-' + res.maxDrawdownPct.toFixed(2) + '%';

        // Position Status (期末不強平)
        const elStatus = document.getElementById('cardPositionStatus');
        const elDetail = document.getElementById('cardPositionDetail');
        const bannerOpen = document.getElementById('bannerOpenPosition');

        if (res.openPosition) {
          elStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span><span class="text-emerald-300 font-bold">🟢 持倉中 (期末續抱)</span>';
          elDetail.innerText = '進場價 ' + res.openPosition.entryPrice + ' · 抱牢 ' + res.openPosition.holdingDays + ' 天 · 未實現 ' + (res.openPosition.unrealizedReturnPct >= 0 ? '+' : '') + res.openPosition.unrealizedReturnPct + '%';

          bannerOpen.classList.remove('hidden');
          document.getElementById('openPosDesc').innerText = '進場日: ' + res.openPosition.entryDate + ' @ ' + res.openPosition.entryPrice + ' · 持股: ' + res.openPosition.shares.toLocaleString() + ' 股 · 抱牢天數: ' + res.openPosition.holdingDays + ' 天';
          document.getElementById('openPosReturn').innerText = (res.openPosition.unrealizedReturnAmount >= 0 ? '+NT$ ' : '-NT$ ') + Math.abs(res.openPosition.unrealizedReturnAmount).toLocaleString() + ' (' + (res.openPosition.unrealizedReturnPct >= 0 ? '+' : '') + res.openPosition.unrealizedReturnPct + '%)';
        } else {
          bannerOpen.classList.add('hidden');
          if (res.currentSignal === 'BUY') {
            elStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400"></span><span class="text-red-300 font-bold">🔺 今日觸發買入</span>';
            elDetail.innerText = '多方訊號浮現，符合自訂策略進場邏輯';
          } else if (res.currentSignal === 'SELL') {
            elStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span><span class="text-amber-300 font-bold">🔻 今日觸發賣出</span>';
            elDetail.innerText = '觸發停損或出場條件，資金回歸現金';
          } else {
            elStatus.innerHTML = '<span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-500"></span><span class="text-slate-300 font-bold">⚪ 空手觀望中</span>';
            elDetail.innerText = '期末無持股，等待下一波多頭策略發動';
          }
        }

        // Profit Factor
        document.getElementById('cardProfitFactor').innerText = res.profitFactor.toFixed(2);
        document.getElementById('cardWinLossRatio').innerText = '賺賠比 ' + res.winLossRatio.toFixed(2);

        // Total Trades
        document.getElementById('cardTotalTrades').innerText = res.trades.length + ' 筆';
        const avgDays = res.trades.length > 0 ? (res.trades.reduce((a, b) => a + b.holdingDays, 0) / res.trades.length).toFixed(1) : 0;
        document.getElementById('cardAvgHolding').innerText = '平均抱牢 ' + avgDays + ' 天';
      }

      // Update Trade History Table
      function updateTradesTable(trades) {
        const tbody = document.getElementById('tradesTableBody');
        const countEl = document.getElementById('tradeListCount');
        if (!tbody) return;

        countEl.innerText = '(' + trades.length + ' 筆交易)';
        tbody.innerHTML = '';

        if (trades.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-slate-500">當前策略條件無觸發任何交易紀錄</td></tr>';
          return;
        }

        // Show reverse chronological
        [...trades].reverse().forEach(t => {
          const tr = document.createElement('tr');
          const isOpen = t.status === 'OPEN';
          tr.className = isOpen ? 'bg-emerald-950/30 border-l-2 border-emerald-500 hover:bg-emerald-900/40' : 'hover:bg-slate-800/40';

          tr.innerHTML = \`
            <td class="py-2 px-2.5 font-medium">\${t.entryDate}</td>
            <td class="py-2 px-2.5 text-slate-200">\${t.entryPrice.toFixed(2)}</td>
            <td class="py-2 px-2.5 \${isOpen ? 'text-emerald-400 font-bold' : ''}">\${isOpen ? '（續抱中）' : t.exitDate}</td>
            <td class="py-2 px-2.5 text-slate-200">\${t.exitPrice.toFixed(2)}</td>
            <td class="py-2 px-2.5 text-blue-300 font-semibold">\${t.shares.toLocaleString()} 股</td>
            <td class="py-2 px-2.5 text-slate-400">\${t.holdingDays} 天</td>
            <td class="py-2 px-2.5 text-right font-bold \${t.returnPct >= 0 ? 'text-red-400' : 'text-emerald-400'}">\${t.returnPct >= 0 ? '+' : ''}\${t.returnPct.toFixed(2)}%</td>
            <td class="py-2 px-2.5 text-right font-bold \${t.returnAmount >= 0 ? 'text-red-400' : 'text-emerald-400'}">\${t.returnAmount >= 0 ? '+' : ''}\${t.returnAmount.toLocaleString()}</td>
            <td class="py-2 px-2.5 \${isOpen ? 'text-emerald-300 font-bold' : 'text-slate-400'}">\${isOpen ? '🟢 期末持倉續抱' : t.exitReason}</td>
          \`;

          tbody.appendChild(tr);
        });
      }

      // =========================================================================
      // 4. TradingView Lightweight Charts Setup & Rendering
      // =========================================================================
      function initCharts() {
        const mainEl = document.getElementById('mainChartContainer');
        const subEl = document.getElementById('subChartContainer');

        if (!window.LightweightCharts) {
          console.warn('LightweightCharts not loaded yet, retrying...');
          setTimeout(initCharts, 300);
          return;
        }

        const chartOptions = {
          layout: {
            background: { color: '#0b0f19' },
            textColor: '#94a3b8',
            fontSize: 11,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif'
          },
          grid: {
            vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
            horzLines: { color: 'rgba(30, 41, 59, 0.4)' }
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: { color: '#64748b', width: 1, style: 2 },
            horzLine: { color: '#64748b', width: 1, style: 2 }
          },
          rightPriceScale: {
            borderColor: '#1e293b',
            scaleMargins: { top: 0.1, bottom: 0.15 }
          },
          timeScale: {
            borderColor: '#1e293b',
            timeVisible: true,
            secondsVisible: false
          }
        };

        // 4.1 Main Candlestick Chart
        mainChart = LightweightCharts.createChart(mainEl, {
          ...chartOptions,
          width: mainEl.clientWidth,
          height: mainEl.clientHeight
        });

        // Candlestick Series (Taiwan red up, green down)
        candleSeries = mainChart.addCandlestickSeries({
          upColor: '#ef4444',
          downColor: '#10b981',
          borderVisible: false,
          wickUpColor: '#ef4444',
          wickDownColor: '#10b981'
        });

        // Moving Averages on Main Chart
        ma5Series = mainChart.addLineSeries({ color: '#facc15', lineWidth: 1.5, title: 'MA5' });
        ma20Series = mainChart.addLineSeries({ color: '#c084fc', lineWidth: 1.5, title: 'MA20' });
        ma60Series = mainChart.addLineSeries({ color: '#22d3ee', lineWidth: 1.5, title: 'MA60' });

        // 4.2 Subchart for Volume / RSI / KD / MACD
        subChart = LightweightCharts.createChart(subEl, {
          ...chartOptions,
          width: subEl.clientWidth,
          height: subEl.clientHeight
        });

        // Volume Series
        volumeSeries = subChart.addHistogramSeries({
          color: '#3b82f6',
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          scaleMargins: { top: 0.2, bottom: 0 }
        });

        // RSI Series
        rsiSeries = subChart.addLineSeries({ color: '#f43f5e', lineWidth: 1.5, title: 'RSI' });

        // KD Series
        kSeries = subChart.addLineSeries({ color: '#eab308', lineWidth: 1.5, title: 'K' });
        dSeries = subChart.addLineSeries({ color: '#06b6d4', lineWidth: 1.5, title: 'D' });

        // MACD Series
        macdHistSeries = subChart.addHistogramSeries({
          color: '#ef4444',
          priceScaleId: '',
          scaleMargins: { top: 0.2, bottom: 0.2 }
        });
        difSeries = subChart.addLineSeries({ color: '#e2e8f0', lineWidth: 1.5, title: 'DIF' });
        demSeries = subChart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, title: 'DEM' });

        // Synchronize TimeScales
        mainChart.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (range) subChart.timeScale().setVisibleRange(range);
        });
        subChart.timeScale().subscribeVisibleTimeRangeChange(range => {
          if (range) mainChart.timeScale().setVisibleRange(range);
        });

        // Crosshair Hover Handler
        mainChart.subscribeCrosshairMove(param => {
          const bar = document.getElementById('hoverInfoText');
          if (!bar) return;
          if (!param.time || !param.seriesData.get(candleSeries)) {
            bar.innerHTML = '滑鼠移動或觸控 K 線查看即時數值與策略訊號';
            return;
          }

          const c = param.seriesData.get(candleSeries);
          const ma5 = param.seriesData.get(ma5Series);
          const ma20 = param.seriesData.get(ma20Series);

          let text = \`<span class="text-white font-bold">\${param.time}</span> | \` +
            \`開: <span class="text-slate-200">\${c.open.toFixed(2)}</span> \` +
            \`高: <span class="text-red-400">\${c.high.toFixed(2)}</span> \` +
            \`低: <span class="text-emerald-400">\${c.low.toFixed(2)}</span> \` +
            \`收: <span class="\${c.close >= c.open ? 'text-red-400' : 'text-emerald-400'} font-bold">\${c.close.toFixed(2)}</span>\`;

          if (ma5) text += \` | <span class="text-yellow-400">MA5: \${ma5.toFixed(2)}</span>\`;
          if (ma20) text += \` | <span class="text-purple-400">MA20: \${ma20.toFixed(2)}</span>\`;

          bar.innerHTML = text;
        });

        // Window Resize Handling
        window.addEventListener('resize', () => {
          if (mainChart && mainEl) mainChart.resize(mainEl.clientWidth, mainEl.clientHeight);
          if (subChart && subEl) subChart.resize(subEl.clientWidth, subEl.clientHeight);
        });

        // Initial Data Load
        switchActiveStock(currentSymbol);
      }

      function switchActiveStock(sym) {
        currentSymbol = sym;
        const stock = window.EMBEDDED_STOCK_DATA[sym];
        if (!stock) return;

        // Update Header
        document.getElementById('hdrStockName').innerText = stock.name;
        document.getElementById('hdrStockCode').innerText = stock.symbol;

        const lastBar = stock.candles[stock.candles.length - 1];
        const prevBar = stock.candles[stock.candles.length - 2];
        const diff = lastBar.close - prevBar.close;
        const diffPct = ((diff / prevBar.close) * 100).toFixed(2);
        const isUp = diff >= 0;

        document.getElementById('hdrPrice').innerText = lastBar.close.toFixed(2);
        document.getElementById('hdrPrice').className = 'text-base md:text-lg font-bold ' + (isUp ? 'text-red-400' : 'text-emerald-400');
        document.getElementById('hdrChange').innerText = (isUp ? '+' : '') + diff.toFixed(2) + ' (' + (isUp ? '+' : '') + diffPct + '%)';
        document.getElementById('hdrChange').className = 'font-bold flex items-center gap-0.5 ' + (isUp ? 'text-red-400' : 'text-emerald-400');

        // Render Quick Pills
        renderStockPills();

        // Calculate and Render
        executeFullAnalysis();
      }

      function renderStockPills() {
        const container = document.getElementById('stockQuickPills');
        if (!container) return;
        container.innerHTML = '';

        watchlistSymbols.forEach(sym => {
          const stock = window.EMBEDDED_STOCK_DATA[sym];
          if (!stock) return;

          const isActive = sym === currentSymbol;
          const btn = document.createElement('button');
          btn.className = 'px-3 py-1 rounded-full shrink-0 font-medium transition ' + 
            (isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700');

          btn.innerText = stock.name + ' ' + stock.code;
          btn.onclick = () => switchActiveStock(sym);
          container.appendChild(btn);
        });
      }

      function executeFullAnalysis() {
        const stock = window.EMBEDDED_STOCK_DATA[currentSymbol];
        if (!stock) return;

        // 1. Calculate Technical Indicators
        currentCandles = calculateTechnicalIndicators(stock.candles);

        // 2. Run Strategy Backtest
        const options = getStrategyOptionsFromUI();
        currentBacktestResult = runStrategyBacktest(currentCandles, options);

        // 3. Update Chart Series Data
        if (candleSeries) {
          candleSeries.setData(currentCandles.map(c => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          })));

          // MA Series
          const ma5Data = currentCandles.filter(c => c.ma5 !== undefined).map(c => ({ time: c.time, value: c.ma5 }));
          const ma20Data = currentCandles.filter(c => c.ma20 !== undefined).map(c => ({ time: c.time, value: c.ma20 }));
          const ma60Data = currentCandles.filter(c => c.ma60 !== undefined).map(c => ({ time: c.time, value: c.ma60 }));

          ma5Series.setData(ma5Data);
          ma20Series.setData(ma20Data);
          ma60Series.setData(ma60Data);

          // 4. Set Strategy Signal Markers on Candlestick Chart (進場 ▲ / 出場 ▼)
          const markers = [];
          currentBacktestResult.trades.forEach(t => {
            markers.push({
              time: t.entryDate,
              position: 'belowBar',
              color: '#ef4444',
              shape: 'arrowUp',
              text: '▲ 買進'
            });

            if (t.exitDate) {
              const isProfit = t.returnAmount > 0;
              markers.push({
                time: t.exitDate,
                position: 'aboveBar',
                color: isProfit ? '#10b981' : '#f59e0b',
                shape: 'arrowDown',
                text: '▼ 平倉 (' + (t.returnPct >= 0 ? '+' : '') + t.returnPct + '%)'
              });
            }
          });

          // Sort markers by time
          markers.sort((a, b) => a.time.localeCompare(b.time));
          candleSeries.setMarkers(markers);

          mainChart.timeScale().fitContent();
        }

        // 5. Update Subchart Data
        updateSubchartData();

        // 6. Update Performance Cards & Trades Table
        updateMetricsCards(currentBacktestResult);
        updateTradesTable(currentBacktestResult.trades);

        // 7. Update Watchlist Radar with Strategy Signals & Metrics
        updateWatchlistUI();
      }

      function updateSubchartData() {
        if (!subChart || currentCandles.length === 0) return;

        // Hide all series first
        volumeSeries.applyOptions({ visible: activeSubchart === 'vol' });
        rsiSeries.applyOptions({ visible: activeSubchart === 'rsi' });
        kSeries.applyOptions({ visible: activeSubchart === 'kd' });
        dSeries.applyOptions({ visible: activeSubchart === 'kd' });
        macdHistSeries.applyOptions({ visible: activeSubchart === 'macd' });
        difSeries.applyOptions({ visible: activeSubchart === 'macd' });
        demSeries.applyOptions({ visible: activeSubchart === 'macd' });

        if (activeSubchart === 'vol') {
          volumeSeries.setData(currentCandles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
          })));
        } else if (activeSubchart === 'rsi') {
          const rsiData = currentCandles.filter(c => c.rsi !== undefined).map(c => ({ time: c.time, value: c.rsi }));
          rsiSeries.setData(rsiData);
        } else if (activeSubchart === 'kd') {
          const kData = currentCandles.filter(c => c.k !== undefined).map(c => ({ time: c.time, value: c.k }));
          const dData = currentCandles.filter(c => c.d !== undefined).map(c => ({ time: c.time, value: c.d }));
          kSeries.setData(kData);
          dSeries.setData(dData);
        } else if (activeSubchart === 'macd') {
          const oscData = currentCandles.filter(c => c.osc !== undefined).map(c => ({
            time: c.time,
            value: c.osc,
            color: c.osc >= 0 ? '#ef4444' : '#10b981'
          })));
          const difData = currentCandles.filter(c => c.dif !== undefined).map(c => ({ time: c.time, value: c.dif }));
          const demData = currentCandles.filter(c => c.macd !== undefined).map(c => ({ time: c.time, value: c.macd }));
          macdHistSeries.setData(oscData);
          difSeries.setData(difData);
          demSeries.setData(demData);
        }

        subChart.timeScale().fitContent();
      }

      // =========================================================================
      // 5. DOM Event Listeners & Mobile Responsive Handling
      // =========================================================================
      document.addEventListener('DOMContentLoaded', () => {
        initCharts();

        // Subchart switcher buttons
        document.querySelectorAll('.subchart-btn').forEach(btn => {
          btn.addEventListener('click', e => {
            document.querySelectorAll('.subchart-btn').forEach(b => {
              b.className = 'subchart-btn px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white font-medium';
            });
            btn.className = 'subchart-btn px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 font-medium';
            activeSubchart = btn.dataset.sub;
            updateSubchartData();
          });
        });

        // Logic toggle buttons (AND vs OR)
        const btnAnd = document.getElementById('btnLogicAnd');
        const btnOr = document.getElementById('btnLogicOr');
        btnAnd.addEventListener('click', () => {
          entryLogic = 'AND';
          btnAnd.className = 'px-2 py-0.5 rounded text-white bg-blue-600 font-bold transition';
          btnOr.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white transition';
          executeFullAnalysis();
        });
        btnOr.addEventListener('click', () => {
          entryLogic = 'OR';
          btnOr.className = 'px-2 py-0.5 rounded text-white bg-blue-600 font-bold transition';
          btnAnd.className = 'px-2 py-0.5 rounded text-slate-400 hover:text-white transition';
          executeFullAnalysis();
        });

        // Sliders live value display
        document.getElementById('sliderAtr').addEventListener('input', e => {
          document.getElementById('valAtrMultiplier').innerText = parseFloat(e.target.value).toFixed(1) + ' x ATR';
          executeFullAnalysis();
        });
        document.getElementById('sliderTrailing').addEventListener('input', e => {
          document.getElementById('valTrailingStop').innerText = e.target.value + ' %';
          executeFullAnalysis();
        });
        document.getElementById('sliderTakeProfit').addEventListener('input', e => {
          document.getElementById('valTakeProfit').innerText = e.target.value + ' %';
          executeFullAnalysis();
        });

        // Checkboxes change listeners
        [
          'chkEntryMa', 'chkEntryKd', 'chkEntryMacd', 'chkEntryBreakout', 'chkEntryRsi',
          'chkStopLossAtr', 'chkTrailingStop', 'chkTakeProfit'
        ].forEach(id => {
          document.getElementById(id).addEventListener('change', () => executeFullAnalysis());
        });

        // Action Buttons
        document.getElementById('btnExecuteBacktest').addEventListener('click', () => executeFullAnalysis());
        document.getElementById('btnRunBacktestHeader').addEventListener('click', () => executeFullAnalysis());
        document.getElementById('btnRefreshWatchlist').addEventListener('click', () => updateWatchlistUI());

        // Download Single File HTML
        document.getElementById('btnDownloadHtml').addEventListener('click', () => {
          const htmlContent = document.documentElement.outerHTML;
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'remix-stock-quant-terminal.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        // Mobile Tabs Switching
        const mobileTabs = document.querySelectorAll('.mobile-tab-btn, .mobile-nav-item');
        mobileTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            mobileTabs.forEach(t => {
              if (t.dataset.tab === target) {
                t.classList.add('active');
                if (t.classList.contains('mobile-tab-btn')) {
                  t.className = 'flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn active bg-blue-600 text-white';
                } else {
                  t.className = 'mobile-nav-item active flex flex-col items-center gap-0.5 text-blue-400';
                }
              } else {
                t.classList.remove('active');
                if (t.classList.contains('mobile-tab-btn')) {
                  t.className = 'flex-1 py-1.5 text-center font-medium rounded-md mobile-tab-btn text-slate-400 hover:text-white';
                } else {
                  t.className = 'mobile-nav-item flex flex-col items-center gap-0.5 text-slate-400 hover:text-white';
                }
              }
            });

            // Show/hide sections on mobile
            if (window.innerWidth < 768) {
              const paneChart = document.getElementById('paneChartAndMetrics');
              const paneWatchlist = document.getElementById('paneWatchlist');
              const paneStrategy = document.getElementById('paneStrategyConfig');
              const paneTrades = document.getElementById('paneTradesTable');

              if (target === 'chart') {
                paneChart.classList.remove('hidden');
                paneWatchlist.classList.add('hidden');
                paneStrategy.classList.add('hidden');
                paneTrades.classList.add('hidden');
              } else if (target === 'strategy') {
                paneChart.classList.add('hidden');
                paneWatchlist.classList.add('hidden');
                paneStrategy.classList.remove('hidden');
                paneTrades.classList.add('hidden');
              } else if (target === 'watchlist') {
                paneChart.classList.add('hidden');
                paneWatchlist.classList.remove('hidden');
                paneStrategy.classList.add('hidden');
                paneTrades.classList.add('hidden');
              } else if (target === 'trades') {
                paneChart.classList.add('hidden');
                paneWatchlist.classList.add('hidden');
                paneStrategy.classList.add('hidden');
                paneTrades.classList.remove('hidden');
              }
            }
          });
        });
      });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync('index.html', htmlTemplate);
console.log('Successfully generated index.html as single-file web app!');
