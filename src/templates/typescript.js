// ─────────────────────────────────────────────────────────────────────────────
// TypeScript-Specific Templates — tsconfig.json, src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Generate tsconfig.json */
export function tsconfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target:           'ES2022',
        module:           'NodeNext',
        moduleResolution: 'NodeNext',
        outDir:           './dist',
        rootDir:          './src',
        strict:           true,
        esModuleInterop:  true,
        skipLibCheck:     true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration:      true,
        declarationMap:   true,
        sourceMap:        true,
        removeComments:   false,
        noUnusedLocals:   true,
        noUnusedParameters: false,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        useUnknownInCatchVariables: true,
        exactOptionalPropertyTypes: false,
        lib:              ['ES2022'],
        types:            ['node'],
      },
      include:  ['src/**/*.ts'],
      exclude:  ['node_modules', 'dist', 'coverage'],
    },
    null,
    2
  );
}

/** Generate src/types/index.ts */
export function tsTypes(options) {
  const { auth } = options;

  return `import type { Request } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Global Type Extensions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extend Express Request to carry the authenticated user.
 * Set by the auth middleware after token verification.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Application Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:    string;
  email: string;
  role:  string;
}

export interface PaginationQuery {
  page?:  string;
  limit?: string;
  sort?:  string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export type AsyncHandler = (
  req: Request,
  res: import('express').Response,
  next: import('express').NextFunction
) => Promise<void>;

export {};
`;
}
