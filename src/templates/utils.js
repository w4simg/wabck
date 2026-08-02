// ─────────────────────────────────────────────────────────────────────────────
// Utility Templates — asyncHandler, ApiError, ApiResponse
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/utils/asyncHandler.js */
export function asyncHandler(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `${isTS ? `import { Request, Response, NextFunction } from 'express';\n\ntype AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;\n` : ''}
/**
 * asyncHandler
 *
 * Wraps an async Express route handler to catch unhandled promise rejections
 * and pass them to the next error-handling middleware (errorMiddleware).
 *
 * Usage:
 *   router.get('/resource', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} - Standard Express (req, res, next) handler
 */
export const asyncHandler = (fn${isTS ? ': AsyncRouteHandler' : ''}) =>
  (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
`;
}

/** Generate src/utils/apiError.js */
export function apiError(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `/**
 * ApiError — Custom Application Error Class
 *
 * Extends the native Error with HTTP status code and structured error list.
 * Throw this in controllers/services and it will be caught by errorMiddleware.
 *
 * @example
 *   throw new ApiError(404, 'User not found');
 *   throw new ApiError(422, 'Validation failed', ['email is required']);
 */
export class ApiError extends Error {
  statusCode${isTS ? ': number' : ''};
  errors${isTS ? ': string[]' : ''};
  success${isTS ? ': boolean' : ''};
  data${isTS ? ': null' : ''};

  constructor(
    statusCode${isTS ? ': number' : ''},
    message = 'An unexpected error occurred',
    errors${isTS ? ': string[]' : ''} = [],
    stack = ''
  ) {
    super(message);
    this.name       = 'ApiError';
    this.statusCode = statusCode;
    this.errors     = errors;
    this.success    = false;
    this.data       = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
`;
}

/** Generate src/utils/apiResponse.js */
export function apiResponse(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `/**
 * ApiResponse — Standardized HTTP Response Wrapper
 *
 * Creates a consistent JSON response shape across the entire API.
 *
 * Shape:
 *   { success: boolean, statusCode: number, message: string, data: T }
 *
 * @example
 *   res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
 *   res.status(201).json(new ApiResponse(201, newUser, 'User created'));
 */
export class ApiResponse${isTS ? '<T = unknown>' : ''} {
  statusCode${isTS ? ': number' : ''};
  data${isTS ? ': T' : ''};
  message${isTS ? ': string' : ''};
  success${isTS ? ': boolean' : ''};

  constructor(
    statusCode${isTS ? ': number' : ''},
    data${isTS ? ': T' : ''},
    message = 'Success'
  ) {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}
`;
}
