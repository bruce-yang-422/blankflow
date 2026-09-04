globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

import { convertBlankLines } from "../src/core/blankLines.js";
import { optimizeChineseSpacing } from "../src/core/chineseSpacing.js";
import { countVisibleCharacters } from "../src/core/characterCount.js";
import { loadHistory, addHistoryEntry, clearHistory, removeHistoryEntry } from "../src/core/history.js";
import { toHalfwidth, toFullwidth } from "../src/core/widthConversion.js";

let pass = 0;
let fail = 0;

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  if (ok) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`FAIL: ${label}`);
    console.error(`  expected: ${JSON.stringify(expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
  }
}

// blankLines
assertEqual(convertBlankLines("甲\n\n乙").text, "甲\n\u200B\n乙", "basic blank line");
assertEqual(convertBlankLines("沒有空行").text, "沒有空行", "no blank line unchanged");
assertEqual(convertBlankLines("甲\r\n\r\n乙").text, "甲\r\n\u200B\r\n乙", "CRLF support");
assertEqual(convertBlankLines("甲\n \n乙").text, "甲\n\u200B\n乙", "space-only blank line");
assertEqual(convertBlankLines("甲\n\t\n乙").text, "甲\n\u200B\n乙", "tab-only blank line");

const once = convertBlankLines("甲\n\n乙").text;
assertEqual(convertBlankLines(once).text, once, "idempotent conversion");

assertEqual(convertBlankLines("單一換行\n第二行").text, "單一換行\n第二行", "single newline not modified");
assertEqual(convertBlankLines("").text, "", "empty string unchanged");

const multi = convertBlankLines("甲\n\n\n\n乙");
assertEqual(multi.convertedCount, 3, "multiple consecutive blank lines each converted");

// chineseSpacing
assertEqual(optimizeChineseSpacing("中文ABC中文").text, "中文 ABC 中文", "CJK-latin spacing");
assertEqual(optimizeChineseSpacing("第3篇").text, "第 3 篇", "CJK-number spacing");
assertEqual(optimizeChineseSpacing("使用ChatGPT寫3篇Threads貼文").text, "使用 ChatGPT 寫 3 篇 Threads 貼文", "full sentence spacing");

// characterCount
assertEqual(countVisibleCharacters("中文"), 2, "plain CJK count");
assertEqual(countVisibleCharacters("😀"), 1, "emoji counted as 1 grapheme");
assertEqual(countVisibleCharacters(""), 0, "empty string count");

// history
clearHistory();
assertEqual(loadHistory().length, 0, "history starts empty");

for (let i = 0; i < 12; i += 1) {
  addHistoryEntry({
    input: `input-${i}`,
    output: `output-${i}`,
    options: { blankLines: true, chineseSpacing: false },
  });
}
const history = loadHistory();
assertEqual(history.length, 10, "history caps at 10 entries");
assertEqual(history[0].input, "input-11", "newest entry is first");
assertEqual(history[9].input, "input-2", "oldest kept entry is the 10th most recent");

clearHistory();
assertEqual(loadHistory().length, 0, "clearHistory empties the list");

addHistoryEntry({ input: "a", output: "a", options: { blankLines: true, chineseSpacing: false } });
addHistoryEntry({ input: "b", output: "b", options: { blankLines: true, chineseSpacing: false } });
const beforeRemove = loadHistory();
removeHistoryEntry(beforeRemove[0].id);
const afterRemove = loadHistory();
assertEqual(afterRemove.length, 1, "removeHistoryEntry removes exactly one entry");
assertEqual(afterRemove[0].input, "a", "removeHistoryEntry keeps the other entry");

clearHistory();

// widthConversion
assertEqual(toHalfwidth("ＡＢＣ１２３").text, "ABC123", "fullwidth latin/digits to halfwidth");
assertEqual(toHalfwidth("！＠＃").text, "!@#", "fullwidth symbols to halfwidth");
assertEqual(toHalfwidth("Ａ　Ｂ").text, "A B", "fullwidth space to halfwidth space");
assertEqual(toHalfwidth("中文不受影響123").text, "中文不受影響123", "CJK untouched by toHalfwidth");
assertEqual(toHalfwidth("").text, "", "toHalfwidth empty string");

assertEqual(toFullwidth("ABC123").text, "ＡＢＣ１２３", "halfwidth latin/digits to fullwidth");
assertEqual(toFullwidth("!@#").text, "！＠＃", "halfwidth symbols to fullwidth");
assertEqual(toFullwidth("A B").text, "Ａ　Ｂ", "halfwidth space to fullwidth space");
assertEqual(toFullwidth("中文不受影響").text, "中文不受影響", "CJK untouched by toFullwidth");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
