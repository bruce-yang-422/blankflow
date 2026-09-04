# 空白換行轉換器 Web + PWA 設計規劃

> 文件用途：作為「空白換行轉換器」網站與 PWA 開發規格、UI/UX 規劃、前端架構與驗收依據。  
> 核心技術依據：`空白換行轉換器核心技術.md`  
> 建議產品定位：**免登入、免上傳、離線可用、貼上即轉換的社群文字排版工具。**

---

# 1. 專案定位

## 1.1 產品名稱暫定

**BlankFlow｜空白換行轉換器**

可替代名稱：

- 空白換行
- 社群空白行工具
- 貼文排版助手
- Social Spacer
- BlankLine
- PostFlow

產品名稱不影響核心技術，可於實作階段再決定。

---

## 1.2 一句話產品說明

將 Facebook、Instagram、Threads、WordPress 等平台容易被吃掉的「空白行」，轉換為含有 `U+200B` 零寬度空白字元的有效空白行，並同時提供中文／英文／數字間距優化、字數統計、即時預覽與一鍵複製。

---

## 1.3 核心產品價值

使用者的完整流程應壓縮成：

```text
貼上文字
  ↓
自動分析
  ↓
選擇需要的排版功能
  ↓
轉換
  ↓
一鍵複製
  ↓
貼到社群平台
```

重點不是「編輯器功能很多」，而是：

> **讓使用者 3～5 秒內完成貼文排版。**

因此介面應避免複雜工具列、帳號系統、雲端文件與不必要設定。

---

# 2. 核心技術基礎

本產品的核心可完全在瀏覽器端執行，不需要後端、不需要 AI，也不需要將使用者文字傳送至伺服器。

---

## 2.1 空白行轉換

核心概念：

```text
原本：
第一段

第二段

轉換後：
第一段
[U+200B]
第二段
```

實際字串：

```js
"第一段\n\u200B\n第二段"
```

推薦正式版不要只使用：

```js
text.replace(/\n\n/g, "\n\u200B\n");
```

而採用較穩健的逐行處理方式，以支援：

- Windows CRLF：`\r\n`
- macOS／Unix LF：`\n`
- 三個以上連續空白行
- 只有 Space 的空白行
- 只有 Tab 的空白行
- 多段文章
- 已存在 U+200B 的文字

推薦實作：

```js
const ZERO_WIDTH_SPACE = "\u200B";

function convertBlankLines(text) {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  const converted = lines.map((line, index) => {
    const isBlank = /^[\t ]*$/.test(line);

    const hasContentBefore = lines
      .slice(0, index)
      .some(item => item.trim() !== "");

    const hasContentAfter = lines
      .slice(index + 1)
      .some(item => item.trim() !== "");

    return isBlank && hasContentBefore && hasContentAfter
      ? ZERO_WIDTH_SPACE
      : line;
  });

  return converted.join(newline);
}
```

---

## 2.2 中文／英文／數字間距優化

功能目的：

```text
轉換前：
使用ChatGPT寫3篇Threads貼文

轉換後：
使用 ChatGPT 寫 3 篇 Threads 貼文
```

規則：

- CJK → 英文／數字：加入半形空白
- 英文／數字 → CJK：加入半形空白
- CJK ↔ 指定 ASCII 符號：加入半形空白

建議保留為「獨立開關」，不要強制套用。

原因：

部分使用者只想修復空白行，不希望原文間距被修改。

---

## 2.3 字數統計

不建議正式版直接依賴：

```js
text.length
```

因為 emoji 等 Unicode 字元可能被計算成 2 個 UTF-16 code unit。

推薦：

```js
function countVisibleCharacters(text) {
  const segmenter = new Intl.Segmenter("zh-TW", {
    granularity: "grapheme"
  });

  return [...segmenter.segment(text)].length;
}
```

介面可同時顯示：

```text
字數 128
行數 7
空白行 3
```

其中「空白行」指目前可被轉換的空白行數。

---

## 2.4 一鍵複製

主要方式：

```js
await navigator.clipboard.writeText(result);
```

但介面不能完全依賴 Clipboard API。

必須保留：

- 可選取的輸出 textarea
- 手動全選
- 手動複製
- Clipboard 失敗提示

---

# 3. PWA 產品策略

本產品非常適合做成 PWA，因為：

1. 核心功能全部在前端執行。
2. 不需要登入。
3. 不需要伺服器運算。
4. 很適合手機使用。
5. 使用情境通常發生在「準備發文」前。
6. 安裝至手機桌面後可像 App 一樣快速開啟。
7. Service Worker 快取後可離線使用。

---

## 3.1 PWA 目標

使用者應可以：

- Safari／Chrome 開啟網站。
- 直接使用全部轉換功能。
- 將網站加入主畫面。
- 從桌面圖示啟動。
- 無網路時仍可以：
  - 輸入文字
  - 轉換空白行
  - 優化排版
  - 查看預覽
  - 複製結果
- 網路恢復後自動載入新版資源。

---

# 4. 使用者族群

主要使用者：

### A. 社群經營者

使用：

- Facebook
- Instagram
- Threads

