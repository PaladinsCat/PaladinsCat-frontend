export const WALLPAPER_STORAGE_KEY = "paladinscat-wallpaper-enabled";
export const CUSTOM_WALLPAPER_STORAGE_KEY = "paladinscat-custom-wallpaper";
export const WALLPAPER_CHANGE_EVENT = "paladinscat:wallpaper-change";

const WALLPAPER_DATABASE_NAME = "paladinscat-wallpapers";
const WALLPAPER_OBJECT_STORE = "images";
export const MAX_CUSTOM_WALLPAPER_BYTES = 25 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type CustomWallpaper =
  | { type: "url"; source: string }
  | { type: "upload"; id: string };

export type ResolvedCustomWallpaper = {
  source: string;
  revoke: boolean;
};

function isSupportedExternalWallpaper(source: string): boolean {
  try {
    const url = new URL(source);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function notifyWallpaperChange(): void {
  window.dispatchEvent(new Event(WALLPAPER_CHANGE_EVENT));
}

function openWallpaperDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(WALLPAPER_DATABASE_NAME, 1);
    request.onerror = () => reject(new Error("The browser could not open its wallpaper storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(WALLPAPER_OBJECT_STORE)) {
        request.result.createObjectStore(WALLPAPER_OBJECT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoredUpload(id: string): Promise<Blob | null> {
  const database = await openWallpaperDatabase();
  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_OBJECT_STORE, "readonly");
    const request = transaction.objectStore(WALLPAPER_OBJECT_STORE).get(id);
    request.onerror = () => reject(new Error("The browser could not read the saved wallpaper."));
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
  }).finally(() => database.close());
}

async function saveUpload(id: string, file: File): Promise<void> {
  const database = await openWallpaperDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_OBJECT_STORE, "readwrite");
    transaction.objectStore(WALLPAPER_OBJECT_STORE).put(file, id);
    transaction.onerror = () => reject(new Error("The browser could not save this wallpaper."));
    transaction.oncomplete = () => resolve();
  }).finally(() => database.close());
}

async function removeUpload(id: string): Promise<void> {
  const database = await openWallpaperDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WALLPAPER_OBJECT_STORE, "readwrite");
    transaction.objectStore(WALLPAPER_OBJECT_STORE).delete(id);
    transaction.onerror = () => reject(new Error("The browser could not remove the saved wallpaper."));
    transaction.oncomplete = () => resolve();
  }).finally(() => database.close());
}

function saveWallpaperReference(wallpaper: CustomWallpaper | null): void {
  try {
    if (wallpaper) {
      window.localStorage.setItem(CUSTOM_WALLPAPER_STORAGE_KEY, JSON.stringify(wallpaper));
    } else {
      window.localStorage.removeItem(CUSTOM_WALLPAPER_STORAGE_KEY);
    }
  } catch {
    throw new Error("The browser could not save this wallpaper setting.");
  }
}

function createWallpaperId(): string {
  return window.crypto.randomUUID?.() ?? `wallpaper-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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

  notifyWallpaperChange();
}

/** Returns the small local-storage reference for the browser's custom wallpaper. */
export function getCustomWallpaper(): CustomWallpaper | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CUSTOM_WALLPAPER_STORAGE_KEY);
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Preserve existing URL-only settings created before the IndexedDB upgrade.
      return isSupportedExternalWallpaper(raw) ? { type: "url", source: raw } : null;
    }
    if (
      typeof parsed === "object"
      && parsed !== null
      && "type" in parsed
      && "source" in parsed
      && parsed.type === "url"
      && typeof parsed.source === "string"
      && isSupportedExternalWallpaper(parsed.source)
    ) {
      return { type: "url", source: parsed.source };
    }
    if (
      typeof parsed === "object"
      && parsed !== null
      && "type" in parsed
      && "id" in parsed
      && parsed.type === "upload"
      && typeof parsed.id === "string"
    ) {
      return { type: "upload", id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/** Resolves the local reference into a URL that can be used by a CSS background. */
export async function resolveCustomWallpaper(): Promise<ResolvedCustomWallpaper | null> {
  const wallpaper = getCustomWallpaper();
  if (!wallpaper) return null;
  if (wallpaper.type === "url") return { source: wallpaper.source, revoke: false };

  const upload = await getStoredUpload(wallpaper.id);
  return upload ? { source: URL.createObjectURL(upload), revoke: true } : null;
}

/** Saves an external wallpaper URL in local storage. */
export async function setCustomWallpaperUrl(source: string): Promise<void> {
  if (typeof window === "undefined") return;

  const normalizedSource = source.trim();
  if (!isSupportedExternalWallpaper(normalizedSource)) {
    throw new Error("Use a valid http(s) image URL.");
  }

  const previous = getCustomWallpaper();
  saveWallpaperReference({ type: "url", source: normalizedSource });
  if (previous?.type === "upload") void removeUpload(previous.id);
  notifyWallpaperChange();
}

/** Stores an uploaded image in IndexedDB and saves only its ID in local storage. */
export async function setCustomWallpaperFile(file: File): Promise<void> {
  if (typeof window === "undefined") return;
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a PNG, JPEG, WebP, GIF, or AVIF image.");
  }
  if (file.size > MAX_CUSTOM_WALLPAPER_BYTES) {
    throw new Error("Choose an image no larger than 25 MB.");
  }

  const id = createWallpaperId();
  const previous = getCustomWallpaper();
  await saveUpload(id, file);
  try {
    saveWallpaperReference({ type: "upload", id });
  } catch (error) {
    void removeUpload(id);
    throw error;
  }
  if (previous?.type === "upload") void removeUpload(previous.id);
  notifyWallpaperChange();
}

/** Removes the reference and its uploaded image, if any, from this browser. */
export async function clearCustomWallpaper(): Promise<void> {
  if (typeof window === "undefined") return;

  const previous = getCustomWallpaper();
  saveWallpaperReference(null);
  if (previous?.type === "upload") void removeUpload(previous.id);
  notifyWallpaperChange();
}
