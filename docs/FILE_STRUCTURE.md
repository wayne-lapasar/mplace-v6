# Project File Structure

Complete file structure for the Lapasar B2B eCommerce Platform - a modular monolith with microservices readiness.

## /apps

Application entry points - deployable services.

### /monolith

Single deployable application (all services in one process).

#### /src/api-gateway

API Gateway - single entry point for all HTTP traffic.

**Middleware:**
- `auth.middleware.ts` - JWT validation, extracts user from token
- `error.middleware.ts` - Global error handler, formats error responses
- `locale.middleware.ts` - Language detection
- `logging.middleware.ts` - Request/response logging with correlation IDs
- `rate-limit.middleware.ts` - Rate limiting per user/IP
- `validation.middleware.ts` - Request body validation using Zod

**Routes:**
- `index.ts` - Main router that aggregates all service routes
- `health.routes.ts` - Health check endpoints (/health, /ready)

**Core:**
- `app.ts` - Creates and configures Hono app with all middleware

#### /src/services

All microservices as modules (each is independently deployable later).

**Catalog Service** (`/catalog`)
- `api.ts` - HTTP endpoints (GET/POST/PUT/DELETE /products)
- `consumers.ts` - Event consumers (listen to catalog-related events)

**Orders Service** (`/orders`)
- `api.ts` - HTTP endpoints (GET/POST /orders, PUT /orders/:id/status)
- `consumers.ts` - Event consumers (ProductCreated, ProductPriceChanged, etc.)

**Users Service** (`/users`)
- `api.ts` - HTTP endpoints (POST /register, POST /login, GET /profile)
- `consumers.ts` - Event consumers (OrderPlaced for user activity tracking)

**Notifications Service** (`/notifications`)
- `consumers.ts` - Only event consumers (OrderPlaced, UserRegistered, etc.)
- No HTTP endpoints - purely event-driven

#### /src/config

- `di-container.ts` - Dependency injection container - wires all services
- `env.ts` - Environment variables validation with Zod

#### /src

- `main.ts` - Application entry point - bootstraps everything
  1. Initialize infrastructure (DB, event bus)
  2. Start all event consumers
  3. Mount all HTTP APIs
  4. Start HTTP server

**Configuration:**
- `Dockerfile` - Docker image for monolith deployment
- `package.json` - Monolith dependencies
- `tsconfig.json` - TypeScript config for monolith
- `.env.example` - Example environment variables

### Future Microservices (Dormant)

Ready-to-split individual services for independent deployment.

#### /catalog-service

Independent catalog microservice.

**Structure:**
- `/api` - HTTP API endpoints
  - `catalog.controller.ts` - HTTP request handlers
  - `catalog.routes.ts` - Route definitions
- `/consumers` - Event consumers
  - `catalog-events.consumer.ts` - Listens to catalog-related events
- `/config`
  - `di-container.ts` - Service-specific DI container
- `main.ts` - Catalog service entry point
  - When split: runs only catalog service
  - Connects to: MongoDB, RabbitMQ
  - Exposes: HTTP API on port 3001

**Configuration:**
- `Dockerfile` - Catalog service Docker image
- `package.json` - Catalog-specific dependencies only
- `tsconfig.json`

#### /orders-service

Independent orders microservice.

**Structure:**
- `/api`
  - `orders.controller.ts`
  - `orders.routes.ts`
- `/consumers`
  - `orders-events.consumer.ts` - Listens to ProductCreated, UserRegistered, etc.
- `/config`
  - `di-container.ts`
- `main.ts` - Orders service entry point
  - When split: runs only orders service
  - Connects to: MongoDB, RabbitMQ
  - Exposes: HTTP API on port 3002

**Configuration:**
- `Dockerfile` - Orders service Docker image
- `package.json`
- `tsconfig.json`

#### /users-service

Independent users/auth microservice.

**Structure:**
- `/api`
  - `users.controller.ts`
  - `auth.controller.ts`
  - `users.routes.ts`
- `/consumers`
  - `users-events.consumer.ts`
- `/config`
  - `di-container.ts`
- `main.ts` - Users service entry point
  - When split: runs only users service
  - Handles: authentication, authorization
  - Exposes: HTTP API on port 3003

