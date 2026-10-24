import { randomBytes } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Base Templates — app.js/ts, server.js/ts, and all root config files
// ─────────────────────────────────────────────────────────────────────────────

const ext = (isTS) => (isTS ? 'js' : 'js'); // ESM always uses .js imports

/** Generate src/app.js or src/app.ts */
export function app(options) {
  const { apiStyle, language, swagger } = options;
  const isTS = language === 'typescript';
  const hasSwagger = swagger === true;

  const typeImport = isTS ? `import { Application } from 'express';\n` : '';
  const appType    = isTS ? ': Application' : '';

  const graphqlBlock =
    apiStyle === 'graphql'
      ? `
// ─────────────────────────────────────────────────────────────────────────────
// GraphQL — Apollo Server 4 mounted on /graphql
// ─────────────────────────────────────────────────────────────────────────────
import { expressMiddleware } from '@as-integrations/express4';
import { createApolloServer } from './graphql/server.js';

const apolloServer = createApolloServer();
await apolloServer.start();
app.use('/graphql', expressMiddleware(apolloServer, {
  context: async ({ req }) => ({ req }),
}));
`
      : '';

  const swaggerImport = hasSwagger
    ? `import { setupSwagger } from './config/swagger.js';\n`
    : '';

  const swaggerMount = hasSwagger
    ? `\n// ─────────────────────────────────────────────────────────────────────────────\n// Swagger UI — available at /api-docs (development)\n// ─────────────────────────────────────────────────────────────────────────────\nif (process.env.NODE_ENV !== 'production') {\n  setupSwagger(app);\n}\n`
    : '';

  return `${typeImport}${swaggerImport}import express${isTS ? ', { Application }' : ''} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import routes from './routes/index.js';

const app${appType} = express();

// ─────────────────────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(rateLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// Logging & Compression
// ─────────────────────────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
${graphqlBlock}
// ─────────────────────────────────────────────────────────────────────────────
// API Routes — versioned under /api/v1
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);
${swaggerMount}
// ─────────────────────────────────────────────────────────────────────────────
// Error Handling — Order matters: 404 must come before the error handler
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
`;
}

/** Generate src/server.js or src/server.ts */
export function server(options) {
  const { database, language, projectName, swagger } = options;
  const isTS = language === 'typescript';
  const hasDB = database !== 'none';
  const hasSwagger = swagger === true;

  const dbImport = hasDB ? `import connectDB from './config/db.js';\n` : '';
  const dbConnect = hasDB ? `  await connectDB();\n` : '';
  const swaggerLog = hasSwagger
    ? `      console.log(\`  ➜  Docs:    http://localhost:\${PORT}/api-docs\`);\n      console.log(\`  ➜  OpenAPI: http://localhost:\${PORT}/api-docs.yaml (or openapi.yaml)\`);\n`
    : '';

  return `import 'dotenv/config';
import app from './app.js';
${dbImport}
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap — Connect to DB then start HTTP server
// ─────────────────────────────────────────────────────────────────────────────
const startServer = async ()${isTS ? ': Promise<void>' : ''} => {
  try {
${dbConnect}    const server = app.listen(PORT, HOST, () => {
      console.log(\`\`);
      console.log(\`  🚀 ${projectName} is running!\`);
      console.log(\`  ➜  Local:   http://localhost:\${PORT}\`);
      console.log(\`  ➜  Health:  http://localhost:\${PORT}/api/v1/health\`);
${swaggerLog}      console.log(\`\`);

    });

    // ── Graceful Shutdown ──────────────────────────────────────────────────
    const shutdown = (signal${isTS ? ': string' : ''}) => {
      console.log(\`\\n  Received \${signal}. Gracefully shutting down…\`);
      server.close(() => {
        console.log('  HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
`;
}

