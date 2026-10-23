#!/usr/bin/env node

import process from 'process';
import path from 'path';
import chalk from 'chalk';
import { renderBanner, log, box } from './utils/logger.js';
import { runPrompts } from './prompts.js';
import { generate } from './generator.js';
import { installDependencies, runPrismaGenerate } from './installer.js';

// ─────────────────────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. Banner ──────────────────────────────────────────────────────────────
  await renderBanner();

  // ── 2. Parse argv (optional pre-fill for project name) ────────────────────
  const argName = process.argv[2];

  // ── 3. Interactive prompts ─────────────────────────────────────────────────
  let options;
  try {
    options = await runPrompts(argName);
  } catch (err) {
    // User pressed Ctrl+C or similar
    if (err?.name === 'ExitPromptError' || err?.message?.includes('User force closed')) {
      log.blank();
      log.warn('Scaffold cancelled.');
      process.exit(0);
    }
    throw err;
  }

  log.blank();

  // ── 4. Generate project files ──────────────────────────────────────────────
  let projectDir;
  try {
    projectDir = await generate(options);
  } catch (err) {
    log.blank();
    log.error(`Generation failed: ${err.message}`);
    process.exit(1);
  }

  // ── 5. Install dependencies ────────────────────────────────────────────────
  if (options.installDeps) {
    try {
      await installDependencies(projectDir, options.packageManager);

      // Run prisma generate after install for PostgreSQL projects
      if (options.database === 'postgresql') {
        await runPrismaGenerate(projectDir, options.packageManager);
      }
    } catch {
      // Installation failure is non-fatal — project files are still valid
      log.blank();
      log.warn('Dependencies were not installed automatically. Install them manually:');
      log.dim(`  cd ${options.projectName}`);
      log.dim(`  ${options.packageManager} ${options.packageManager === 'yarn' ? '' : 'install'}`);
    }
  }

  // ── 6. Success summary ─────────────────────────────────────────────────────
  log.blank();
  printSuccessSummary(options, projectDir);
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Summary
// ─────────────────────────────────────────────────────────────────────────────

function printSuccessSummary(options, projectDir) {
  const { projectName, language, database, auth, validation, docker, swagger, packageManager, installDeps } = options;
  const pm      = packageManager;
  const relDir  = path.relative(process.cwd(), projectDir) || projectName;
  const devCmd  = `${pm} run dev`;

  // Progress recap
  log.success('Project scaffolded successfully!');
  log.blank();
  log.label('  Language',   language === 'typescript' ? 'TypeScript' : 'JavaScript');
  log.label('  Database',   database === 'none' ? 'None' : database);
  log.label('  Auth',       auth === 'none' ? 'None' : auth);
  if (validation && validation !== 'none') log.label('  Validation', validation);
  if (swagger)  log.label('  API Docs',   'Swagger UI → /api-docs');
  if (docker)   log.label('  Docker',     'Dockerfile + docker-compose.yml');
  log.blank();

  // Next steps
  const steps = [];
  steps.push(`cd ${relDir}`);
  if (!installDeps) steps.push(`${pm}${pm === 'yarn' ? '' : ' install'}`);
  steps.push('cp .env.example .env');
  if (database === 'postgresql') steps.push('npx prisma migrate dev --name init');
  steps.push(devCmd);

  const stepsStr = steps.map((s, i) => `  ${chalk.dim(`${i + 1}.`)} ${chalk.cyan(s)}`).join('\n');

  console.log(
    box(
      chalk.bold.white('🚀 Next steps:\n\n') + stepsStr + '\n\n' +
      chalk.dim('  API: ') + chalk.white('http://localhost:5000/api/v1/health'),
      { borderColor: 'green', title: chalk.green('Ready!'), titleAlignment: 'center' }
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(chalk.red('\n  Fatal error:'), err.message || err);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
