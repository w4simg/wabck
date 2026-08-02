// ─────────────────────────────────────────────────────────────────────────────
// Route Templates
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/routes/index.js — Master router */
export function routesIndex(options) {
  const { auth, language } = options;
  const isTS = language === 'typescript';
  const hasAuth = auth !== 'none';

  return `import { Router } from 'express';
import healthRoutes from './health.route.js';
import userRoutes from './user.route.js';
${hasAuth && auth === 'jwt' ? "import authRoutes from './auth.route.js';\n" : ''}
const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Route Registration
// All routes here are mounted at /api/v1 (configured in app.js)
// ─────────────────────────────────────────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/users',  userRoutes);
${hasAuth && auth === 'jwt' ? "router.use('/auth', authRoutes);\n" : ''}
export default router;
`;
}

/** Generate src/routes/health.route.js */
export function healthRoute(options) {
  const { language, database, projectName } = options;
  const isTS = language === 'typescript';

  const typeImports = isTS ? `import { Request, Response } from 'express';\n` : '';

  return `${typeImports}import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let _version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));
  _version = pkg.version;
} catch { /* ignore */ }

const router = Router();

/**
 * GET /api/v1/health
 *
 * Returns the current health status of the API including uptime,
 * version, environment, and timestamp.
 */
router.get('/', (_req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  res.status(200).json({
    status:    'ok',
    uptime:    Math.floor(process.uptime()),
    version:   _version,
    env:       process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    memory: {
      used:  Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  });
});

export default router;
`;
}

/** Generate src/routes/user.route.js */
export function userRoute(options) {
  const { auth, language, validation } = options;
  const isTS = language === 'typescript';
  const hasJwt = auth === 'jwt';
  const hasValidation = validation && validation !== 'none';

  const authImport = hasJwt
    ? `import { authenticate, authorize } from '../middlewares/auth.middleware.js';\n`
    : auth === 'clerk'
    ? `import { requireAuth } from '../middlewares/auth.middleware.js';\n`
    : auth === 'firebase'
    ? `import { authenticate } from '../middlewares/auth.middleware.js';\n`
    : '';

  const guardStart = hasJwt ? 'authenticate, ' : auth !== 'none' ? 'requireAuth, ' : '';
  const adminGuard = hasJwt ? 'authenticate, authorize("admin"), ' : guardStart;

  let validationImport = '';
  let validateCreate = '';
  let validateUpdate = '';

  if (hasValidation) {
    if (validation === 'zod' || validation === 'joi') {
      validationImport = `import { validate, createUserSchema, updateUserSchema } from '../validators/user.validator.js';\n`;
      validateCreate = `validate(createUserSchema), `;
      validateUpdate = `validate(updateUserSchema), `;
    } else if (validation === 'express-validator') {
      validationImport = `import { createUserRules, updateUserRules, handleValidationErrors } from '../validators/user.validator.js';\n`;
      validateCreate = `createUserRules, handleValidationErrors, `;
      validateUpdate = `updateUserRules, handleValidationErrors, `;
    }
  }

  return `import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
${authImport}${validationImport}
const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// User Routes — /api/v1/users
// ─────────────────────────────────────────────────────────────────────────────

router.get('/',     ${guardStart}getAllUsers);
router.post('/',    ${guardStart}${validateCreate}createUser);
router.get('/:id',  ${guardStart}getUserById);
router.put('/:id',  ${guardStart}${validateUpdate}updateUser);
router.delete('/:id', ${adminGuard}deleteUser);

export default router;
`;
}

/** Generate src/routes/auth.route.js (JWT only) */
export function authRoute(options) {
  const { language, validation } = options;
  const isTS = language === 'typescript';
  const hasValidation = validation && validation !== 'none';

  let validationImport = '';
  let validateRegister = '';
  let validateLogin = '';

  if (hasValidation) {
    if (validation === 'zod' || validation === 'joi') {
      validationImport = `import { validate, createUserSchema, loginSchema } from '../validators/user.validator.js';\n`;
      validateRegister = `validate(createUserSchema), `;
      validateLogin = `validate(loginSchema), `;
    } else if (validation === 'express-validator') {
      validationImport = `import { createUserRules, loginRules, handleValidationErrors } from '../validators/user.validator.js';\n`;
      validateRegister = `createUserRules, handleValidationErrors, `;
      validateLogin = `loginRules, handleValidationErrors, `;
    }
  }

  return `import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
${validationImport}
const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Auth Routes — /api/v1/auth
// ─────────────────────────────────────────────────────────────────────────────

router.post('/register', authRateLimiter, ${validateRegister}register);
router.post('/login',    authRateLimiter, ${validateLogin}login);
router.post('/logout',   authenticate,   logout);
router.get('/me',        authenticate,   getMe);

export default router;
`;
}
