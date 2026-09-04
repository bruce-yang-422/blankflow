const HISTORY_KEY = "blankflow.history";
const MAX_ENTRIES = 10;

/**
 * @typedef {{ id: string, createdAt: number, input: string, output: string, options: { blankLines: boolean, chineseSpacing: boolean } }} HistoryEntry
 */

/** @returns {HistoryEntry[]} */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable or full, ignore
  }
}

/**
 * Adds a new entry to the front of history, capped at MAX_ENTRIES.
 * @param {{ input: string, output: string, options: { blankLines: boolean, chineseSpacing: boolean } }} entry
 * @returns {HistoryEntry[]} the updated list
 */
export function addHistoryEntry(entry) {
  const entries = loadHistory();

  const next = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    input: entry.input,
    output: entry.output,
    options: entry.options,
  };

  const updated = [next, ...entries].slice(0, MAX_ENTRIES);
  saveHistory(updated);
  return updated;
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // storage unavailable, ignore
  }
}

/**
 * Removes a single entry by id.
 * @param {string} id
 * @returns {HistoryEntry[]} the updated list
 */
export function removeHistoryEntry(id) {
  const updated = loadHistory().filter((entry) => entry.id !== id);
  saveHistory(updated);
  return updated;
}