需求：

- 貼文空白行不要消失
- 貼文看起來乾淨
- 快速複製

---

### B. 電商賣家

使用：

- 蝦皮商品介紹
- Facebook 粉專
- IG 商品貼文
- Threads

需求：

- 大量整理商品文案
- 中文英文數字混排
- 快速排版

---

### C. 行銷／小編

需求：

- 每天處理大量社群文字
- 不想登入
- 希望固定工具可以放桌面
- 手機與電腦都能使用

---

### D. 一般使用者

需求：

- 偶爾使用
- 不想研究 Unicode
- 只想知道「貼進去 → 按一下 → 複製」

---

# 5. 使用者體驗原則

產品 UI 必須遵守以下原則：

## 5.1 一頁完成

不要讓使用者進入：

```text
首頁
↓
工具頁
↓
設定頁
↓
結果頁
```

建議：

```text
單頁工具
```

所有主要操作都在同一個畫面完成。

---

## 5.2 輸入即分析

使用者貼上文字後立即更新：

- 字數
- 行數
- 可轉換空白行數
- 原始預覽

不需要先按「分析」。

---

## 5.3 不自動破壞原文

預設只執行：

**空白行轉換**

中文／英文間距優化必須由使用者選擇。

---

## 5.4 所有處理均顯示結果

不要做成：

```text
按下轉換
→ 自動複製
→ 沒有結果區
```

應保留明確結果區，降低使用者不確定感。

---

## 5.5 手機優先

PWA 的主要價值來自手機。

因此整體設計採：

```text
Mobile First
```

桌機再擴展成左右雙欄。

---

# 6. 網頁資訊架構

建議整站控制在 4 個主要區域：

```text
App
│
├─ Header
│
├─ Editor
│   ├─ Input
│   ├─ Options
│   ├─ Actions
│   └─ Statistics
│
├─ Result
│   ├─ Output
│   ├─ Copy
│   └─ Preview
│
└─ Help / FAQ
```

PWA 不需要額外製作獨立首頁。

---

# 7. 主畫面 Wireframe

## 7.1 Desktop

```text
┌────────────────────────────────────────────────────────────┐
│  BlankFlow                              [安裝 App]  [說明] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│       貼上文字，自動保留社群貼文的空白行                    │
│       不上傳內容・瀏覽器本機處理・可離線使用               │
│                                                            │
├─────────────────────────┬──────────────────────────────────┤
│ 原始文字                │ 轉換結果                         │
│                         │                                  │
│ ┌─────────────────────┐ │ ┌──────────────────────────────┐ │
│ │                     │ │ │                              │ │
│ │ textarea            │ │ │ output textarea             │ │
│ │                     │ │ │                              │ │
│ │                     │ │ │                              │ │
│ └─────────────────────┘ │ └──────────────────────────────┘ │
│                         │                                  │
│ 字數 128 · 7 行 · 3空行 │ 已保留 3 個空白行               │
│                         │                                  │
│ ☑ 保留空白行            │ [複製結果]                       │
│ ☐ 中英數自動加空格      │                                  │
│                         │                                  │
│ [立即轉換] [清除]       │                                  │
├─────────────────────────┴──────────────────────────────────┤
│  貼到 Facebook / Instagram / Threads 前都可以使用         │
├────────────────────────────────────────────────────────────┤
│ FAQ                                                        │
└────────────────────────────────────────────────────────────┘
```

---

## 7.2 Mobile / PWA

```text
┌───────────────────────┐
│ BlankFlow        ⋯    │
├───────────────────────┤
│ 貼上文字              │
│ ┌───────────────────┐ │
│ │                   │ │
│ │ textarea          │ │
│ │                   │ │
│ └───────────────────┘ │
│ 128 字 · 7 行 · 3 空行│
│                       │
│ ☑ 保留空白行          │
│ ☐ 中英數加空格        │
│                       │
│ [     立即轉換      ] │
│                       │
│ 轉換結果              │
│ ┌───────────────────┐ │
│ │                   │ │
│ │ result            │ │
│ │                   │ │
│ └───────────────────┘ │
│                       │
│ [     複製結果      ] │
│                       │
│ ✓ 已保留 3 個空白行   │
└───────────────────────┘
```

---

# 8. 主畫面元件規格

## 8.1 Header

內容：

- Logo
- BlankFlow / 空白換行
- PWA 安裝按鈕
- 說明按鈕
- 主題切換，可列為 V2

Desktop：

```text
Logo + 名稱                         安裝 App / 使用說明
```

Mobile：

```text
Logo + 名稱                         ⋯
```

---

## 8.2 Hero

主標：

> **讓社群貼文的空白行，不再被吃掉。**

副標：

> 貼上文字，一鍵加入隱形空白字元。Facebook、Instagram、Threads 貼文排版更乾淨。

信任說明：

> 文字只在你的裝置內處理，不會上傳伺服器。

---

## 8.3 InputEditor

元件：

```text
<InputEditor />
```

功能：

- textarea
- 支援貼上
- 支援 Ctrl/Cmd + V
- 自動高度或固定最小高度
- 即時統計
- 偵測空白行
- 不修改使用者輸入內容

