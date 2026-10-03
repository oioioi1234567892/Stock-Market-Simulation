# 🚀 台股智選量化操盤室 - Vercel 部署指南

本專案已完全優化為符合 **Vercel Serverless 雲端架構** 的現代化全端 Web 應用程式。

---

## 🏗️ 系統架構說明

| 層級 | 核心技術 | 運作機制 |
| :--- | :--- | :--- |
| **前端 (Client SPA)** | Vite 8 + React 19 + Tailwind CSS | 編譯輸出至 `dist/`，由 Vercel Edge Network 進行全域 CDN 加速快取與分發。 |
| **後端 API (Serverless)** | Express + Yahoo Finance + Node.js | 由 `api/index.ts` 承接所有 `/api/*` 請求，在 Vercel Serverless Functions 上按需無伺服器執行。 |
| **路由重定向 (Routing)** | `vercel.json` | API 請求重寫至 `/api`，前端路由平滑指向 `/index.html`，防止重新整理 404。 |
| **數據持久化** | LocalStorage + 記憶體 / PostgreSQL | 支援零配置即時運行；若填入 `DATABASE_URL` 即可無縫串接 Vercel Postgres、Neon 或 Supabase。 |

---

## 📦 快速部署步驟

### 方法一：GitHub 連動部署（最推薦、支援自動 CI/CD）

1. **上傳代碼至 GitHub**
   ```bash
   git init
   git add .
   git commit -m "feat: setup vercel deployment architecture"
   git branch -M main
   git remote add origin https://github.com/你的帳號/你的儲存庫.git
   git push -u origin main
   ```

2. **在 Vercel 匯入專案**
   - 前往 [Vercel 控制台](https://vercel.com/dashboard)，點擊 **「Add New...」 ➔ 「Project」**。
   - 選擇剛剛上傳的 GitHub 儲存庫並點擊 **「Import」**。

3. **確認專案設定**
   Vercel 已內建專用 `vercel.json`，系統會自動填入以下配置：
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build` (或 `npm run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **設定環境變數（可選）**
   在 **Environment Variables** 區塊中：
   - `APP_URL`: 您的自訂網域或 Vercel 提供之網址（例如：`https://my-stock-app.vercel.app`）
   - `DATABASE_URL`（可選）：若需儲存雲端回測記錄，可連動 Vercel Postgres、Neon 或 Supabase。未填寫時系統會自動啟用高靈敏度記憶體 + 本機 LocalStorage 快取。
   - `GEMINI_API_KEY`（可選）：若需使用 AI 分析功能。

5. **點擊「Deploy」**
   - 點擊 **Deploy** 按鈕，約 60 秒即可完成建置並獲取專屬上線網址！

---

### 方法二：使用 Vercel CLI 終端指令部署

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登入與一鍵預覽部署**
   ```bash
   vercel
   ```
   按照終端提示登入並確認預設設定（直接按 Enter 採用 `vercel.json`）。

3. **發布至正式生產環境 (Production)**
   ```bash
   vercel --prod
   ```

---

## 🔍 健康檢查與驗證

部署完成後，可透過瀏覽器造訪您的網址進行驗證：
- 前端操盤室介面：`https://<your-project>.vercel.app/`
- API 狀態檢查：`https://<your-project>.vercel.app/api/health`
- 即時個股行情測試：`https://<your-project>.vercel.app/api/stocks/2330.TW/quote`
