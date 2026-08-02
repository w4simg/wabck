// ─────────────────────────────────────────────────────────────────────────────
// Model Templates — user.model.js for each database
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/models/user.model.js */
export function userModel(options) {
  const { database, language } = options;
  const isTS = language === 'typescript';

  switch (database) {
    // ── MongoDB / Mongoose ──────────────────────────────────────────────────
    case 'mongodb':
      return `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

${isTS ? `
export interface IUser extends mongoose.Document {
  name:      string;
  email:     string;
  password:  string;
  role:      'user' | 'admin';
  isActive:  boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
` : ''}
const userSchema = new mongoose.Schema${isTS ? '<IUser>' : ''}(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\\S+@\\S+\\.\\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Never return password in queries by default
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Pre-save hook — hash password before saving ────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method — compare plain text password with hash ───────────────
userSchema.methods.comparePassword = async function (
  candidatePassword${isTS ? ': string' : ''}
)${isTS ? ': Promise<boolean>' : ''} {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model${isTS ? '<IUser>' : ''}('User', userSchema);
`;

    // ── PostgreSQL / Prisma ─────────────────────────────────────────────────
    case 'postgresql':
      // Prisma uses a schema.prisma file — this is the User service stub
      return `/**
 * User Model — PostgreSQL (Prisma)
 *
 * The actual schema is defined in prisma/schema.prisma.
 * This file re-exports the Prisma client and provides a typed User type.
 */
export { prisma } from '../config/db.js';

${isTS ? `
import type { User } from '@prisma/client';
export type { User };
export type CreateUserInput = Pick<User, 'name' | 'email'> & { password: string };
export type UpdateUserInput = Partial<Pick<User, 'name' | 'email' | 'role' | 'isActive'>>;
` : ''}
`;

    // ── MySQL / mysql2 ──────────────────────────────────────────────────────
    case 'mysql':
      return `import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

${isTS ? `
export interface User {
  id:        number;
  name:      string;
  email:     string;
  password?: string;
  role:      string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
` : ''}
/**
 * User Model (MySQL)
 *
 * Provides CRUD operations wrapping raw mysql2 queries.
 * Creates the users table if it does not exist.
 */
export const UserModel = {
  /** Ensure the users table exists */
  async initialize()${isTS ? ': Promise<void>' : ''} {
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(255)  NOT NULL UNIQUE,
        password   VARCHAR(255)  NOT NULL,
        role       ENUM('user','admin') DEFAULT 'user',
        is_active  BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    \`);
  },

  async findAll()${isTS ? ': Promise<User[]>' : ''} {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE is_active = 1'
    );
    return rows${isTS ? ' as User[]' : ''};
  },

  async findById(id${isTS ? ': number' : ''})${isTS ? ': Promise<User | null>' : ''} {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    const users = rows${isTS ? ' as User[]' : ''};
    return users[0] || null;
  },

  async findByEmail(email${isTS ? ': string' : ''})${isTS ? ': Promise<User | null>' : ''} {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows${isTS ? ' as User[]' : ''};
    return users[0] || null;
  },

  async create(data${isTS ? ': { name: string; email: string; password: string }' : ''})${isTS ? ': Promise<User>' : ''} {
    const hashed = await bcrypt.hash(data.password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [data.name, data.email, hashed]
    );
    const insertResult = result${isTS ? ' as any' : ''};
    return this.findById(insertResult.insertId)${isTS ? ' as Promise<User>' : ''};
  },

  async update(id${isTS ? ': number' : ''}, data${isTS ? ': Partial<User>' : ''})${isTS ? ': Promise<User | null>' : ''} {
    const fields = Object.keys(data).map((k) => \`\${k} = ?\`).join(', ');
    await pool.query(\`UPDATE users SET \${fields} WHERE id = ?\`, [...Object.values(data), id]);
    return this.findById(id);
  },

  async delete(id${isTS ? ': number' : ''})${isTS ? ': Promise<void>' : ''} {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },

  async comparePassword(plain${isTS ? ': string' : ''}, hashed${isTS ? ': string' : ''})${isTS ? ': Promise<boolean>' : ''} {
    return bcrypt.compare(plain, hashed);
  },
};
`;

    // ── SQLite / better-sqlite3 ─────────────────────────────────────────────
    case 'sqlite':
      return `import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

${isTS ? `
export interface User {
  id:         number;
  name:       string;
  email:      string;
  password?:  string;
  role:       string;
  is_active:  number; // SQLite uses 0/1 for booleans
  created_at: string;
  updated_at: string;
}
` : ''}
/**
 * User Model (SQLite)
 *
 * better-sqlite3 is fully synchronous — no async/await for queries.
 * Initialize() should be called once at startup.
 */
export const UserModel = {
  initialize()${isTS ? ': void' : ''} {
    db.exec(\`
      CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL UNIQUE,
        password   TEXT NOT NULL,
        role       TEXT DEFAULT 'user',
        is_active  INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    \`);
  },

  findAll()${isTS ? ': User[]' : ''} {
    return db.prepare(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE is_active = 1'
    ).all()${isTS ? ' as User[]' : ''};
  },

  findById(id${isTS ? ': number' : ''})${isTS ? ': User | undefined' : ''} {
    return db.prepare(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?'
    ).get(id)${isTS ? ' as User | undefined' : ''};
  },

  findByEmail(email${isTS ? ': string' : ''})${isTS ? ': User | undefined' : ''} {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email)${isTS ? ' as User | undefined' : ''};
  },

  async create(data${isTS ? ': { name: string; email: string; password: string }' : ''}) {
    const hashed = await bcrypt.hash(data.password, 12);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const info = stmt.run(data.name, data.email, hashed);
    return this.findById(info.lastInsertRowid${isTS ? ' as number' : ''});
  },

  update(id${isTS ? ': number' : ''}, data${isTS ? ': Partial<User>' : ''}) {
    const fields = Object.keys(data).map((k) => \`\${k} = ?\`).join(', ');
    db.prepare(\`UPDATE users SET \${fields}, updated_at = datetime('now') WHERE id = ?\`).run(
      ...Object.values(data), id
    );
    return this.findById(id);
  },

  delete(id${isTS ? ': number' : ''})${isTS ? ': void' : ''} {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  async comparePassword(plain${isTS ? ': string' : ''}, hashed${isTS ? ': string' : ''})${isTS ? ': Promise<boolean>' : ''} {
    return bcrypt.compare(plain, hashed);
  },
};
`;

    default:
      return `// No database selected — no user model generated.\n`;
  }
}

/** Generate prisma/schema.prisma */
export function prismaSchema(options) {
  const { projectName } = options;
  return `// Prisma Schema for ${projectName}
// Run: npx prisma migrate dev --name init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

enum Role {
  USER
  ADMIN
}
`;
}
