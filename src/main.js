import { getTextStatistics } from "./core/statistics.js";
import { processText } from "./core/processText.js";
import { copyText } from "./core/clipboard.js";
import { loadHistory, addHistoryEntry, clearHistory, removeHistoryEntry } from "./core/history.js";

import { PLATFORM_MODES, getPlatform, getPlatformPreset, getPlatformFeedback, getCharacterLimitState } from "./core/platforms.js";

const platformMode = { value: "general" };
const platformSegments = document.getElementById("platformMode");
const resetPlatformPreset = document.getElementById("resetPlatformPreset");
for (const mode of PLATFORM_MODES) {
  const label = document.createElement("label");
  label.className = "platform-segment";
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "platform";
  radio.value = mode.id;
  radio.checked = mode.id === platformMode.value;
  const text = document.createElement("span");
  text.textContent = mode.name;
  label.append(radio, text);
  platformSegments.appendChild(label);
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    platformMode.value = radio.value;
    applyPlatformPreset();
  });
}

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
const optWidthConversion = { value: "none" };
const widthRadios = document.querySelectorAll("input[name=widthConversion]");
const optRememberInput = document.getElementById("optRememberInput");
const optShowInvisible = document.getElementById("optShowInvisible");

const convertBtn = document.getElementById("convertBtn");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

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

const REMEMBERED_INPUT_KEY = "blankflow.rememberedInput";

let currentOutput = "";
let hasConvertedOnce = false;
let toastTimer = null;
let undoSnapshot = null;

function loadOptions() {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    platformMode.value = getPlatform(saved.platform).id;
    if (typeof saved.blankLines === "boolean") optBlankLines.checked = saved.blankLines;
    if (typeof saved.chineseSpacing === "boolean") optChineseSpacing.checked = saved.chineseSpacing;
    if (typeof saved.widthConversion === "string") optWidthConversion.value = saved.widthConversion;
    if (typeof saved.rememberInput === "boolean") optRememberInput.checked = saved.rememberInput;
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
        widthConversion: optWidthConversion.value,
        rememberInput: optRememberInput.checked,
        platform: platformMode.value,
      })
    );
  } catch {
    // storage unavailable, ignore
  }
}

function loadRememberedInput() {
  if (!optRememberInput.checked) return;
  try {
    const saved = localStorage.getItem(REMEMBERED_INPUT_KEY);
    if (saved) inputText.value = saved;
  } catch {
    // storage unavailable, ignore
  }
}

function saveRememberedInput() {
  try {
    if (optRememberInput.checked) {
      localStorage.setItem(REMEMBERED_INPUT_KEY, inputText.value);
    } else {
      localStorage.removeItem(REMEMBERED_INPUT_KEY);
    }
  } catch {
    // storage unavailable, ignore
  }
}

function readConversionOptions() {
  return {
    blankLines: optBlankLines.checked,
    chineseSpacing: optChineseSpacing.checked,
    widthConversion: optWidthConversion.value,
    platform: platformMode.value,
  };
}

function renderPlatform() {
  if (!["none", "toHalfwidth", "toFullwidth"].includes(optWidthConversion.value)) {
    optWidthConversion.value = "none";
  }
  widthRadios.forEach(radio => {
    radio.checked = radio.value === optWidthConversion.value;
  });
  const mode = getPlatform(platformMode.value);
  platformSegments.querySelectorAll("input").forEach(radio => {
    radio.checked = radio.value === mode.id;
  });
  const preset = getPlatformPreset(mode.id);
  const options = readConversionOptions();
  const customized = Object.keys(preset).some(key => preset[key] !== options[key]);
  resetPlatformPreset.hidden = !customized;
}

function invalidateResult() {
  renderOutput("");
  conversionSummary.hidden = true;
  conversionSummary.textContent = "";
  undoSnapshot = null;
  undoBtn.disabled = true;
}

function applyPlatformPreset() {
  const preset = getPlatformPreset(platformMode.value);
  optBlankLines.checked = preset.blankLines;
  optChineseSpacing.checked = preset.chineseSpacing;
  optWidthConversion.value = preset.widthConversion;
  handleOptionsChange();
}

function handleOptionsChange() {
  saveOptions();
  renderPlatform();
  invalidateResult();
  updateStats();
}

function renderLengthWarnings(value, source = "原文") {
  const feedback = getPlatformFeedback(platformMode.value, value);
  lengthWarnings.replaceChildren();
  lengthWarnings.hidden = feedback.length === 0;
  for (const entry of feedback) {
    const item = document.createElement("li");
    item.className = `length-warning${entry.tone === "warn" ? "" : " length-warning--info"}`;
    const icon = document.createElement("span");
    icon.className = "length-warning__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = entry.tone === "warn" ? "⚠" : "ℹ";
    const text = document.createElement("span");
    text.textContent = `${source}・${entry.message}`;
    item.append(icon, text);
    lengthWarnings.appendChild(item);
  }
}

