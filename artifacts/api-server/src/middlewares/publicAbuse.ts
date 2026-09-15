import type { RequestHandler } from "express";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const createRateLimiter = (scope: string, maxRequests: number, windowMs: number): RequestHandler =>
  (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${scope}:${ip}`;
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (buckets.size > 1000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }

    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
      return;
    }

    next();
  };

export const appointmentRateLimit = createRateLimiter("appointment", 5, 10 * 60_000);
export const inquiryRateLimit = createRateLimiter("inquiry", 10, 10 * 60_000);