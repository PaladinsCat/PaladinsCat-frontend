/**
 * Returns whether Lite mode (disable all animations) is enabled for this browser.  Returns: `boolean`. · refs: none
 * Stores and reads the browser lite-mode preference.
 * refs: none
 */
/**
 * Name the localStorage key for the reduced-animation lite-mode preference.
 * refs: none
 */
export const LITE_MODE_STORAGE_KEY = "paladinscat-lite-mode";
/**
 * Name the browser event notifying listeners of a lite-mode preference change.
 * refs: none
 */
export const LITE_MODE_CHANGE_EVENT = "paladinscat:lite-mode-change";

/**
 * Returns whether Lite mode (disable all animations) is enabled for this browser.  Returns: `boolean`. · refs: none
 * I/O types: `none -> boolean`.
 */
export function getLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LITE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Persists the Lite mode preference and notifies listeners. · refs: none
 * I/O types: `enabled: boolean -> void`.
 */
export function setLiteMode(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(LITE_MODE_STORAGE_KEY, "1");
    else window.localStorage.removeItem(LITE_MODE_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, quota) — the in-memory toggle still works.
  }
  window.dispatchEvent(new Event(LITE_MODE_CHANGE_EVENT));
}
