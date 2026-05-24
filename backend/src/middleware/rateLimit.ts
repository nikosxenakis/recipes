import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-IP fixed-window rate limit, kept in this lambda instance's memory.
 * Imperfect (multiple instances each have their own counter) but cheap and
 * good enough to keep a runaway abuser from melting the LLM budget.
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ?? req.socket.remoteAddress ?? "unknown");

    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(ip, bucket);
    }

    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(opts.max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, opts.max - bucket.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: `Too many requests. Try again in ${retryAfter}s.` });
      return;
    }
    next();
  };
}
