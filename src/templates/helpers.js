// ─────────────────────────────────────────────────────────────────────────────
// Helper Templates — token.helper.js, constants, etc.
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/helpers/token.helper.js (JWT only) */
export function tokenHelper(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';

${isTS ? `
interface TokenPayload {
  id:    string;
  email: string;
  role:  string;
}

interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}
` : ''}
const ACCESS_TOKEN_EXPIRY  = process.env.JWT_EXPIRES_IN        || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generates an access token + refresh token pair for the given payload.
 *
 * Access tokens are short-lived (15 min by default).
 * Refresh tokens are long-lived (30 days by default).
 *
 * @param payload - Data to embed in the token { id, email, role }
 * @returns {{ accessToken, refreshToken }}
 */
export function generateTokens(payload${isTS ? ': TokenPayload' : ''})${isTS ? ': TokenPair' : ''} {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured');

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ id: payload.id }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws an ApiError on invalid or expired tokens.
 *
 * @param token - The raw JWT string
 * @returns Decoded payload
 */
export function verifyToken(token${isTS ? ': string' : ''})${isTS ? ': TokenPayload & jwt.JwtPayload' : ''} {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured');

  try {
    return jwt.verify(token, secret)${isTS ? ' as TokenPayload & jwt.JwtPayload' : ''};
  } catch (error) {
    if ((error${isTS ? ' as Error' : ''}).name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token has expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid token. Please log in again.');
  }
}
`;
}

/** Generate src/constants/index.js */
export function constants(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `// ─────────────────────────────────────────────────────────────────────────────
// Application-Wide Constants
// ─────────────────────────────────────────────────────────────────────────────

/** HTTP Status Codes — avoids magic numbers in controllers/services */
export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
}${isTS ? ' as const' : ''};

/** User roles */
export const ROLES = {
  USER:  'user',
  ADMIN: 'admin',
}${isTS ? ' as const' : ''};

/** Default pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100,
}${isTS ? ' as const' : ''};

/** Cookie names */
export const COOKIES = {
  REFRESH_TOKEN: 'refreshToken',
}${isTS ? ' as const' : ''};
`;
}
