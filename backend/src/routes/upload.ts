import { Router, Request, Response } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "../lib/auth";
import { getS3Client } from "../lib/r2";
import multer from "multer";
import { Readable } from "stream";
import sharp from "sharp";

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed. Only images are accepted.`));
    }
  },
});


function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF\u0750-\u077F]+/g, (m) => m)
    .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "product";
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (mimeType === "image/svg+xml") {
    return { buffer, contentType: "image/svg+xml" };
  }

  const compressed = await sharp(buffer)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  return { buffer: compressed, contentType: "image/webp" };
}

function buildR2Key(productCode: string | undefined, productName: string, imageIndex: number): string {
  const name = slugify(productName);
  if (productCode && productCode.trim() && productCode.trim().toUpperCase() !== "NEW") {
    const code = productCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    return `products/${code}/${name}-${imageIndex}.webp`;
  }
  return `products/new/${name}-${imageIndex}.webp`;
}

router.post("/admin/upload", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  const s3 = getS3Client();

  if (!s3 || !bucketName) {
    res.json({ available: false, error: "R2 not configured" });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const productName = typeof req.body.productName === "string" && req.body.productName.trim()
    ? req.body.productName.trim()
    : "product";
  const productCode = typeof req.body.productCode === "string" ? req.body.productCode.trim() : undefined;
  const imageIndex = parseInt(req.body.imageIndex as string, 10) || 1;

  try {
    const { buffer: compressed, contentType } = await compressImage(file.buffer, file.mimetype);

    const key = buildR2Key(productCode, productName, imageIndex);

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: compressed,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const isPublicUrl = publicUrl && !publicUrl.includes("r2.cloudflarestorage.com");
    const fileUrl = isPublicUrl
      ? `${publicUrl.replace(/\/$/, "")}/${key}`
      : `/api/images/${encodeURIComponent(key)}`;

    const originalKB = Math.round(file.buffer.length / 1024);
    const compressedKB = Math.round(compressed.length / 1024);

    res.json({ available: true, fileUrl, originalKB, compressedKB });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ available: false, error: "Upload failed" });
  }
});

const ALLOWED_KEY_PREFIXES = ["products/"];

router.get("/images/*key", async (req: Request, res: Response) => {
  const bucketName = process.env.R2_BUCKET_NAME;
  const s3 = getS3Client();

  if (!s3 || !bucketName) {
    res.status(503).send("Image storage not configured");
    return;
  }

  const rawKey = decodeURIComponent(req.params.key ?? "");
  const key = rawKey.replace(/\.\.[/\\]/g, "").replace(/^[/\\]+/, "");

  const isAllowed = ALLOWED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
  if (!isAllowed || key.includes("..")) {
    res.status(400).send("Invalid image key");
    return;
  }

  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    if (result.ContentType) res.setHeader("Content-Type", result.ContentType);
    if (result.ContentLength) res.setHeader("Content-Length", result.ContentLength);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    (result.Body as Readable).pipe(res);
  } catch (err) {
    console.error("R2 fetch error:", err);
    res.status(404).send("Image not found");
  }
});

export default router;
