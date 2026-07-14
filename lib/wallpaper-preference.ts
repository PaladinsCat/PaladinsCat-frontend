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
  wallpaper: CustomWallpaper;
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

function saveWallpaperReferences(wallpapers: CustomWallpaper[]): void {
  try {
    if (wallpapers.length > 0) {
      window.localStorage.setItem(CUSTOM_WALLPAPER_STORAGE_KEY, JSON.stringify(wallpapers));
    } else {
      window.localStorage.removeItem(CUSTOM_WALLPAPER_STORAGE_KEY);
    }
  } catch {
    throw new Error("The browser could not save this wallpaper setting.");
  }
}

function parseWallpaperReference(value: unknown): CustomWallpaper | null {
  if (
    typeof value === "object"
    && value !== null
    && "type" in value
    && "source" in value
    && value.type === "url"
    && typeof value.source === "string"
    && isSupportedExternalWallpaper(value.source)
  ) {
    return { type: "url", source: value.source };
  }
  if (
    typeof value === "object"
    && value !== null
    && "type" in value
    && "id" in value
    && value.type === "upload"
    && typeof value.id === "string"
  ) {
    return { type: "upload", id: value.id };
  }
  return null;
}

function wallpaperKey(wallpaper: CustomWallpaper): string {
  return wallpaper.type === "url" ? `url:${wallpaper.source}` : `upload:${wallpaper.id}`;
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

/** Returns the small local-storage references for this browser's custom wallpapers. */
export function getCustomWallpapers(): CustomWallpaper[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_WALLPAPER_STORAGE_KEY);
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Preserve existing URL-only settings created before the IndexedDB upgrade.
      return isSupportedExternalWallpaper(raw) ? [{ type: "url", source: raw }] : [];
    }
    const values = Array.isArray(parsed) ? parsed : [parsed];
    return values.map(parseWallpaperReference).filter((wallpaper): wallpaper is CustomWallpaper => wallpaper !== null);
  } catch {
    return [];
  }
}

/** Returns the first wallpaper for compatibility with single-wallpaper consumers. */
export function getCustomWallpaper(): CustomWallpaper | null {
  return getCustomWallpapers()[0] ?? null;
}

/** Resolves local references into URLs that can be used by CSS backgrounds. */
export async function resolveCustomWallpapers(): Promise<ResolvedCustomWallpaper[]> {
  const wallpapers = getCustomWallpapers();
  const resolved = await Promise.all(wallpapers.map(async (wallpaper): Promise<ResolvedCustomWallpaper | null> => {
    if (wallpaper.type === "url") {
      return { source: wallpaper.source, revoke: false, wallpaper };
    }

    const upload = await getStoredUpload(wallpaper.id);
    return upload ? { source: URL.createObjectURL(upload), revoke: true, wallpaper } : null;
  }));
  return resolved.filter((wallpaper): wallpaper is ResolvedCustomWallpaper => wallpaper !== null);
}

/** Resolves the first custom wallpaper for compatibility with single-wallpaper consumers. */
export async function resolveCustomWallpaper(): Promise<ResolvedCustomWallpaper | null> {
  return (await resolveCustomWallpapers())[0] ?? null;
}

function validateWallpaperUrl(source: string): string {
  const normalizedSource = source.trim();
  if (!isSupportedExternalWallpaper(normalizedSource)) {
    throw new Error("Use a valid http(s) image URL.");
  }
  return normalizedSource;
}

function validateWallpaperFile(file: File): void {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose PNG, JPEG, WebP, GIF, or AVIF images.");
  }
  if (file.size > MAX_CUSTOM_WALLPAPER_BYTES) {
    throw new Error("Choose images no larger than 25 MB each.");
  }
}

/** Adds an external wallpaper URL to the saved collection. */
export async function addCustomWallpaperUrl(source: string): Promise<void> {
  if (typeof window === "undefined") return;

  const normalizedSource = validateWallpaperUrl(source);
  const wallpapers = getCustomWallpapers();
  const nextWallpaper: CustomWallpaper = { type: "url", source: normalizedSource };
  if (!wallpapers.some((wallpaper) => wallpaperKey(wallpaper) === wallpaperKey(nextWallpaper))) {
    saveWallpaperReferences([...wallpapers, nextWallpaper]);
  }
  notifyWallpaperChange();
}

/** Adds uploaded images to IndexedDB and their references to the saved collection. */
export async function addCustomWallpaperFiles(files: File[]): Promise<void> {
  if (typeof window === "undefined" || files.length === 0) return;
  files.forEach(validateWallpaperFile);

  const additions = files.map((file) => ({ file, wallpaper: { type: "upload", id: createWallpaperId() } as CustomWallpaper }));
  const savedIds: string[] = [];
  try {
    for (const addition of additions) {
      if (addition.wallpaper.type !== "upload") continue;
      await saveUpload(addition.wallpaper.id, addition.file);
      savedIds.push(addition.wallpaper.id);
    }
    saveWallpaperReferences([...getCustomWallpapers(), ...additions.map(({ wallpaper }) => wallpaper)]);
  } catch (error) {
    await Promise.allSettled(savedIds.map(removeUpload));
    throw error;
  }
  notifyWallpaperChange();
}

/** Replaces the collection with one external wallpaper URL. */
export async function setCustomWallpaperUrl(source: string): Promise<void> {
  if (typeof window === "undefined") return;

  const normalizedSource = validateWallpaperUrl(source);
  const previous = getCustomWallpapers();
  saveWallpaperReferences([{ type: "url", source: normalizedSource }]);
  await Promise.allSettled(previous.filter((wallpaper): wallpaper is Extract<CustomWallpaper, { type: "upload" }> => wallpaper.type === "upload").map((wallpaper) => removeUpload(wallpaper.id)));
  notifyWallpaperChange();
}

/** Replaces the collection with one uploaded image. */
export async function setCustomWallpaperFile(file: File): Promise<void> {
  if (typeof window === "undefined") return;
  validateWallpaperFile(file);

  const id = createWallpaperId();
  const previous = getCustomWallpapers();
  await saveUpload(id, file);
  try {
    saveWallpaperReferences([{ type: "upload", id }]);
  } catch (error) {
    void removeUpload(id);
    throw error;
  }
  await Promise.allSettled(previous.filter((wallpaper): wallpaper is Extract<CustomWallpaper, { type: "upload" }> => wallpaper.type === "upload").map((wallpaper) => removeUpload(wallpaper.id)));
  notifyWallpaperChange();
}

/** Removes one wallpaper from the saved collection. */
export async function removeCustomWallpaper(target: CustomWallpaper): Promise<void> {
  if (typeof window === "undefined") return;

  const targetKey = wallpaperKey(target);
  const wallpapers = getCustomWallpapers();
  const index = wallpapers.findIndex((wallpaper) => wallpaperKey(wallpaper) === targetKey);
  if (index < 0) return;
  saveWallpaperReferences(wallpapers.filter((_, wallpaperIndex) => wallpaperIndex !== index));
  if (target.type === "upload") await Promise.allSettled([removeUpload(target.id)]);
  notifyWallpaperChange();
}

/** Removes all references and uploaded images from this browser. */
export async function clearCustomWallpaper(): Promise<void> {
  if (typeof window === "undefined") return;

  const previous = getCustomWallpapers();
  saveWallpaperReferences([]);
  await Promise.allSettled(previous.filter((wallpaper): wallpaper is Extract<CustomWallpaper, { type: "upload" }> => wallpaper.type === "upload").map((wallpaper) => removeUpload(wallpaper.id)));
  notifyWallpaperChange();
}
