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
  const { language, database, projectName, swagger } = options;
  const isTS = language === 'typescript';

  const typeImports = isTS ? `import { Request, Response } from 'express';\n` : '';

  const swaggerDoc = swagger
    ? `/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check & uptime
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service metrics, uptime, version, and memory usage
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 uptime: { type: integer, example: 120 }
 *                 version: { type: string, example: 1.0.0 }
 *                 env: { type: string, example: development }
 *                 timestamp: { type: string, example: "2026-01-01T00:00:00.000Z" }
 */
`
    : `/**
 * GET /api/v1/health
 *
 * Returns the current health status of the API including uptime,
 * version, environment, and timestamp.
 */
`;

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

${swaggerDoc}router.get('/', (_req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
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
  const { auth, language, validation, swagger } = options;
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

  const swaggerDoc = swagger
    ? `/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string, example: "Alex Smith" }
 *               email: { type: string, example: "alex@example.com" }
 *               password: { type: string, example: "SecurePass123!" }
 *     responses:
 *       201:
 *         description: User created
 *
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
`
    : '';

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
${swaggerDoc}
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
  const { language, validation, swagger } = options;
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

  const swaggerDoc = swagger
    ? `/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Jane Doe" }
 *               email: { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "Secret123!" }
 *     responses:
 *       201:
 *         description: Registered successfully
 *
 * /auth/login:
 *   post:
 *     summary: Authenticate user & get JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "Secret123!" }
 *     responses:
 *       200:
 *         description: Login successful
 *
 * /auth/logout:
 *   post:
 *     summary: Invalidate user session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *
 * /auth/me:
 *   get:
 *     summary: Get profile of logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */
`
    : '';

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
${swaggerDoc}
router.post('/register', authRateLimiter, ${validateRegister}register);
router.post('/login',    authRateLimiter, ${validateLogin}login);
router.post('/logout',   authenticate,   logout);
router.get('/me',        authenticate,   getMe);

export default router;
`;
}