**Configuration:**
- `Dockerfile`
- `package.json`
- `tsconfig.json`

#### /notification-service

Independent notification microservice.

**Structure:**
- `/consumers` - Only consumers - no HTTP API
  - `notification-events.consumer.ts` - Listens to: OrderPlaced, UserRegistered, etc.
    - Sends: emails, SMS, push notifications
- `/adapters` - External service adapters
  - `email.adapter.ts` - SendGrid, AWS SES, etc.
  - `sms.adapter.ts` - Twilio, AWS SNS, etc.
- `/config`
  - `di-container.ts`
- `main.ts` - Notification service entry point
  - When split: runs only notification consumers
  - No HTTP server - purely event-driven

**Configuration:**
- `Dockerfile`
- `package.json`
- `tsconfig.json`

## /packages

Shared packages - business logic and infrastructure.

### Domain Packages

Bounded contexts following Domain-Driven Design (DDD).

#### /catalog-domain

Catalog bounded context (domain logic).

**Domain Layer** (`/domain`) - Pure business logic - no dependencies

**Entities:**
- `product.entity.ts` - Product aggregate root with business methods
  - Methods: `activate()`, `deactivate()`, `updatePrice()`
  - Validations: price must be positive, SKU unique
- `category.entity.ts` - Category entity with hierarchy support

**Value Objects:**
- `product-code.vo.ts` - SKU/barcode value object with validation
- `product-name.vo.ts` - Product name with min/max length rules
- `price.vo.ts` - Money value object (amount + currency)
- `stock-quantity.vo.ts` - Non-negative quantity with units

**Events:**
- `product-created.event.ts` - Domain event: new product created
- `product-price-changed.event.ts` - Domain event: price updated
- `product-stock-updated.event.ts` - Domain event: stock changed
- `product-activated.event.ts` - Domain event: product made active
- `product-deactivated.event.ts` - Domain event: product disabled

**Errors:**
- `product-not-found.error.ts` - Business error: product doesn't exist
- `invalid-price.error.ts` - Business error: price validation failed
- `duplicate-sku.error.ts` - Business error: SKU already exists
- `insufficient-stock.error.ts` - Business error: not enough inventory

**Specifications:**
- `is-product-available.spec.ts` - Rule: active + in stock + not expired
- `can-change-price.spec.ts` - Rule: price change constraints

**Application Layer** (`/application`) - Use cases - orchestrates domain logic

**Commands** (Write operations - state changes):
- `create-product.use-case.ts` - Create new product
- `update-product.use-case.ts` - Update product details
- `delete-product.use-case.ts` - Soft delete product
- `adjust-stock.use-case.ts` - Adjust inventory levels

**Queries** (Read operations - no state changes):
- `get-product.use-case.ts` - Get single product by ID
- `get-products.use-case.ts` - List products with filters/pagination
- `search-products.use-case.ts` - Full-text search products
- `get-product-stock.use-case.ts` - Check product availability

**DTO:**
- `product.dto.ts` - Data transfer objects with Zod schemas
  - CreateProductDTO, UpdateProductDTO, ProductResponseDTO

**Mappers:**
- `product.mapper.ts` - Domain entity ↔ DTO transformations

**Infrastructure Layer** (`/infrastructure`) - Infrastructure implementations

**Persistence:**
- `product.repository.ts` - Implements IProductRepository port
  - MongoDB implementation with audit trail
- `product.schema.ts` - MongoDB schema definition

**Ports Layer** (`/ports`) - Interfaces (contracts)

- `product.repository.port.ts` - Repository interface (save, find, delete)
  - Used by application layer, implemented by infrastructure

**Configuration:**
- `package.json` - Can be published as separate package
- `tsconfig.json`

#### /orders-domain

Orders bounded context.

**Domain Layer** (`/domain`)

**State Machines:**
- `order-state-machine.ts` - Order lifecycle
- `payment-state-machine.ts` - Payment flow
- `refund-state-machine.ts` - Refund process

**Entities:**
- `order.entity.ts` - Order aggregate root
  - States: pending, confirmed, shipped, delivered, cancelled
  - Methods: `confirm()`, `ship()`, `deliver()`, `cancel()`
- `order-item.entity.ts` - Order line item (product + quantity + price snapshot)

