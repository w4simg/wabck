import path from 'path';
import { writeFile, createDir, pathExists, remove } from './utils/fs.js';
import { log, spinner } from './utils/logger.js';
import { buildPackageJson } from './utils/pkg.js';
import * as T from './templates/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Project Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates full project scaffolding:
 *   1. Validate that the target directory doesn't exist
 *   2. Create directory structure
 *   3. Generate all files from templates
 *
 * On any failure, rolls back all created directories/files.
 *
 * @param {object} options - Resolved user options from prompts
 * @returns {Promise<string>} - Absolute path to the created project
 */
export async function generate(options) {
  const { projectName, language, database, auth, validation, apiStyle, docker, swagger } = options;
  const isTS    = language === 'typescript';
  const ext     = isTS ? 'ts' : 'js';
  const hasDB   = database !== 'none';
  const hasAuth = auth !== 'none';
  const hasJwt  = auth === 'jwt';
  const isGql   = apiStyle === 'graphql';
  const hasValidation = validation && validation !== 'none';
  const hasSwagger    = swagger === true;

  const projectDir = path.resolve(process.cwd(), projectName);
  const createdDirs = [];

  // ── Pre-flight: check directory doesn't already exist ─────────────────────
  if (await pathExists(projectDir)) {
    throw new Error(
      `Directory "${projectName}" already exists.\n` +
      `  Please choose a different name or remove the existing directory.`
    );
  }

  // ── Step 1: Create directory skeleton ─────────────────────────────────────
  const dirSpin = spinner('Creating project structure…').start();

  try {
    const dirs = [
      '',                    // root
      'src',
      'src/config',
      'src/controllers',
      'src/routes',
      'src/middlewares',
      'src/services',
      'src/utils',
      'src/constants',
      'src/helpers',
    ];

    if (hasDB)          dirs.push('src/models');
    if (isTS)           dirs.push('src/types');
    if (isGql)          dirs.push('src/graphql');
    if (hasValidation)  dirs.push('src/validators');
    if (database === 'postgresql') dirs.push('prisma');

    for (const d of dirs) {
      const full = d ? path.join(projectDir, d) : projectDir;
      await createDir(full);
      createdDirs.push(full);
    }

    dirSpin.succeed('Project structure created');
  } catch (err) {
    dirSpin.fail('Failed to create directory structure');
    await rollback(createdDirs);
    throw err;
  }

  // ── Step 2: Write all files ────────────────────────────────────────────────
  const fileSpin = spinner('Writing files…').start();

  try {
    const write = async (relPath, content) =>
      writeFile(path.join(projectDir, relPath), content);

    // ── package.json ──────────────────────────────────────────────────────
    await write('package.json', JSON.stringify(buildPackageJson(options), null, 2));

    // ── Root config files ─────────────────────────────────────────────────
    await write('.env',              T.envFile(options));
    await write('.env.example',      T.envExample(options));
    await write('.gitignore',        T.gitignore());
    await write('.prettierrc',       T.prettierrc());
    await write('eslint.config.js',  T.eslintConfig(options));
    await write('README.md',         T.readme(options));
    if (hasSwagger) {
      await write('openapi.yaml',    T.swaggerYaml(options));
    }

    // ── TypeScript extras ─────────────────────────────────────────────────
    if (isTS) {
      await write('tsconfig.json',    T.tsconfig());
      await write(`src/types/index.ts`, T.tsTypes(options));
    }

    // ── Core application files ────────────────────────────────────────────
    await write(`src/app.${ext}`,    T.app(options));
    await write(`src/server.${ext}`, T.server(options));

    // ── Config ────────────────────────────────────────────────────────────
    await write(`src/config/db.${ext}`,  T.db(options));
    await write(`src/config/env.${ext}`, T.envConfig(options));
    if (hasSwagger) {
      await write(`src/config/swagger.${ext}`, T.swaggerConfig(options));
    }

    // ── Routes ────────────────────────────────────────────────────────────
    await write(`src/routes/index.${ext}`,        T.routesIndex(options));
    await write(`src/routes/health.route.${ext}`, T.healthRoute(options));
    await write(`src/routes/user.route.${ext}`,   T.userRoute(options));
    if (hasJwt) {
      await write(`src/routes/auth.route.${ext}`, T.authRoute(options));
    }

    // ── Controllers ───────────────────────────────────────────────────────
    await write(`src/controllers/user.controller.${ext}`, T.userController(options));

    // ── Models ────────────────────────────────────────────────────────────
    if (hasDB) {
      await write(`src/models/user.model.${ext}`, T.userModel(options));
    }
    if (database === 'postgresql') {
      await write('prisma/schema.prisma', T.prismaSchema(options));
    }

    // ── Middlewares ───────────────────────────────────────────────────────
    await write(`src/middlewares/error.middleware.${ext}`,       T.errorMiddleware(options));
    await write(`src/middlewares/notFound.middleware.${ext}`,    T.notFoundMiddleware(options));
    await write(`src/middlewares/rateLimiter.middleware.${ext}`, T.rateLimiterMiddleware(options));
    if (hasAuth) {
      await write(`src/middlewares/auth.middleware.${ext}`, T.authMiddleware(options));
    }

    // ── Services ──────────────────────────────────────────────────────────
    await write(`src/services/user.service.${ext}`, T.userService(options));

    // ── Utilities ─────────────────────────────────────────────────────────
    await write(`src/utils/asyncHandler.${ext}`, T.asyncHandler(options));
    await write(`src/utils/apiError.${ext}`,     T.apiError(options));
    await write(`src/utils/apiResponse.${ext}`,  T.apiResponse(options));

    // ── Validators ────────────────────────────────────────────────────────
    if (hasValidation) {
      await write(`src/validators/user.validator.${ext}`, T.userValidator(options));
    }

    // ── Constants ─────────────────────────────────────────────────────────
    await write(`src/constants/index.${ext}`, T.constants(options));

    // ── Helpers ───────────────────────────────────────────────────────────
    if (hasJwt) {
      await write(`src/helpers/token.helper.${ext}`, T.tokenHelper(options));
    }

    // ── GraphQL ───────────────────────────────────────────────────────────
    if (isGql) {
      await write(`src/graphql/schema.${ext}`,    T.graphqlSchema(options));
      await write(`src/graphql/resolvers.${ext}`, T.graphqlResolvers(options));
      await write(`src/graphql/server.${ext}`,    T.graphqlServer(options));
    }

    // ── Docker ────────────────────────────────────────────────────────────
    if (docker) {
      await write('Dockerfile',          T.dockerfile(options));
      await write('docker-compose.yml',  T.dockerCompose(options));
      await write('.dockerignore',       T.dockerignore());
    }

    fileSpin.succeed('Files written successfully');
    return projectDir;
  } catch (err) {
    fileSpin.fail('Failed to write project files');
    await rollback(createdDirs);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes all created directories in reverse order (deepest first).
 * Called when generation fails partway through.
 * @param {string[]} dirs - Array of absolute directory paths to remove
 */
async function rollback(dirs) {
  log.warn('Rolling back created files…');
  for (const d of [...dirs].reverse()) {
    try {
      await remove(d);
    } catch {
      // Silently continue — best-effort cleanup
    }
  }
  log.dim('  Cleanup complete.');
}
