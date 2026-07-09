const rateLimit = require("./rateLimiter");

const uploadRateLimit = rateLimit({
  scope: "upload",
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Trop d'uploads. Reessayez plus tard.",
});

const agoraTokenRateLimit = rateLimit({
  scope: "agora-token",
  windowMs: 60 * 1000,
  max: 60,
  message: "Trop de demandes de token appel. Reessayez dans un instant.",
});

const agoraCallInitiateRateLimit = rateLimit({
  scope: "agora-call-initiate",
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Trop de tentatives d'appel. Reessayez plus tard.",
});

const agoraCallActionRateLimit = rateLimit({
  scope: "agora-call-action",
  windowMs: 60 * 1000,
  max: 60,
  message: "Trop d'actions d'appel. Reessayez dans un instant.",
});

const agoraCallPingRateLimit = rateLimit({
  scope: "agora-call-ping",
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Trop de pings d'appel. Reessayez dans un instant.",
});

module.exports = {
  uploadRateLimit,
  agoraTokenRateLimit,
  agoraCallInitiateRateLimit,
  agoraCallActionRateLimit,
  agoraCallPingRateLimit,
};