**Value Objects:**
- `order-status.vo.ts` - Enum: pending, confirmed, shipped, etc.
- `order-total.vo.ts` - Total with tax calculation
- `shipping-address.vo.ts` - Address validation
- `payment-method.vo.ts` - Payment type (credit card, PayPal, etc.)

**Events:**
- `order-placed.event.ts` - Domain event: order created
- `order-confirmed.event.ts` - Domain event: order confirmed
- `order-shipped.event.ts` - Domain event: order shipped
- `order-cancelled.event.ts` - Domain event: order cancelled

**Errors:**
- `order-not-found.error.ts` - Business error: order doesn't exist
- `invalid-order-status.error.ts` - Business error: invalid status transition
- `product-unavailable.error.ts` - Business error: product out of stock

**Specifications:**
- `can-place-order.spec.ts` - Rule: user eligible + products available
- `can-cancel-order.spec.ts` - Rule: order not shipped yet

**Application Layer** (`/application`)

**Commands:**
- `place-order.use-case.ts` - Create new order
  1. Validate products exist
  2. Check inventory
  3. Reserve stock
  4. Create order
  5. Publish OrderPlaced event
- `confirm-order.use-case.ts` - Confirm payment received
- `cancel-order.use-case.ts` - Cancel order and release stock
- `update-shipping.use-case.ts` - Update tracking info

**Queries:**
- `get-order.use-case.ts` - Get single order
- `get-orders.use-case.ts` - List orders with filters
- `get-user-orders.use-case.ts` - Get orders for specific user

**DTO:**
- `order.dto.ts` - PlaceOrderDTO, OrderResponseDTO, etc.

**Mappers:**
- `order.mapper.ts` - Domain ↔ DTO transformations

**Infrastructure Layer** (`/infrastructure`)

**Persistence:**
- `order.repository.ts` - MongoDB implementation
- `order.schema.ts` - Order schema with embedded items

**Ports Layer** (`/ports`)

- `order.repository.port.ts` - Repository interface

**Configuration:**
- `package.json`
- `tsconfig.json`

#### /users-domain

Users bounded context.

**Domain Layer** (`/domain`)

**Entities:**
- `user.entity.ts` - User aggregate root
  - Properties: id, email, name, passwordHash, roles
  - Methods: `updateProfile()`, `changePassword()`, `activate()`
- `user-profile.entity.ts` - Extended user profile (address, phone, preferences)

**Value Objects:**
- `email.vo.ts` - Email validation
- `password.vo.ts` - Password strength validation (min 8 chars, etc.)
- `user-role.vo.ts` - Enum: admin, customer, guest

**Events:**
- `user-registered.event.ts` - Domain event: new user signed up
- `user-logged-in.event.ts` - Domain event: user authenticated
- `user-password-changed.event.ts` - Domain event: password updated

**Errors:**
- `user-not-found.error.ts` - Business error: user doesn't exist
- `duplicate-email.error.ts` - Business error: email already registered
- `invalid-credentials.error.ts` - Business error: wrong email/password
- `weak-password.error.ts` - Business error: password too weak

**Application Layer** (`/application`)

**Commands:**
- `register-user.use-case.ts` - User registration
  1. Validate email unique
  2. Hash password with Argon2
  3. Create user
  4. Publish UserRegistered event
- `login-user.use-case.ts` - User authentication
  1. Find user by email
  2. Verify password
  3. Generate JWT
  4. Publish UserLoggedIn event
- `change-password.use-case.ts` - Password change
- `update-profile.use-case.ts` - Update user info

**Queries:**
- `get-user.use-case.ts` - Get user by ID
- `get-user-by-email.use-case.ts` - Find user by email

**DTO:**
- `user.dto.ts` - RegisterDTO, LoginDTO, UserResponseDTO
- `auth.dto.ts` - LoginResponseDTO (token + user)

**Mappers:**
- `user.mapper.ts` - Domain ↔ DTO transformations

**Infrastructure Layer** (`/infrastructure`)

**Persistence:**
- `user.repository.ts` - MongoDB implementation
- `user.schema.ts` - User schema with indexes on email

**Ports Layer** (`/ports`)

- `user.repository.port.ts` - Repository interface

**Configuration:**
- `package.json`
- `tsconfig.json`

