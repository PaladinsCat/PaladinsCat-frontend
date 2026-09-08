/**
 * Read the home-alert localStorage preference; default to enabled during SSR, storage failure, or any value other than false.
 * Stores the user preference for home alerts.
 * refs: none
 */
/**
 * Name the localStorage key for the home-alert enabled preference.
 * refs: none
 */
export const HOME_ALERTS_STORAGE_KEY = "paladinscat-home-alerts-enabled";
/**
 * Name the browser event notifying listeners of a home-alert preference change.
 * refs: none
 */
export const HOME_ALERTS_CHANGE_EVENT = "paladinscat:home-alerts-change";

/**
 * Read the home-alert localStorage preference; default to enabled during SSR, storage failure, or any value other than false.
 * refs: none
 * I/O types: `none -> boolean`.
 */
export function getHomeAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(HOME_ALERTS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/**
 * Persist the home-alert preference when localStorage is available, then dispatch the browser change event even if persistence fails. Requires a browser window.
 * refs: none
 * I/O types: `enabled: boolean -> void`.
 */
export function setHomeAlertsEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(HOME_ALERTS_STORAGE_KEY, String(enabled));
  } catch {
    // Keep the preference working for the current page when storage is unavailable.
  }

  window.dispatchEvent(new Event(HOME_ALERTS_CHANGE_EVENT));
}