Placeholder：

```text
把準備發布的貼文貼在這裡…

例如：

今天分享 3 個小技巧。

第一個技巧…
```

---

## 8.4 StatisticsBar

顯示：

```text
128 字　7 行　3 個空白行
```

如果沒有空白行：

```text
128 字　4 行　沒有需要轉換的空白行
```

---

## 8.5 OptionsPanel

### 選項 A

```text
☑ 保留空白行
```

說明：

> 在空白行加入看不見的零寬度字元。

預設：

```text
ON
```

---

### 選項 B

```text
☐ 中文／英文／數字自動加空格
```

說明：

> 例如「使用ChatGPT寫3篇」→「使用 ChatGPT 寫 3 篇」。

預設：

```text
OFF
```

---

### V2 可加入

```text
☐ 清除多餘行尾空白
☐ 統一換行格式
☐ 移除既有零寬字元
```

V1 不建議一次塞太多選項。

---

# 9. 操作按鈕

## 9.1 主要按鈕

```text
立即轉換
```

點擊後：

1. 取得 input。
2. 依 Options 執行文字處理。
3. 更新 Result。
4. 顯示轉換摘要。
5. 不強制自動複製。

原因：

PWA／Safari／部分瀏覽器對 Clipboard 權限行為不同，將「轉換」與「複製」分開，UX 更可預期。

---

## 9.2 次要按鈕

```text
清除
```

功能：

- 清除輸入
- 清除結果
- 重置統計
- 不改變使用者設定

清除前若內容很多，可選擇性加確認。

V1 可不確認以追求速度。

---

## 9.3 複製按鈕

```text
複製結果
```

成功：

```text
✓ 已複製
```

2 秒後恢復：

```text
複製結果
```

失敗：

```text
無法自動複製，請長按／全選結果後手動複製。
```

---

# 10. Result 區域

Result 不只是顯示文字，也要傳達「到底做了什麼」。

例如：

```text
轉換完成

✓ 已保留 3 個空白行
✓ 已加入 4 組中英數間距
```

若只選空白行：

```text
✓ 已保留 3 個空白行
```

若沒有需要轉換的內容：

```text
沒有找到需要處理的空白行。
```

不要顯示錯誤式紅色狀態，因為這不是失敗。

---

# 11. 隱形字元視覺化

這是非常推薦加入的 UX 功能。

因為 `U+200B` 肉眼看不到，使用者會懷疑：

> 「真的有轉換嗎？」

因此 Result 區可加入：

```text
[ ] 顯示隱形字元
```

開啟後只在「視覺預覽」顯示：

```text
第一段
[ZWSP]
第二段
```

或：

```text
第一段
·
第二段
```

注意：

此功能只能影響 Preview，不可以改變真正複製內容。

真正輸出仍必須是：

```text
\u200B
```

---

# 12. 轉換資料流

推薦單一資料處理流程：

```text
inputText
    │
    ├─ normalizeNewlines()
    │
    ├─ countStatistics()
    │
    └─ 使用者按「立即轉換」
          │
          ├─ enableChineseSpacing ?
          │      └─ optimizeChineseSpacing()
          │
          ├─ enableBlankLine ?
          │      └─ convertBlankLines()
          │
          └─ outputText
                 │
                 ├─ Result
                 ├─ Preview
                 └─ Clipboard
```

---

# 13. 核心程式模組

不要將全部邏輯寫在單一 `App.jsx` 或 `script.js`。

推薦拆分：

```text
src/
├─ core/
│  ├─ blankLines.ts
│  ├─ chineseSpacing.ts
│  ├─ characterCount.ts
│  ├─ statistics.ts
│  └─ clipboard.ts
│
├─ components/
│  ├─ Header.tsx
│  ├─ Hero.tsx
│  ├─ InputEditor.tsx
│  ├─ StatisticsBar.tsx
│  ├─ OptionsPanel.tsx
│  ├─ ActionBar.tsx
│  ├─ ResultEditor.tsx
│  ├─ ConversionSummary.tsx
│  ├─ InstallPrompt.tsx
│  └─ OfflineBadge.tsx
│
├─ hooks/
│  ├─ usePWAInstall.ts
│  └─ useOnlineStatus.ts
│
├─ styles/
│  └─ globals.css
│
├─ App.tsx
└─ main.tsx
```

---

# 14. 推薦前端技術架構

## 14.1 V1 建議

```text
Vite
React
TypeScript
CSS / CSS Modules
vite-plugin-pwa
```

原因：

- 專案小
- 部署容易
- PWA 設定成熟
- TypeScript 可避免文字處理函式輸入輸出錯誤
- 不需要引入大型狀態管理

不需要：

- Next.js Server Component
- Node API
- Database
- Firebase
- Supabase
- 使用者帳號

除非未來要加入雲端同步。

---

## 14.2 更極簡版本

也可使用：

```text
Vite
Vanilla TypeScript
vite-plugin-pwa
```

這個產品本身不需要 React 才能完成。

若目標是：

> 最小 bundle、最快開啟、最容易長期維護

