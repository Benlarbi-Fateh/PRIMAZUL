// backend/config/redis.js
const Redis = require("ioredis");

// URL de connexion (par défaut localhost si pas dans .env)
// Exemple .env : REDIS_URL=redis://:password@host:port
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = new Redis(redisUrl, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on("connect", () => console.log("✅ Connecté à Redis"));
redisClient.on("error", (err) => console.error("❌ Erreur Redis:", err));

module.exports = redisClient;
