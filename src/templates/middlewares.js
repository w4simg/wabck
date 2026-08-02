// ─────────────────────────────────────────────────────────────────────────────
// Middleware Templates
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/middlewares/error.middleware.js */
export function errorMiddleware(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  const typeImports = isTS
    ? `import { Request, Response, NextFunction } from 'express';\n`
    : '';
  const fnSig = isTS
    ? '(err: any, _req: Request, res: Response, _next: NextFunction): void'
    : '(err, _req, res, _next)';

  return `${typeImports}import { ApiError } from '../utils/apiError.js';

/**
 * Global Error Handling Middleware
 *
 * Catches all errors passed to next(err) and returns a consistent JSON
 * response. Must be the LAST middleware registered in app.js.
 */
export const errorMiddleware = ${fnSig} => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // ── Handle specific error types ──────────────────────────────────────────

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = \`Invalid \${err.path}: \${err.value}\`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = \`Duplicate value for \${field}\`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errors     = Object.values(err.errors || {}).map((e${isTS ? ': any' : ''}) => e.message);
    message    = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token has expired';
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    statusCode = 422;
    errors     = err.errors?.map((e${isTS ? ': any' : ''}) => \`\${e.path.join('.')}: \${e.message}\`) || [];
    message    = 'Validation failed';
  }

  res.status(statusCode).json({
    success:    false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
`;
}

/** Generate src/middlewares/notFound.middleware.js */
export function notFoundMiddleware(options) {
  const { language } = options;
  const isTS = language === 'typescript';
  const typeImports = isTS ? `import { Request, Response } from 'express';\n` : '';
  const fnSig = isTS ? '(req: Request, res: Response): void' : '(req, res)';

  return `${typeImports}
/**
 * 404 Not Found Middleware
 *
 * Catches any request that doesn't match a registered route and returns
 * a structured 404 response.
 */
export const notFoundMiddleware = ${fnSig} => {
  res.status(404).json({
    success:    false,
    statusCode: 404,
    message:    \`Route \${req.method} \${req.originalUrl} not found\`,
  });
};
`;
}

/** Generate src/middlewares/rateLimiter.middleware.js */
export function rateLimiterMiddleware(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `import rateLimit from 'express-rate-limit';

/**
 * Global Rate Limiter
 *
 * Limits repeated requests from the same IP to prevent abuse.
 * Configured to allow 100 requests per 15-minute window.
 */
export const rateLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              100,             // max requests per window per IP
  standardHeaders:  true,           // Return rate limit info in RateLimit-* headers
  legacyHeaders:    false,          // Disable the X-RateLimit-* headers
  message: {
    success:    false,
    statusCode: 429,
    message:    'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Stricter rate limiter for sensitive auth endpoints.
 * Allows only 10 requests per 15 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:    false,
    statusCode: 429,
    message:    'Too many authentication attempts, please try again after 15 minutes.',
  },
});
`;
}

/** Generate src/middlewares/auth.middleware.js */
export function authMiddleware(options) {
  const { auth, language } = options;
  const isTS = language === 'typescript';

  const typeImports = isTS
    ? `import { Request, Response, NextFunction } from 'express';\n`
    : '';

  if (auth === 'jwt') {
    return `${typeImports}import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

${isTS ? `
// Extend Express Request type to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
` : ''}
/**
 * JWT Authentication Middleware
 *
 * Verifies the Bearer token from the Authorization header and attaches
 * the decoded user payload to req.user for use in downstream handlers.
 */
export const authenticate = asyncHandler(async (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided. Authorization header must be: Bearer <token>');
  }

  const token = authHeader.split(' ')[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured');

  const decoded = jwt.verify(token, secret)${isTS ? ' as { id: string; email: string; role: string }' : ''};
  req.user = {
    id:    decoded.id,
    email: decoded.email,
    role:  decoded.role,
  };

  next();
});

/**
 * Role-Based Authorization Middleware Factory
 *
 * @param {...string} roles - Allowed roles
 * @example
 * router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 */
export const authorize = (...roles${isTS ? ': string[]' : ''}) =>
  asyncHandler(async (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, \`Role '\${req.user.role}' is not allowed to access this resource\`);
    }
    next();
  });
`;
  }

  if (auth === 'clerk') {
    return `${typeImports}import { clerkMiddleware, getAuth } from '@clerk/express';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Clerk Authentication Middleware
 *
 * Mount clerkMiddleware() globally in app.js, then use requireAuth
 * on protected routes.
 */
export { clerkMiddleware };

/**
 * Require authentication via Clerk.
 * Throws 401 if the request is not authenticated.
 */
export const requireAuth = asyncHandler(async (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, 'Authentication required. Please sign in.');
  }
  next();
});
`;
  }

  if (auth === 'firebase') {
    return `${typeImports}import admin from 'firebase-admin';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

/**
 * Firebase Authentication Middleware
 *
 * Verifies the Firebase ID token from the Authorization header and
 * attaches the decoded token to req.user.
 */
export const authenticate = asyncHandler(async (req${isTS ? ': Request' : ''}, _res${isTS ? ': Response' : ''}, next${isTS ? ': NextFunction' : ''}) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'No Firebase token provided');
  }

  const idToken = authHeader.split(' ')[1];

  const decoded = await admin.auth().verifyIdToken(idToken);
  (req${isTS ? ' as any' : ''}).user = {
    id:    decoded.uid,
    email: decoded.email || '',
    role:  (decoded.role${isTS ? ' as string' : ''}) || 'user',
  };

  next();
});
`;
  }

  return `// No authentication selected.\n`;
}