Vanilla TypeScript 反而非常適合。

---

# 15. 狀態管理

V1 只需要：

```ts
interface AppState {
  inputText: string;
  outputText: string;

  options: {
    blankLines: boolean;
    chineseSpacing: boolean;
  };

  statistics: {
    characters: number;
    lines: number;
    blankLines: number;
  };

  conversion: {
    convertedBlankLines: number;
    insertedSpaces: number;
  };
}
```

React 可用：

```text
useState
useMemo
```

即可。

不需要 Redux / Zustand。

---

# 16. 本機儲存策略

推薦使用 `localStorage` 保存：

```text
使用者功能選項
```

例如：

```json
{
  "blankLines": true,
  "chineseSpacing": false
}
```

是否保存文字內容：

### 預設建議：不保存

原因：

- 使用者可能貼入私人內容
- 產品可主打「文字不留存」
- 重新開啟就是乾淨狀態

V2 可加入：

```text
☐ 記住上次文字
```

讓使用者自行決定。

---

# 17. PWA Manifest 規劃

`manifest.webmanifest`

```json
{
  "name": "BlankFlow 空白換行轉換器",
  "short_name": "BlankFlow",
  "description": "社群貼文空白行與中英數排版工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F7F8FA",
  "theme_color": "#111827",
  "lang": "zh-TW",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/pwa-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/pwa-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Desktop 不必限制 orientation。

若希望桌機也自然使用，可移除：

```json
"orientation": "portrait-primary"
```

推薦正式版本移除 orientation 限制。

---

# 18. Service Worker 策略

本產品應採：

> **App Shell + Cache First 靜態資源 + 離線可用**

主要快取：

```text
/
index.html
JS bundle
CSS bundle
icons
fonts（若有）
manifest
```

不需要快取 API，因為沒有後端 API。

---

## 18.1 更新策略

推薦：

```text
registerType: "prompt"
```

當有新版時顯示：

```text
有新版可以使用
[立即更新]
```

不要使用完全無提示的強制 reload，以免使用者正在編輯文字時內容消失。

---

# 19. PWA 安裝流程

## Chrome / Android

偵測：

```js
beforeinstallprompt
```

符合條件時顯示：

```text
安裝 BlankFlow
```

點擊後觸發瀏覽器安裝流程。

---

## iOS Safari

iOS 不使用相同的安裝 prompt 流程。

介面應顯示簡單教學：

```text
Safari → 分享 → 加入主畫面
```

建議只在 iOS Safari 且非 standalone 模式顯示。

---

# 20. Offline UX

PWA 離線時，Header 可顯示小型狀態：

```text
● 離線模式
```

但不應阻止操作。

因為所有核心功能皆可離線。

離線訊息：

> 目前沒有網路，但文字轉換仍可正常使用。

---

# 21. PWA App 啟動畫面

Standalone 啟動後：

```text
不需要 Landing Page
```

直接進入工具。

第一個聚焦區：

```text
Input textarea
```

讓使用者開 App 後馬上貼文。

---

# 22. Responsive Breakpoints

推薦：

```css
Mobile:   < 768px
Tablet:   768px - 1023px
Desktop:  >= 1024px
```

Mobile：

```text
Input
Options
Convert
Result
Copy
```

單欄。

Desktop：

```text
Input | Result
```

雙欄。

---

# 23. 視覺風格

推薦方向：

> **極簡工具感 + SaaS 清晰度 + 社群友善感**

避免：

- 大量漸層
- 過多玻璃擬態
- 大量動畫
- 複雜卡片
- 過多說明
- 看起來像 AI 工具

---

## 23.1 顏色建議

### Background

```text
#F7F8FA
```

### Card

```text
#FFFFFF
```

### Primary Text

```text
#111827
```

### Secondary Text

```text
#6B7280
```

### Border

```text
#E5E7EB
```

### Primary Action

可採：

```text
#2563EB
```

或更柔和：

```text
#4F6EF7
```

---

## 23.2 圓角

```text
Card: 16px
Textarea: 14px
Button: 12px
Small chip: 999px
```

---

## 23.3 陰影

使用極淡陰影：

```css
box-shadow:
  0 1px 2px rgba(0,0,0,.04),
  0 8px 24px rgba(0,0,0,.04);
