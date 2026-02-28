# Backend Mono Services API

A robust, production-ready Node.js TypeScript REST API service for restaurant management with industry-standard practices and comprehensive error handling.

## 🚀 Features

### Core Architecture

- **TypeScript** with strict type safety
- **Express.js** framework with modular routing
- **Consolidated Architecture** with single entry points
- **Service Layer Pattern** with separation of concerns
- **Repository Pattern** for data access
- **Dependency Injection** ready structure

### Security & Validation

- **Enhanced Authentication** with JWT and role-based access control
- **Consolidated Auth Middleware** for maintainability
- **Input Validation** with express-validator
- **Security Headers** with Helmet
- **CORS** configuration with origin validation
- **Rate Limiting** to prevent abuse
- **Request Timeout** handling

### Error Handling & Monitoring

- **Consolidated Error System** with single source of truth
- **Centralized Error Handler** with consistent responses
- **Comprehensive Logging** with Winston
- **Health Check** endpoints with database status
- **Request Tracing** with unique request IDs

### Database & Performance

- **Prisma ORM** with PostgreSQL
- **Singleton DatabaseManager** with connection lifecycle
- **Database Transactions** with rollback support
- **Graceful Shutdown** handling with proper cleanup

### Real-time Communication

- **WebSocket Support** with Socket.IO
- **Real-time Transaction Updates** for live monitoring
- **Room-based Communication** for outlet-specific events
- **JWT Authentication** for WebSocket connections
- **Event-driven Architecture** for transaction lifecycle

### Development Experience

- **Hot Reloading** with Nodemon
- **Code Formatting** with Prettier
- **Type Safety** with TypeScript strict mode
- **Git Hooks** with Husky for pre-commit checks
- **Environment Configuration** management
- **Docker Support** for containerization

## 📦 Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd be-mono-service
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Generate Prisma client:**

```bash
npm run prisma:generate
```

5. **Run database migrations:**

```bash
npm run prisma:migrate
```

## 🛠️ Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reloading enabled.
WebSocket server will also be initialized for real-time transaction updates.

### Code Quality Checks

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run typecheck
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Production

### Build and Start

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Required environment variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database
DB_SCHEMA=mono

# Authentication
JWT_SECRET=your-super-secret-jwt-key
AUTH_USERNAME=admin
AUTH_PASSWORD=password

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# External Services
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_IS_PRODUCTION=false

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-s3-bucket
```

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

### Available Endpoints

#### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token

#### Users

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

#### Transactions

- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/:id` - Get transaction by ID
- `POST /api/v1/transactions` - Create transaction
- `PUT /api/v1/transactions/:id/status` - Update transaction status
- `DELETE /api/v1/transactions/:id` - Delete transaction

#### Menus

- `GET /api/v1/menus` - Get all menus
- `GET /api/v1/menus/:id` - Get menu by ID
- `POST /api/v1/menus` - Create menu
- `PUT /api/v1/menus/:id` - Update menu
- `DELETE /api/v1/menus/:id` - Delete menu

#### Outlets

- `GET /api/v1/outlets` - Get all outlets
- `GET /api/v1/outlets/:id` - Get outlet by ID
- `POST /api/v1/outlets` - Create outlet
- `PUT /api/v1/outlets/:id` - Update outlet
- `DELETE /api/v1/outlets/:id` - Delete outlet

#### Vouchers

- `GET /api/v1/vouchers` - Get all vouchers
- `GET /api/v1/vouchers/:id` - Get voucher by ID
- `POST /api/v1/vouchers` - Create voucher
- `PUT /api/v1/vouchers/:id` - Update voucher
- `DELETE /api/v1/vouchers/:id` - Delete voucher

#### Files

- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/:id` - Get file by ID
- `DELETE /api/v1/files/:id` - Delete file

#### WebSockets

- `GET /api/v1/websockets/stats` - Get WebSocket connection statistics

### WebSocket Events

The application provides real-time transaction updates through WebSocket connections:

#### Transaction Events

- `transaction:created` - New transaction created
- `transaction:status-updated` - Transaction status changed
- `transaction:table-updated` - Transaction moved to different table
- `transaction:deleted` - Transaction cancelled/deleted

#### Client Events

- `join-transaction` - Join specific transaction room
- `leave-transaction` - Leave specific transaction room

#### WebSocket Connection

Connect to `ws://localhost:3000` (or your server URL) with JWT authentication:

