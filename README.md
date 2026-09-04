# 空白換行轉換器 BlankFlow

將 Facebook、Instagram、Threads 等平台容易被吃掉的空白行，轉換為含有零寬度空白字元（U+200B）的有效空白行；同時提供中文／英文／數字間距優化、字數統計、即時預覽與一鍵複製。

- 免登入、免上傳，所有文字只在瀏覽器本機處理
- 支援 PWA 安裝與離線使用
- Mobile First，桌機自動切換雙欄版面

## 本機開發

不需要建置工具，純靜態網站，直接啟動任一靜態伺服器即可：

```bash
npx serve .
```

或使用 VS Code Live Server 開啟 `index.html`。

## 測試

```bash
npm test
```

## 部署到 GitHub Pages

1. 建立 GitHub repository 並 push 此專案。
2. Repository → Settings → Pages。
3. Source 選擇 `Deploy from a branch`，Branch 選擇 `main` / `(root)`。
4. 儲存後等待數分鐘，即可透過 `https://<username>.github.io/<repo>/` 開啟。

專案內所有資源路徑皆使用相對路徑，可直接部署在 GitHub Pages 的子路徑（`/<repo>/`）下。

## 專案結構

```text
index.html                 主頁面
manifest.webmanifest       PWA manifest
sw.js                       Service Worker（App Shell 快取 + 離線）
src/
  main.js                   UI 邏輯與事件綁定
  styles/globals.css        樣式
  core/                     純函式核心邏輯
    blankLines.js           空白行 → U+200B 轉換
    chineseSpacing.js       中英數間距優化
    characterCount.js       Grapheme 字元統計
    statistics.js           字數／行數／空白行統計
    clipboard.js            複製與 fallback
    processText.js          組合轉換流程
icons/                      PWA 圖示
tests/                      核心函式單元測試
```