```

---

# 24. Typography

中文：

```text
Noto Sans TC
system-ui
-apple-system
BlinkMacSystemFont
"Segoe UI"
sans-serif
```

如果希望 PWA 真正完全離線且極輕量：

> 優先使用 system font，不強制載入 Google Fonts。

---

# 25. Textarea UX

Textarea 是整個產品最重要的 UI。

必須：

- 清楚區分 Input / Result
- 大型點擊區
- 手機至少 180～240px 高
- Desktop 至少 360px 高
- 支援長文
- `resize: vertical`
- 不使用 contenteditable 作為 V1 主編輯器

推薦：

```css
textarea {
  width: 100%;
  min-height: 320px;
  line-height: 1.7;
  font-size: 16px;
}
```

手機保持 `16px` 以上，可避免部分行動瀏覽器輸入時自動縮放頁面。

---

# 26. 鍵盤快捷鍵

Desktop 可支援：

```text
Ctrl / Cmd + Enter
```

執行：

```text
立即轉換
```

以及：

```text
Ctrl / Cmd + Shift + C
```

執行：

```text
複製結果
```

必須避免覆蓋瀏覽器常用快捷鍵。

V1 只做 `Cmd/Ctrl + Enter` 即可。

---

# 27. 安全與隱私設計

網站應明確顯示：

> **所有文字都只在你的瀏覽器內處理，不會上傳伺服器。**

技術原則：

- 無登入
- 無文字 API
- 無文字資料庫
- 不記錄貼文內容
- Analytics 不得收集 textarea value
- 錯誤追蹤不得附帶使用者輸入文字

如果使用 GA / Plausible，可記錄：

```text
convert_click
copy_click
install_click
option_spacing_enabled
```

不可記錄：

```text
input_text
output_text
clipboard_content
```

---

# 28. SEO 規劃

雖然是工具型網站，仍可做簡單 SEO。

Title：

```text
空白換行轉換器｜Facebook・IG・Threads 貼文空白行工具
```

Description：

```text
免費空白換行轉換器，在空白行加入零寬度字元，避免 Facebook、Instagram、Threads 貼文換行被壓縮。免登入、文字不上傳、支援 PWA 離線使用。
```

H1：

```text
空白換行轉換器
```

頁面內可自然包含：

- Facebook 空白行
- IG 空白行
- Instagram 換行
- Threads 換行
- 社群貼文排版
- 零寬度空白
- U+200B

---

# 29. FAQ

推薦至少包含：

## 為什麼貼到社群後空白行會不見？

部分平台會清理純空白行或重新正規化 whitespace。

---

## 這個工具做了什麼？

在原本完全空白的行中放入看不見的 `U+200B` 字元，使該行在字串層級不再是完全空白。

---

## 會改變我的文字嗎？

「保留空白行」功能只處理空白行。

若另外開啟「中文／英文／數字自動加空格」，才會修改中英數交界間距。

---

## 我的文字會被上傳嗎？

不會。

所有文字處理皆在瀏覽器本機完成。

---

## 沒網路也可以用嗎？

安裝 PWA 或曾載入網站資源後，核心轉換功能可離線使用。

---

## 為什麼按複製沒有反應？

瀏覽器可能阻止 Clipboard API。Result 區仍可手動選取並複製。

---

# 30. Edge Cases

正式版必須考慮：

### 空字串

```text
""
```

結果：

```text
不執行轉換
```

CTA disabled 或顯示：

```text
請先輸入文字
```

---

### 單一換行

```text
甲
乙
```

不可加入 U+200B。

---

### 一個空白行

```text
甲

乙
```

轉換：

```text
甲
U+200B
乙
```

---

### 多個空白行

```text
甲



乙
```

每一個有效空白行都應獨立處理。

---

### 空白行只有 Space

```text
甲

乙
```

視為空白行。

---

### 空白行只有 Tab

視為空白行。

---

### CRLF

必須正確處理：

```text
\r\n
```

---

### 已含 U+200B

必須定義策略。

V1 建議：

> 已含 U+200B 的行視為已轉換，不再重複插入。

---

### Emoji

字數統計使用 grapheme cluster。

---

### 複合 Emoji

例如：

```text
👨‍👩‍👧‍👦
```

應盡量顯示為 1 個可見字素，而不是多個 UTF-16 code unit。

---

# 31. Idempotency

非常重要。

同一段已轉換文字再次轉換，不應持續增加 U+200B。

應滿足：

```js
convertBlankLines(
  convertBlankLines(text)
) === convertBlankLines(text)
```

也就是：

> 轉換函式應盡量具備 idempotent 特性。

---

# 32. 建議改良版核心演算法

V1 建議直接把核心函式寫成可測試的 pure functions。

例如：

```ts
const ZWSP = "\u200B";

export function isBlankLine(line: string): boolean {
  return /^[\t ]*$/.test(line);
}

export function isConvertedBlankLine(line: string): boolean {
  return line === ZWSP;
}

