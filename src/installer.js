import { execa } from 'execa';
import { spinner, log } from './utils/logger.js';
import { getInstallCmd } from './utils/pkg.js';

// ─────────────────────────────────────────────────────────────────────────────
// Dependency Installer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Installs project dependencies in the generated project directory.
 * Uses the package manager chosen by the user.
 *
 * @param {string} projectDir   - Absolute path to the generated project
 * @param {string} packageManager - 'npm' | 'pnpm' | 'yarn' | 'bun'
 */
export async function installDependencies(projectDir, packageManager) {
  const { cmd, args } = getInstallCmd(packageManager);
  const spin = spinner(`Installing dependencies with ${packageManager}…`).start();

  try {
    await execa(cmd, args, {
      cwd: projectDir,
      // Pipe output so the spinner stays clean; errors are captured
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    spin.succeed(`Dependencies installed with ${packageManager}`);
  } catch (err) {
    spin.fail(`Dependency installation failed`);
    log.warn('You can install them manually:');
    log.dim(`  cd ${projectDir}`);
    log.dim(`  ${cmd} ${args.join(' ')}`);

    // Re-throw so the caller can decide whether to abort or continue
    throw new Error(`Installation failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Post-Install Steps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs `prisma generate` after installation for PostgreSQL projects.
 * @param {string} projectDir
 * @param {string} packageManager
 */
export async function runPrismaGenerate(projectDir, packageManager) {
  const spin = spinner('Running prisma generate…').start();

  try {
    const runner = packageManager === 'npm' ? 'npx' : packageManager;
    await execa(runner, ['prisma', 'generate'], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    spin.succeed('Prisma client generated');
  } catch {
    spin.warn('Could not auto-run prisma generate — run it manually:');
    log.dim('  npx prisma generate');
  }
}
