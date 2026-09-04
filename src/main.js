import { getTextStatistics } from "./core/statistics.js";
import { processText } from "./core/processText.js";
import { copyText } from "./core/clipboard.js";

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

const OPTIONS_KEY = "blankflow.options";
const ZWSP_RE = /\u200B/g;

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

// Service worker registration + update prompt
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdatePrompt(registration);
          }
        });
      });
    }).catch(() => {
      // registration failed, app still works online
    });
  });
}

function showUpdatePrompt(registration) {
  clearTimeout(toastTimer);
  toast.hidden = false;
  toast.innerHTML = "";

  const label = document.createElement("span");
  label.textContent = "有新版可以使用　";
  const btn = document.createElement("button");
  btn.textContent = "立即更新";
  btn.className = "btn--ghost";
  btn.style.marginLeft = "8px";
  btn.addEventListener("click", () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  });

  toast.append(label, btn);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
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

// Init
loadOptions();
updateStats();
updateOnlineStatus();
applyTheme(loadTheme());