export function convertBlankLines(text: string): string {
  if (!text) return text;

  const usesCRLF = text.includes("\r\n");
  const newline = usesCRLF ? "\r\n" : "\n";

  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n");

  const hasVisibleContent = (line: string) => {
    return line.replace(/\u200B/g, "").trim() !== "";
  };

  const result = lines.map((line, index) => {
    if (isConvertedBlankLine(line)) {
      return line;
    }

    if (!isBlankLine(line)) {
      return line;
    }

    const hasContentBefore = lines
      .slice(0, index)
      .some(hasVisibleContent);

    const hasContentAfter = lines
      .slice(index + 1)
      .some(hasVisibleContent);

    return hasContentBefore && hasContentAfter
      ? ZWSP
      : line;
  });

  return result.join(newline);
}
```

---

# 33. 統計函式

推薦：

```ts
export function getTextStatistics(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  const blankLines = lines.filter(line =>
    /^[\t ]*$/.test(line)
  ).length;

  const segmenter = new Intl.Segmenter("zh-TW", {
    granularity: "grapheme"
  });

  const characters = [
    ...segmenter.segment(text)
  ].length;

  return {
    characters,
    lines: text ? lines.length : 0,
    blankLines
  };
}
```

如需更精準區分「位於內容中間、實際會被轉換的空白行」，應另外建立：

```text
countConvertibleBlankLines()
```

而不是直接以所有空白行計算。

---

# 34. Conversion Report

建議核心函式除了輸出文字，也可回傳 report：

```ts
interface ConversionResult {
  text: string;
  report: {
    blankLinesConverted: number;
    spacingInserted: number;
  };
}
```

結果：

```ts
{
  text: "...",
  report: {
    blankLinesConverted: 3,
    spacingInserted: 4
  }
}
```

UI 就可以準確顯示：

```text
已保留 3 個空白行
已加入 4 個中英數間距
```

---

# 35. Clipboard Fallback

推薦流程：

```text
navigator.clipboard.writeText()
          │
          ├─ success
          │    └─ 已複製
          │
          └─ fail
               ├─ select output textarea
               └─ 顯示手動複製提示
```

可加：

```js
outputRef.current?.select();
```

讓失敗時使用者可以立刻使用系統複製功能。

---

# 36. Accessibility

必須：

- 所有按鈕可用鍵盤操作
- Switch / Checkbox 有 label
- Textarea 有 `<label>`
- focus state 清楚
- Toast 不可以是唯一狀態提示
- Result 更新可使用 `aria-live="polite"`
- 色彩對比符合基本 WCAG 要求

---

# 37. Toast 設計

成功：

```text
✓ 已複製到剪貼簿
```

錯誤：

```text
無法自動複製，請手動複製結果
```

離線：

```text
目前為離線模式，轉換功能仍可使用
```

更新：

```text
有新版可以使用
[更新]
```

---

# 38. 首次使用引導

不要做多步 Tutorial。

第一次進入只需要在 textarea 上方顯示：

```text
1. 貼上貼文
2. 按「立即轉換」
3. 複製結果
```

即可。

完成第一次轉換後可自動隱藏。

---

# 39. 安裝 PWA 的提示時機

不要一開站就跳安裝。

推薦條件：

```text
使用者至少成功轉換 1 次
```

之後顯示：

> 常用這個工具？安裝到桌面，下次開啟更快。

按鈕：

```text
安裝 App
```

這比第一次開啟就要求安裝更自然。

---

# 40. Empty State

Result 尚未產生：

```text
轉換結果會顯示在這裡
```

可放淡色 icon：

```text
↵
```

不要顯示假文字。

---

# 41. 錯誤狀態

本產品大部分操作不應產生「系統錯誤」。

主要錯誤只會來自：

- Clipboard
- PWA cache
- Browser compatibility

使用者文字本身不應被當成錯誤。

---

# 42. Browser Compatibility

主要支援：

- Chrome
- Edge
- Safari
- Firefox
- Android Chrome
- iOS Safari

針對：

```text
Intl.Segmenter
```

若舊瀏覽器不支援，可 fallback：

```js
Array.from(text).length
```

字數可能較不精準，但不影響核心轉換。

---

# 43. 測試策略

## 43.1 Unit Test

核心函式：

```text
convertBlankLines()
optimizeChineseSpacing()
countVisibleCharacters()
countConvertibleBlankLines()
```

---

## 43.2 必測案例

```ts
convertBlankLines("甲\n\n乙")
// 甲\n\u200B\n乙
```

```ts
convertBlankLines("沒有空行")
// 原文不變
```

```ts
convertBlankLines("甲\r\n\r\n乙")
// 正確支援 CRLF
```

```ts
convertBlankLines("甲\n \n乙")
// 空格行視為空白
```

```ts
convertBlankLines("甲\n\t\n乙")
// Tab 行視為空白
```

```ts
convertBlankLines("甲\n\u200B\n乙")
// 不重複插入
```

```ts
optimizeChineseSpacing("中文ABC中文")
// 中文 ABC 中文
```

```ts
optimizeChineseSpacing("第3篇")
// 第 3 篇
```

---

# 44. E2E Test

測試完整流程：

```text
開啟網站
↓
貼上文字
↓
顯示正確統計
↓
立即轉換
↓
Result 正確
↓
點擊複製
↓
顯示已複製
```

PWA：

```text
載入一次
↓
關閉網路
↓
重新開啟
↓
仍可轉換
```

---

# 45. PWA 驗收標準

正式發布前至少確認：

- `manifest.webmanifest` 可正常讀取
- icon 192×192
- icon 512×512
- maskable icon
- `display: standalone`
- HTTPS
- Service Worker 正常註冊
- 離線可開啟 App
- 離線可轉換文字
- 安裝後可從桌面啟動
- 更新版本不會直接清掉使用者正在輸入的文字

---

# 46. 效能目標

因為產品本身很小，應追求非常快。

推薦：

```text
First load JS < 150 KB gzip
```

理想：

```text
< 80 KB gzip
```

核心演算法應在：

```text
數萬字文字
```

仍保持幾乎即時反應。

---

# 47. 不需要做的功能

V1 明確不要做：

- 會員系統
- 登入
- AI 改寫
- 雲端同步
- 文件管理
- 複雜 Markdown 編輯
- 社群平台 API 發文
- 多人協作
- 後端文字儲存
- 大型 UI Framework

避免把一個 3 秒工具做成大型 SaaS。

---

# 48. V1 MVP 功能

正式第一版建議只做：

### 核心

- [x] 文字輸入
- [x] 空白行 U+200B 轉換
- [x] 中英數間距優化
- [x] 字數統計
- [x] 行數統計
- [x] 可轉換空白行統計
- [x] 結果預覽
- [x] 一鍵複製
- [x] 清除

### PWA

- [x] Manifest
- [x] Service Worker
- [x] Offline
- [x] Installable
- [x] App icon
- [x] Standalone mode

### UX

- [x] Mobile First
- [x] Desktop 雙欄
- [x] Clipboard fallback
- [x] Offline 狀態
- [x] Update prompt
- [x] 隱私說明

---

# 49. V1.1 建議

第二階段可加入：

- 顯示隱形字元
- 一鍵「全部優化」
- Undo
- 重做
- 最近一次內容暫存（使用者選擇）
- Dark Mode
- 分享 API
- iOS 安裝提示
- 最近使用設定
- 字數限制提醒

---

# 50. V2 可擴充方向

若工具有流量，再考慮：

## 社群平台模式

```text
Facebook
Instagram
Threads
WordPress
```

不同模式可顯示：

- 建議字數
- 常用排版
- 平台注意事項

但不可假設所有平台字數規則相同。

---

## 更多文字工具

可擴充：

```text
空白換行
中英排版
全形／半形
移除多餘空格
移除多餘空白行
特殊字元檢查
Hashtag 整理
```

主畫面仍需保持簡單。

---

# 51. 建議 URL 結構

V1：

```text
/
```

就足夠。

FAQ 可使用：

```text
/#faq
```

隱私：

```text
/privacy
```

若之後擴充多工具：

```text
/tools/blank-line
/tools/chinese-spacing
```

---

# 52. 建議專案目錄

```text
blankflow/
├─ public/
│  ├─ icons/
│  │  ├─ pwa-192.png
│  │  ├─ pwa-512.png
│  │  └─ pwa-maskable-512.png
│  ├─ favicon.ico
│  └─ manifest.webmanifest
│
├─ src/
│  ├─ core/
│  │  ├─ blankLines.ts
│  │  ├─ chineseSpacing.ts
│  │  ├─ characterCount.ts
│  │  ├─ statistics.ts
│  │  └─ clipboard.ts
│  │
│  ├─ components/
│  │  ├─ Header.tsx
│  │  ├─ Hero.tsx
│  │  ├─ InputEditor.tsx
│  │  ├─ StatisticsBar.tsx
│  │  ├─ OptionsPanel.tsx
│  │  ├─ ResultEditor.tsx
│  │  ├─ ActionBar.tsx
│  │  ├─ Toast.tsx
│  │  ├─ InstallPrompt.tsx
│  │  └─ OfflineBadge.tsx
│  │
│  ├─ hooks/
│  │  ├─ usePWAInstall.ts
│  │  └─ useOnlineStatus.ts
│  │
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ globals.css
│
├─ tests/
│  ├─ blankLines.test.ts
│  ├─ chineseSpacing.test.ts
│  └─ statistics.test.ts
│
├─ index.html
├─ vite.config.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

