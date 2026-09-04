// 全形／半形字元轉換（僅處理全形英數與 ASCII 符號，不處理中文標點）

// 全形字元 U+FF01-FF5E 對應半形 U+0021-007E，偏移量固定為 0xFEE0
const FULLWIDTH_RE = /[\uFF01-\uFF5E]/g;
const FULLWIDTH_SPACE_RE = /\u3000/g;

// 半形英數與符號（含半形空白 \u0020）對應全形，偏移量同上
const HALFWIDTH_RE = /[\u0020-\u007E]/g;

/**
 * 全形轉半形：全形英數字、符號、空白 → 半形
 * @param {string} text
 * @returns {{ text: string, convertedCount: number }}
 */
export function toHalfwidth(text) {
  if (!text) return { text, convertedCount: 0 };

  let convertedCount = 0;

  let result = text.replace(FULLWIDTH_RE, (char) => {
    convertedCount += 1;
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });

  result = result.replace(FULLWIDTH_SPACE_RE, () => {
    convertedCount += 1;
    return " ";
  });

  return { text: result, convertedCount };
}

/**
 * 半形轉全形：半形英數字、符號、空白 → 全形
 * @param {string} text
 * @returns {{ text: string, convertedCount: number }}
 */
export function toFullwidth(text) {
  if (!text) return { text, convertedCount: 0 };

  let convertedCount = 0;

  const result = text.replace(HALFWIDTH_RE, (char) => {
    convertedCount += 1;
    if (char === " ") {
      return "\u3000";
    }
    return String.fromCharCode(char.charCodeAt(0) + 0xFEE0);
  });

  return { text: result, convertedCount };
}
