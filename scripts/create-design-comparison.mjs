import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "output", "design-reference", "glarivo-direction-3.png");
const implementationPath = path.join(root, "output", "design-qa", "home-desktop-final.png");
const outputPath = path.join(root, "output", "design-qa", "direction-3-comparison-final.png");

const width = 1536;
const height = 1024;
const [source, implementation] = await Promise.all([
  sharp(sourcePath).resize(width, height, { fit: "fill" }).png().toBuffer(),
  sharp(implementationPath).resize(width, height, { fit: "fill" }).png().toBuffer(),
]);

await sharp({
  create: {
    width: width * 2 + 4,
    height,
    channels: 4,
    background: { r: 223, g: 228, b: 236, alpha: 1 },
  },
})
  .composite([
    { input: source, left: 0, top: 0 },
    { input: implementation, left: width + 4, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(outputPath);
