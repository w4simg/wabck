// ─────────────────────────────────────────────────────────────────────────────
// Docker Templates — Dockerfile, docker-compose.yml, .dockerignore
// ─────────────────────────────────────────────────────────────────────────────

/** Generate Dockerfile */
export function dockerfile(options) {
  const { language, database } = options;
  const isTS = language === 'typescript';
  const port = 5000;

  if (isTS) {
    return `# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \\
    adduser  -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:${port}/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
`;
  }

  return `# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser  -S nodejs -u 1001

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:${port}/api/v1/health || exit 1

CMD ["node", "src/server.js"]
`;
}

/** Generate docker-compose.yml */
export function dockerCompose(options) {
  const { database, projectName } = options;
  const safe = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const dbService = {
    mongodb: `
  mongo:
    image: mongo:7-jammy
    container_name: ${safe}_mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: ${safe}
    volumes:
      - mongo_data:/data/db
    networks:
      - app_network
`,
    postgresql: `
  postgres:
    image: postgres:16-alpine
    container_name: ${safe}_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER:     \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-password}
      POSTGRES_DB:       \${DB_NAME:-${safe}}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
`,
    mysql: `
  mysql:
    image: mysql:8.0
    container_name: ${safe}_mysql
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD:-password}
      MYSQL_DATABASE:      \${DB_NAME:-${safe}}
      MYSQL_USER:          \${DB_USER:-appuser}
      MYSQL_PASSWORD:      \${DB_PASSWORD:-password}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
`,
    sqlite: '',
    none:   '',
  }[database] || '';

  const dbVolume = {
    mongodb:    '  mongo_data:\n',
    postgresql: '  postgres_data:\n',
    mysql:      '  mysql_data:\n',
    sqlite:     '',
    none:       '',
  }[database] || '';

  const dbDepends = ['mongodb', 'postgresql', 'mysql'].includes(database)
    ? `    depends_on:\n      - ${database === 'mongodb' ? 'mongo' : database}\n`
    : '';

  return `# docker-compose.yml — ${projectName}
# Usage: docker compose up --build

version: '3.9'

services:
  app:
    build:
      context: .
      target:  production
    container_name: ${safe}_app
    restart: unless-stopped
    ports:
      - "\${PORT:-5000}:5000"
    env_file:
      - .env
    networks:
      - app_network
${dbDepends}    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout:  10s
      retries:  3
      start_period: 30s
${dbService}
networks:
  app_network:
    driver: bridge

${dbVolume ? `volumes:\n${dbVolume}` : ''}`;
}

/** Generate .dockerignore */
export function dockerignore() {
  return `node_modules/
npm-debug.log*
.git/
.gitignore
.env
.env.local
dist/
coverage/
*.md
.dockerignore
Dockerfile
docker-compose.yml
.DS_Store
`;
}