/** Generate .env */
export function envFile(options) {
  const { database, auth, projectName } = options;

  // Auto-generate a cryptographically secure JWT secret at scaffold time
  const jwtSecret = randomBytes(32).toString('hex');

  const dbVars = {
    mongodb:    'MONGODB_URI=mongodb://localhost:27017/${projectName}',
    postgresql: 'DATABASE_URL=postgresql://postgres:password@localhost:5432/${projectName}',
    mysql:      `DB_HOST=localhost\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=password\nDB_NAME=${projectName}`,
    sqlite:     `SQLITE_PATH=./database.sqlite`,
    none:       '',
  };

  const authVars = {
    jwt:      `\nJWT_SECRET=${jwtSecret}\nJWT_EXPIRES_IN=7d\nJWT_REFRESH_EXPIRES_IN=30d`,
    clerk:    `\nCLERK_SECRET_KEY=sk_test_your-clerk-secret-key`,
    firebase: `\nFIREBASE_PROJECT_ID=your-firebase-project-id\nFIREBASE_PRIVATE_KEY=your-firebase-private-key\nFIREBASE_CLIENT_EMAIL=your-firebase-client-email`,
    none:     '',
  };

  return `# ─────────────────────────────────────────────
# ${projectName} — Environment Variables
# ─────────────────────────────────────────────
# Copy this file to .env and fill in the values.
# JWT_SECRET below was auto-generated at scaffold time — keep it secret!

NODE_ENV=development
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=*

# Database
${(dbVars[database] || '').replace('${projectName}', projectName)}
${authVars[auth] || ''}
`;
}

/** Generate .env.example — safe to commit; uses a placeholder instead of the real secret */
export function envExample(options) {
  const { database, auth, projectName } = options;

  const dbVars = {
    mongodb:    `MONGODB_URI=mongodb://localhost:27017/${projectName}`,
    postgresql: `DATABASE_URL=postgresql://postgres:password@localhost:5432/${projectName}`,
    mysql:      `DB_HOST=localhost\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=password\nDB_NAME=${projectName}`,
    sqlite:     `SQLITE_PATH=./database.sqlite`,
    none:       '',
  };

  const authVars = {
    jwt:      `\nJWT_SECRET=change-me-generate-with-openssl-rand-hex-32\nJWT_EXPIRES_IN=7d\nJWT_REFRESH_EXPIRES_IN=30d`,
    clerk:    `\nCLERK_SECRET_KEY=sk_test_your-clerk-secret-key`,
    firebase: `\nFIREBASE_PROJECT_ID=your-firebase-project-id\nFIREBASE_PRIVATE_KEY=your-firebase-private-key\nFIREBASE_CLIENT_EMAIL=your-firebase-client-email`,
    none:     '',
  };

  return `# ─────────────────────────────────────────────
# ${projectName} — Environment Variables (EXAMPLE)
# ─────────────────────────────────────────────
# This file is safe to commit. Copy to .env and replace placeholder values.
# Your actual .env already has a generated JWT_SECRET.

NODE_ENV=development
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=*

# Database
${(dbVars[database] || '').replace('${projectName}', projectName)}
${authVars[auth] || ''}
`;
}

/** Generate .gitignore for the generated project */
export function gitignore() {
  return `# ─── Dependencies ──────────────────────────────
node_modules/
.pnp
.pnp.js

# ─── Build Outputs ──────────────────────────────
dist/
build/
*.tsbuildinfo

# ─── Environment Variables ──────────────────────
.env
.env.local
.env.*.local
# .env.example is safe to commit

# ─── Logs ───────────────────────────────────────
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# ─── OS / Editor ────────────────────────────────
.DS_Store
Thumbs.db
.idea/
.vscode/

# ─── Database ───────────────────────────────────
*.sqlite
*.sqlite3
database.sqlite

# ─── Testing ────────────────────────────────────
coverage/
`;
}

/** Generate .prettierrc */
export function prettierrc() {
  return JSON.stringify(
    {
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      bracketSpacing: true,
      arrowParens: 'always',
    },
    null,
    2
  );
}

