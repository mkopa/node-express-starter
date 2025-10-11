## Node Express Starter

A production-ready **Node.js blueprint** implementing **Domain-Driven Design**, **Layered Architecture**, and **SOLID principles**.

Designed to demonstrate **scalable backend architecture**, it includes patterns like **dependency injection**, the **repository pattern**, and **clean separation of concerns**.

Built with **TypeScript**, **Express.js**, and **MySQL** — tailored for teams delivering **complex business applications**.

## 🎯 Architecture Highlights

- ✅ **True Dependency Inversion** with TypeDI container and repository interfaces
- ✅ **3-Layer Architecture** (Controllers → Services → Repositories)
- ✅ **Domain-Driven Design** with domain-specific errors and business logic separation
- ✅ **SOLID Principles** fully implemented across all layers
- ✅ **Transaction Management** with automatic rollback on errors
- ✅ **Type Safety** with TypeScript interfaces, DTOs, and strict typing
- ✅ **Production-Ready** error handling, logging, and security features
- ✅ **Comprehensive Testing** with unit tests and mocked interfaces

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (required)
- Node.js 22+ (optional, for local development)
- Git

### Installation & Run

```bash
# 1. Clone repository
git clone git@github.com:mkopa/boarding-system.git
cd boarding-system

# 2. Install dependencies (optional, for local development)
npm install

# 3. Start all services (MySQL, Adminer, API)
docker-compose up -d

# 4. Check if services are running
docker-compose ps
```

**Services will be available at:**

- **API**: http://localhost:3000
- **Adminer (MySQL GUI)**: http://localhost:8888
  - System: `MySQL`
  - Server: `db`
  - Username: `boarding_user`
  - Password: `boarding_pass`
  - Database: `boarding`

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-09T10:00:00.000Z",
  "database": "connected",
  "uptime": 3600,
  "responseTime": "5ms",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 📋 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Internal endpoints require **Basic Auth**:

- Username: `internal-client`
- Password: `supersecretpassword`

To generate the Authorization header:

```bash
echo -n 'internal-client:supersecretpassword' | base64
# Output: aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=
```

---

### Endpoints

#### 1. User Boarding (Create User)

**Endpoint**: `POST /api/v1/internal/boarding`

**Headers**:

```
Authorization: Basic aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "john.doe@example.com",
  "phone": "+48123456789",
  "first_name": "John",
  "last_name": "Doe",
  "company_id": 1
}
```

**Validation Rules**:

- `email`: required, valid email format, unique, 5-255 chars
- `first_name`: required, 1-100 chars, letters only
- `last_name`: required, 1-100 chars, letters only
- `phone`: optional, 5-20 chars, valid phone format
- `company_id`: required, integer ≥ 1, must exist in database

**Success Response** (201):

```json
{
  "message": "User created successfully",
  "token": "a1b2c3d4e5f6...64chars"
}
```

**Error Responses**:

| Code | Error               | Description                 |
| ---- | ------------------- | --------------------------- |
| 400  | Validation Error    | Invalid request body format |
| 404  | Company Not Found   | Company ID doesn't exist    |
| 409  | User Already Exists | Email already registered    |

---

#### 2. Set Password (One-time Token)

**Endpoint**: `POST /api/v1/internal/set-password/:token`

**Headers**:

```
Authorization: Basic aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=
Content-Type: application/json
```

**URL Parameters**:

- `token`: 64-character hexadecimal string (from boarding endpoint)

**Request Body**:

```json
{
  "password": "MySecureP@ssw0rd123"
}
```

**Validation Rules**:

- `password`: minimum 12 characters, must contain letters and numbers
- Token must be valid (not used, not expired)
- Token expires after 12 hours (configurable via `TOKEN_EXPIRY_HOURS`)

**Success Response** (200):

```json
{
  "success": true,
  "message": "Password set successfully"
}
```

**Error Responses**:

| Code | Error         | Description                         |
| ---- | ------------- | ----------------------------------- |
| 400  | Weak Password | Password doesn't meet requirements  |
| 404  | Invalid Token | Token doesn't exist or already used |
| 410  | Token Expired | Token is older than expiry time     |

---

## 🏗️ Architecture

### **Dependency Inversion with Interfaces**

