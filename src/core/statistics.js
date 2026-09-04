import { countVisibleCharacters } from "./characterCount.js";
import { countConvertibleBlankLines } from "./blankLines.js";

export function getTextStatistics(text) {
  if (!text) {
    return { characters: 0, lines: 0, blankLines: 0 };
  }

  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  return {
    characters: countVisibleCharacters(text),
    lines: lines.length,
    blankLines: countConvertibleBlankLines(text),
  };
}
