import { convertBlankLines } from "./blankLines.js";
import { optimizeChineseSpacing } from "./chineseSpacing.js";
import { toHalfwidth, toFullwidth } from "./widthConversion.js";

/**
 * @param {string} text
 * @param {{ blankLines: boolean, chineseSpacing: boolean, widthConversion?: "none" | "toHalfwidth" | "toFullwidth" }} options
 * @returns {{ text: string, report: { convertedBlankLines: number, insertedSpaces: number, convertedWidth: number } }}
 */
export function processText(text, options) {
  let current = text ?? "";
  let convertedBlankLines = 0;
  let insertedSpaces = 0;
  let convertedWidth = 0;

  if (options.widthConversion === "toHalfwidth") {
    const widthResult = toHalfwidth(current);
    current = widthResult.text;
    convertedWidth = widthResult.convertedCount;
  } else if (options.widthConversion === "toFullwidth") {
    const widthResult = toFullwidth(current);
    current = widthResult.text;
    convertedWidth = widthResult.convertedCount;
  }

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
    report: { convertedBlankLines, insertedSpaces, convertedWidth },
  };
}
