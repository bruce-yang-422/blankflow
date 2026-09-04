import { getTextStatistics } from "./core/statistics.js";
import { processText } from "./core/processText.js";
import { copyText } from "./core/clipboard.js";
import { loadHistory, addHistoryEntry, clearHistory, removeHistoryEntry } from "./core/history.js";

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const resultWrap = document.getElementById("resultWrap");
const resultPanel = document.getElementById("resultPanel");
const resultEmptyState = document.getElementById("resultEmptyState");
const showInvisibleOption = document.getElementById("showInvisibleOption");
const resultActionBar = document.getElementById("resultActionBar");

const statChars = document.getElementById("statChars");
const statLines = document.getElementById("statLines");
const statBlank = document.getElementById("statBlank");
const threadsWarning = document.getElementById("threadsWarning");

const optBlankLines = document.getElementById("optBlankLines");
const optChineseSpacing = document.getElementById("optChineseSpacing");
const optShowInvisible = document.getElementById("optShowInvisible");

const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const conversionSummary = document.getElementById("conversionSummary");
const onboarding = document.getElementById("onboarding");
const toast = document.getElementById("toast");
const helpBtn = document.getElementById("helpBtn");
const faq = document.getElementById("faq");

const offlineBadge = document.getElementById("offlineBadge");

const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const OPTIONS_KEY = "blankflow.options";
const ZWSP_RE = /\u200B/g;
const THREADS_MAIN_POST_LIMIT = 500;

let currentOutput = "";
let hasConvertedOnce = false;
let toastTimer = null;

function loadOptions() {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.blankLines === "boolean") optBlankLines.checked = saved.blankLines;
    if (typeof saved.chineseSpacing === "boolean") optChineseSpacing.checked = saved.chineseSpacing;
  } catch {
    // ignore corrupted storage
  }
}

function saveOptions() {
  try {
    localStorage.setItem(
      OPTIONS_KEY,
      JSON.stringify({
        blankLines: optBlankLines.checked,
        chineseSpacing: optChineseSpacing.checked,
      })
    );
  } catch {
    // storage unavailable, ignore
  }
}

function updateStats() {
  const value = inputText.value;
  const stats = getTextStatistics(value);

  statChars.innerHTML = `<b>${stats.characters}</b> 字`;
  statLines.innerHTML = `<b>${stats.lines}</b> 行`;
  statBlank.innerHTML =
    stats.blankLines > 0 ? `<b>${stats.blankLines}</b> 個空白行` : "沒有需要轉換的空白行";

  threadsWarning.hidden = stats.characters <= THREADS_MAIN_POST_LIMIT;

  convertBtn.disabled = value.trim() === "";
}

function renderOutput(text) {
  currentOutput = text;

  const hasContent = text.length > 0;
  resultPanel.classList.toggle("is-empty", !hasContent);
  resultEmptyState.hidden = hasContent;
  resultWrap.hidden = !hasContent;
  showInvisibleOption.hidden = !hasContent;
  resultActionBar.hidden = !hasContent;

  outputText.value = optShowInvisible.checked
    ? text.replace(ZWSP_RE, "␣")
    : text;

  copyBtn.disabled = !hasContent;
}

function showToast(message, duration = 2500) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

function handleConvert() {
  const value = inputText.value;
  if (!value.trim()) return;

  const { text, report } = processText(value, {
    blankLines: optBlankLines.checked,
    chineseSpacing: optChineseSpacing.checked,
  });

  renderOutput(text);

  const lines = [];
  if (optBlankLines.checked) {
    lines.push(
      report.convertedBlankLines > 0
        ? `✓ 已保留 ${report.convertedBlankLines} 個空白行`
        : "沒有找到需要處理的空白行。"
    );
  }
  if (optChineseSpacing.checked && report.insertedSpaces > 0) {
    lines.push(`✓ 已加入 ${report.insertedSpaces} 組中英數間距`);
  }

  conversionSummary.innerHTML = lines.map(line => `<span>${line}</span>`).join("");
  conversionSummary.hidden = lines.length === 0;

  addHistoryEntry({
    input: value,
    output: text,
    options: {
      blankLines: optBlankLines.checked,
      chineseSpacing: optChineseSpacing.checked,
    },
  });
  renderHistory();

  if (!hasConvertedOnce) {
    hasConvertedOnce = true;
    onboarding.hidden = true;
    maybeShowInstallPrompt();
  }
}

