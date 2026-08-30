import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export type UploadedR2Image = {
  key: string;
  url: string;
  width: number;
  height: number;
  size: number;
  contentType: "image/webp";
};

let client: S3Client | undefined;

function requiredEnvironmentValue(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim();

  if (!value || value === "CHANGE_ME") {
    throw new Error(`Missing required R2 environment variable: ${name}`);
  }

  return value;
}

function getR2Config(): R2Config {
  return {
    accountId: requiredEnvironmentValue("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnvironmentValue("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnvironmentValue("R2_SECRET_ACCESS_KEY"),
    bucketName: requiredEnvironmentValue("R2_BUCKET_NAME"),
    publicUrl: requiredEnvironmentValue("R2_PUBLIC_URL").replace(/\/+$/, ""),
  };
}

function getR2Client() {
  if (client) return client;

  const config = getR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

function normalizeObjectKey(key: string) {
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");

  if (!normalized || normalized.includes("..") || !normalized.endsWith(".webp")) {
    throw new Error("R2 image keys must be safe relative paths ending in .webp");
  }

  return normalized;
}

function publicObjectUrl(publicUrl: string, key: string) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${publicUrl}/${encodedKey}`;
}

export async function uploadImageToR2(input: {
  data: Buffer;
  key: string;
  cacheControl?: string;
}): Promise<UploadedR2Image> {
  if (input.data.byteLength === 0 || input.data.byteLength > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Image source must be between 1 byte and 12 MB");
  }

  const key = normalizeObjectKey(input.key);
  const image = sharp(input.data, { failOn: "error" }).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }

  const output = await image
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  const config = getR2Config();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: output.data,
      ContentType: "image/webp",
      CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    url: publicObjectUrl(config.publicUrl, key),
    width: output.info.width,
    height: output.info.height,
    size: output.info.size,
    contentType: "image/webp",
  };
}

export async function verifyR2Object(key: string) {
  const config = getR2Config();
  const normalizedKey = normalizeObjectKey(key);
  const result = await getR2Client().send(
    new HeadObjectCommand({ Bucket: config.bucketName, Key: normalizedKey }),
  );

  return {
    key: normalizedKey,
    url: publicObjectUrl(config.publicUrl, normalizedKey),
    contentType: result.ContentType,
    size: result.ContentLength,
  };
}

export async function deleteR2Object(key: string) {
  const config = getR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: config.bucketName, Key: normalizeObjectKey(key) }),
  );
}
