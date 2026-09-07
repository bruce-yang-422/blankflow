# 空白換行轉換器 BlankFlow

🔗 網站：[blankflow.stack-base.com](https://blankflow.stack-base.com)

將 Facebook、Instagram、Threads 等平台容易被吃掉的空白行，轉換為含有零寬度空白字元（U+200B）的有效空白行；同時提供中文／英文／數字間距優化、字數統計、即時預覽與一鍵複製。

- 免登入、免上傳，所有文字只在瀏覽器本機處理
- 支援 PWA 安裝與離線使用
- Mobile First，桌機自動切換雙欄版面

## 社群平台模式

在標題說明下方、編輯區上方的分段按鈕選擇模式，再按「立即轉換」：

| 模式 | 排版預設 |
| --- | --- |
| 通用（含 Facebook） | 保留空白行，顯示Facebook 折疊提醒 |
| Instagram／Threads | 保留空白行，維持原有中英數間距 |
| WordPress | 開啟中英數間距，不加入零寬字元 |

Facebook 歸入通用，不提供獨立切換按鈕；舊設定與歷史中的 Facebook 模式會對應至通用，保留原有排版選項。

各模式預設不轉換全半形，選項仍可自行調整或重新套用預設。平台及自訂選項會保存在本機，也會隨歷史記錄還原。切換平台或調整排版選項會清除舊結果，原文保持不變。

指定平台只顯示對應提示；字數在輸入時檢查原文、轉換後檢查結果，門檻僅供參考，不會裁切內容或阻止轉換。WordPress 輸出為純文字，請在編輯器中調整段落。平台模組已納入離線快取。

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

本專案透過 `.github/workflows/deploy.yml` 自動部署：每次 push 到 `main` 分支時，GitHub Actions 會先跑測試，再將整個專案發布到 GitHub Pages。

首次設定：

1. Repository → Settings → Pages。
2. Source 選擇 `GitHub Actions`。
3. push 到 `main` 後，Actions 分頁可查看部署進度。

自訂網域：專案根目錄的 `CNAME` 檔案指定了 `blankflow.stack-base.com`，並在 Cloudflare DNS 設定 CNAME 記錄指向 `<username>.github.io`。若未設定自訂網域，預設會部署在 `https://<username>.github.io/<repo>/`。

專案內所有資源路徑皆使用相對路徑，可直接部署在 GitHub Pages 的子路徑（`/<repo>/`）或自訂網域根目錄下。

## 專案結構

```text
index.html                 主頁面
manifest.webmanifest       PWA manifest
sw.js                       Service Worker（App Shell 快取 + 離線）
CNAME                       自訂網域設定（GitHub Pages）
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
    platforms.js            平台模式、排版預設及提示
    widthConversion.js      全形／半形轉換
    history.js               最近轉換記錄（localStorage，上限 10 筆）
icons/                      PWA 圖示
tests/                      核心函式單元測試
.github/workflows/          GitHub Actions 自動部署設定
```