### Shared Packages

Cross-cutting concerns shared across all bounded contexts.

#### /shared-kernel

Shared across all bounded contexts.

**Domain Layer** (`/domain`) - Reusable domain primitives

**State Machine:**
- `state-machine.base.ts` - Base state machine class
- `state.ts` - State definition
- `transition.ts` - Transition definition
- `state-machine.error.ts` - State machine errors

**Value Objects:**
- `email.vo.ts` - Email validation (RFC 5322 compliant)
- `money.vo.ts` - Money with currency (USD, EUR, etc.)
  - Methods: `add()`, `subtract()`, `multiply()`
- `address.vo.ts` - Postal address with country validation
- `phone-number.vo.ts` - Phone with country code
- `date-range.vo.ts` - Start/end date validation

**Events:**
- `domain-event.base.ts` - Base class for all domain events
  - Properties: eventId, eventName, occurredAt, aggregateId
- `event-metadata.ts` - Correlation ID, causation ID, user context

**Entities:**
- `base.entity.ts` - Base entity with id, createdAt, updatedAt

**Specifications:**
- `specification.base.ts` - Specification pattern base class
  - Methods: `and()`, `or()`, `not()`, `isSatisfiedBy()`

**Application Layer** (`/application`) - Shared application patterns

**DTO:**
- `pagination.dto.ts` - Standard pagination (page, limit, total)
- `filter.dto.ts` - Common filtering (search, sort, date range)
- `result.dto.ts` - Success/failure result wrapper
  - Result&lt;T&gt; = { success: true, data: T } | { success: false, error: Error }

**Errors:**
- `application.error.ts` - Base application error
- `validation.error.ts` - Zod validation errors
- `not-found.error.ts` - Resource not found (404)
- `unauthorized.error.ts` - Authentication required (401)
- `forbidden.error.ts` - Insufficient permissions (403)
- `conflict.error.ts` - Resource conflict (409)
- `localized.error.ts` - Base error with i18n support

**Types** (`/types`)

- `common.types.ts` - Common TypeScript types
  - ID, Timestamp, UUID, etc.

**Configuration:**
- `package.json`
- `tsconfig.json`

#### /infrastructure

Shared infrastructure (cross-cutting concerns).

**Database** (`/database`)

Database connection and utilities.

- `mongodb.client.ts` - Singleton MongoDB connection
  - Handles: connection pooling, retry logic
- `base.repository.ts` - Base repository with common CRUD methods
  - Methods: findById, findAll, save, delete, count
- `transaction.helper.ts` - MongoDB transaction wrapper
  - Usage: withTransaction(async (session) =&gt; { ... })

**Events** (`/events`)

Event bus implementations.

- `event-bus.port.ts` - Event bus interface
  - Methods: publish(event), subscribe(eventName, handler)
- `in-memory-event-bus.ts` - In-memory implementation (for monolith)
  - Synchronous event handling within same process
- `rabbitmq-event-bus.ts` - RabbitMQ implementation (for microservices)
  - Async event handling across services
- `rabbitmq.client.ts` - RabbitMQ connection management
- `domain-event.publisher.ts` - Helper to publish domain events

**State Machine** (`/state-machine`)

- `state-machine.repository.ts` - Persistence
- `state-machine.event-publisher.ts` - Event integration
- `state-machine.visualizer.ts` - Generate state diagrams

**Cache** (`/cache`)

Caching layer.

- `cache.port.ts` - Cache interface (get, set, delete, clear)
- `redis-cache.ts` - Redis implementation
- `in-memory-cache.ts` - Simple Map-based cache (for dev/testing)
- `cache-key.builder.ts` - Helper to build consistent cache keys
  - Example: buildKey('product', productId) -&gt; "product:123"

**Auth** (`/auth`)

Authentication &amp; authorization.

- `jwt.service.ts` - JWT token generation and validation
  - Methods: sign(payload), verify(token)
- `password.service.ts` - Password hashing with Argon2
  - Methods: hash(password), verify(password, hash)
- `auth-context.ts` - Current user context (userId, roles, permissions)

**Localization** (`/localization`)

Localization infrastructure.

**Translation Files** (`/locales`)