/** Generate eslint.config.js */
export function eslintConfig(options) {
  const isTS = options.language === 'typescript';
  return `import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
];
`;
}

/** Generate README.md */
export function readme(options) {
  const { projectName, language, database, auth, validation, apiStyle, docker, swagger, packageManager } = options;
  const isTS = language === 'typescript';
  const pm = packageManager;

  return `# ${projectName}

> Production-ready Express.js API — scaffolded by [wabck](https://github.com/wabck/wabck)

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
${pm} ${pm === 'yarn' ? '' : 'install'}

# Copy environment variables
cp .env.example .env

# Start development server
${pm} run dev
\`\`\`

The API will be available at **http://localhost:5000**
${swagger ? `\n📖 **API Documentation:**
- **Swagger UI:** http://localhost:5000/api-docs
- **OpenAPI 3.0 YAML:** \`openapi.yaml\` or http://localhost:5000/api-docs.yaml
- **OpenAPI 3.0 JSON:** http://localhost:5000/api-docs.json\n` : ''}
## 📁 Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── config/          # DB connection, env validation${swagger ? ', swagger' : ''}
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Error, auth, rate-limiter
│   ├── models/          # Data models
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # asyncHandler, ApiError, ApiResponse
${validation !== 'none' ? `│   ├── validators/      # Input validation\n` : ''}│   ├── helpers/         # Token, etc.
│   ├── constants/       # App-wide constants
│   ├── app.${isTS ? 'ts' : 'js'}           # Express app
│   └── server.${isTS ? 'ts' : 'js'}        # Entry point
${swagger ? '├── openapi.yaml       # OpenAPI 3.0 specification (YAML)\n' : ''}├── .env.example
├── .prettierrc
└── eslint.config.js
\`\`\`

## 🛠 Stack

| Feature       | Choice                    |
|---------------|---------------------------|
| Language      | ${isTS ? 'TypeScript' : 'JavaScript (ES Modules)'} |
| Database      | ${database === 'none' ? '—' : database}             |
| Auth          | ${auth === 'none' ? '—' : auth}                     |
${validation !== 'none' ? `| Validation    | ${validation}                                        |\n` : ''}| API Style     | ${apiStyle === 'graphql' ? 'GraphQL (Apollo Server 4)' : 'REST'} |
${swagger ? '| API Docs      | ✔ Swagger / OpenAPI 3.0 (/api-docs + openapi.yaml)  |\n' : ''}| Docker        | ${docker ? '✔ Dockerfile + docker-compose' : '—'}   |

## 🔗 Endpoints

| Method | Path               | Description        |
|--------|--------------------|--------------------|
| GET    | \`/\`              | Root health ping   |
| GET    | \`/api/v1/health\` | Detailed health    |
| GET    | \`/api/v1/users\`  | List users         |
| POST   | \`/api/v1/users\`  | Create user        |
| GET    | \`/api/v1/users/:id\` | Get user by ID  |
| PUT    | \`/api/v1/users/:id\` | Update user     |
| DELETE | \`/api/v1/users/:id\` | Delete user     |
${auth === 'jwt' ? `| POST   | \`/api/v1/auth/register\` | Register    |\n| POST   | \`/api/v1/auth/login\` | Login           |` : ''}
${swagger ? `| GET    | \`/api-docs\`      | Swagger UI (interactive) |\n| GET    | \`/api-docs.yaml\` | OpenAPI 3.0 YAML spec    |\n| GET    | \`/api-docs.json\` | OpenAPI 3.0 JSON spec    |\n` : ''}
${docker ? `## 🐳 Docker\n\n\`\`\`bash\ndocker compose up --build\n\`\`\`\n` : ''}
${isTS ? `## 🏗 Build\n\n\`\`\`bash\n${pm} run build\n${pm} start\n\`\`\`\n` : ''}
## 📜 License

MIT
`;
}
