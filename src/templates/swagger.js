// ─────────────────────────────────────────────────────────────────────────────
// Swagger / OpenAPI Templates — src/config/swagger.js/ts & openapi.yaml
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/config/swagger.js or src/config/swagger.ts */
export function swaggerConfig(options) {
  const { projectName, language, auth } = options;
  const isTS = language === 'typescript';
  const hasJwt = auth === 'jwt';

  return `import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
${isTS ? `import type { Express } from 'express';\n` : ''}
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Production Swagger / OpenAPI 3.0 Specification
// ─────────────────────────────────────────────────────────────────────────────

// Dynamically read version from package.json
let version = '1.0.0';
try {
  const pkgPath = path.resolve(__dirname, '../../package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    version = pkg.version || '1.0.0';
  }
} catch { /* use fallback version */ }

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: '${projectName} API',
    version,
    description: 'Production-ready REST API documentation with interactive Swagger UI and OpenAPI 3.0 specification.',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: '${projectName} Team',
    },
  },
  servers: [
    {
      url: \`http://localhost:\${process.env.PORT || 5000}/api/v1\`,
      description: 'Local development server',
    },
    {
      url: '/api/v1',
      description: 'Current host / Reverse proxy relative path',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health & diagnostic endpoints' },
    { name: 'Users',  description: 'User management and CRUD operations' },
${hasJwt ? "    { name: 'Auth',   description: 'Authentication, sessions, and token issuance' },\n" : ''}  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        description:  'Provide your Bearer token in the format: \`Bearer <token>\`',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message:    { type: 'string',  example: 'Success' },
          data:       { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message:    { type: 'string',  example: 'Validation or operation error' },
          errors:     { type: 'array', items: { type: 'string' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id:       { type: 'string', example: '661fae4e5bc24a1b8c9d0123' },
          name:      { type: 'string', example: 'Alex Mercer' },
          email:     { type: 'string', format: 'email', example: 'alex@example.com' },
          role:      { type: 'string', enum: ['user', 'admin'], example: 'user' },
          isActive:  { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Configure and mount Swagger UI and OpenAPI endpoints on the Express application.
 * @param {${isTS ? 'Express' : 'import("express").Express'}} app
 */
export function setupSwagger(app${isTS ? ': Express' : ''}) {
  // Custom dark-accent styling for modern presentation
  const customCss = \`
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 25px 0 }
    .swagger-ui .info .title { font-family: system-ui, sans-serif; font-weight: 700 }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px }
  \`;

  // Interactive Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: '${projectName} API Documentation',
      customCss,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
      },
    })
  );

  // Raw OpenAPI 3.0 JSON specification (for Postman, Insomnia, or code generators)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Raw OpenAPI 3.0 YAML specification file
  app.get('/api-docs.yaml', (_req, res) => {
    const yamlPath = path.resolve(__dirname, '../../openapi.yaml');
    if (existsSync(yamlPath)) {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      return res.sendFile(yamlPath);
    }
    // Fallback: send JSON representation if yaml file is relocated
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
`;
}

/** Generate openapi.yaml for the root directory of the scaffolded project */
export function swaggerYaml(options) {
  const { projectName, auth } = options;
  const hasJwt = auth === 'jwt';

  return `openapi: 3.0.3
info:
  title: ${projectName} API
  description: Production-grade REST API specification for ${projectName}. Auto-generated by wabck.
  version: 1.0.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  contact:
    name: ${projectName} Team

servers:
  - url: http://localhost:5000/api/v1
    description: Local development server
  - url: /api/v1
    description: Current host / Reverse proxy relative path

tags:
  - name: Health
    description: System health & diagnostic endpoints
  - name: Users
    description: User management and CRUD operations
${hasJwt ? `  - name: Auth
    description: Authentication, sessions, and token issuance
` : ''}
paths:
  /health:
    get:
      tags:
        - Health
      summary: Health check & server diagnostics
      description: Returns service uptime, memory metrics, runtime environment, and current version.
      responses:
        '200':
          description: Service is healthy and responding
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok
                  uptime:
                    type: integer
                    example: 120
                  version:
                    type: string
                    example: 1.0.0
                  env:
                    type: string
                    example: development
                  timestamp:
                    type: string
                    format: date-time
                    example: '2026-01-01T00:00:00.000Z'
                  memory:
                    type: object
                    properties:
                      used:
                        type: string
                        example: 32 MB
                      total:
                        type: string
                        example: 64 MB

  /users:
    get:
      tags:
        - Users
      summary: Retrieve all users
      description: Fetches a list of registered users.
      responses:
        '200':
          description: Users retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
    post:
      tags:
        - Users
      summary: Create a new user
      description: Adds a new user record to the database.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '400':
          description: Bad request or validation failure
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'

  /users/{id}:
    get:
      tags:
        - Users
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          description: Unique identifier of the user
          schema:
            type: string
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'
    put:
      tags:
        - Users
      summary: Update an existing user
      parameters:
        - name: id
          in: path
          required: true
          description: Unique identifier of the user
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserInput'
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '404':
          description: User not found
    delete:
      tags:
        - Users
      summary: Delete a user by ID
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          description: Unique identifier of the user
          schema:
            type: string
      responses:
        '200':
          description: User deleted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '404':
          description: User not found
${hasJwt ? `
  /auth/register:
    post:
      tags:
        - Auth
      summary: Register a new account
      description: Creates a new user profile and returns access tokens.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterInput'
      responses:
        '201':
          description: User successfully registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          description: Validation error or email already in use
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'

  /auth/login:
    post:
      tags:
        - Auth
      summary: Authenticate user & issue tokens
      description: Validates email and password, issuing access & refresh tokens.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginInput'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'

  /auth/logout:
    post:
      tags:
        - Auth
      summary: Invalidate user session
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logged out successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'

  /auth/me:
    get:
      tags:
        - Auth
      summary: Retrieve current authenticated user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '401':
          description: Unauthorized
` : ''}
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Supply your JSON Web Token as 'Bearer <token>'

  schemas:
    ApiResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        statusCode:
          type: integer
          example: 200
        message:
          type: string
          example: Success
        data:
          type: object

    ApiError:
      type: object
      properties:
        success:
          type: boolean
          example: false
        statusCode:
          type: integer
          example: 400
        message:
          type: string
          example: Error occurred
        errors:
          type: array
          items:
            type: string

    User:
      type: object
      properties:
        _id:
          type: string
          example: 661fae4e5bc24a1b8c9d0123
        name:
          type: string
          example: Alex Mercer
        email:
          type: string
          format: email
          example: alex@example.com
        role:
          type: string
          enum: [user, admin]
          example: user
        isActive:
          type: boolean
          example: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateUserInput:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          example: Alex Mercer
        email:
          type: string
          format: email
          example: alex@example.com
        password:
          type: string
          format: password
          example: SecurePass123!

    UpdateUserInput:
      type: object
      properties:
        name:
          type: string
          example: Alex Mercer
        email:
          type: string
          format: email
          example: alex@example.com

    RegisterInput:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          example: Jane Doe
        email:
          type: string
          format: email
          example: jane@example.com
        password:
          type: string
          format: password
          example: SecretPass123!

    LoginInput:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: jane@example.com
        password:
          type: string
          format: password
          example: SecretPass123!

    AuthResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        statusCode:
          type: integer
          example: 200
        message:
          type: string
          example: Authenticated
        data:
          type: object
          properties:
            user:
              $ref: '#/components/schemas/User'
            accessToken:
              type: string
              example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            refreshToken:
              type: string
              example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`;
}
