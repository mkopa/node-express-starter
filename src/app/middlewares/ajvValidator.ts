import { Request, Response, NextFunction } from 'express';
import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  removeAdditional: 'failing',
});

addFormats(ajv); // email, uri, date, ipv4 etc.

/**
 * Middleware do walidacji request.body względem JSON Schema
 */
export function validateSchema(schema: AnySchema) {
  const validate = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction) => {
    const valid = validate(req.body);

    if (!valid) {
      const errors = validate.errors?.map((err) => ({
        field: err.instancePath || err.params.missingProperty,
        message: err.message,
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
}
