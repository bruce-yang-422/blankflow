import { convertBlankLines } from "./blankLines.js";
import { optimizeChineseSpacing } from "./chineseSpacing.js";

/**
 * @param {string} text
 * @param {{ blankLines: boolean, chineseSpacing: boolean }} options
 * @returns {{ text: string, report: { convertedBlankLines: number, insertedSpaces: number } }}
 */
export function processText(text, options) {
  let current = text ?? "";
  let convertedBlankLines = 0;
  let insertedSpaces = 0;

  if (options.chineseSpacing) {
    const spacingResult = optimizeChineseSpacing(current);
    current = spacingResult.text;
    insertedSpaces = spacingResult.insertedCount;
  }

  if (options.blankLines) {
    const blankResult = convertBlankLines(current);
    current = blankResult.text;
    convertedBlankLines = blankResult.convertedCount;
  }

  return {
    text: current,
    report: { convertedBlankLines, insertedSpaces },
  };
}
