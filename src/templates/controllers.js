// ─────────────────────────────────────────────────────────────────────────────
// Controller Templates — user.controller.js
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/controllers/user.controller.js */
export function userController(options) {
  const { auth, language } = options;
  const isTS = language === 'typescript';
  const hasJwt = auth === 'jwt';

  const typeImports = isTS
    ? `import { Request, Response } from 'express';\n`
    : '';

  return `${typeImports}import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { UserService } from '../services/user.service.js';
// ─────────────────────────────────────────────────────────────────────────────
// User CRUD Controllers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/users — List all users */
export const getAllUsers = asyncHandler(async (_req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const users = await UserService.getAll();
  res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
});

/** GET /api/v1/users/:id — Get user by ID */
export const getUserById = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const user = await UserService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

/** POST /api/v1/users — Create a new user */
export const createUser = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const user = await UserService.create(req.body);
  res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

/** PUT /api/v1/users/:id — Update a user */
export const updateUser = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const user = await UserService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

/** DELETE /api/v1/users/:id — Delete a user */
export const deleteUser = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const result = await UserService.remove(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'User deleted successfully'));
});
${hasJwt ? `
// ─────────────────────────────────────────────────────────────────────────────
// Auth Controllers
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register */
export const register = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const result = await UserService.register(req.body);
  res
    .status(201)
    .cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
    })
    .json(new ApiResponse(201, result, 'Registration successful'));
});

/** POST /api/v1/auth/login */
export const login = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const { email, password } = req.body;
  const result = await UserService.login(email, password);
  res
    .status(200)
    .cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
    })
    .json(new ApiResponse(200, result, 'Login successful'));
});

/** POST /api/v1/auth/logout */
export const logout = asyncHandler(async (_req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  res
    .clearCookie('refreshToken')
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

/** GET /api/v1/auth/me — Get current authenticated user */
export const getMe = asyncHandler(async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  const user = await UserService.getById((req${isTS ? ' as any' : ''}).user.id);
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched'));
});
` : ''}`;
}
