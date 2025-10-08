# Boarding System API

> Professional user onboarding system with Express.js + TypeScript + MySQL + Dependency Injection

## 🎯 Architecture Highlights

- ✅ **Proper Dependency Injection** with TypeDI
- ✅ **3-Layer Architecture** (Controllers → Services → Repositories)
- ✅ **SOLID Principles** fully implemented
- ✅ **Transaction Management** for data consistency
- ✅ **Type Safety** with TypeScript interfaces and DTOs
- ✅ **Production-Ready** error handling and logging

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation & Run

```bash
# 1. Clone repository
git clone git@github.com:mkopa/boarding-system.git
cd boarding-system

# 2. Install dependencies
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
  "timestamp": "2025-10-08T10:00:00.000Z",
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

---

### 1. User Boarding (Create User)

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

- `email`: required, valid email format, min 5 chars, unique
- `first_name`: required, min 1 char
- `last_name`: required, min 1 char
- `phone`: optional, min 5 chars
- `company_id`: required, integer ≥ 1, must exist in database

**Success Response** (201):

```json
{
  "message": "User created successfully",
  "token": "a1b2c3d4e5f6...64chars"
}
```

**Error Responses**:

409 Conflict:

```json
{
  "error": "User with this email already exists"
}
```

400 Bad Request:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "must match format \"email\""
    }
  ]
}
```

404 Not Found:

```json
{
  "error": "Company with id 999 does not exist"
}
```

---

### 2. Set Password (One-time Token)

**Endpoint**: `POST /api/v1/internal/set-password/:token`

**Headers**:

```
Authorization: Basic aW50ZXJuYWwtY2xpZW50OnN1cGVyc2VjcmV0cGFzc3dvcmQ=
Content-Type: application/json
```

**URL Parameters**:

- `token`: 64-character hexadecimal string received from boarding endpoint

**Request Body**:

```json
{
  "password": "MySecureP@ssw0rd123"
}
```

**Validation Rules**:

- `password`: minimum 12 characters, must contain letters and numbers
- Token must be valid (not used, not expired)
- Token expires after 12 hours

**Success Response** (200):

```json
{
  "success": true,
  "message": "Password set successfully"
}
```

---

## 🏗️ Architecture

### **3-Layer Architecture with Dependency Injection**

```
┌─────────────────────────────────────────────────┐
│                   HTTP Layer                    │
├─────────────────────────────────────────────────┤
│  Controllers (HTTP Request/Response)            │
│  • BoardingController                           │
│    - createUser()                               │
│    - setPassword()                              │
└────────────────┬────────────────────────────────┘
                 │ injects
┌────────────────▼────────────────────────────────┐
│              Business Logic Layer               │
├─────────────────────────────────────────────────┤
│  Services (Business Rules & Transactions)       │
│  • BoardingService                              │
│    - onboardUser()                              │
│    - setPasswordFromToken()                     │
└────────────────┬────────────────────────────────┘
                 │ injects
┌────────────────▼────────────────────────────────┐
│               Data Access Layer                 │
├─────────────────────────────────────────────────┤
│  Repositories (Database Operations)             │
│  • UserRepository                               │
│  • CompanyRepository                            │
│  • TokenRepository                              │
└─────────────────────────────────────────────────┘
```

### **Dependency Injection Flow**

```typescript
// 1. Bootstrap registers dependencies
Container.set('DB_POOL', pool);

// 2. TypeDI automatically injects dependencies
@Service()
class UserRepository {
  constructor(@Inject('DB_POOL') private pool: Pool) {}
}

@Service()
class BoardingService {
  constructor(
    private userRepo: UserRepository, // Auto-injected
    private companyRepo: CompanyRepository, // Auto-injected
    private tokenRepo: TokenRepository // Auto-injected
  ) {}
}

@Service()
class BoardingController {
  constructor(private service: BoardingService) {} // Auto-injected
}

// 3. Routes get controller from container
const controller = Container.get(BoardingController);
router.post('/boarding', controller.createUser.bind(controller));
```

---

## 📁 Project Structure

