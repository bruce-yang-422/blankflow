import { countVisibleCharacters } from "./characterCount.js";

// These are BlankFlow editing presets, not platform requirements.
export const PLATFORM_MODES = [
  { id: "general", name: "通用", blankLines: true, chineseSpacing: false,
    hint: "適用 Facebook 與一般貼文：保留空白行，其他排版由你決定。發布前請確認段落與動態牆預覽。" },
  { id: "instagram", name: "Instagram", blankLines: true, chineseSpacing: false, limit: 2200,
    hint: "保留空白行與原有間距，方便安排內文及 Hashtag 段落；貼上後請確認段落呈現。" },
  { id: "threads", name: "Threads", blankLines: true, chineseSpacing: false, limit: 500,
    hint: "保留空白行，預設不增加中英數空格。適合短段落；較長內容可自行分篇。此模式以主貼文為參考。" },
  { id: "wordpress", name: "WordPress", blankLines: false, chineseSpacing: true,
    hint: "整理中英數間距，預設不加入零寬字元。貼入段落區塊後，用編輯器調整段落與間距；輸出仍為純文字。" },
];

export function getPlatform(id) {
  return PLATFORM_MODES.find(mode => mode.id === id) || PLATFORM_MODES[0];
}

export function getPlatformPreset(id) {
  const mode = getPlatform(id);
  return { blankLines: mode.blankLines, chineseSpacing: mode.chineseSpacing, widthConversion: "none" };
}

export function getPlatformFeedback(id, text) {
  if (!text) return [];
  const mode = getPlatform(id);
  const count = countVisibleCharacters(text);
  return [mode].flatMap(item => {
    if (item.limit) {
      const difference = count - item.limit;
      return [{ tone: difference > 0 ? "warn" : "info",
        message: `${item.name}：約 ${count.toLocaleString("zh-TW")} / ${item.limit.toLocaleString("zh-TW")} 字，${difference > 0 ? `超出參考門檻 ${difference} 字` : `距參考門檻還有 ${-difference} 字`}。含空白與換行；實際計數及可發布長度以平台為準。` }];
    }
    return [{ tone: "info", message: item.id === "general"
      ? "Facebook：貼文可能顯示「查看更多」，折疊位置依版面而異，請在發布前預覽。"
      : "WordPress：此模式不設定字數門檻。請使用段落區塊，並在網站預覽確認佈景主題的段落間距。" }];
  });
}

// Input counter status; platform limits are reference values.
export function getCharacterLimitState(id, count) {
  const { limit } = getPlatform(id);
  if (!limit || count === 0) return "neutral";
  if (count > limit) return "exceeded";
  return count >= limit * 0.9 ? "near" : "normal";
}
