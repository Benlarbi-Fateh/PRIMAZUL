const buckets = new Map();

const getClientKey = (req, scope) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress;

  return `${scope}:${ip || "unknown"}`;
};

const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  scope = "global",
  message = "Trop de tentatives. Reessayez plus tard.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, scope);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", retryAfter.toString());
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter,
      });
    }

    return next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

module.exports = rateLimit;
