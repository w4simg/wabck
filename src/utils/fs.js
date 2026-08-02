import fs from 'fs-extra';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// File System Utilities (thin wrappers around fs-extra)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensures a directory exists, creating it (and parents) if necessary.
 * @param {string} dirPath
 */
export async function createDir(dirPath) {
  await fs.ensureDir(dirPath);
}

/**
 * Writes content to a file, creating all ancestor directories as needed.
 * @param {string} filePath
 * @param {string} content
 */
export async function writeFile(filePath, content) {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Checks if a path (file or directory) exists.
 * @param {string} p
 * @returns {Promise<boolean>}
 */
export async function pathExists(p) {
  return fs.pathExists(p);
}

/**
 * Removes a file or directory recursively. Silent on missing paths.
 * @param {string} p
 */
export async function remove(p) {
  return fs.remove(p);
}