This project implements true **Dependency Inversion Principle** (SOLID's "D"):

```
High-level modules (Services) depend on abstractions (Interfaces)
Low-level modules (Repositories) implement those abstractions
```

**Key Benefits:**

- ✅ Easy to test (inject mock implementations)
- ✅ Easy to swap implementations (e.g., MongoDB instead of MySQL)
- ✅ No concrete dependencies in business logic
- ✅ True loose coupling

### **3-Layer Architecture**

```
┌──────────────────────────────────────────────┐
│              HTTP Layer                      │
├──────────────────────────────────────────────┤
│  Controllers (HTTP Request/Response)         │
│  • BoardingController                        │
│    - createUser()                            │
│    - setPassword()                           │
└────────────┬─────────────────────────────────┘
             │ depends on
┌────────────▼─────────────────────────────────┐
│           Business Logic Layer               │
├──────────────────────────────────────────────┤
│  Services (Business Rules & Transactions)    │
│  • BoardingService                           │
│    - onboardUser()                           │
│    - setPasswordFromToken()                  │
│                                              │
│  Depends on: IUserRepository,                │
│              ICompanyRepository,             │
│              ITokenRepository                │
└────────────┬─────────────────────────────────┘
             │ depends on (interfaces)
┌────────────▼─────────────────────────────────┐
│            Data Access Layer                 │
├──────────────────────────────────────────────┤
│  Repository Interfaces (Contracts)           │
│  • IUserRepository                           │
│  • ICompanyRepository                        │
│  • ITokenRepository                          │
│                                              │
│  Repository Implementations                  │
│  • UserRepository                            │
│  • CompanyRepository                         │
│  • TokenRepository                           │
└──────────────────────────────────────────────┘
```

### **Dependency Injection Flow**

```typescript
// 1. Bootstrap registers dependencies
Container.set('DB_POOL', pool);
Container.set('IUserRepository', Container.get(UserRepository));
Container.set('ICompanyRepository', Container.get(CompanyRepository));
Container.set('ITokenRepository', Container.get(TokenRepository));

// 2. Service injects interfaces (not concrete classes)
@Service()
class BoardingService {
  constructor(
    @Inject('IUserRepository') private userRepo: IUserRepository,
    @Inject('ICompanyRepository') private companyRepo: ICompanyRepository,
    @Inject('ITokenRepository') private tokenRepo: ITokenRepository
  ) {}
}

// 3. Controller injects service
@Service()
class BoardingController {
  constructor(private service: BoardingService) {}
}

// 4. Routes get controller from container
const controller = Container.get(BoardingController);
router.post('/boarding', controller.createUser.bind(controller));
```

---

## 📁 Project Structure

```
boarding-service/
├── src/
│   ├── app/
│   │   ├── app.ts                    # Express configuration
│   │   ├── middlewares/
│   │   │   ├── ajvValidator.ts       # JSON Schema validation
│   │   │   ├── basicAuth.ts          # Basic Auth middleware
│   │   │   ├── errorHandler.ts       # Centralized error handling
│   │   │   ├── rateLimiter.ts        # Rate limiting (in-memory)
│   │   │   └── sanitizeInput.ts      # Input sanitization
│   │   └── routes/
│   │       ├── internal.ts           # Protected endpoints
│   │       └── health.ts             # Health check
│   ├── controllers/                  # HTTP Layer
│   │   └── BoardingController.ts     # Request/Response handling
│   ├── services/                     # Business Logic Layer
│   │   └── BoardingService.ts        # Business rules & transactions
│   ├── repositories/                 # Data Access Layer
│   │   ├── UserRepository.ts         # User operations implementation
│   │   ├── CompanyRepository.ts      # Company operations implementation
│   │   ├── TokenRepository.ts        # Token operations implementation
│   │   └── base/
│   │       └── BaseRepository.ts     # Common repository utilities
│   ├── types/                        # Type definitions & contracts
│   │   ├── entities/                 # Database entities
│   │   │   ├── User.types.ts
│   │   │   ├── Company.types.ts
│   │   │   └── PasswordToken.types.ts
│   │   ├── dtos/                     # Data Transfer Objects
│   │   │   ├── user.dto.ts
│   │   │   └── boarding.dto.ts
│   │   ├── interfaces/               # Repository interfaces
│   │   │   ├── IUserRepository.ts
│   │   │   ├── ICompanyRepository.ts
│   │   │   └── ITokenRepository.ts
│   │   ├── responses/                # API response types
│   │   │   ├── boarding.response.ts
│   │   │   ├── error.response.ts
│   │   │   └── health.response.ts
│   │   ├── errors/                   # Domain errors
│   │   │   └── DomainErrors.ts
│   │   ├── express.d.ts              # Express type extensions
│   │   └── index.ts                  # Barrel exports
│   ├── validation/
│   │   └── schemas/
│   │       ├── boarding.schema.json  # Boarding validation
│   │       └── setPassword.schema.json
│   ├── utils/
│   │   ├── crypto.ts                 # Hashing & token generation
│   │   ├── logger.ts                 # Winston logger
│   │   └── sanitize.ts               # Input sanitization utilities
│   ├── db/
│   │   └── mysql.ts                  # Database pool creation
│   └── index.ts                      # Application bootstrap
├── tests/
│   ├── services/
│   │   └── BoardingService.test.ts   # Service unit tests
│   ├── setup.ts                      # Test setup
│   ├── globalSetup.ts                # Global test setup
│   └── globalTeardown.ts             # Global test teardown
├── migrations/
│   ├── 001_create_schema.sql         # Database schema
│   ├── 002_seed_companies.sql        # Seed data
│   └── 003_add_indexes.sql           # Performance indexes
├── docker-compose.yml                # Docker services
├── Dockerfile                        # App container
├── .env                              # Environment variables
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── jest.config.js                    # Jest config
└── README.md                         # This file
```

---

## 🗄️ Database Schema

### **Entity-Relationship Diagram**

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│  companies  │       │ user_companies   │       │    users    │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ user_id (FK)     │   ┌───│ id (PK)     │
│ name        │   └──→│ company_id (FK)  │←──┘   │ email       │
│ created_at  │       └──────────────────┘       │ first_name  │
└─────────────┘                                  │ last_name   │
                                                 │ phone       │
                      ┌──────────────────┐       │ is_active   │
                      │ password_tokens  │       │ has_password│
                      ├──────────────────┤       │ password_hash
                      │ id (PK)          │       │ created_at  │
                      │ user_id (FK)     │───────│             │
                      │ token_hash       │       └─────────────┘
                      │ used             │
                      │ created_at       │
                      └──────────────────┘
```

### **Key Features**

- **Many-to-Many Relationship**: Users can belong to multiple companies
- **One-time Tokens**: Password tokens can only be used once
- **Token Expiration**: Tokens expire after configurable time (default: 12 hours)
- **Indexed Queries**: Optimized indexes for email, token_hash, and foreign keys

---

## 🔒 Security Features

| Feature            | Implementation        | Purpose                                         |
| ------------------ | --------------------- | ----------------------------------------------- |
| Password Hashing   | Argon2id              | OWASP recommended, memory-hard algorithm        |
| Token Storage      | SHA-256 hashing       | Secure token storage (never store plain tokens) |
| Authentication     | HTTP Basic Auth       | Simple, secure auth for internal endpoints      |
| Input Validation   | AJV JSON Schema       | Prevent malformed data, XSS attacks             |
| SQL Injection      | Parameterized queries | All queries use placeholders (?)                |
| Rate Limiting      | In-memory limiter     | 10 requests/min per IP (configurable)           |
| HTTP Headers       | Helmet.js             | XSS, CSRF, clickjacking protection              |
| Transaction Safety | Auto-rollback         | Data consistency on errors                      |
| Input Sanitization | validator.js          | Escape HTML, normalize inputs                   |
| Token Expiry       | Time-based validation | Prevent token reuse after expiration            |

### **Security Best Practices**

✅ **Never store plain passwords** - Always use Argon2 hashing  
✅ **Never store plain tokens** - Always hash with SHA-256  
✅ **Use HTTPS in production** - Encrypt all traffic  
✅ **Rotate secrets regularly** - Change JWT_SECRET, API keys  
✅ **Implement proper CORS** - Whitelist allowed origins  
✅ **Use environment variables** - Never commit secrets to Git  
✅ **Enable database SSL** - Encrypt database connections  
✅ **Monitor failed auth attempts** - Detect brute force attacks

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual services with mocked dependencies
- **Mocked Interfaces**: Use Jest mocks for repository interfaces
- **Transaction Testing**: Verify rollback on errors
- **Domain Error Testing**: Test all custom error scenarios

### Example Test

```typescript
it('should throw CompanyNotFoundError if company does not exist', async () => {
  // Arrange
  mockCompanyRepo.findById.mockResolvedValue(null);

  // Act & Assert
  await expect(boardingService.onboardUser(validData)).rejects.toThrow(CompanyNotFoundError);

  await expect(boardingService.onboardUser(validData)).rejects.toMatchObject({
    statusCode: 404,
    errorCode: 'COMPANY_NOT_FOUND',
  });
});
```

---

## 🛠️ Development

### Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Setup MySQL locally
mysql -u root -p < migrations/001_create_schema.sql
mysql -u root -p < migrations/002_seed_companies.sql
mysql -u root -p < migrations/003_add_indexes.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your local MySQL credentials

# 4. Run in development mode (with hot reload)
npm run dev
```

### Available Scripts

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start dev server with hot reload (ts-node-dev) |
| `npm run build`         | Compile TypeScript to JavaScript               |
| `npm start`             | Start production server (requires build)       |
| `npm run lint`          | Run ESLint on src/                             |
| `npm run format`        | Format code with Prettier                      |
| `npm test`              | Run Jest tests                                 |
| `npm run test:watch`    | Run tests in watch mode                        |
| `npm run test:coverage` | Generate coverage report                       |

### Environment Variables

Key configuration options in `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=boarding_user
DB_PASSWORD=boarding_pass
DB_NAME=boarding

# Application
PORT=3000
NODE_ENV=development

# Security
APP_BASIC_USER=internal-client
APP_BASIC_PASSWORD=supersecretpassword
JWT_SECRET=your-super-secret-key-min-32-chars

# Token Configuration
TOKEN_EXPIRY_HOURS=12

# Password Hashing
PASSWORD_HASH_ALGO=argon2  # Options: argon2, bcrypt

# Logging
LOG_LEVEL=debug  # Options: error, warn, info, debug

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000
```

---

## 🐛 Troubleshooting

### Docker Issues

**Problem**: Port 3306 already in use

```bash
# Stop local MySQL
sudo service mysql stop

# Or change port in docker-compose.yml
ports:
  - "3307:3306"  # Use different host port
```

**Problem**: Database not ready

```bash
# Check logs
docker-compose logs db

# Wait for health check (should show "healthy")
docker-compose ps

# Restart services
docker-compose restart
```

**Problem**: App container crashes

```bash
# Check logs
docker-compose logs app

# Rebuild with no cache
docker-compose up -d --build --force-recreate
```

### API Issues

**Problem**: 401 Unauthorized

- Verify Authorization header format: `Basic <base64>`
- Check credentials match `.env` file
- Generate correct base64:
  ```bash
  echo -n 'internal-client:supersecretpassword' | base64
  ```

**Problem**: 404 Company not found

- Check available companies in Adminer
- Default IDs: 1 (ACME Corp), 2 (Globex), 3 (Initech)
- Verify seed script ran: `migrations/002_seed_companies.sql`

**Problem**: Connection refused

- Wait for health check: `docker-compose ps` (should show "healthy")
- Check app logs: `docker-compose logs app`
- Verify port 3000 is not in use

**Problem**: Slow queries

```bash
# Check if indexes are created
mysql -u boarding_user -p boarding
SHOW INDEX FROM users;
SHOW INDEX FROM password_tokens;

# Run index migration if missing
mysql -u boarding_user -p boarding < migrations/003_add_indexes.sql
```

---

## 📚 Code Quality

### SOLID Principles Implementation

| Principle                 | Implementation                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Each class has one reason to change (Controller→HTTP, Service→Business Logic, Repository→Data Access) |
| **O**pen/Closed           | Easy to extend (new repositories, services) without modifying existing code                           |
| **L**iskov Substitution   | Can swap repository implementations (MySQL→MongoDB) via interfaces                                    |
| **I**nterface Segregation | Small, focused interfaces (IUserRepository, ICompanyRepository)                                       |
| **D**ependency Inversion  | Services depend on interfaces, not concrete classes                                                   |

### Design Patterns

| Pattern                  | Usage                                               |
| ------------------------ | --------------------------------------------------- |
| **Repository Pattern**   | Abstract data access behind interfaces              |
| **Service Pattern**      | Encapsulate business logic with transactions        |
| **Dependency Injection** | Loose coupling via TypeDI container                 |
| **Factory Pattern**      | `createApp()`, `createDbPool()` functions           |
| **Middleware Pattern**   | Express middleware chain (auth, validation, errors) |
| **DTO Pattern**          | Type-safe data transfer between layers              |

### Domain-Driven Design

- **Domain Errors**: Custom errors with semantic meaning (`CompanyNotFoundError`, `TokenExpiredError`)
- **Business Rules**: Encapsulated in service layer (token expiry, password validation)
- **Transaction Boundaries**: Services manage transactions, repositories execute queries
- **Type Safety**: Strong typing across all layers (entities, DTOs, responses)

---

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong `JWT_SECRET` (min 32 chars, random)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS
- [ ] Configure production CORS origins
- [ ] Use Redis for rate limiting (replace in-memory)
- [ ] Enable database SSL connections
- [ ] Set up monitoring (Datadog, New Relic)
- [ ] Configure log aggregation (ELK, CloudWatch)
- [ ] Use secret management (AWS Secrets Manager, Vault)
- [ ] Set up database backups
- [ ] Configure connection pooling limits
- [ ] Enable health check endpoints
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling

### Docker Production Build

```bash
# Build optimized image
docker build -t boarding-api:latest .

# Run with production settings
docker run -d \
  --name boarding-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=prod-db.example.com \
  boarding-api:latest
```

---

## 🧪 Testing with cURL

### 1. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

### 2. Create a User

```bash
curl -X POST http://localhost:3000/api/v1/internal/boarding \
  -H "Authorization: Basic aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@example.com",
    "phone": "+48987654321",
    "first_name": "Jane",
    "last_name": "Smith",
    "company_id": 2
  }'
```

### 3. Set Password (replace TOKEN)

```bash
TOKEN="your_token_from_step_2"

curl -X POST http://localhost:3000/api/v1/internal/set-password/$TOKEN \
  -H "Authorization: Basic aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePassword123!"
  }'
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👤 Author

**Marcin Kopa**

---
