export const WALLPAPER_STORAGE_KEY = "paladinscat-wallpaper-enabled";
export const WALLPAPER_CHANGE_EVENT = "paladinscat:wallpaper-change";

export function getWallpaperEnabled(): boolean {
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(WALLPAPER_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setWallpaperEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(WALLPAPER_STORAGE_KEY, String(enabled));
  } catch {
    // Keep the preference working for the current page when storage is unavailable.
  }

  window.dispatchEvent(new Event(WALLPAPER_CHANGE_EVENT));
}