- `/en` - English translations
  - `common.json` - Common translations (buttons, labels)
  - `validation.json` - Validation messages
  - `errors.json` - Error messages
  - `emails.json` - Email templates
  - `notifications.json` - Push notification messages
- `/ms` - Malay translations (ms = Bahasa Melayu)
  - `common.json`
  - `validation.json`
  - `errors.json`
  - `emails.json`
  - `notifications.json`

**Formatters** (`/formatters`)

Locale-specific formatters.

- `date.formatter.ts` - Date formatting (DD/MM/YYYY vs MM/DD/YYYY)
- `number.formatter.ts` - Number formatting (1,000.00 vs 1.000,00)
- `currency.formatter.ts` - Currency formatting (RM vs $)

**Core:**
- `i18n.service.ts` - Main i18n service
- `i18n.middleware.ts` - Hono middleware for language detection
- `i18n.types.ts` - TypeScript types
- `translator.ts` - Translation helper
- `locale-detector.ts` - Detect user's preferred language

**Logging** (`/logging`)

Structured logging.

- `logger.ts` - Winston or Pino wrapper
  - Levels: error, warn, info, debug
  - Context: correlationId, userId, service
- `log-context.ts` - Request-scoped logging context
- `transports/` - Log destinations
  - `console.transport.ts` - Console output (dev)
  - `file.transport.ts` - File output (production)
  - `mongodb.transport.ts` - Store logs in MongoDB (optional)

**Monitoring** (`/monitoring`)

Observability.

- `health-check.ts` - Health check endpoints
  - Checks: DB connection, event bus, cache
- `metrics.ts` - Prometheus metrics exporter
  - Metrics: request count, duration, errors
- `tracing.ts` - OpenTelemetry distributed tracing

**Validation** (`/validation`)

Input validation.

- `zod-validator.ts` - Zod schema validation helper
- `validation-error-formatter.ts` - Format Zod errors to user-friendly messages

**HTTP** (`/http`)

HTTP utilities.

- `http-client.ts` - HTTP client (fetch wrapper with retry)
- `api-error.ts` - Standard API error format

**Configuration:**
- `package.json`
- `tsconfig.json`

#### /contracts

Service contracts (APIs, Events).

**Events** (`/events`)

Event schemas (shared across services).

- `/catalog`
  - `product-created.event.ts` - Event schema with Zod validation
  - `product-updated.event.ts`
  - `product-deleted.event.ts`
- `/orders`
  - `order-placed.event.ts` - Order events
  - `order-confirmed.event.ts`
  - `order-cancelled.event.ts`
- `/users`
  - `user-registered.event.ts` - User events
  - `user-logged-in.event.ts`
- `event.registry.ts` - Central registry of all events
  - Maps event names to schemas

**API** (`/api`)

API contracts (OpenAPI specs).

- `catalog.openapi.yaml` - Catalog API specification
- `orders.openapi.yaml` - Orders API specification
- `users.openapi.yaml` - Users API specification

**DTO** (`/dto`)

- `common.dto.ts` - Shared DTOs across services

**Configuration:**
- `package.json`
- `tsconfig.json`

## /infrastructure

Infrastructure as Code.

### /docker

**Monolith Deployment:**
- `docker-compose.monolith.yml` - Monolith + MongoDB + Redis (single VM)
  - Services: monolith, mongo, redis
  - Use for: development, staging, initial production
- `.env.example` - Example environment variables

**Microservices Deployment:**
- `docker-compose.microservices.yml` - All services + RabbitMQ (multiple VMs)
  - Services: gateway, catalog, orders, users, notifications
  - Use for: production scaling

### /kubernetes

Kubernetes manifests (future).

**Base Configuration** (`/base`)
- `namespace.yaml` - K8s namespace
- `configmap.yaml` - Configuration
- `secrets.yaml` - Secrets (DB passwords, API keys)

**Monolith Deployment** (`/monolith`)
- `deployment.yaml` - Monolith deployment
- `service.yaml` - Monolith service (ClusterIP)
- `ingress.yaml` - Ingress (external access)

**Microservices Deployment** (`/microservices`)

Individual service deployments:
- `catalog-deployment.yaml`
- `orders-deployment.yaml`
- `users-deployment.yaml`
- `notification-deployment.yaml`

### /terraform