function updateStats() {
  const value = inputText.value;
  const stats = getTextStatistics(value);

  statChars.innerHTML = `<b>${stats.characters}</b> 字`;
  const limitState = getCharacterLimitState(platformMode.value, stats.characters);
  const limitLabels = { neutral: "", normal: "範圍內", near: "接近上限", exceeded: "超出上限" };
  statChars.dataset.limitState = limitState;
  statChars.title = `原文字數${limitLabels[limitState] ? `：${limitLabels[limitState]}（平台參考門檻）` : ""}`;
  if (limitState === "near" || limitState === "exceeded") {
    const label = document.createElement("span");
    label.className = "stat-limit-label";
    label.textContent = limitLabels[limitState];
    statChars.appendChild(label);
  }

  statLines.innerHTML = `<b>${stats.lines}</b> 行`;
  statBlank.innerHTML =
    stats.blankLines > 0 ? `<b>${stats.blankLines}</b> 個空白行` : "沒有需要轉換的空白行";

  renderLengthWarnings(value);

  convertBtn.disabled = value.trim() === "";
  saveRememberedInput();
}

function renderOutput(text) {
  currentOutput = text;
  renderLengthWarnings(text || inputText.value, text ? "轉換結果" : "原文");

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
  shareBtn.hidden = !hasContent || !navigator.share;
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

  undoSnapshot = { input: value, output: currentOutput };
  undoBtn.disabled = false;

  const options = readConversionOptions();

  const { text, report } = processText(value, options);

  renderOutput(text);

  const lines = [`✓ ${getPlatform(platformMode.value).name}模式轉換完成`];
  if (options.widthConversion !== "none" && report.convertedWidth > 0) {
    const label = options.widthConversion === "toHalfwidth" ? "全形轉半形" : "半形轉全形";
    lines.push(`✓ 已${label} ${report.convertedWidth} 個字元`);
  }
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
    options,
  });
  renderHistory();

  if (!hasConvertedOnce) {
    hasConvertedOnce = true;
    onboarding.hidden = true;
    maybeShowIosInstallHint();
  }
}

function handleUndo() {
  if (!undoSnapshot) return;
  inputText.value = undoSnapshot.input;
  updateStats();
  renderOutput(undoSnapshot.output);
  conversionSummary.hidden = true;
  conversionSummary.innerHTML = "";
  undoSnapshot = null;
  undoBtn.disabled = true;
}

function handleClear() {
  inputText.value = "";
  renderOutput("");
  conversionSummary.hidden = true;
  conversionSummary.innerHTML = "";
  undoSnapshot = null;
  undoBtn.disabled = true;
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

async function handleShare() {
  if (!currentOutput || !navigator.share) return;

  try {
    await navigator.share({ text: currentOutput });
  } catch (error) {
    if (error?.name !== "AbortError") {
      showToast("分享失敗，請改用複製結果。", 3000);
    }
  }
}

inputText.addEventListener("input", updateStats);

resetPlatformPreset.addEventListener("click", applyPlatformPreset);
optBlankLines.addEventListener("change", handleOptionsChange);
optChineseSpacing.addEventListener("change", handleOptionsChange);
widthRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    optWidthConversion.value = radio.value;
    handleOptionsChange();
  });
});

optRememberInput.addEventListener("change", () => {
  saveOptions();
  saveRememberedInput();
});

optShowInvisible.addEventListener("change", () => {
  renderOutput(currentOutput);
});

convertBtn.addEventListener("click", handleConvert);
undoBtn.addEventListener("click", handleUndo);
clearBtn.addEventListener("click", handleClear);
copyBtn.addEventListener("click", handleCopy);
shareBtn.addEventListener("click", handleShare);

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
  optWidthConversion.value = entry.options.widthConversion || "none";
  platformMode.value = getPlatform(entry.options.platform).id;
  renderPlatform();
  saveOptions();
  updateStats();
  renderOutput(entry.output);
  conversionSummary.hidden = true;
  conversionSummary.innerHTML = "";
  undoSnapshot = null;
  undoBtn.disabled = true;
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
    meta.textContent = `${formatHistoryTime(entry.createdAt)} · ${getPlatform(entry.options.platform).name}`;

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
renderPlatform();
loadRememberedInput();
updateStats();
updateOnlineStatus();
applyTheme(loadTheme());
renderHistory();
