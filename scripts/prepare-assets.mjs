import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logoSource = path.join(root, "public", "brand", "glarivo-logo-source.png");

async function buildLogo(targetName, color) {
  const { data, info } = await sharp(logoSource)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const output = Buffer.alloc(info.width * info.height * 4);
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const sourceAlpha = data[index + 3] / 255;
      const distanceFromWhite = 255 - Math.min(red, green, blue);
      const mask = Math.max(0, Math.min(1, (distanceFromWhite - 12) / 92));
      const alpha = Math.round(mask * sourceAlpha * 255);

      output[index] = color[0];
      output[index + 1] = color[1];
      output[index + 2] = color[2];
      output[index + 3] = alpha;

      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const padding = 28;
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const width = Math.min(info.width - left, maxX - minX + 1 + padding * 2);
  const height = Math.min(info.height - top, maxY - minY + 1 + padding * 2);

  await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left, top, width, height })
    .resize({ width: 760, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", "brand", targetName));
}

const assets = [
  ["hero-glassware.png", "hero-glassware.webp", 1920],
  ["category-drinkware.png", "category-drinkware.webp", 1200],
  ["category-tableware.png", "category-tableware.webp", 1200],
  ["category-serveware.png", "category-serveware.webp", 1200],
  ["category-storage.png", "category-storage.webp", 1200],
  ["category-bakeware.png", "category-bakeware.webp", 1200],
  ["category-colored.png", "category-colored.webp", 1200],
  ["glassware-production.png", "glassware-production.webp", 1920],
];

await Promise.all([
  buildLogo("glarivo-logo-blue.png", [45, 107, 174]),
  buildLogo("glarivo-logo-white.png", [255, 255, 255]),
  ...assets.map(([source, target, width]) =>
    sharp(path.join(root, "public", "images", "home", source))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, smartSubsample: true })
      .toFile(path.join(root, "public", "images", "home", target)),
  ),
]);

console.log("Prepared Glarivo logo variants and homepage image assets.");
