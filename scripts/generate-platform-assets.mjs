import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve("public/images/icons/platform");
const size = 64;

// Brand paths are the monochrome marks used by Simple Icons (steam.js,
// epicgames.svg, playstation.js, and xbox.js). The PC mark is Lucide's Monitor
// icon, used for the API's non-launcher Hi-Rez/PC accounts.
const icons = {
  Platform_Steam: {
    body: `<path fill="#000" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265z"/>`,
  },
  Platform_Epic_Games: {
    body: "",
  },
  Platform_PlayStation: {
    body: `<path fill="#000" d="M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241 6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z"/>`,
  },
  Platform_Xbox: {
    body: `<path fill="#000" d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.022-.082-.042a.8.8 0 0 0-.281-.045c-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.057-.082.042-.086.042A11.96 11.96 0 0 0 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91C5.921 3.814 4.525 3.382 3.935 3.382a.7.7 0 0 0-.281.046zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545z"/>`,
  },
  Platform_HiRez_PC: {
    body: `<g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></g>`,
  },
};

const svgFor = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`;

// Use the canonical SVG path byte-for-byte before rasterization. Do not
// hand-transcribe this path: SVG arc flags and compact coordinates are easy
// to corrupt while still producing a superficially shield-shaped image.
const epicGamesSvg = await readFile(new URL("./assets/epicgames.svg", import.meta.url), "utf8");
const epicGamesPath = epicGamesSvg.match(/<path d="([^"]+)"/)?.[1];
if (!epicGamesPath) throw new Error("Canonical Epic Games SVG path is missing");
icons.Platform_Epic_Games.body = `<path fill="#000" d="${epicGamesPath}"/>`;

await mkdir(outputDir, { recursive: true });

for (const [name, icon] of Object.entries(icons)) {
  const input = Buffer.from(svgFor(icon.body));
  const raster = sharp(input)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha();

  await raster.clone().png({ compressionLevel: 9 }).toFile(path.join(outputDir, `${name}.png`));
  await raster.clone().avif({ lossless: true, effort: 9 }).toFile(path.join(outputDir, `${name}.avif`));
}

console.log(`Generated ${Object.keys(icons).length} transparent platform icon pairs in ${outputDir}`);
