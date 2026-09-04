// 可見字元（grapheme cluster）統計，含舊瀏覽器 fallback
export function countVisibleCharacters(text) {
  if (!text) return 0;

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("zh-TW", { granularity: "grapheme" });
    return [...segmenter.segment(text)].length;
  }

  return Array.from(text).length;
}
