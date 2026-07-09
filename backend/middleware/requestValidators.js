const mongoose = require("mongoose");

const badRequest = (res, message, details) =>
  res.status(400).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });

const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value) || !/^[a-f\d]{24}$/i.test(value)) {
    return badRequest(res, `${paramName} invalide`);
  }

  return next();
};

const validatePaginationQuery = ({
  limitParam = "limit",
  beforeParam = "before",
  maxLimit = 100,
} = {}) => (req, res, next) => {
  const limit = req.query[limitParam];
  const before = req.query[beforeParam];

  if (limit !== undefined) {
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
      return badRequest(res, `${limitParam} doit etre un entier entre 1 et ${maxLimit}`);
    }
  }

  if (before !== undefined) {
    const parsedDate = new Date(before);
    if (Number.isNaN(parsedDate.getTime())) {
      return badRequest(res, `${beforeParam} doit etre une date valide`);
    }
  }

  return next();
};

const validateSearchQuery = ({
  queryParam = "query",
  minLength = 1,
  maxLength = 100,
} = {}) => (req, res, next) => {
  const value = req.query[queryParam];

  if (typeof value !== "string" || value.trim().length < minLength) {
    return badRequest(res, "Requete de recherche vide");
  }

  if (value.trim().length > maxLength) {
    return badRequest(res, `Recherche limitee a ${maxLength} caracteres`);
  }

  return next();
};

const validatePositiveIntegerQuery = ({
  queryParam,
  min = 1,
  max = 100,
}) => (req, res, next) => {
  const value = req.query[queryParam];

  if (value === undefined) {
    return next();
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return badRequest(res, `${queryParam} doit etre un entier entre ${min} et ${max}`);
  }

  return next();
};

module.exports = {
  validateObjectIdParam,
  validatePaginationQuery,
  validateSearchQuery,
  validatePositiveIntegerQuery,
};
