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

const validateUuidParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];

  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return badRequest(res, `${paramName} invalide`);
  }

  return next();
};

const validateObjectIdBody = (fieldName) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value) || !/^[a-f\d]{24}$/i.test(value)) {
    return badRequest(res, `${fieldName} invalide`);
  }

  return next();
};

const validateUuidBody = (fieldName) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return badRequest(res, `${fieldName} invalide`);
  }

  return next();
};

const validateOptionalEnumBody = (fieldName, allowedValues) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (value !== undefined && !allowedValues.includes(value)) {
    return badRequest(res, `${fieldName} invalide`, { allowedValues });
  }

  return next();
};

const validateOptionalBooleanBody = (fieldName) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (value !== undefined && typeof value !== "boolean") {
    return badRequest(res, `${fieldName} doit etre un booleen`);
  }

  return next();
};

const validateOptionalArrayBody = (fieldName, { maxLength = 100 } = {}) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (value !== undefined && !Array.isArray(value)) {
    return badRequest(res, `${fieldName} doit etre un tableau`);
  }

  if (Array.isArray(value) && value.length > maxLength) {
    return badRequest(res, `${fieldName} limite a ${maxLength} elements`);
  }

  return next();
};

const validateOptionalIntegerBody = ({
  fieldName,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}) => (req, res, next) => {
  const value = req.body?.[fieldName];

  if (value === undefined) {
    return next();
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return badRequest(res, `${fieldName} doit etre un entier entre ${min} et ${max}`);
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
  validateUuidParam,
  validateObjectIdBody,
  validateUuidBody,
  validateOptionalEnumBody,
  validateOptionalBooleanBody,
  validateOptionalArrayBody,
  validateOptionalIntegerBody,
  validatePaginationQuery,
  validateSearchQuery,
  validatePositiveIntegerQuery,
};