```
boarding-service/
├── src/
│   ├── app/
│   │   ├── app.ts                          # Express configuration
│   │   ├── middlewares/
│   │   │   ├── ajvValidator.ts             # JSON Schema validation
│   │   │   ├── basicAuth.ts                # Basic Auth middleware
│   │   │   ├── errorHandler.ts             # Error handling
│   │   │   └── rateLimiter.ts              # Rate limiting
│   │   └── routes/
│   │       ├── internal.ts                 # Internal endpoints
│   │       └── health.ts                   # Health check
│   ├── controllers/                        # HTTP Layer
│   │   └── BoardingController.ts           # Request/Response handling
│   ├── services/                           # Business Logic Layer
│   │   └── BoardingService.ts              # Business rules
│   ├── repositories/                       # Data Access Layer
│   │   ├── UserRepository.ts               # User data operations
│   │   ├── CompanyRepository.ts            # Company data operations
│   │   └── TokenRepository.ts              # Token data operations
│   ├── types/
│   │   └── express.d.ts                    # TypeScript declarations
│   ├── utils/
│   │   ├── crypto.ts                       # Hashing & token generation
│   │   └── logger.ts                       # Winston logger
│   ├── validation/
│   │   └── schemas/
│   │       ├── boarding.schema.json        # Boarding validation
│   │       └── setPassword.schema.json     # Password validation
│   ├── db/
│   │   └── mysql.ts                        # Database pool
│   └── index.ts                            # Application entry point
├── migrations/
│   ├── 001_create_schema.sql               # Database schema
│   └── 002_seed_companies.sql              # Seed data
├── postman/
│   └── postman_collection.json             # API collection
├── docker-compose.yml                      # Docker services
├── Dockerfile                              # App container
├── .env                                    # Environment variables
├── package.json                            # Dependencies
├── tsconfig.json                           # TypeScript config
└── README.md                               # This file
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
                                                 │ is_active   │
                                                 │ has_password│
                      ┌──────────────────┐       │ password_hash
                      │ password_tokens  │       │ created_at  │
                      ├──────────────────┤       └─────────────┘
                      │ id (PK)          │            ▲
                      │ user_id (FK)     │────────────┘
                      │ token_hash       │
                      │ used             │
                      │ created_at       │
                      └──────────────────┘
```

### **Tables**

**companies**

- `id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `name` VARCHAR(255) NOT NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**users**

- `id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `email` VARCHAR(255) NOT NULL UNIQUE
- `phone` VARCHAR(50)
- `first_name` VARCHAR(100)
- `last_name` VARCHAR(100)
- `is_active` TINYINT(1) DEFAULT 0
- `has_password` TINYINT(1) DEFAULT 0
- `password_hash` VARCHAR(255)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**user_companies** (many-to-many)

- `user_id` BIGINT (FK → users.id)
- `company_id` BIGINT (FK → companies.id)
- PRIMARY KEY (user_id, company_id)

**password_tokens**

- `id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `user_id` BIGINT (FK → users.id)
- `token_hash` VARCHAR(255) NOT NULL (indexed)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `used` TINYINT(1) DEFAULT 0

---

## 🔒 Security Features

- ✅ **Argon2** password hashing (OWASP recommended)
- ✅ **SHA-256** token hashing for storage
- ✅ **Basic Auth** for internal endpoints
- ✅ **Helmet.js** for HTTP headers security
- ✅ **AJV validation** for input sanitization
- ✅ **SQL injection prevention** via parameterized queries
- ✅ **Token expiration** (12 hours configurable)
- ✅ **One-time token usage** enforcement
- ✅ **Rate limiting** (10 req/min per IP)
- ✅ **Transaction management** for data consistency

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

## 🛠️ Development

### Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Setup MySQL locally
mysql -u root -p < migrations/001_create_schema.sql
mysql -u root -p < migrations/002_seed_companies.sql

# 3. Configure environment
cp .env.dist .env
# Edit .env with your local MySQL credentials

# 4. Run in development mode (with hot reload)
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Environment Variables

See `.env` file for all configuration options:

- Database connection
- Basic Auth credentials
- Token expiry time
- Password hashing algorithm
- Log level
- Rate limiting settings

---

## 🐛 Troubleshooting

### Docker Issues

**Port 3306 already in use**

```bash
# Stop local MySQL
sudo service mysql stop

# Or change port in docker-compose.yml
```

**Database not ready**

```bash
# Check logs
docker-compose logs db

# Wait for health check
docker-compose ps
```

**App container crashes**

```bash
# Check logs
docker-compose logs app

# Rebuild
docker-compose up -d --build
```

### API Issues

**401 Unauthorized**

- Verify Authorization header format
- Check credentials in .env match your request
- Base64 encode: `echo -n 'internal-client:supersecretpassword' | base64`

**404 Company not found**

- Check available companies in Adminer
- Default companies: 1 (ACME Corp), 2 (Globex), 3 (Initech)

**Connection refused**

- Wait for database health check: `docker-compose ps`
- Check app logs: `docker-compose logs app`

---

## 🎓 Code Quality

### SOLID Principles

- **S**ingle Responsibility: Each class has one reason to change
- **O**pen/Closed: Easy to extend without modifying existing code
- **L**iskov Substitution: Can swap implementations via DI
- **I**nterface Segregation: Small, focused interfaces (DTOs)
- **D**ependency Inversion: Depend on abstractions, not concretions

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Pattern**: Business logic encapsulation
- **Dependency Injection**: Loose coupling via TypeDI
- **Factory Pattern**: createApp(), createDbPool()
- **Middleware Pattern**: Express middleware chain

---

## 📝 License

MIT License - see LICENSE file

---

## 👤 Author

Marcin Kopa

---
