<div align="center">

# BlankFlow

**空白換行轉換器：保留社群貼文段落的純前端排版工具**

[![Deploy](https://github.com/bruce-yang-422/blankflow/actions/workflows/deploy.yml/badge.svg)](https://github.com/bruce-yang-422/blankflow/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)
![No Build](https://img.shields.io/badge/build-none-lightgrey)

[線上使用](https://blankflow.stack-base.com) · [回報問題](https://github.com/bruce-yang-422/blankflow/issues) · [功能建議](https://github.com/bruce-yang-422/blankflow/issues/new)

</div>

---

## 簡介

在 Facebook、Instagram、Threads 等平台發文時，連續的空白行常被自動合併，導致段落擠在一起。BlankFlow 會在空白行插入零寬度空白字元（U+200B），讓段落在發布後仍能維持原本的間距，並提供中英數間距與全形／半形轉換等排版功能。

所有處理皆在瀏覽器本機完成，無須登入、不會上傳任何文字。

## 功能特色

- **保留空白行**：在空白行插入 U+200B，避免平台合併段落。
- **中英數間距**：自動在中文與英文、數字之間加入空格。
- **全形／半形轉換**：統一標點與英數字元寬度。
- **平台模式**：內建通用、Instagram、Threads、WordPress 預設，可個別調整。
- **即時統計**：顯示字數、行數、空白行數，並提供平台字數參考提示。
- **複製與分享**：一鍵複製結果，支援 Web Share API。
- **本機記錄**：保留最近 10 筆轉換記錄，支援單步復原與記住上次輸入。
- **響應式介面**：桌面為雙欄編輯，手機於同一輸入框顯示結果。
- **PWA**：可安裝至裝置並離線使用，支援亮色、暗色與跟隨系統主題。

## 快速開始

### 線上使用

直接開啟 <https://blankflow.stack-base.com>，無須安裝。

### 本機執行

#### 需求

- [Node.js](https://nodejs.org/) 18 以上（僅用於開發伺服器與測試）

#### 安裝與啟動

```bash
git clone https://github.com/bruce-yang-422/blankflow.git
cd blankflow
npm run dev
```

開啟終端機顯示的本機網址即可使用。`npm run dev` 會透過 `npx` 下載 [`serve`](https://www.npmjs.com/package/serve)，首次執行需連網。

## 使用方式

1. 選擇平台模式。
2. 貼上文字，依需求調整排版選項。
3. 按下「立即轉換」。
4. 按下「複製結果」，貼至目標平台並預覽後發布。

> [!TIP]
> 手機版轉換後可直接編輯同一個文字框；按「復原」可回到轉換前的內容。

### 平台模式預設值

| 模式 | 保留空白行 | 中英數自動加空格 |
| --- | :---: | :---: |
| 通用（含 Facebook） | ✅ | ❌ |
| Instagram | ✅ | ❌ |
| Threads | ✅ | ❌ |
| WordPress | ❌ | ✅ |

> [!NOTE]
> - 各模式預設皆保留原本的全形／半形字元。
> - 以上為本工具的排版預設，並非平台官方規範。
> - 字數提示僅供參考，不會截斷內容或阻止轉換；實際限制以各平台為準。
> - WordPress 模式輸出純文字，段落樣式請於編輯器中設定。

## 開發

本專案採用原生 HTML、CSS 與 JavaScript（ES Modules），**無建置步驟、無執行期相依套件**。

### 可用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 以靜態伺服器啟動本機開發環境 |
| `npm test` | 執行核心邏輯測試 |

### 測試

```bash
npm test
```

測試以 Node.js 直接執行，涵蓋文字轉換、統計、平台設定與歷史記錄等核心模組。

## 專案結構

```text
blankflow/
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages 自動部署
├── icons/                   # 網站與 PWA 圖示
├── src/
│   ├── core/                # 核心邏輯（與 UI 無關，可獨立測試）
│   │   ├── blankLines.js        # 空白行處理
│   │   ├── chineseSpacing.js    # 中英數間距
│   │   ├── widthConversion.js   # 全形／半形轉換
│   │   ├── processText.js       # 轉換流程整合
│   │   ├── platforms.js         # 平台模式設定
│   │   ├── statistics.js        # 文字統計
│   │   ├── characterCount.js    # 字數計算
│   │   ├── history.js           # 轉換記錄
│   │   └── clipboard.js         # 剪貼簿操作
│   ├── styles/globals.css   # 全站樣式與響應式版面
│   └── main.js              # 介面狀態與事件處理
├── tests/run.js             # 核心邏輯測試
├── index.html               # 主頁面與 SEO 中繼資料
├── manifest.webmanifest     # PWA 設定
├── sw.js                    # Service Worker 與離線快取
├── CNAME                    # GitHub Pages 自訂網域
├── LICENSE
└── package.json
```

## 部署

專案透過 GitHub Actions 部署至 GitHub Pages。推送至 `main` 或手動觸發工作流程時，會先執行測試，通過後才發布。

1. 於儲存庫 **Settings → Pages → Build and deployment** 將 Source 設為 **GitHub Actions**。
2. 推送至 `main`，並於 **Actions** 分頁確認執行結果。
3. 如需自訂網域，修改根目錄 `CNAME` 並設定對應 DNS 記錄；不使用自訂網域時請刪除 `CNAME`。

網站資源皆使用相對路徑，可部署於網域根目錄或子路徑。

> [!IMPORTANT]
> 修改任何離線快取資源時，請同步更新 `sw.js` 中的 `CACHE_VERSION`，確保使用者取得新版本。Service Worker 僅在 HTTPS 或 `localhost` 下運作。

## 隱私

- 輸入文字**不會**上傳至任何伺服器。
- 設定、最近 10 筆轉換記錄與選擇記住的輸入內容，僅儲存於瀏覽器的 `localStorage`，不跨裝置同步；清除網站資料即一併刪除。
- 剪貼簿、系統分享與 PWA 安裝功能取決於瀏覽器支援與權限；無法自動複製時可手動選取複製。

## 授權條款

本專案採用 [MIT License](LICENSE) 授權。
