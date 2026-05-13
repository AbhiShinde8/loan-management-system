// Validation Middleware
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Validated data को req में डालो
      req.validatedData = validatedData;
      next();
    } catch (error) {
      // Joi error को format करो
      const errors = {};

      if (error.details && Array.isArray(error.details)) {
        error.details.forEach((detail) => {
          const field = detail.path[0];
          errors[field] = detail.message;
        });
      }

      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
  };
};

module.exports = validateRequest;
