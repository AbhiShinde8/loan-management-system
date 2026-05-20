const { validationResult } = require("express-validator");

const validate = (schemas) => {
  return [
    // ✅ Run all schemas
    ...(Array.isArray(schemas) ? schemas : [schemas]),

    // ✅ Check results
    (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.param,
            message: err.msg,
            value: err.value,
          })),
        });
      }

      next();
    },
  ];
};

module.exports = validate;