```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'your-jwt-token' },
});

socket.on('transaction:created', event => {
  console.log('New transaction:', event.data);
});
```

### Health Check

- `GET /health` - Application health status
- `GET /api/v1` - API information and endpoints

## 🐳 Docker Support

### Using Docker Compose (Recommended)

1. **Start all services:**

```bash
docker-compose up -d
```

2. **View logs:**

```bash
docker-compose logs -f
```

3. **Stop services:**

```bash
docker-compose down
```

### Using Docker

1. **Build image:**

```bash
docker build -t mono-service .
```

2. **Run container:**

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://username:password@host:5432/database \
  -e JWT_SECRET=your-jwt-secret \
  mono-service
```

## 📊 Monitoring & Logging

### Application Logs

The application uses Winston for structured logging with the following levels:

- `error` - Error messages and exceptions
- `warn` - Warning messages
- `info` - General information
- `debug` - Debug information (development only)

### Health Monitoring

The `/health` endpoint provides:

- Application status
- Database connectivity
- Memory usage
- Uptime
- Environment information

## � Project Structure

```
src/
├── app.ts                    # Express app with middleware chain
├── index.ts                  # Server entry point with DB initialization
├── config/
│   ├── index.ts              # Environment configuration
│   └── database.ts           # Singleton DatabaseManager (Prisma)
├── middlewares/
│   ├── index.ts              # Centralized middleware exports
│   ├── auth.middlewares.ts   # Consolidated auth (JWT, role, basic)
│   └── rateLimiter.middlewares.ts
├── modules/
│   ├── users/
│   ├── transactions/
│   ├── menus/
│   ├── outlets/
│   ├── inventories/
│   ├── vouchers/
│   ├── files/
│   ├── tables/
│   ├── discounts/
│   ├── messages/
│   └── websockets/
├── services/
│   ├── base.service.ts       # Base service with common DB operations
│   ├── transaction.service.ts
│   ├── websocket.service.ts
│   └── thermalPrinter.service.ts
├── utils/
│   ├── auth/
│   │   └── jwt.ts            # JWT utilities and role hierarchy
│   ├── common/
│   │   └── logger.ts         # Winston logger configuration
│   ├── errors/
│   │   ├── custom.errors.ts  # AppError class and ErrorCode enum
│   │   └── error.handler.ts  # Centralized error handler
│   ├── response/
│   │   └── responseHandler.ts
│   ├── validation/
│   └── generator/
└── types/
    └── *.types.ts            # Shared TypeScript interfaces
```

### Recent Refactoring

The codebase has been refactored for improved maintainability:

- **Consolidated Health Endpoint**: Single `/health` endpoint in app.ts replaces 10+ duplicate module-level health endpoints
- **Consolidated Middleware**: All auth middleware (JWT, role-based, basic) merged into single file
- **Simplified Database**: Single DatabaseManager with proper lifecycle management
- **Unified Error Handling**: Single AppError class and error handler
- **Cleaner Imports**: Removed duplicate files and standardized import patterns

The application uses a singleton database manager with:

- Connection pooling
- Automatic reconnection
- Health checks
- Graceful shutdown

### Security Configuration

- JWT token expiration: 24 hours
- Rate limiting: 100 requests per 15 minutes
- Request timeout: 30 seconds
- CORS: Configurable origins
- Security headers: CSP, HSTS, XSS protection

## 🧪 Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── services/
├── controllers/
└── utils/
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage
```

## 📝 Code Quality

### Prettier Configuration

- 2 space indentation
- Single quotes
- Trailing commas
- Semicolons

### TypeScript Configuration

- Strict type checking
- No implicit any
- Import/export rules
- Modern ES features

### Git Hooks

- Pre-commit: Format check and type check
- Pre-push: Test run

## 🚀 Deployment

### Environment Setup

1. **Production environment variables**
2. **Database migrations**
3. **Build application**
4. **Start with process manager (PM2)**

### PM2 Configuration

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check the [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) for architecture details
- Review the API documentation above
- See [docs/websocket-implementation.md](./docs/websocket-implementation.md) for WebSocket details

---

**Built with ❤️ using Node.js, TypeScript, and modern best practices**
