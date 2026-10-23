// ─────────────────────────────────────────────────────────────────────────────
// package.json Builder for the Generated Project
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a complete package.json object based on the user's selections.
 * @param {object} options - Options from the CLI prompts
 * @returns {object} - Parsed package.json content
 */
export function buildPackageJson(options) {
  const { projectName, language, database, auth, validation, apiStyle } = options;
  const isTS = language === 'typescript';

  // ── Scripts ────────────────────────────────────────────────────────────────
  const scripts = isTS
    ? {
        dev:        'tsx watch src/server.ts',
        build:      'tsc --outDir dist',
        start:      'node dist/server.js',
        lint:       'eslint src --ext .ts',
        'lint:fix': 'eslint src --ext .ts --fix',
        'type-check': 'tsc --noEmit',
      }
    : {
        dev:        'nodemon src/server.js',
        start:      'node src/server.js',
        lint:       'eslint src',
        'lint:fix': 'eslint src --fix',
      };

  // ── Core Dependencies (always included) ────────────────────────────────────
  const dependencies = {
    express:              '^4.19.2',
    dotenv:               '^16.4.5',
    cors:                 '^2.8.5',
    helmet:               '^7.1.0',
    compression:          '^1.7.4',
    morgan:               '^1.10.0',
    'cookie-parser':      '^1.4.6',
    'express-rate-limit': '^7.3.1',
  };

  // ── Dev Dependencies ───────────────────────────────────────────────────────
  const devDependencies = {
    eslint:                   '^9.6.0',
    '@eslint/js':             '^9.6.0',
    prettier:                 '^3.3.2',
    'eslint-config-prettier': '^9.1.0',
    'eslint-plugin-prettier': '^5.1.3',
  };

  if (isTS) {
    Object.assign(devDependencies, {
      typescript:             '^5.4.5',
      tsx:                    '^4.15.7',
      '@types/express':       '^4.17.21',
      '@types/node':          '^20.14.9',
      '@types/cors':          '^2.8.17',
      '@types/morgan':        '^1.9.9',
      '@types/compression':   '^1.7.5',
      '@types/cookie-parser': '^1.4.7',
    });
  } else {
    devDependencies.nodemon = '^3.1.4';
  }

  // ── Database ───────────────────────────────────────────────────────────────
  switch (database) {
    case 'mongodb':
      dependencies.mongoose = '^8.4.4';
      break;
    case 'postgresql':
      dependencies['@prisma/client'] = '^5.16.1';
      devDependencies.prisma         = '^5.16.1';
      break;
    case 'mysql':
      dependencies.mysql2 = '^3.10.1';
      break;
    case 'sqlite':
      dependencies['better-sqlite3'] = '^9.6.0';
      if (isTS) devDependencies['@types/better-sqlite3'] = '^7.6.11';
      break;
    // 'none' → no extra dependency
  }

  // ── Authentication ─────────────────────────────────────────────────────────
  switch (auth) {
    case 'jwt':
      dependencies.jsonwebtoken = '^9.0.2';
      dependencies.bcryptjs     = '^2.4.3';
      if (isTS) {
        devDependencies['@types/jsonwebtoken'] = '^9.0.6';
        devDependencies['@types/bcryptjs']     = '^2.4.6';
      }
      break;
    case 'clerk':
      dependencies['@clerk/express'] = '^1.1.2';
      break;
    case 'firebase':
      dependencies['firebase-admin'] = '^12.2.0';
      break;
    // 'none' → no extra dependency
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  switch (validation) {
    case 'zod':
      dependencies.zod = '^3.23.8';
      break;
    case 'joi':
      dependencies.joi = '^17.13.1';
      break;
    case 'express-validator':
      dependencies['express-validator'] = '^7.1.0';
      break;
  }

  // ── API Style ──────────────────────────────────────────────────────────────
  if (apiStyle === 'graphql') {
    dependencies['@apollo/server']            = '^4.10.5';
    dependencies['graphql']                   = '^16.9.0';
    dependencies['@as-integrations/express4'] = '^1.0.0';
  }

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  if (options.swagger) {
    dependencies['swagger-jsdoc']     = '^6.2.8';
    dependencies['swagger-ui-express'] = '^5.0.1';
    if (isTS) devDependencies['@types/swagger-ui-express'] = '^4.1.6';
  }


  return {
    name:        projectName,
    version:     '1.0.0',
    description: `${projectName} — Production-ready Express.js API`,
    type:        'module',
    main:        isTS ? 'dist/server.js' : 'src/server.js',
    scripts,
    dependencies,
    devDependencies,
    engines:     { node: '>=18.0.0' },
    keywords:    ['express', 'api', 'backend', 'nodejs'],
    author:      '',
    license:     'MIT',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Install Command Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the install command args for the chosen package manager.
 * @param {'npm'|'pnpm'|'yarn'|'bun'} pm - Package manager
 * @returns {{ cmd: string, args: string[] }}
 */
export function getInstallCmd(pm) {
  const map = {
    npm:  { cmd: 'npm',  args: ['install'] },
    pnpm: { cmd: 'pnpm', args: ['install'] },
    yarn: { cmd: 'yarn', args: [] },
    bun:  { cmd: 'bun',  args: ['install'] },
  };
  return map[pm] ?? map.npm;
}
