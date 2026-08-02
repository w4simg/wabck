import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import figlet from 'figlet';

/** Promisify figlet manually to avoid DEP0174 warning */
const figletAsync = (text, opts) =>
  new Promise((resolve, reject) => {
    figlet.text(text, opts, (err, data) => (err ? reject(err) : resolve(data)));
  });

// ─────────────────────────────────────────────────────────────────────────────
// Colorized Logger
// ─────────────────────────────────────────────────────────────────────────────

export const log = {
  info:    (msg) => console.log(chalk.cyan('ℹ ') + chalk.white(msg)),
  success: (msg) => console.log(chalk.green('✔ ') + chalk.green(msg)),
  error:   (msg) => console.log(chalk.red('✖ ')  + chalk.red(msg)),
  warn:    (msg) => console.log(chalk.yellow('⚠ ') + chalk.yellow(msg)),
  step:    (msg) => console.log(chalk.blue('→ ')  + chalk.white(msg)),
  dim:     (msg) => console.log(chalk.dim(msg)),
  label:   (label, value) => console.log(chalk.cyan(`  ${label}: `) + chalk.white(value)),
  blank:   ()    => console.log(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Spinner Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a pre-configured ora spinner.
 * @param {string} text - Initial spinner text
 * @returns {import('ora').Ora}
 */
export const spinner = (text) =>
  ora({
    text: chalk.cyan(text),
    color: 'cyan',
    spinner: 'dots',
  });

// ─────────────────────────────────────────────────────────────────────────────
// Boxen Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps content in a styled boxen box.
 * @param {string} content
 * @param {import('boxen').Options} opts
 */
export const box = (content, opts = {}) =>
  boxen(content, {
    padding: 1,
    margin: { top: 0, bottom: 1, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: 'cyan',
    ...opts,
  });

// ─────────────────────────────────────────────────────────────────────────────
// ASCII Art Banner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders the WABCK banner with gradient colors and a subtitle box.
 */
export async function renderBanner() {
  try {
    const art = await figletAsync('WABCK', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });
    console.log(gradient.cristal.multiline(art));
  } catch {
    // Fallback if figlet font fails
    console.log(gradient.cristal('\n  ██╗    ██╗ █████╗ ██████╗  ██████╗██╗  ██╗\n  ██║    ██║██╔══██╗██╔══██╗██╔════╝██║ ██╔╝\n  ██║ █╗ ██║███████║██████╔╝██║     █████╔╝ \n  ██║███╗██║██╔══██║██╔══██╗██║     ██╔═██╗ \n  ╚███╔███╔╝██║  ██║██████╔╝╚██████╗██║  ██╗\n   ╚══╝╚══╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝\n'));
  }

  console.log(
    box(
      chalk.white('⚡ Scaffold production-ready Express.js backends in seconds\n') +
        chalk.dim('   by wabck — https://github.com/wabck/wabck'),
      { borderColor: 'magenta', padding: { top: 0, bottom: 0, left: 2, right: 2 } }
    )
  );
}
