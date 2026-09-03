/** Stores and reads the browser lite-mode preference.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 * refs: none
 */
/** Apply LITE_MODE_STORAGE_KEY to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * refs: none
 */
export const LITE_MODE_STORAGE_KEY = "paladinscat-lite-mode";
/** Apply LITE_MODE_CHANGE_EVENT to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * refs: none
 */
export const LITE_MODE_CHANGE_EVENT = "paladinscat:lite-mode-change";

/** Returns whether Lite mode (disable all animations) is enabled for this browser.  Returns: `boolean`. · refs: none */
export function getLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LITE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persists the Lite mode preference and notifies listeners. · refs: none */
export function setLiteMode(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(LITE_MODE_STORAGE_KEY, "1");
    else window.localStorage.removeItem(LITE_MODE_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, quota) — the in-memory toggle still works.
  }
  window.dispatchEvent(new Event(LITE_MODE_CHANGE_EVENT));
}
