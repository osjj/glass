import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = path.resolve(import.meta.dirname, "..");
const inputPath = process.argv[2];

if (!inputPath) {
  throw new Error("Pass the reference logo PNG path as the first argument.");
}

const brandDirectory = path.join(projectRoot, "public", "brand");
const sourcePath = path.join(brandDirectory, "glarivo-logo-source.png");
const bluePath = path.join(brandDirectory, "glarivo-logo-blue.png");
const whitePath = path.join(brandDirectory, "glarivo-logo-white.png");
const bottomWordScale = 1.2;

const { data, info } = await sharp(inputPath)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
const bluePixels = Buffer.alloc(pixelCount * 4);
const whitePixels = Buffer.alloc(pixelCount * 4);

for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  const sourceOffset = pixel * 3;
  const outputOffset = pixel * 4;
  const red = data[sourceOffset];
  const green = data[sourceOffset + 1];
  const blue = data[sourceOffset + 2];

  // The supplied artwork is a blue logo composited over near-white. Combining
  // tonal distance with blue chroma removes the white texture while preserving
  // antialiased blue edges and rejecting neutral background noise.
  const tonalAlpha = (255 - Math.min(red, green, blue) - 1) / 225;
  const blueChroma = blue - (red + green) / 2;
  const chromaAlpha = (blueChroma - 0.5) / 108;
  const normalizedAlpha = Math.max(0, Math.min(1, tonalAlpha, chromaAlpha));
  const alpha = normalizedAlpha < 0.012 ? 0 : Math.round(normalizedAlpha * 255);

  if (alpha === 0) {
    continue;
  }

  const recoverChannel = (channel) => {
    if (normalizedAlpha >= 0.995) return channel;
    return Math.max(
      0,
      Math.min(255, Math.round((channel - 255 * (1 - normalizedAlpha)) / normalizedAlpha)),
    );
  };

  bluePixels[outputOffset] = recoverChannel(red);
  bluePixels[outputOffset + 1] = recoverChannel(green);
  bluePixels[outputOffset + 2] = recoverChannel(blue);
  bluePixels[outputOffset + 3] = alpha;

  whitePixels[outputOffset] = 255;
  whitePixels[outputOffset + 1] = 255;
  whitePixels[outputOffset + 2] = 255;
  whitePixels[outputOffset + 3] = alpha;
}

await fs.mkdir(brandDirectory, { recursive: true });
await fs.copyFile(inputPath, sourcePath);

const rawInput = { raw: { width: info.width, height: info.height, channels: 4 } };
const outputOptions = {
  background: { r: 0, g: 0, b: 0, alpha: 0 },
  threshold: 2,
};

async function enlargeBottomWord(imagePath) {
  const { data: rgba, info: imageInfo } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const searchLeft = Math.floor(imageInfo.width * 0.23);
  const searchRight = Math.ceil(imageInfo.width * 0.78);
  const searchTop = Math.floor(imageInfo.height * 0.86);
  let minX = imageInfo.width;
  let minY = imageInfo.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = searchTop; y < imageInfo.height; y += 1) {
    for (let x = searchLeft; x <= searchRight; x += 1) {
      const alpha = rgba[(y * imageInfo.width + x) * 4 + 3];
      if (alpha <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error(`Could not locate GLASSWARE word in ${imagePath}.`);
  }

  const wordWidth = maxX - minX + 1;
  const wordHeight = maxY - minY + 1;
  const enlargedWidth = Math.round(wordWidth * bottomWordScale);
  const enlargedHeight = Math.round(wordHeight * bottomWordScale);
  const centerX = minX + wordWidth / 2;
  const centerY = minY + wordHeight / 2;
  const enlargedLeft = Math.round(centerX - enlargedWidth / 2);
  const enlargedTop = Math.round(centerY - enlargedHeight / 2);
  const enlargedRight = enlargedLeft + enlargedWidth - 1;
  const lineGap = 28;

  const word = await sharp(imagePath)
    .extract({ left: minX, top: minY, width: wordWidth, height: wordHeight })
    .resize(enlargedWidth, enlargedHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const transparentRectangle = (width, height) => ({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  });
  const lineBandTop = Math.max(0, minY - 5);
  const lineBandHeight = Math.min(imageInfo.height - lineBandTop, wordHeight + 10);
  const leftLineClearStart = Math.max(0, enlargedLeft - lineGap);
  const leftLineClearWidth = Math.max(0, minX - leftLineClearStart);
  const rightLineClearStart = maxX + 1;
  const rightLineClearWidth = Math.max(0, Math.min(imageInfo.width, enlargedRight + lineGap + 1) - rightLineClearStart);

  const eraseLayers = [
    {
      input: transparentRectangle(wordWidth, wordHeight),
      left: minX,
      top: minY,
      blend: "dest-out",
    },
  ];

  if (leftLineClearWidth > 0) {
    eraseLayers.push({
      input: transparentRectangle(leftLineClearWidth, lineBandHeight),
      left: leftLineClearStart,
      top: lineBandTop,
      blend: "dest-out",
    });
  }

  if (rightLineClearWidth > 0) {
    eraseLayers.push({
      input: transparentRectangle(rightLineClearWidth, lineBandHeight),
      left: rightLineClearStart,
      top: lineBandTop,
      blend: "dest-out",
    });
  }

  const updated = await sharp(imagePath)
    .composite([
      ...eraseLayers,
      { input: word, left: enlargedLeft, top: enlargedTop, blend: "over" },
    ])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  await fs.writeFile(imagePath, updated);
}

async function normalizeWhiteLogo(imagePath) {
  const { data: rgba, info: imageInfo } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < rgba.length; offset += 4) {
    if (rgba[offset + 3] === 0) continue;
    rgba[offset] = 255;
    rgba[offset + 1] = 255;
    rgba[offset + 2] = 255;
  }

  const normalized = await sharp(rgba, {
    raw: {
      width: imageInfo.width,
      height: imageInfo.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();

  await fs.writeFile(imagePath, normalized);
}

await Promise.all([
  sharp(bluePixels, rawInput)
    .trim(outputOptions)
    .extend({ top: 20, right: 20, bottom: 20, left: 20, background: outputOptions.background })
    .png({ compressionLevel: 9, palette: false })
    .toFile(bluePath),
  sharp(whitePixels, rawInput)
    .trim(outputOptions)
    .extend({ top: 20, right: 20, bottom: 20, left: 20, background: outputOptions.background })
    .png({ compressionLevel: 9, palette: false })
    .toFile(whitePath),
]);

await Promise.all([enlargeBottomWord(bluePath), enlargeBottomWord(whitePath)]);
await normalizeWhiteLogo(whitePath);

const [blueMetadata, whiteMetadata] = await Promise.all([
  sharp(bluePath).metadata(),
  sharp(whitePath).metadata(),
]);

console.log(JSON.stringify({ sourcePath, bluePath, whitePath, blueMetadata, whiteMetadata }, null, 2));
