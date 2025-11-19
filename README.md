# ChatGPT 提示詞助手

React + Vite 版本的 Chrome 擴充功能，可儲存常用提示詞、設定觸發符號，並在 ChatGPT (https://chatgpt.com) 的輸入框中輸入 `!!` 等自訂符號快速插入片語。

## 功能重點
- ✅ React 建立的提示詞管理介面，支援新增、編輯、刪除與即時同步
- ✅ 匯入 / 匯出 JSON，方便共享與備份
- ✅ 自訂觸發符號 (預設 `!!`)，在 ChatGPT 中按 Tab / Enter 選取
- ✅ content script 於 ChatGPT 內顯示建議清單，支援鍵盤導覽

## 環境需求
- Node.js 18+ / npm 10+
- Chrome 109+ (Manifest V3)

## 開發流程
```bash
npm install
npm run dev          # 啟動 React 開發伺服器（options UI）
npm run build        # 產出 build/，含 background/content/options
```

`npm run dev` 只渲染 React 介面（無法呼叫 Chrome API），請在瀏覽器中載入 `build/` 目錄進行完整測試。

## 安裝 / 偵錯
1. 執行 `npm run build`，確認 `build/` 內含 `manifest.json`、`background.js`、`content.js`、`index.html`、`icons/`
2. Chrome 前往 `chrome://extensions` → 開啟「開發人員模式」
3. 「載入未封裝項目」→ 選擇 `build/`
4. 點擊工具列圖示將會開啟 React options 介面；在 https://chatgpt.com 文字輸入框輸入觸發符號即可叫出列表

## 專案結構
```
├── public/             # manifest 及 icons（會被複製到 build/）
├── src/
│   ├── App.tsx         # React options UI
│   ├── content.ts      # ChatGPT 內容腳本（提示詞插入）
│   ├── background.ts   # 觸發 options 頁面的 service worker
│   └── *.css           # UI 與全域樣式
├── vite.config.ts      # 自訂輸出 entry（main/background/content）
└── package.json
```

## 相關指令
- `npm run lint`：使用 ESLint 驗證 TypeScript / React 程式碼
- `npm run preview`：預覽 build 結果

若需調整匹配網址或權限，請修改 `public/manifest.json` 並重新 build。