# 53. 建議 Component Tree

```text
<App>
 ├─ <Header />
 │   ├─ <InstallButton />
 │   └─ <OfflineBadge />
 │
 ├─ <Hero />
 │
 ├─ <ToolLayout>
 │   ├─ <InputPanel>
 │   │   ├─ <InputEditor />
 │   │   ├─ <StatisticsBar />
 │   │   ├─ <OptionsPanel />
 │   │   └─ <ActionBar />
 │   │
 │   └─ <ResultPanel>
 │       ├─ <ConversionSummary />
 │       ├─ <ResultEditor />
 │       └─ <CopyButton />
 │
 ├─ <FAQ />
 │
 └─ <Toast />
```

---

# 54. 建議核心 API

```ts
convertBlankLines(text: string): string
```

```ts
optimizeChineseSpacing(text: string): string
```

```ts
countVisibleCharacters(text: string): number
```

```ts
countConvertibleBlankLines(text: string): number
```

```ts
getTextStatistics(text: string): TextStatistics
```

```ts
copyText(text: string): Promise<CopyResult>
```

後續若要一次完成：

```ts
processText(text, options): ConversionResult
```

---

# 55. processText 建議介面

```ts
interface ProcessOptions {
  convertBlankLines: boolean;
  optimizeChineseSpacing: boolean;
}

interface ProcessReport {
  convertedBlankLines: number;
  insertedSpaces: number;
}

interface ProcessResult {
  text: string;
  report: ProcessReport;
}

function processText(
  text: string,
  options: ProcessOptions
): ProcessResult
```

這會讓 UI 完全不需要知道正則細節。

---

