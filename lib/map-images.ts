export function mapImagePath(mapName: string): string {
  const name = mapName.replace(/[’']/g, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `/images/maps/${name}.png`;
}
