import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

// ─────────────────────────────────────────────────────────────────────────────
// Interactive CLI Prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the full interactive questionnaire and returns a resolved options object.
 * @param {string} [initialName] - Pre-filled project name from CLI argv
 * @returns {Promise<object>} options
 */
export async function runPrompts(initialName) {
  console.log(chalk.dim('  Answer a few questions to scaffold your project.\n'));

  // 1. Project Name
  const projectName = await input({
    message: 'Project name:',
    default: initialName || 'my-api',
    validate: (v) => {
      if (!v.trim()) return 'Project name cannot be empty.';
      if (!/^[a-z0-9-_]+$/i.test(v)) return 'Use only letters, numbers, hyphens or underscores.';
      return true;
    },
  });

  // 2. Language
  const language = await select({
    message: 'Language:',
    choices: [
      { name: `${chalk.yellow('JavaScript')} (ES Modules)`, value: 'javascript' },
      { name: `${chalk.blue('TypeScript')} (strict mode)`,  value: 'typescript' },
    ],
  });

  // 3. Package Manager
  const packageManager = await select({
    message: 'Package manager:',
    choices: [
      { name: `${chalk.red('npm')}`,   value: 'npm' },
      { name: `${chalk.yellow('pnpm')} (faster, disk-efficient)`, value: 'pnpm' },
      { name: `${chalk.blue('yarn')}`,  value: 'yarn' },
      { name: `${chalk.magenta('bun')} (fastest)`, value: 'bun' },
    ],
  });

  // 4. Database
  const database = await select({
    message: 'Database:',
    choices: [
      { name: `${chalk.green('MongoDB')}    — Mongoose ODM`,    value: 'mongodb'    },
      { name: `${chalk.blue('PostgreSQL')} — Prisma ORM`,       value: 'postgresql' },
      { name: `${chalk.cyan('MySQL')}       — mysql2 driver`,   value: 'mysql'      },
      { name: `${chalk.magenta('SQLite')}   — better-sqlite3`,  value: 'sqlite'     },
      { name: `${chalk.dim('None')}         — no database`,     value: 'none'       },
    ],
  });

  // 5. Authentication
  const auth = await select({
    message: 'Authentication:',
    choices: [
      { name: `${chalk.yellow('JWT')}      — jsonwebtoken + bcryptjs`, value: 'jwt'      },
      { name: `${chalk.blue('Clerk')}     — @clerk/express`,           value: 'clerk'    },
      { name: `${chalk.orange?.('Firebase') || chalk.red('Firebase')} — firebase-admin`, value: 'firebase' },
      { name: `${chalk.dim('None')}       — no auth`,                   value: 'none'     },
    ],
  });

  // 6. Validation
  const validation = await select({
    message: 'Validation library:',
    choices: [
      { name: `${chalk.blue('Zod')}               — TypeScript-first schema validation`, value: 'zod'              },
      { name: `${chalk.cyan('Joi')}               — the classic schema validator`,       value: 'joi'              },
      { name: `${chalk.green('Express Validator')} — middleware-based validation`,        value: 'express-validator' },
      { name: `${chalk.dim('None')}               — no validation library`,              value: 'none'             },
    ],
  });

  // 7. API Style
  const apiStyle = await select({
    message: 'API style:',
    choices: [
      { name: `${chalk.green('REST')}    — standard RESTful API`,   value: 'rest'    },
      { name: `${chalk.magenta('GraphQL')} — Apollo Server 4`,      value: 'graphql' },
    ],
  });

  // 8. Docker
  const docker = await confirm({
    message: 'Include Docker + docker-compose?',
    default: true,
  });

  // 9. Install Dependencies
  const installDeps = await confirm({
    message: `Install dependencies now with ${chalk.cyan(packageManager)}?`,
    default: true,
  });

  return {
    projectName: projectName.trim(),
    language,
    packageManager,
    database,
    auth,
    validation,
    apiStyle,
    docker,
    installDeps,
  };
}
