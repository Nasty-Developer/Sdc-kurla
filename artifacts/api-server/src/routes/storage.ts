import { Readable } from "node:stream";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAdmin } from "../middlewares/adminAuth";
import { ObjectNotFoundError, objectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();

const uploadRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(10 * 1024 * 1024),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
});

router.post("/storage/uploads/request-url", requireAdmin, async (req, res) => {
  const parsed = uploadRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Only JPEG, PNG, WebP, or GIF images up to 10 MB are allowed." });
    return;
  }

  try {
    const { uploadURL, objectPath } = await objectStorageService.createUploadUrl({
      contentType: parsed.data.contentType,
      size: parsed.data.size,
    });
    res.json({ uploadURL, objectPath, metadata: parsed.data });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to create media upload URL");
    res.status(500).json({ error: "Unable to prepare image upload." });
  }
});

router.get("/storage/objects/*path", async (req, res) => {
  try {
    const rawPath = req.params.path;
    const path = `/objects/${Array.isArray(rawPath) ? rawPath.join("/") : rawPath}`;
    const file = await objectStorageService.getObjectFile(path);
    const response = await objectStorageService.download(file);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image not found." });
      return;
    }
    req.log?.error({ err: error }, "Unable to serve clinic image");
    res.status(500).json({ error: "Unable to load image." });
  }
});

export default router;