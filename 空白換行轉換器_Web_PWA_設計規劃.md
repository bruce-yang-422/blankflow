# 空白換行轉換器 Web + PWA 設計規劃

> 最後盤點：2026-09-07。以本機專案原始碼及本次測試結果為準。
> 核心原理參考：[空白換行轉換器核心技術.md](空白換行轉換器核心技術.md)。該文件為原理與範例說明，實際函式介面以本文件及 `src/core/` 為準。
> 本文件已整併原先 63 節的重複規劃，更新實作狀態，並將範圍收斂為 **GitHub Pages 純靜態網站 + 瀏覽器端 PWA**。

## 1. 產品定位與範圍

**BlankFlow｜空白換行轉換器**：免登入、文字不上傳，在瀏覽器內完成社群貼文空白行及中英數排版。使用者流程為「貼上 → 選擇選項 → 立即轉換 → 複製／分享」。目標維持 4 個主要操作、一般短文約 3～5 秒完成；操作時間尚未量測驗收。

主要使用者為社群經營者、電商賣家、行銷小編及一般使用者。頁面維持單頁工具，輸入與結果分開；轉換不覆寫輸入。U+200B 的實際保留效果仍須在目的平台測試，不能保證所有平台永久採用相同處理方式。

目前版本已具備核心 MVP，並完成多項原列 V1.1／V2 的功能；尚不能將整體 PWA、跨瀏覽器與正式部署驗收標成全部完成。

### GitHub Pages 可行性與刪除範圍

