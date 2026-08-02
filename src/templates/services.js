// ─────────────────────────────────────────────────────────────────────────────
// Service Templates — user.service.js
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/services/user.service.js */
export function userService(options) {
  const { database, auth, language } = options;
  const isTS = language === 'typescript';
  const hasDB = database !== 'none';

  // ── MongoDB ────────────────────────────────────────────────────────────────
  if (database === 'mongodb') {
    return `import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
${auth === 'jwt' ? "import { generateTokens } from '../helpers/token.helper.js';\n" : ''}
/**
 * User Service (MongoDB)
 *
 * Encapsulates all business logic related to users.
 * Controllers should call service methods and never directly touch models.
 */
export const UserService = {
  /** Retrieve all active users (passwords excluded) */
  async getAll()${isTS ? ': Promise<any[]>' : ''} {
    return User.find({ isActive: true }).select('-password').lean();
  },

  /** Retrieve a single user by ID */
  async getById(id${isTS ? ': string' : ''}) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  /** Create a new user */
  async create(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await User.findOne({ email: data.email });
    if (exists) throw new ApiError(409, 'A user with this email already exists');
    return User.create(data);
  },

  /** Update an existing user */
  async update(id${isTS ? ': string' : ''}, data${isTS ? ': Partial<{ name: string; email: string }>' : ''}) {
    const user = await User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  /** Soft-delete a user (sets isActive = false) */
  async remove(id${isTS ? ': string' : ''}) {
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) throw new ApiError(404, 'User not found');
    return { message: 'User deleted successfully' };
  },
${auth === 'jwt' ? `
  /** Register + issue tokens */
  async register(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await User.findOne({ email: data.email });
    if (exists) throw new ApiError(409, 'Email already in use');
    const user = await User.create(data);
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });
    return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens };
  },

  /** Login + issue tokens */
  async login(email${isTS ? ': string' : ''}, password${isTS ? ': string' : ''}) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid credentials');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });
    const { password: _pw, ...safeUser } = user.toObject();
    return { user: safeUser, ...tokens };
  },
` : ''}};
`;
  }

  // ── PostgreSQL / Prisma ────────────────────────────────────────────────────
  if (database === 'postgresql') {
    return `import { prisma } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import bcrypt from 'bcryptjs';
${auth === 'jwt' ? "import { generateTokens } from '../helpers/token.helper.js';\n" : ''}
export const UserService = {
  async getAll() {
    return prisma.user.findMany({
      where:  { isActive: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  },

  async getById(id${isTS ? ': string' : ''}) {
    const user = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  async create(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ApiError(409, 'A user with this email already exists');
    const password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { ...data, password } });
    const { password: _pw, ...safe } = user;
    return safe;
  },

  async update(id${isTS ? ': string' : ''}, data${isTS ? ': any' : ''}) {
    try {
      const user = await prisma.user.update({ where: { id }, data });
      const { password: _pw, ...safe } = user;
      return safe;
    } catch {
      throw new ApiError(404, 'User not found');
    }
  },

  async remove(id${isTS ? ': string' : ''}) {
    try {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      return { message: 'User deleted successfully' };
    } catch {
      throw new ApiError(404, 'User not found');
    }
  },
${auth === 'jwt' ? `
  async register(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ApiError(409, 'Email already in use');
    const password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { ...data, password } });
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },

  async login(email${isTS ? ': string' : ''}, password${isTS ? ': string' : ''}) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, 'Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },
` : ''}};
`;
  }

  // ── MySQL ──────────────────────────────────────────────────────────────────
  if (database === 'mysql' || database === 'sqlite') {
    const Model = 'UserModel';
    return `import { ${Model} } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
${auth === 'jwt' ? "import { generateTokens } from '../helpers/token.helper.js';\n" : ''}
export const UserService = {
  async getAll() {
    return ${Model}.findAll();
  },

  async getById(id${isTS ? ': number' : ''}) {
    const user = await ${Model}.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  async create(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await ${Model}.findByEmail(data.email);
    if (exists) throw new ApiError(409, 'A user with this email already exists');
    return ${Model}.create(data);
  },

  async update(id${isTS ? ': number' : ''}, data${isTS ? ': Record<string, any>' : ''}) {
    const user = await ${Model}.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return ${Model}.update(id, data);
  },

  async remove(id${isTS ? ': number' : ''}) {
    const user = await ${Model}.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    await ${Model}.delete(id);
    return { message: 'User deleted successfully' };
  },
${auth === 'jwt' ? `
  async register(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const exists = await ${Model}.findByEmail(data.email);
    if (exists) throw new ApiError(409, 'Email already in use');
    const user = await ${Model}.create(data);
    const tokens = generateTokens({ id: String(user.id), email: user.email, role: user.role });
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },

  async login(email${isTS ? ': string' : ''}, password${isTS ? ': string' : ''}) {
    const user = await ${Model}.findByEmail(email);
    if (!user) throw new ApiError(401, 'Invalid credentials');
    const isMatch = await ${Model}.comparePassword(password, user.password || '');
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');
    const tokens = generateTokens({ id: String(user.id), email: user.email, role: user.role });
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },
` : ''}};
`;
  }

  // ── No database ────────────────────────────────────────────────────────────
  return `import { ApiError } from '../utils/apiError.js';

/**
 * User Service — In-Memory Store
 *
 * No database is configured. Uses an in-memory array as a placeholder.
 * Replace with a real database integration before going to production.
 */

${isTS ? 'interface User { id: string; name: string; email: string; createdAt: string; }' : ''}

const users${isTS ? ': User[]' : ''} = [];
let nextId = 1;

export const UserService = {
  async getAll() { return users; },
  async getById(id${isTS ? ': string' : ''}) {
    const user = users.find((u) => u.id === id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },
  async create(data${isTS ? ': { name: string; email: string }' : ''}) {
    const user = { id: String(nextId++), ...data, createdAt: new Date().toISOString() };
    users.push(user);
    return user;
  },
  async update(id${isTS ? ': string' : ''}, data${isTS ? ': Partial<User>' : ''}) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new ApiError(404, 'User not found');
    users[idx] = { ...users[idx], ...data };
    return users[idx];
  },
  async remove(id${isTS ? ': string' : ''}) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new ApiError(404, 'User not found');
    users.splice(idx, 1);
    return { message: 'User deleted' };
  },
};
`;
}
