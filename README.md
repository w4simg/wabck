# wabck

> **Scaffold production-ready Express.js backends in seconds.**

```bash
npx wabck my-api
```

or

```bash
npm create wabck@latest my-api
```

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🌐 Language | JavaScript (ESM) or TypeScript |
| 🗄 Database | MongoDB, PostgreSQL (Prisma), MySQL, SQLite, None |
| 🔐 Auth | JWT, Clerk, Firebase, None |
| ✅ Validation | Zod, Joi, Express Validator |
| 🔗 API Style | REST or GraphQL (Apollo Server 4) |
| 📖 Docs | Swagger / OpenAPI 3 |
| 🐳 Docker | Multi-stage Dockerfile + docker-compose |
| ⚡ Package managers | npm, pnpm, yarn, bun |

## 🎨 CLI Experience

- **ASCII art banner** with gradient colors (figlet + gradient-string)
- **Animated spinners** for every step (ora)
- **Color-coded prompts** (chalk)
- **Boxed success summary** with numbered next steps

## 🏗 Generated Structure

```
my-api/
├── src/
│   ├── config/          db.js + env.js [+ swagger.js]
│   ├── controllers/     user.controller.js
│   ├── middlewares/     error, notFound, rateLimiter, auth
│   ├── models/          user.model.js
│   ├── routes/          index, health, user [+ auth]
│   ├── services/        user.service.js
│   ├── utils/           asyncHandler, ApiError, ApiResponse
│   ├── validators/      user.validator.js
│   ├── constants/       HTTP_STATUS, ROLES, PAGINATION
│   ├── helpers/         token.helper.js (JWT)
│   ├── types/           (TypeScript only)
│   ├── graphql/         (GraphQL only)
│   ├── app.js
│   └── server.js
├── .env.example
├── .prettierrc
├── eslint.config.js
├── Dockerfile          (optional)
└── docker-compose.yml  (optional)
```

## 🔗 Generated Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health + uptime |
| GET | `/api/v1/users` | List users |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:id` | Get user |
| PUT | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |
| POST | `/api/v1/auth/register` | Register (JWT) |
| POST | `/api/v1/auth/login` | Login (JWT) |
| GET | `/api/v1/auth/me` | Profile (JWT) |
| GET | `/api-docs` | Swagger UI (Interactive Docs) |
| GET | `/api-docs.json` | OpenAPI 3.0 JSON Spec |

## 📜 License

MIT
