// 空白行轉換核心邏輯
export const ZWSP = "\u200B";

export function isBlankLine(line) {
  return /^[\t ]*$/.test(line);
}

export function isConvertedBlankLine(line) {
  return line === ZWSP;
}

function hasVisibleContent(line) {
  return line.replace(/\u200B/g, "").trim() !== "";
}

/**
 * 將位於兩段內容之間的空白行轉換為 U+200B。
 * 具備 idempotent 特性：已轉換的行不會重複插入。
 */
export function convertBlankLines(text) {
  if (!text) return { text, convertedCount: 0 };

  const usesCRLF = text.includes("\r\n");
  const newline = usesCRLF ? "\r\n" : "\n";
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  let convertedCount = 0;

  const result = lines.map((line, index) => {
    if (isConvertedBlankLine(line)) {
      return line;
    }

    if (!isBlankLine(line)) {
      return line;
    }

    const hasContentBefore = lines.slice(0, index).some(hasVisibleContent);
    const hasContentAfter = lines.slice(index + 1).some(hasVisibleContent);

    if (hasContentBefore && hasContentAfter) {
      convertedCount += 1;
      return ZWSP;
    }

    return line;
  });

  return { text: result.join(newline), convertedCount };
}

/** 計算目前文字中「可被轉換」的空白行數量（不實際轉換）。 */
export function countConvertibleBlankLines(text) {
  if (!text) return 0;

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let count = 0;

  lines.forEach((line, index) => {
    if (isConvertedBlankLine(line)) return;
    if (!isBlankLine(line)) return;

    const hasContentBefore = lines.slice(0, index).some(hasVisibleContent);
    const hasContentAfter = lines.slice(index + 1).some(hasVisibleContent);

    if (hasContentBefore && hasContentAfter) {
      count += 1;
    }
  });

  return count;
}
