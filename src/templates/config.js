// ─────────────────────────────────────────────────────────────────────────────
// Config Templates — db.js, env.js, swagger.js
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/config/db.js or db.ts */
export function db(options) {
  const { database, language } = options;
  const isTS = language === 'typescript';

  switch (database) {
    // ── MongoDB / Mongoose ──────────────────────────────────────────────────
    case 'mongodb':
      return `import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Uses DATABASE_URL (or MONGODB_URI) from environment variables.
 * Exits the process if the connection fails.
 */
const connectDB = async ()${isTS ? ': Promise<void>' : ''} => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');

    const conn = await mongoose.connect(uri, {
      // Mongoose 7+ uses the new connection engine by default
    });

    console.log(\`✔ MongoDB connected: \${conn.connection.host}\`);

    // ── Mongoose connection events ────────────────────────────────────────
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error${isTS ? ' as Error' : ''}.message || error);
    process.exit(1);
  }
};

export default connectDB;
`;

    // ── PostgreSQL / Prisma ─────────────────────────────────────────────────
    case 'postgresql':
      return `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis${isTS ? ' as unknown as { prisma: PrismaClient }' : ''};

/**
 * PrismaClient singleton — prevents multiple instances in development
 * due to hot-reloading (Next.js pattern, works for Node as well).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Establishes a connection to PostgreSQL via Prisma.
 * Exits the process if the connection fails.
 */
const connectDB = async ()${isTS ? ': Promise<void>' : ''} => {
  try {
    await prisma.$connect();
    console.log('✔ PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error${isTS ? ' as Error' : ''}.message || error);
    process.exit(1);
  }
};

export default connectDB;
`;

    // ── MySQL / mysql2 ──────────────────────────────────────────────────────
    case 'mysql':
      return `import mysql from 'mysql2/promise';

let pool${isTS ? ': mysql.Pool' : ''};

/**
 * Creates a mysql2 connection pool and verifies connectivity.
 * Pool is exported for use across the application.
 */
const connectDB = async ()${isTS ? ': Promise<void>' : ''} => {
  try {
    pool = mysql.createPool({
      host:             process.env.DB_HOST     || 'localhost',
      port:             Number(process.env.DB_PORT) || 3306,
      user:             process.env.DB_USER     || 'root',
      password:         process.env.DB_PASSWORD || '',
      database:         process.env.DB_NAME     || 'mydb',
      waitForConnections: true,
      connectionLimit:  10,
      queueLimit:       0,
    });

    // Verify the connection
    await pool.query('SELECT 1');
    console.log(\`✔ MySQL connected — db: \${process.env.DB_NAME || 'mydb'}\`);
  } catch (error) {
    console.error('MySQL connection failed:', error${isTS ? ' as Error' : ''}.message || error);
    process.exit(1);
  }
};

export { pool };
export default connectDB;
`;

    // ── SQLite / better-sqlite3 ─────────────────────────────────────────────
    case 'sqlite':
      return `import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let db${isTS ? ': Database.Database' : ''};

/**
 * Opens the SQLite database file and runs a quick smoke test.
 * better-sqlite3 is synchronous — no await needed for queries.
 */
const connectDB = async ()${isTS ? ': Promise<void>' : ''} => {
  try {
    const dbPath = process.env.SQLITE_PATH
      ? path.resolve(process.env.SQLITE_PATH)
      : path.join(__dirname, '..', '..', 'database.sqlite');

    db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');

    // Smoke-test the connection
    db.prepare('SELECT 1').get();
    console.log(\`✔ SQLite connected — \${dbPath}\`);
  } catch (error) {
    console.error('SQLite connection failed:', error${isTS ? ' as Error' : ''}.message || error);
    process.exit(1);
  }
};

export { db };
export default connectDB;
`;

    default:
      return `// No database selected — this file is intentionally empty.\n`;
  }
}

/** Generate src/config/env.js — validates required environment variables */
export function envConfig(options) {
  const { database, auth, language } = options;
  const isTS = language === 'typescript';

  const requiredVars = [`'PORT'`, `'NODE_ENV'`];
  if (database === 'mongodb')    requiredVars.push(`'MONGODB_URI'`);
  if (database === 'postgresql') requiredVars.push(`'DATABASE_URL'`);
  if (database === 'mysql') {
    requiredVars.push(`'DB_HOST'`, `'DB_USER'`, `'DB_NAME'`);
  }
  if (auth === 'jwt')      requiredVars.push(`'JWT_SECRET'`);
  if (auth === 'clerk')    requiredVars.push(`'CLERK_SECRET_KEY'`);
  if (auth === 'firebase') requiredVars.push(`'FIREBASE_PROJECT_ID'`, `'FIREBASE_PRIVATE_KEY'`, `'FIREBASE_CLIENT_EMAIL'`);

  return `/**
 * Environment Configuration & Validation
 *
 * Validates that all required environment variables are present at startup.
 * Import this module early (before any DB or server init).
 */

const REQUIRED_VARS = [${requiredVars.join(', ')}];

/**
 * Validates environment variables and exits if any are missing.
 */
export function validateEnv()${isTS ? ': void' : ''} {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\\n  Missing required environment variables:');
    missing.forEach((key) => console.error(\`  ✖ \${key}\`));
    console.error('\\n  Check your .env file.\\n');
    process.exit(1);
  }
}

/**
 * Typed environment config object for convenient access.
 */
export const config = {
  port:     Number(process.env.PORT) || 5000,
  host:     process.env.HOST || '0.0.0.0',
  nodeEnv:  process.env.NODE_ENV || 'development',
  isProd:   process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
${database === 'mongodb'    ? "  mongoUri: process.env.MONGODB_URI || '',\n" : ''}${database === 'postgresql' ? "  databaseUrl: process.env.DATABASE_URL || '',\n" : ''}${auth === 'jwt' ? "  jwtSecret: process.env.JWT_SECRET || '',\n  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',\n" : ''}};
`;
}

/** Generate src/config/swagger.js */
export function swagger(options) {
  const { projectName, language } = options;
  const isTS = language === 'typescript';

  return `import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Read version from package.json
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'));
  version = pkg.version;
} catch { /* use default */ }

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       '${projectName} API',
      version,
      description: 'Auto-generated API documentation for ${projectName}',
      license: { name: 'MIT' },
      contact:     { name: '${projectName} Support' },
    },
    servers: [
      { url: \`http://localhost:\${process.env.PORT || 5000}/api/v1\`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:   'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Pick up JSDoc @swagger annotations from all route files
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
`;
}
