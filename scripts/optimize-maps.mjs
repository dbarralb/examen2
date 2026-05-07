import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const mapsDir = path.join(projectRoot, "assets", "Pantalla de juego", "maps");
const optimizedDir = path.join(mapsDir, "optimized");

const maps = ["almacen_A", "almacen_B"];
const widths = [2048, 3072];
const formats = [
  {
    ext: "webp",
    encode: (image) => image.webp({ quality: 75, effort: 6 }),
  },
  {
    ext: "avif",
    encode: (image) => image.avif({ quality: 48, effort: 6 }),
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function assertSourceExists(sourcePath) {
  try {
    await fs.access(sourcePath);
  } catch {
    throw new Error(`No encuentro el mapa original: ${sourcePath}`);
  }
}

async function optimizeMap(mapName) {
  const sourcePath = path.join(mapsDir, `${mapName}.png`);
  await assertSourceExists(sourcePath);

  const metadata = await sharp(sourcePath).metadata();
  console.log(`\n${mapName}.png (${metadata.width}x${metadata.height})`);

  for (const width of widths) {
    for (const format of formats) {
      const outputPath = path.join(optimizedDir, `${mapName}_${width}.${format.ext}`);
      const image = sharp(sourcePath).resize({
        width,
        withoutEnlargement: true,
      });

      await format.encode(image).toFile(outputPath);
      const stats = await fs.stat(outputPath);
      console.log(`  OK ${path.basename(outputPath)} - ${formatBytes(stats.size)}`);
    }
  }
}

async function main() {
  await fs.mkdir(optimizedDir, { recursive: true });

  console.log("Optimizando mapas del almacen...");
  console.log(`Origen: ${mapsDir}`);
  console.log(`Destino: ${optimizedDir}`);

  for (const mapName of maps) {
    await optimizeMap(mapName);
  }

  console.log("\nMapas optimizados actualizados.");
}

main().catch((error) => {
  console.error("\nNo se han podido optimizar los mapas.");
  console.error(error.message);
  process.exitCode = 1;
});