Cloud infrastructure (AWS, GCP, Azure).

**Modules** (`/modules`)
- `/vpc` - Network setup
- `/ecs` - Container orchestration
- `/rds` - Managed database

**Configuration:**
- `main.tf` - Main Terraform config
- `variables.tf` - Input variables
- `outputs.tf` - Output values

## /tests

Test suites.

### /unit

Fast, isolated tests (no infrastructure).

- `/catalog`
  - `product.entity.test.ts` - Test product business logic
  - `create-product.use-case.test.ts` - Test use case with mocked repository
- `/orders`
  - `order.entity.test.ts`
  - `place-order.use-case.test.ts`

### /integration

Tests with real infrastructure.

- `/catalog`
  - `product.repository.test.ts` - Test MongoDB repository
  - `catalog-api.test.ts` - Test HTTP endpoints
- `/orders`
  - `order.repository.test.ts`
  - `orders-api.test.ts`

### /fixtures

Test data builders.

- `product.fixture.ts` - Factory to create test products
- `order.fixture.ts` - Factory to create test orders
- `user.fixture.ts` - Factory to create test users

### /helpers

Test utilities.

- `test-database.ts` - In-memory MongoDB for testing
- `test-event-bus.ts` - Mock event bus
- `test-server.ts` - Test HTTP server setup

## /scripts

Automation scripts.

- `seed.ts` - Seed database with sample data
  - Usage: bun run scripts/seed.ts
- `migrate.ts` - Run database migrations
- `generate-openapi.ts` - Generate OpenAPI from Zod schemas
- `check-env.ts` - Validate environment variables
- `deploy.sh` - Deployment script

## /docs

Documentation.

### /architecture

- `hexagonal-architecture.md` - Explain hexagonal architecture
- `bounded-contexts.md` - Explain domain boundaries
- `event-driven.md` - Explain event-driven communication
- `deployment-modes.md` - Monolith vs microservices

### /api

- `README.md` - API documentation overview
- `authentication.md` - How to authenticate
- `error-handling.md` - Error response format

### /development

- `getting-started.md` - Setup guide for developers
- `coding-standards.md` - Code style, naming conventions
- `testing-guide.md` - How to write tests

### /deployment

- `monolith-deployment.md` - Deploy as single server
- `microservices-deployment.md` - Deploy as separate services
- `environment-variables.md` - Required env vars

### Root Documentation

- `architecture.md` - High-level architecture overview
- `migration-guide.md` - How to split monolith to microservices

## /.github

GitHub configuration.

### /workflows

CI/CD pipelines.

- `ci.yml` - Continuous integration
  - On push: lint, test, build
- `cd-monolith.yml` - Deploy monolith
  - Trigger: push to main
  - Steps: build Docker, push, deploy to VM
- `cd-microservices.yml` - Deploy microservices
  - Trigger: manual or tag
  - Steps: build all services, push, deploy

**Configuration:**
- `dependabot.yml` - Automated dependency updates

## /.vscode

VSCode configuration.

- `settings.json` - Editor settings (format on save, etc.)
- `extensions.json` - Recommended extensions
- `launch.json` - Debug configurations

## Root Files

Project configuration.

**Package Management:**
- `package.json` - Root package.json (monorepo workspace)
  - Scripts: dev, build, test, lint, format
  - Workspaces: apps/*, packages/*
- `bun.lockb` - Bun lock file

**TypeScript:**
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.base.json` - Shared TS config for all packages

**Code Quality:**
- `eslint.config.mts` - ESLint configuration (flat config)
  - Rules: TypeScript, import sorting, Prettier
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore in formatting

**Environment:**
- `.env.example` - Example environment variables
- `.gitignore` - Git ignore rules

**Documentation:**
- `README.md` - Project overview
  - Quick start guide
  - Architecture explanation
  - Deployment instructions
- `CHANGELOG.md` - Version history

---

**This structure supports:**
- ✅ Modular monolith deployment (start simple)
- ✅ Microservices migration (split when needed)
- ✅ Domain-Driven Design (DDD)
- ✅ Hexagonal Architecture (Ports &amp; Adapters)
- ✅ Event-Driven Architecture
- ✅ Type safety with TypeScript
- ✅ Comprehensive testing strategy