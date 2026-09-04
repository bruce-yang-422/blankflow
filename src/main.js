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
const lengthWarnings = document.getElementById("lengthWarnings");

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

// \u5404\u793E\u7FA4\u5E73\u53F0\u7684\u6587\u5B57\u9577\u5EA6\u9650\u5236\uFF0F\u6298\u758A\u63D0\u9192
// threshold \u70BA null \u8868\u793A\u4E0D\u4F9D\u5B57\u6578\u5224\u65B7\uFF0C\u53EA\u8981\u6709\u5167\u5BB9\u5C31\u56FA\u5B9A\u986F\u793A
const PLATFORM_LENGTH_RULES = [
  {
    id: "facebook",
    tone: "info",
    threshold: null,
    message: () =>
      `Facebook \u52D5\u614B\u7246\u53EF\u80FD\u6703\u6298\u758A\u8CBC\u6587\u986F\u793A\u300C\u67E5\u770B\u66F4\u591A\u300D\uFF0C\u6298\u758A\u9EDE\u4F9D\u88DD\u7F6E\u8207\u7248\u9762\u800C\u7570\u3001\u7121\u6CD5\u6E96\u78BA\u9810\u6E2C\uFF0C\u5EFA\u8B70\u767C\u5E03\u524D\u5148\u9810\u89BD\u78BA\u8A8D\u3002`,
  },
  {
    id: "threads",
    tone: "warn",
    threshold: 500,
    message: (limit) =>
      `\u5DF2\u8D85\u904E Threads \u4E3B\u8CBC\u6587\u4E0A\u9650\uFF08<b>${limit}</b> \u5B57\uFF09\uFF0C\u8CBC\u6587\u6703\u88AB\u622A\u65B7\u6216\u7121\u6CD5\u767C\u5E03\u3002\u53EF\u6539\u7528 Threads \u7684\u300C\u6587\u5B57\u9644\u4EF6\u300D\u529F\u80FD\uFF0C\u6700\u591A\u652F\u63F4 <b>10,000</b> \u5B57\u7684\u9577\u6587\u3002`,
  },
  {
    id: "instagram",
    tone: "warn",
    threshold: 2200,
    message: (limit) =>
      `\u5DF2\u8D85\u904E Instagram \u8CBC\u6587\u5167\u6587\u4E0A\u9650\uFF08<b>${limit}</b> \u5B57\uFF09\uFF0C\u53EF\u80FD\u7121\u6CD5\u767C\u5E03\u3002\u82E5\u5167\u6587\u5305\u542B\u7DB2\u5740\uFF0C\u5BE6\u969B\u4E0A\u9650\u53EF\u80FD\u7565\u4F4E\uFF08\u7D04 2,190 \u5B57\uFF09\u3002`,
  },
];

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

function renderLengthWarnings(characters) {
  const triggered = PLATFORM_LENGTH_RULES.filter((rule) =>
    rule.threshold === null ? characters > 0 : characters > rule.threshold
  );

  lengthWarnings.innerHTML = "";
  lengthWarnings.hidden = triggered.length === 0;

  if (triggered.length === 0) return;

  const isWarn = triggered.some((rule) => rule.tone === "warn");
  const item = document.createElement("li");
  item.className = `length-warning${isWarn ? "" : " length-warning--info"}`;

  const icon = document.createElement("span");
  icon.className = "length-warning__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isWarn ? "⚠" : "ℹ";

  const text = document.createElement("span");
  text.innerHTML = triggered.map((rule) => rule.message(rule.threshold)).join(" ");

  item.append(icon, text);
  lengthWarnings.appendChild(item);
}

function updateStats() {
  const value = inputText.value;
  const stats = getTextStatistics(value);

  statChars.innerHTML = `<b>${stats.characters}</b> 字`;
  statLines.innerHTML = `<b>${stats.lines}</b> 行`;
  statBlank.innerHTML =
    stats.blankLines > 0 ? `<b>${stats.blankLines}</b> 個空白行` : "沒有需要轉換的空白行";

  renderLengthWarnings(stats.characters);

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
    maybeShowIosInstallHint();
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
  installBtn.hidden = false;
});

const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  || window.navigator.standalone === true;

if (isStandalone) {
  installBtn.hidden = true;
}

function maybeShowIosInstallHint() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !isStandalone) {
    document.getElementById("iosInstallHint").hidden = false;
  }
}

installBtn.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    document.getElementById("iosInstallHint").hidden = false;
  } else {
    showToast("此瀏覽器不支援一鍵安裝，可從瀏覽器選單選擇「加入主畫面」或「安裝應用程式」。", 4000);
  }
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