# 56. UX 成功條件

產品正式完成後，一個完全不知道 `U+200B` 是什麼的人也應能完成：

```text
開啟
↓
貼上
↓
轉換
↓
複製
```

且不超過：

```text
4 個主要操作
```

---

# 57. 開發階段

## Phase 1｜Core

完成：

- blank line converter
- chinese spacing
- statistics
- clipboard
- unit tests

---

## Phase 2｜UI

完成：

- Responsive layout
- Input
- Result
- Options
- Toast
- Empty state

---

## Phase 3｜PWA

完成：

- manifest
- icons
- Service Worker
- install flow
- offline
- update prompt

---

## Phase 4｜QA

完成：

- Unicode
- CRLF
- emoji
- Clipboard
- iOS Safari
- Android Chrome
- Desktop Chrome
- Desktop Edge
- Firefox

---

## Phase 5｜Production

完成：

- HTTPS
- SEO
- privacy
- analytics event
- Lighthouse
- deploy

---

# 58. 驗收 Checklist

## Core

- [ ] 一個空白行可正確加入 U+200B
- [ ] 單一換行不修改
- [ ] 連續多空白行正確
- [ ] Space 空白行正確
- [ ] Tab 空白行正確
- [ ] CRLF 正確
- [ ] 已轉換內容再次轉換不重複加入 U+200B
- [ ] 中英數間距功能獨立
- [ ] Emoji 字數合理
- [ ] Result 可手動複製

## UX

- [ ] 貼上即更新統計
- [ ] 轉換不修改 Input
- [ ] Result 清楚
- [ ] 複製成功有提示
- [ ] Clipboard 失敗有 fallback
- [ ] Mobile 單手可操作
- [ ] Desktop 雙欄清楚

## PWA

- [ ] 可安裝
- [ ] 安裝後 standalone
- [ ] 離線可開啟
- [ ] 離線可轉換
- [ ] 離線可查看結果
- [ ] 新版本有更新提示
- [ ] 不會更新時直接丟失使用者輸入

## Privacy

- [ ] 文字不送後端
- [ ] Analytics 不收文字內容
- [ ] Error tracking 不收 textarea value
- [ ] 頁面清楚說明本機處理

---

# 59. 最終產品建議

這個工具最適合的產品方向不是大型文字編輯器，而是：

> **「一個專門解決社群空白行與中文排版的小型高速 PWA 工具。」**

最重要的 5 個設計決策：

1. **Single Page**：打開就能貼文字。
2. **Local First**：所有文字只在瀏覽器端處理。
3. **Offline First**：安裝後無網路也可以正常使用。
4. **Non-destructive**：Input 永遠保留原文，Result 另外產生。
5. **One-click Copy**：完成後能快速貼回社群 App。

---

# 60. 最推薦的 V1 畫面

```text
┌─────────────────────────────────────┐
│ BlankFlow               安裝 App   │
│                                     │
│ 讓社群貼文的空白行，不再被吃掉     │
│ 文字只在你的裝置內處理              │
│                                     │
│ 原始文字                            │
│ ┌─────────────────────────────────┐ │
│ │ 貼上文字…                       │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 128 字 · 7 行 · 3 個空白行          │
│                                     │
│ ☑ 保留空白行                        │
│ ☐ 中英數自動加空格                  │
│                                     │
│ [            立即轉換             ] │
│                                     │
│ 轉換結果                            │
│ ✓ 已保留 3 個空白行                 │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [            複製結果             ] │
│                                     │
│ 不上傳文字 · 可離線使用             │
└─────────────────────────────────────┘
```

---

# 61. 開發指令摘要

若將此規格直接交給 AI Coding Agent，可用以下開發目標：

```text
請依此文件建立一個 Mobile First 的空白換行轉換 PWA。

技術：
- Vite
- React
- TypeScript
- vite-plugin-pwa

核心要求：
1. 所有文字處理皆在前端。
2. 空白行插入 U+200B。
3. 支援 LF / CRLF。
4. 空格／Tab 空白行需辨識。
5. 已轉換文字不得重複插入 U+200B。
6. 中英數間距優化為可選功能。
7. 使用 Intl.Segmenter 做可見字元統計。
8. Clipboard API 並提供 fallback。
9. Input 不可被直接覆寫，Result 獨立。
10. 支援 PWA 安裝與離線使用。
11. Service Worker 更新不得直接清除使用者正在編輯的內容。
12. 不建立後端、不儲存使用者文字。
13. Desktop 雙欄、Mobile 單欄。
14. 建立核心函式 unit tests。
```

---

# 62. 一句話技術架構

```text
Vite + TypeScript + Browser-only Text Processing
+ U+200B Blank Line Conversion
+ Intl.Segmenter
+ Clipboard API
+ Service Worker
+ Web App Manifest
= Offline-first Social Text Formatting PWA
```

---

# 63. 最終定位

**BlankFlow 不應被做成「另一個文字編輯器」。**

它應該是一個：

> **打開就貼、按一下就完成、複製就離開的高效率微工具。**

這會是最適合原核心技術，也最適合 PWA 使用情境的產品設計。
