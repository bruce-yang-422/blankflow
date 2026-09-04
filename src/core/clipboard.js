// Clipboard 複製與 fallback
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
    throw new Error("Clipboard API unavailable");
  } catch (error) {
    return { ok: false, error };
  }
}
