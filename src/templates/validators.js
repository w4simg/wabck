// ─────────────────────────────────────────────────────────────────────────────
// Validator Templates — user.validator.js
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/validators/user.validator.js */
export function userValidator(options) {
  const { validation, language } = options;
  const isTS = language === 'typescript';

  // ── Zod ─────────────────────────────────────────────────────────────────────
  if (validation === 'zod') {
    return `import { z } from 'zod';
${isTS ? "import { Request, Response, NextFunction } from 'express';\n" : ''}
// ─────────────────────────────────────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  body: z.object({
    name:     z.string().min(2, 'Name must be at least 2 characters').max(50),
    email:    z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name:  z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation Middleware Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an Express middleware that validates the request against a Zod schema.
 * Throws a ZodError (caught by errorMiddleware) on failure.
 *
 * @param {z.ZodSchema} schema - Zod schema with body/params/query fields
 */
export const validate = (schema${isTS ? ': z.ZodSchema' : ''}) =>
  (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
    schema.parse({
      body:   req.body,
      params: req.params,
      query:  req.query,
    });
    next();
  };
`;
  }

  // ── Joi ──────────────────────────────────────────────────────────────────────
  if (validation === 'joi') {
    return `import Joi from 'joi';
${isTS ? "import { Request, Response, NextFunction } from 'express';\n" : ''}
// ─────────────────────────────────────────────────────────────────────────────
// Joi Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createUserSchema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one {{#name}}',
    }),
});

export const updateUserSchema = Joi.object({
  name:  Joi.string().min(2).max(50),
  email: Joi.string().email(),
}).min(1);

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation Middleware Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an Express middleware that validates req.body against a Joi schema.
 * Passes a 422 ApiError to next() on failure.
 */
export const validate = (schema${isTS ? ': Joi.Schema' : ''}) =>
  (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d${isTS ? ': Joi.ValidationErrorItem' : ''}) => d.message);
      const err = new Error('Validation failed');
      (err${isTS ? ' as any' : ''}).statusCode = 422;
      (err${isTS ? ' as any' : ''}).errors = messages;
      return next(err);
    }
    next();
  };
`;
  }

  // ── Express Validator ──────────────────────────────────────────────────────
  return `import { body, param, validationResult } from 'express-validator';
${isTS ? "import { Request, Response, NextFunction } from 'express';\n" : ''}
// ─────────────────────────────────────────────────────────────────────────────
// Express Validator Rules
// ─────────────────────────────────────────────────────────────────────────────

export const createUserRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const updateUserRules = [
  param('id').notEmpty().withMessage('User ID is required'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation Error Handler Middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run after validation rule arrays. Collects all errors and passes a
 * 422 error to next() if any rules failed.
 */
export const handleValidationErrors = (
  req${isTS ? ': Request' : ''},
  _res${isTS ? ': Response' : ''},
  next${isTS ? ': NextFunction' : ''}
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e${isTS ? ': any' : ''}) => e.msg);
    const err = new Error('Validation failed');
    (err${isTS ? ' as any' : ''}).statusCode = 422;
    (err${isTS ? ' as any' : ''}).errors = messages;
    return next(err);
  }
  next();
};
`;
}
