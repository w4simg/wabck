// ─────────────────────────────────────────────────────────────────────────────
// Template Index — Re-exports all template functions
// ─────────────────────────────────────────────────────────────────────────────

export {
  app,
  server,
  envFile,
  envExample,
  gitignore,
  prettierrc,
  eslintConfig,
  readme,
} from './base.js';

export {
  db,
  envConfig,
} from './config.js';

export {
  routesIndex,
  healthRoute,
  userRoute,
  authRoute,
} from './routes.js';

export {
  userController,
} from './controllers.js';

export {
  userModel,
  prismaSchema,
} from './models.js';

export {
  errorMiddleware,
  notFoundMiddleware,
  rateLimiterMiddleware,
  authMiddleware,
} from './middlewares.js';

export {
  userService,
} from './services.js';

export {
  asyncHandler,
  apiError,
  apiResponse,
} from './utils.js';

export {
  userValidator,
} from './validators.js';

export {
  tokenHelper,
  constants,
} from './helpers.js';

export {
  dockerfile,
  dockerCompose,
  dockerignore,
} from './docker.js';

export {
  tsconfig,
  tsTypes,
} from './typescript.js';

export {
  graphqlSchema,
  graphqlResolvers,
  graphqlServer,
} from './graphql.js';
