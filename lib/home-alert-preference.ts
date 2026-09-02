/** Stores the user preference for home alerts.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 * refs: none
 */
/** Apply HOME_ALERTS_STORAGE_KEY to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * refs: none
 */
export const HOME_ALERTS_STORAGE_KEY = "paladinscat-home-alerts-enabled";
/** Apply HOME_ALERTS_CHANGE_EVENT to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * refs: none
 */
export const HOME_ALERTS_CHANGE_EVENT = "paladinscat:home-alerts-change";

/** Apply getHomeAlertsEnabled to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `boolean`
 * refs: none
 */
export function getHomeAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(HOME_ALERTS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/** Apply setHomeAlertsEnabled to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `void`
 * refs: none
 */
export function setHomeAlertsEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(HOME_ALERTS_STORAGE_KEY, String(enabled));
  } catch {
    // Keep the preference working for the current page when storage is unavailable.
  }

  window.dispatchEvent(new Event(HOME_ALERTS_CHANGE_EVENT));
}
