# Lapasar B2B eCommerce Platform

A scalable, enterprise-grade B2B eCommerce platform built with **Hexagonal Architecture**, designed to grow from monolith to microservices.

## 🏗️ Architecture

- **Hexagonal Architecture** (Ports & Adapters)
- **Domain-Driven Design** (DDD) with bounded contexts
- **Event-Driven Architecture** ready for CQRS
- **Monorepo** with workspace packages
- **Monolith-first** with microservices migration path

## 🚀 Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Language**: TypeScript
- **Database**: MongoDB (native driver)
- **Validation**: Zod
- **Authentication**: JWT + Argon2id
- **Logging**: Pino
- **Testing**: Bun test

## 📦 Project Structure

```
lapasar-corp-api/
├── apps/
│   └── monolith/              # Main application
├── packages/
│   ├── shared-kernel/         # Shared domain primitives
│   ├── infrastructure/        # Cross-cutting infrastructure
│   ├── contracts/             # Event schemas
│   ├── users-domain/          # User management
│   ├── catalog-domain/        # Product catalog (TBD)
│   └── orders-domain/         # Order management (TBD)
└── infrastructure/
    └── docker/                # Docker Compose configs
```

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- MongoDB >= 6.0 (or use Docker Compose)

### Installation

```bash
# Install dependencies
bun install

# Copy environment file
cp apps/monolith/.env.example apps/monolith/.env

# Edit .env with your configuration
```

### Development

```bash
# Start MongoDB with Docker
docker-compose -f infrastructure/docker/docker-compose.monolith.yml up mongo -d

# Run development server
bun run dev

# Server will start at http://localhost:3000
```

### Testing

```bash
# Run all tests
bun test

# Run unit tests only
bun run test:unit

# Run integration tests
bun run test:integration
```

### Production Build

```bash
# Build application
bun run build

# Start production server
bun run start
```

## 📚 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/ready` - Detailed readiness check

### Users
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/:id` - Get user by ID

## 🏛️ Core Features

### ✅ Implemented
- Hexagonal Architecture foundation
- User registration with Argon2id password hashing
- JWT authentication
- Event-driven architecture (in-memory event bus)
- MongoDB with audit trail
- Request/response logging
- Health checks
- Error handling with proper HTTP status codes
- Input validation with Zod
- Internationalization (i18n) with English & Malay support

### 🚧 To Be Implemented
- Product catalog
- Order management with state machines
- Rate limiting
- API versioning
- OpenAPI documentation generation
- Redis caching
- RabbitMQ event bus
- WebSocket support
- GraphQL API
- Idempotent API design
- CQRS and Event Sourcing

## 🔐 Security Features

- Argon2id password hashing (19 MiB memory, 2 iterations)
- JWT-based authentication
- Configurable rate limiting (TBD)
- Input validation on all endpoints
- Audit trail for all data changes

## 📖 Development Guide

### Adding a New Domain

1. Create package in `packages/your-domain/`
2. Define domain entities and value objects
3. Create use cases (commands/queries)
4. Implement repository
5. Create HTTP API in `apps/monolith/src/services/your-domain/`
6. Register in DI container

### Code Style

- Use Prettier for formatting: `bun run format`
- Use ESLint for linting: `bun run lint`
- Follow Better Comments convention:
  - `// *` for information
  - `// !` for important matters
  - `// ?` for considerations

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose -f infrastructure/docker/docker-compose.monolith.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.monolith.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.monolith.yml down
```

## 📝 Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `DEFAULT_LOCALE` - Default locale for i18n (en, ms)

## 🌍 Internationalization

The platform supports multiple languages with automatic locale detection:

- **Supported Languages**: English (en), Malay (ms)
- **Locale Detection**: Query param (`?lang=ms`), Accept-Language header, or default
- **Translation Files**: Organized by domain in `packages/infrastructure/localization/translations/`
- **Usage**: All error messages and responses are automatically translated

See [docs/I18N_GUIDE.md](docs/I18N_GUIDE.md) for detailed usage and implementation guide.

## 🤝 Contributing

1. Follow the project structure and architecture patterns
2. Write tests for new features
3. Update documentation
4. Use conventional commits

## 📄 License

MIT

---

Built with ❤️ using Bun, Hono, and Hexagonal Architecture