function handleClear() {
  inputText.value = "";
  renderOutput("");
  conversionSummary.hidden = true;
  conversionSummary.innerHTML = "";
  updateStats();
  inputText.focus();
}

async function handleCopy() {
  if (!currentOutput) return;

  const result = await copyText(currentOutput);
  if (result.ok) {
    showToast("✓ 已複製到剪貼簿");
  } else {
    outputText.removeAttribute("readonly");
    outputText.focus();
    outputText.select();
    outputText.setAttribute("readonly", "true");
    showToast("無法自動複製，請長按／全選結果後手動複製。", 4000);
  }
}

inputText.addEventListener("input", updateStats);

optBlankLines.addEventListener("change", saveOptions);
optChineseSpacing.addEventListener("change", saveOptions);

optShowInvisible.addEventListener("change", () => {
  renderOutput(currentOutput);
});

convertBtn.addEventListener("click", handleConvert);
clearBtn.addEventListener("click", handleClear);
copyBtn.addEventListener("click", handleCopy);

inputText.addEventListener("keydown", (event) => {
  const isModifierEnter = (event.metaKey || event.ctrlKey) && event.key === "Enter";
  if (isModifierEnter) {
    event.preventDefault();
    handleConvert();
  }
});

helpBtn.addEventListener("click", () => {
  const isOpen = !faq.hidden;
  faq.hidden = isOpen;
  helpBtn.setAttribute("aria-expanded", String(!isOpen));
  if (!isOpen) {
    faq.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

// Offline status
function updateOnlineStatus() {
  offlineBadge.hidden = navigator.onLine;
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// PWA install prompt (Chrome/Android)
let deferredInstallPrompt = null;
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

function maybeShowInstallPrompt() {
  if (deferredInstallPrompt) {
    installBtn.hidden = false;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;

  if (isIOS && !isStandalone) {
    document.getElementById("iosInstallHint").hidden = false;
  }
}

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

document.getElementById("iosInstallClose").addEventListener("click", () => {
  document.getElementById("iosInstallHint").hidden = true;
});

// Service worker registration — updates apply silently on next visit
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => {
      // registration failed, app still works online
    });
  });
}

// Theme switch (light / system / dark)
const THEME_KEY = "blankflow.theme";
const themeButtons = document.querySelectorAll("[data-theme-choice]");

function applyTheme(choice) {
  if (choice === "light" || choice === "dark") {
    document.documentElement.setAttribute("data-theme", choice);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  themeButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.themeChoice === choice));
  });
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

function saveTheme(choice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // storage unavailable, ignore
  }
}

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const choice = btn.dataset.themeChoice;
    applyTheme(choice);
    saveTheme(choice);
  });
});

// History panel
function formatHistoryTime(timestamp) {
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function restoreHistoryEntry(entry) {
  inputText.value = entry.input;
  optBlankLines.checked = entry.options.blankLines;
  optChineseSpacing.checked = entry.options.chineseSpacing;
  saveOptions();
  updateStats();
  renderOutput(entry.output);
  conversionSummary.hidden = true;
  conversionSummary.innerHTML = "";
  inputText.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHistory() {
  const entries = loadHistory();
  historyPanel.hidden = entries.length === 0;

  if (entries.length === 0) {
    historyList.innerHTML = "";
    return;
  }

  historyList.innerHTML = "";

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const body = document.createElement("button");
    body.type = "button";
    body.className = "history-item__body";

    const preview = document.createElement("span");
    preview.className = "history-item__preview";
    preview.textContent = entry.input.replace(/\s+/g, " ").trim().slice(0, 60) || "（空白內容）";

    const meta = document.createElement("span");
    meta.className = "history-item__meta";
    meta.textContent = formatHistoryTime(entry.createdAt);

    body.append(preview, meta);
    body.addEventListener("click", () => restoreHistoryEntry(entry));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "history-item__delete";
    deleteBtn.setAttribute("aria-label", "刪除這筆記錄");
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => {
      removeHistoryEntry(entry.id);
      renderHistory();
    });

    item.append(body, deleteBtn);
    historyList.appendChild(item);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  clearHistory();
  renderHistory();
});

// Init
loadOptions();
updateStats();
updateOnlineStatus();
applyTheme(loadTheme());
renderHistory();
