const { ZodError } = require("zod");

const validateRequestPart = (schema, value) => {
  if (!schema) {
    return value;
  }

  return schema.parse(value);
};

const validateWithZod = ({ body, query, params } = {}) => (req, res, next) => {
  try {
    if (body) {
      req.body = validateRequestPart(body, req.body);
    }

    if (query) {
      req.query = validateRequestPart(query, req.query);
    }

    if (params) {
      req.params = validateRequestPart(params, req.params);
    }

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return res.status(400).json({
        message: issue?.message || "Invalid request data",
      });
    }

    return next(error);
  }
};

module.exports = {
  validateWithZod,
};