GitHub Pages 提供 HTML、CSS、JavaScript 靜態託管，不執行伺服器端程式。因此保留瀏覽器端轉換、localStorage、PWA 安裝與離線快取、Clipboard、系統分享、主題切換及靜態說明頁。PWA 是否可安裝、複製或分享，另外取決於 HTTPS、瀏覽器能力及使用者操作；這些不是需要刪除的後端功能。依據：[GitHub Pages 說明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)與[建立網站限制](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。

已刪除原規劃中「未來加入雲端同步」的擴充前提，並將下列項目排除於所有開發階段，不列為未完成待辦：

- 自建會員／登入後端、雲端文字資料庫、跨裝置雲端同步與多人協作。
- Node API、PHP／Python 等伺服器端程式、執行時 SSR／Server Components。
- 需要伺服器保存密鑰或代理請求的 AI 改寫及社群 API 自動發文。
- 需要持續運作後端的排程工作或推播服務。

以上指「只使用 GitHub Pages，且不另接後端」的專案範圍；加入外部服務屬於另一種架構。React、TypeScript、Vite 本身可產出靜態網站，未採用它們是目前架構選擇，不是 Pages 不支援。複雜文件管理、Markdown 編輯器及大型 UI Framework 也不列入目前範圍，理由是產品定位。

## 2. 盤點依據與檔案對照

本次讀取專案所有文字檔，包括隱藏部署設定、README、兩份技術／規劃文件、測試與完整程式；圖示檔檢查可讀性及尺寸。`.git` 為版本控制資料，不作產品功能來源。

| 檔案 | 現有職責 |
| --- | --- |
| `index.html` | 主頁、輸入／結果、選項、主題、歷史、FAQ、安裝提示、SEO metadata |
| `src/main.js` | DOM 事件、狀態、統計、轉換、複製／分享、localStorage、主題、PWA 註冊 |
| `src/styles/globals.css` | 手機單欄、桌機雙欄、亮暗主題與各區塊樣式 |
| `src/core/blankLines.js` | 空白行辨識、可轉換數量、插入 U+200B |
| `src/core/chineseSpacing.js` | CJK 與 ASCII 英數／指定符號間距 |
| `src/core/characterCount.js` | 字素計數與舊瀏覽器 fallback |
| `src/core/statistics.js` | 輸入字數、行數、可轉換空白行數 |
| `src/core/platforms.js` | 平台模式、排版預設與平台專屬字數／段落提示 |
| `src/core/widthConversion.js` | 全形／半形英數、ASCII 對應符號及空白轉換 |
| `src/core/processText.js` | 組合轉換及報告 |
| `src/core/clipboard.js` | Clipboard API 寫入、回傳成功或失敗 |
| `src/core/history.js` | localStorage 最近 10 筆記錄、單筆刪除、全部刪除 |
| `sw.js` | App Shell 預快取、Cache First、舊快取清除與更新訊息 |
| `manifest.webmanifest` | 名稱、相對路徑、scope、standalone、圖示 |
| `icons/` | 192×192、512×512、512×512 maskable PNG；16／32 favicon、ICO |
| `tests/run.js` | Node 自訂斷言測試，不使用測試框架 |
| `package.json` | ES modules，`npm test`、`npm run dev`；無前端依賴與建置步驟 |
| `.github/workflows/deploy.yml` | main push／手動觸發，先測試再發布 Pages artifact |
| `CNAME`、`.nojekyll` | 自訂網域 `blankflow.stack-base.com`、停用 Jekyll 處理的空檔 |
| `.gitignore` | 排除 node_modules、log、screenshot PNG |
| `README.md` | 操作、開發、部署與目錄說明；尚未完整列出所有新增功能 |
| `空白換行轉換器核心技術.md` | 原始演算法、Unicode、複製及測試原理 |
| 本文件 | 現況、GitHub Pages 可行範圍、待辦及驗收 |

## 3. 已實現功能

「已實現」表示存在可追溯程式；不代表已在每個裝置完成驗收。以下 UI 主要由 `index.html` 與 `src/main.js` 實作。

| 功能 | 現況與限制 |
| --- | --- |
| 文字輸入與即時統計 | 輸入立即更新字數、行數、可轉換空白行數；空／純空白輸入停用轉換 |
| 空白行 U+200B 轉換 | 逐行處理位於內容中間的空行；支援連續空行、Space、Tab、LF／CRLF，已轉換內容不重複插入；保留首尾空行 |
| 中英數間距優化 | 獨立開關、預設關閉；另支援 `@#$%^&*` 邊界，為精簡規則而非完整排版引擎 |
| 全形／半形轉換 | 同列呈現圖示、標題與小型扁膠囊切換（11px 字級、26px 按鈕高度），顯示原樣／半形／全形；完整轉換名稱保留於輔助標籤與懸停說明，支援方向鍵與本機設定／歷史還原；含空白與全形 ASCII 對應符號，不是所有 Unicode 字元的寬度正規化 |
| 字素統計 | 使用 `Intl.Segmenter`；缺少時用 `Array.from`。統計包含空白、換行及 U+200B，並非排除不可見字元後的純可見文字數 |
| 組合轉換 | 同一次「立即轉換」依目前選項執行全半形 → 中英數間距 → 空白行 |
| 結果與摘要 | 獨立 readonly textarea；顯示空白行、間距、全半形轉換數量；空結果有 Empty State |
| 一鍵複製 | 複製記憶體中的原始結果；成功顯示 Toast，未採舊規劃的按鈕文字切換 |
| 複製失敗處理 | 聚焦及全選結果框，提示手動複製；隱形字元顯示開啟時有待修正問題，見第 5 節 |
| 隱形字元顯示 | 結果框將 U+200B 顯示為 `␣`；程式複製與分享仍取原始結果 |
| 清除 | 清空輸入、結果、統計、摘要與復原快照；保留選項與歷史記錄 |
| 復原 Undo | 僅一個轉換前快照，還原當時輸入及上一個結果；不是多步編輯歷史，不復原選項與歷史記錄，也不能撤銷清除 |
| 快捷鍵 | 輸入框內 Ctrl／Cmd + Enter 轉換；Ctrl／Cmd + V 使用 textarea 原生貼上 |
| 記住功能選項 | localStorage 保存空白行、中英間距、全半形選擇及記住輸入設定 |
| 記住上次輸入 | 底部細分隔線設定列（11px 文字、32×18px 小型開關，開關兩態維持白色 14px 圓點、灰／藍軌道及等距置中），文字對齊上方選項，說明保留懸停提示與輔助描述；預設關閉；開啟後持續保存輸入並在下次開啟還原，關閉時移除該筆暫存 |
| 最近 10 筆轉換記錄 | 每次轉換自動保存原文、結果、選項、時間；支援點選還原、單筆刪除、全部刪除 |
| 主題切換 | 亮色／跟隨系統／暗色；預設亮色，保存選擇 |
| Web Share | 有 `navigator.share` 時提供分享結果；失敗提示改用複製，取消不報錯；不是直接 API 發文 |
| 平台文字提示 | 通用模式保留Facebook 折疊提醒；指定平台只顯示該平台提示。輸入時檢查原文，轉換後檢查結果（含新增字元），標示來源、參考門檻與差額，不阻止轉換 |
| 社群平台模式 | 已完成通用／Instagram／Threads／WordPress 選擇、排版預設、自訂選項、重新套用預設、本機保存與歷史還原 |
| FAQ 與引導 | 9 個 FAQ、三步引導，首次轉換後隱藏引導；重開頁面仍會顯示 |
| 響應式版面 | 小於 900px 單欄，900px 起雙欄；640px 起調整外距 |
| 基本可及性 | 輸入 label、選項 label、統計／摘要／Toast 的 aria-live、部分焦點樣式；尚有缺口 |
| 基本 SEO 與隱私文案 | title、description、zh-TW、h1、FAQ、本機儲存及不上傳說明 |

### 社群平台模式規格（2026-09-07 已實現）

平台切換位於標題說明下方、編輯區上方，使用原生 radio 分段按鈕（通用／Instagram／Threads／WordPress），取代下拉選單。桌機與手機皆為小型橫向膠囊切換，外框與選中項採全圓角；桌機按鈕高 32px、手機 36px；支援 Tab 聚焦與方向鍵選擇。移除可見標題、平台說明與預設狀態文字，縮小上下間距；僅自訂選項時在旁邊顯示「套用平台預設」按鈕。

| 模式 | 保留空白行 | 中英數間距 | 全半形 | 提示 |
| --- | --- | --- | --- | --- |
| 通用（預設，含 Facebook） | 開 | 關 | 不轉換 | Facebook 折疊提醒 |
| Instagram | 開 | 關 | 不轉換 | 2,200 字參考門檻、段落提醒 |
| Threads | 開 | 關 | 不轉換 | 主貼文 500 字參考門檻、短段落提醒 |
| WordPress | 關 | 開 | 不轉換 | 段落區塊及佈景間距，不設字數門檻 |

Facebook 已歸入通用，不再提供獨立按鈕；舊設定與歷史記錄中的 `facebook` 會對應至 `general`，保留原有自訂排版選項。通用仍保留 Facebook 折疊提醒。

預設為本工具的編輯選擇，不是平台強制格式。切換平台或修改排版選項會清除舊結果與復原快照，保留原始文字；需再次轉換才產生新結果。自訂選項保留所選平台的提示，可按「套用平台預設」還原。重新開啟保留平台與自訂選項；歷史記錄保存 `options.platform`，舊記錄沒有平台時以通用還原，全半形缺值回到不轉換。

Threads 門檻依據 [Meta 官方說明](https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/)；WordPress 段落行為參考 [WordPress 官方文件](https://wordpress.org/documentation/article/adding-a-new-block/)。Instagram 延用既有 2,200 字參考值，本次讀取官方 API 文件遇到 HTTP 429，未將其標記為已重新核實的最新限制。所有計數都明示為參考，不裁切、不阻止轉換，也不自動發文。

### 本機儲存的實際規則

| localStorage key | 內容與預設 |
| --- | --- |
| `blankflow.options` | 平台（初次使用 general）及功能選項；初次使用保留空白行 ON，其餘轉換 OFF／none，記住輸入 OFF |
| `blankflow.rememberedInput` | 僅使用者開啟「記住上次輸入內容」時保存 |
| `blankflow.history` | 每次轉換自動保存最近 10 筆完整輸入／結果，沒有停用記錄開關 |
| `blankflow.theme` | 主題選擇，預設 light |

**文字不上傳不等於文字不留存。** 關閉記住輸入或按編輯區「清除」不會刪除歷史；歷史須用單筆刪除或「清除全部」。儲存被禁止／額滿時程式吞掉錯誤，沒有保存失敗提示。沒有導入 Analytics 或錯誤追蹤；CSS 仍會請求 Google Fonts，不能宣稱完全沒有外部網路請求。

## 4. PWA 與部署現況

| 項目 | 狀態 |
| --- | --- |
| Manifest | 已實現：`start_url: ./index.html`、`scope: ./`、`display: standalone`，未鎖定螢幕方向 |
| 圖示 | 所有 6 個圖示檔均可讀取；PWA 三個 PNG 尺寸符合 manifest；maskable 安全區外觀尚未實機驗收 |
| Service Worker | 已實現註冊、App Shell 預快取、Cache First、導航失敗回 index；版本 `blankflow-v24`（含平台模組預快取） |
| 離線狀態 | 已監聽 online／offline，用 `navigator.onLine` 顯示標記；不是已成功快取的證明 |
| Chrome／Android 安裝 | 已處理 `beforeinstallprompt` 與 userChoice；尚待實機驗收 |
| iOS 安裝提示 | 首次轉換後對 iPhone／iPad／iPod UA 顯示 Safari 加入主畫面說明；未精確限制 Safari，iPad 桌面 UA 待測 |
| Standalone | manifest 及模式偵測已寫入，安裝按鈕在偵測 standalone 時隱藏；桌面啟動待驗收 |
| 新版更新 | 偵測新 worker 安裝後自動送 `SKIP_WAITING`，沒有更新提示／立即更新按鈕，也沒有強制 reload |
| 部署工作流 | 已實現先跑 `node tests/run.js` 再 upload／deploy Pages；上傳根目錄作為 artifact |
| 自訂網域與 HTTPS | CNAME 及 README 有設定記載；本次未查核遠端 DNS、憑證、Pages Settings 或 Actions 執行紀錄，不能標成部署成功 |

離線使用前須至少成功載入並完成 Service Worker 快取；首次造訪時無網路不能直接開啟。核心 JS、CSS、manifest 與主要圖示在預快取清單；Google Fonts 沒有完整離線快取，離線可能使用替代字型，16px favicon 未列入預快取。

Cache First 依版本鍵區分資源，後續修改靜態資源應同步調整快取版本並驗收。現有更新不重載編輯頁，但 worker 可立即接管，不能寫成「只在下次造訪才啟用」或「更新流程已完整驗收」。網路恢復事件目前只更新徽章，沒有明確呼叫 `registration.update()`。

## 5. 部分完成與已確認缺口

下列均能在 GitHub Pages 架構內修正，保留為待辦；平台模式已完成，其餘既有缺口仍按此表追蹤。

| 優先序 | 缺口 | 證據與完成條件 |
| --- | --- | --- |
| P1 | 隱形字元顯示污染手動複製 | `renderOutput()` 直接把結果 textarea 換成 `␣`，手動全選與 Clipboard 失敗 fallback 會選到顯示字元。應將視覺預覽與實際輸出分離，驗證所有複製路徑保留 U+200B |
| P1 | 全形轉換與保留空白行互相影響 | 實測 `甲\n \n乙` 同時開啟半形轉全形及保留空白行，得到 `甲\n　\n乙`，新增 U+200B 數為 0。因先轉為 U+3000，後續 `/^[\t ]*$/` 不辨識；需定義組合規則並補測試 |
| P1 | 更新提示尚未實現 | 舊規劃勾選 Update prompt 不符程式。增加新版可用／立即更新流程，保護未保存輸入，測試多分頁、離線與既有 waiting worker |
| P2 | 平台提示精確性 | 已檢查轉換後字素數並移除絕對宣稱；仍為固定參考門檻，尚未模擬平台實際計數方式，Instagram 最新官方規則仍待再次查核 |
| P2 | 可及性缺口 | 結果 textarea 沒有直接的 label／aria-labelledby；主題 `role=radio` 使用 aria-pressed 而非 aria-checked，缺少 radio 群組鍵盤互動；補標籤、語意及鍵盤驗收 |
| P2 | 手機輸入與窄螢幕 | 依最新 UI 調整，說明與工具區文字統一縮小 1px；textarea 為 15px、1.85 行高，採明確繁體中文無襯線 fallback；最小高仍為 220px／桌機 300px，與原桌機 360px 目標不同；驗收手機聚焦縮放、Header 擠壓及單手操作 |
| P2 | 安裝提示時機 | 安裝按鈕一開始就顯示，只有 iOS 自動提示延後到第一次轉換；未完整實現「使用一次才提示安裝」規劃 |
| P2 | 長文效能 | 空白行轉換與統計每行使用 slice／some，最差可達 O(n²)；沒有數萬字效能量測，需改善掃描及驗收輸入延遲 |
| P2 | CJK 範圍與核心技術文件不同 | 程式使用 `豈-﫿`，核心文件為 `豈-﫿`，前者範圍更廣；核對預期 Unicode 範圍及補上邊界測試 |
| P2 | 儲存透明度及 FAQ | 補保存失敗處理；「會改變我的文字嗎」FAQ 尚未提全半形轉換；明確說明清除輸入與刪除歷史不同 |
| P2 | 離線字型一致性 | 移除外部字型依賴或改用本機字型檔，確認離線樣式與必要資源完整性 |

## 6. 尚未實現、保留的前端功能

以下不是 GitHub Pages 的限制，也不是已承諾全部要加入；先修正第 5 節，再按需要擴充。

| 功能 | 目前狀態／範圍 |
| --- | --- |
| 一鍵「全部優化」預設組合 | 已可同時勾選多功能轉換，已有平台預設組合，但沒有獨立「全部優化」按鈕；需避免同時要求互斥的全形與半形方向 |
| Redo／多步 Undo | 沒有 Redo、多步操作堆疊或清除復原 |
| 清除多餘行尾空白／空格 | 尚無獨立選項 |
| 統一換行格式選項 | 轉換空白行時內部已正規化；尚不能由使用者指定輸出 LF／CRLF |
| 移除既有零寬字元 | 尚無清理選項；現有顯示只處理 U+200B |
| 移除多餘空白行 | 尚未實現壓縮空行數 |
| 特殊字元檢查 | 尚未提供其他不可見字元的辨識及說明 |
| Hashtag 整理 | 尚未實現 |
| 即時轉換／原文與結果比較預覽 | 目前只有統計即時更新，結果須按轉換；沒有獨立原文預覽或差異比較 |
| 獨立隱私頁／多工具頁 | 現有隱私說明在同頁；未建立獨立頁面 |
| 安裝後自動聚焦輸入 | 初始化沒有 focus；目前只在清除等操作聚焦 |
| 複製快捷鍵 | 尚無 Ctrl／Cmd + Shift + C；若新增需避免瀏覽器快捷鍵衝突 |
| 事件分析 | 尚無 Analytics；可選但非必要，不列為發版門檻，不傳送輸入／輸出／剪貼簿內容 |

URL 保持首頁及同頁區塊。未來隱私／工具頁使用實際靜態檔（如 `privacy.html`、`tools/blank-line/index.html`）或 hash 路由；刪除依賴伺服器 rewrite 的路由前提。現有 `#faq` 元素預設 hidden，僅加錨點還不會展開，須補行為。所有資源繼續使用相對路徑，以支援 Pages 的 `/<repo>/` 與自訂網域根目錄。

## 7. 現行架構與核心介面

使用 **HTML + 原生 JavaScript ES modules + CSS + 手寫 Service Worker**，不需要 Vite／React／TypeScript／vite-plugin-pwa，也沒有 `components/`、`hooks/` 或 `dist/`。未來延續現有架構，不將舊文件的框架範例當成待補功能。

```text
輸入 → getTextStatistics() → 即時統計／平台提示
按下轉換 → processText(input, options)
             全半形 → 中英數間距 → 空白行
           → currentOutput → 結果／摘要／複製／分享
           → 本機最近 10 筆歷史
```

主要介面（JavaScript，以下為結構摘要）：

```js
convertBlankLines(text) // { text, convertedCount }
optimizeChineseSpacing(text) // { text, insertedCount }
toHalfwidth(text) // { text, convertedCount }
toFullwidth(text) // { text, convertedCount }
countVisibleCharacters(text) // number
countConvertibleBlankLines(text) // number
getTextStatistics(text) // { characters, lines, blankLines }
copyText(text) // Promise<{ ok, error? }>

processText(text, {
  blankLines: true,
  chineseSpacing: false,
  widthConversion: "none" // 或 toHalfwidth / toFullwidth
})
// { text, report: { convertedBlankLines, insertedSpaces, convertedWidth } }
```

空白行重複轉換應比較 `.text`，不可沿用舊文件直接把回傳物件再傳給轉換函式的範例：

```js
const once = convertBlankLines(input).text;
const twice = convertBlankLines(once).text;
console.assert(twice === once);
```

LF／CRLF 規則：只要輸入包含 CRLF，空白行模組輸出統一 CRLF；否則輸出 LF，單獨 CR 也會正規化。關閉空白行功能時，不會額外做這一步。不是逐個保留混合換行格式。

## 8. 測試結果與驗收清單

2026-09-07 平台模式實作後執行 `npm test`：**58 passed, 0 failed**。

原有 31 項斷言涵蓋空白行 9 項、中英數間距 3 項、字元計數 3 項、歷史記錄 7 項、全半形 9 項。包含 LF／CRLF、Space／Tab、多空行、單一換行不修改、空字串、重複轉換、基本 emoji、歷史上限與刪除、全半形基本行為。

新增 18 項平台測試，涵蓋平台轉換與 Facebook 舊模式對應、舊資料 fallback、門檻邊界、跨平台提示隔離、轉換新增字元超出門檻與歷史平台保存。

前次另執行組合轉換檢查，確認第 5 節的全形空白問題；沒有將臨時檢查加入專案測試。現有測試通過不代表組合流程沒有缺陷。

### 程式與本機檢查已完成

- [x] 讀取所有專案文字檔並與兩份原文件對照。
- [x] 核心與平台測試 58 項通過。
- [x] Manifest、SW、部署工作流與相對路徑已有設定。
- [x] 圖示檔可讀，PWA PNG 尺寸符合宣告。
- [x] 確認目前沒有文字 API、Analytics 或錯誤追蹤整合。

### 尚待完成的測試與發版驗收

- [ ] 修正並回歸驗證隱形預覽／手動複製，以及全半形與空白行組合問題。
- [ ] `processText` 已有平台組合測試；仍需補 `getTextStatistics`、`countConvertibleBlankLines` 的直接測試與 report 檢查。
- [ ] 補複合 emoji、罕見 Unicode、Segmenter fallback、首尾／混合換行、符號間距與 CJK 範圍案例。
- [ ] 驗證 Clipboard 成功／被拒絕／不支援、分享成功／取消／失敗。
- [ ] 建立或執行瀏覽器完整流程驗收：輸入 → 統計 → 轉換 → 原文不變 → 複製。
- [ ] Android Chrome、iOS Safari 實機安裝、桌面圖示啟動及 standalone。
- [ ] 完成首次快取後關網，重新開啟、轉換、檢視結果及複製。
- [ ] 新版提示、等待中的 worker、多分頁與輸入保存；更新不遺失未保存文字。
- [ ] Chrome、Edge、Firefox、Safari 桌面與手機窄螢幕、鍵盤及螢幕閱讀器驗收。
- [ ] 檢查文字對比、焦點可見性、主題與結果標籤。
- [ ] 儲存禁止、額滿、損壞資料及記住輸入／歷史清除行為。
- [ ] 實際目的社群貼上效果與字數提示核對。
- [ ] 長文效能及 Lighthouse；首載 JS 目標 <150 KB gzip，理想 <80 KB，尚未量測。
- [ ] 確認遠端 Pages Source、Actions 成功、DNS、自訂網域 HTTPS、根路徑與專案子路徑。

本次以本機 Chromium 完成平台模式瀏覽器檢查：切換平台、保留原文、清除過期結果、自訂選項重開還原、重新套用預設、歷史還原、轉換後門檻提示、390px 寬度選擇器及快取後斷網重新載入／轉換。未發生 JavaScript 錯誤。尚未執行手機安裝、真實剪貼簿、跨瀏覽器完整 E2E、Lighthouse 或遠端部署驗證；完整發版項目仍維持未勾選。

## 9. 後續開發順序與指令

1. 修正第 5 節 P1 項目，補組合流程與複製驗證。
2. 完成更新提示及 PWA 安裝／離線／更新實機驗收。
3. 修正可及性、手機樣式、字型與儲存提示，核對長文效能。
4. 同步 README 與核心技術文件的實際介面及新增功能，再按需求選做第 6 節功能。
5. 通過發版驗收後由既有 GitHub Actions 發布，維持純靜態架構。

```bash
npm test
npm run dev
```

`npm run dev` 使用 npx 啟動 serve，本機首次執行可能需要下載套件；網站發布本身沒有 Node 伺服器或建置步驟。只靠雙擊 `index.html` 的 file URL 不作為 ES modules／PWA 的開發驗收方式。

### 字數儀表狀態

原文字數依所選平台參考門檻變色：低於 90% 為綠色、90%～100% 為橙色、超出為紅色；接近／超出時加上文字標記。空輸入、通用與 WordPress 無字數門檻，維持原色。行數與空白行統計維持原色。轉換後的結果警告仍獨立檢查結果文字。新增 9 項門檻狀態測試。

### 手機版排版修正

移除 DOCTYPE 前誤植的「格」，恢復標準模式。小於 640px 採兩列頁首（品牌／操作列），按鈕不斷行；Hero 標題分為兩行、手機說明縮短，平台切換等寬排列。手機編輯區縮小外距並保持 textarea 16px，桌機仍使用原有排版。
