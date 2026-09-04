// 中文／英文／數字間距優化（盤古之白精簡實作）
const CJK = "⺀-⻿⼀-⿟぀-ゟ゠-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿︰-﹏";
const ASCII_SYMBOLS = "@#$%^&*";

export function optimizeChineseSpacing(text) {
  if (!text) return { text, insertedCount: 0 };

  let insertedCount = 0;
  let result = text;

  const patterns = [
    new RegExp(`([${CJK}])([A-Za-z0-9])`, "g"),
    new RegExp(`([A-Za-z0-9])([${CJK}])`, "g"),
    new RegExp(`([${CJK}])([${ASCII_SYMBOLS}])`, "g"),
    new RegExp(`([${ASCII_SYMBOLS}])([${CJK}])`, "g"),
  ];

  for (const pattern of patterns) {
    result = result.replace(pattern, (...args) => {
      insertedCount += 1;
      return `${args[1]} ${args[2]}`;
    });
  }

  return { text: result, insertedCount };
}
