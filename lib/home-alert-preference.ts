export const HOME_ALERTS_STORAGE_KEY = "paladinscat-home-alerts-enabled";
export const HOME_ALERTS_CHANGE_EVENT = "paladinscat:home-alerts-change";

export function getHomeAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(HOME_ALERTS_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setHomeAlertsEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(HOME_ALERTS_STORAGE_KEY, String(enabled));
  } catch {
    // Keep the preference working for the current page when storage is unavailable.
  }

  window.dispatchEvent(new Event(HOME_ALERTS_CHANGE_EVENT));
}
