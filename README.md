# HTTP Monitor - Backend

A NestJS-based backend service that monitors HTTP responses from httpbin.org every 5 minutes, stores the data in PostgreSQL, and broadcasts updates via WebSocket.

## 🚀 Features

- ✅ Automated HTTP pings to httpbin.org every 5 minutes
- ✅ Random JSON payload generation for each request
- ✅ PostgreSQL database for persistent storage
- ✅ Real-time WebSocket updates
- ✅ RESTful API for historical data
- ✅ Statistical analysis for anomaly detection
- ✅ Comprehensive error handling
- ✅ TypeScript for type safety

## 🛠️ Technology Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Real-time**: Socket.io
- **HTTP Client**: Axios
- **Validation**: class-validator
- **Testing**: Jest

## 📋 Prerequisites

- Node.js 18+ 
- Docker (for PostgreSQL)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd http-monitor-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=http_monitor
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

5. **Run the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 📡 API Endpoints

### Ping Endpoints

#### `POST /api/ping/trigger`
Manually trigger an HTTP ping to httpbin.org

**Response:**
```json
{
  "success": true,
  "message": "Ping executed successfully",
  "data": {
    "id": "uuid",
    "timestamp": "2026-01-16T20:00:00.000Z",
    "statusCode": 200,
    "responseTime": 245.5,
    ...
  }
}
```

### Response Endpoints

#### `GET /api/responses`
Get paginated list of HTTP responses

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### `GET /api/responses/:id`
Get a single response by ID

#### `GET /api/responses/latest/data`
Get the most recent response (for polling fallback)

#### `GET /api/responses/stats/summary`
Get statistical summary for anomaly detection

**Query Parameters:**
- `windowHours` (optional): Time window in hours (default: 24)

**Response:**
```json
{
  "count": 288,
  "mean": 234.5,
  "stdDev": 45.2,
  "min": 150.0,
  "max": 450.0,
  "windowHours": 24
}
```

## 🔌 WebSocket Events

### Client → Server
- `connection`: Client connects
- `disconnect`: Client disconnects

### Server → Client
- `new-response`: Emitted when a new HTTP response is recorded
  ```json
  {
    "id": "uuid",
    "timestamp": "2026-01-16T20:00:00.000Z",
    "requestPayload": {...},
    "responseData": {...},
    "statusCode": 200,
    "responseTime": 245.5,
    "headers": {...}
  }
  ```

## 🗄️ Database Schema

### `http_responses` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| timestamp | TIMESTAMP | When the request was made |
| requestPayload | JSONB | JSON payload sent to httpbin.org |
| responseData | JSONB | Response data from httpbin.org |
| statusCode | INTEGER | HTTP status code |
| responseTime | FLOAT | Response time in milliseconds |
| headers | JSONB | Response headers |
| createdAt | TIMESTAMP | Record creation time |

**Indexes:**
- `idx_timestamp` on `timestamp` (DESC)
- `idx_status_code` on `statusCode`
- `idx_response_time` on `responseTime`

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Core Component: PingService

The `PingService` is identified as the core component for comprehensive testing because:

1. **Critical Business Logic**: Orchestrates the main functionality
2. **Complex Operations**: Handles HTTP requests, timing, error handling
3. **Multiple Dependencies**: Interacts with database and WebSocket
4. **Data Integrity**: Ensures accurate response time measurement
5. **Error Scenarios**: Must handle network failures gracefully

**Test Coverage Goal**: 90%+

## 🚀 Deployment

### Railway (Recommended)

1. **Create a new project** on Railway
2. **Add PostgreSQL database** service
3. **Deploy from GitHub**:
   - Connect your repository
   - Set build command: `npm run build`
   - Set start command: `npm run start:prod`
4. **Set environment variables**:
   ```
   DB_HOST=<railway-postgres-host>
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=<railway-generated>
   DB_NAME=railway
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```

### External Cron Setup

Since free hosting platforms may sleep, use an external cron service:

1. **Sign up** at [cron-job.org](https://cron-job.org)
2. **Create a new cron job**:
   - URL: `https://your-backend.railway.app/api/ping/trigger`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Method: POST
3. **Enable monitoring** to track execution

## 🏗️ Architecture

```
┌─────────────────┐
│  External Cron  │
│  (cron-job.org) │
└────────┬────────┘
         │ POST /api/ping/trigger
         │ (every 5 minutes)
         ▼
┌─────────────────────────────────┐
│         NestJS Backend          │
│                                 │
│  ┌──────────────────────────┐  │
│  │     PingService          │  │
│  │  - Generate payload      │  │
│  │  - Execute HTTP request  │  │
│  │  - Measure response time │  │
│  │  - Save to database      │  │
│  │  - Broadcast via WS      │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  WebSocket Gateway       │  │
│  │  - Broadcast updates     │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  REST API Controllers    │  │
│  │  - Historical data       │  │
│  │  - Statistics            │  │
│  └──────────────────────────┘  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Railway)     │
└─────────────────┘
```

## 📝 Design Decisions

### Why PostgreSQL?
- **Structured Data**: HTTP responses have consistent schema
- **JSONB Support**: Flexible storage for payloads and responses
- **Time-Series Queries**: Excellent for historical analysis
- **Free Tier**: Available on Railway with persistent storage
- **Production Ready**: ACID compliance and reliability

### Why External Cron?
- **Reliability**: Free hosting platforms sleep during inactivity
- **Simplicity**: No need for complex keep-alive mechanisms
- **Monitoring**: External service provides execution tracking
- **Scalability**: Easy to adjust frequency without code changes

### Why TypeORM?
- **Type Safety**: Full TypeScript support
- **Migrations**: Database schema versioning
- **Active Record**: Intuitive API for database operations
- **NestJS Integration**: First-class support

## 🔍 Assumptions

1. **Data Retention**: All historical data is kept indefinitely
2. **Concurrent Users**: Low volume (< 100 simultaneous connections)
3. **Authentication**: Not required for MVP
4. **Rate Limiting**: Not needed (httpbin.org has no strict limits)
5. **Time Zone**: All timestamps stored in UTC
6. **Payload Size**: Random payloads < 1KB
7. **Response Size**: httpbin.org responses < 10KB

## 🚧 Future Improvements

### Short-term
- [ ] Add authentication (JWT)
- [ ] Implement rate limiting
- [ ] Add request/response size limits
- [ ] Implement data retention policy
- [ ] Add health check endpoint
- [ ] Add metrics endpoint (Prometheus)

### Medium-term
- [ ] Multi-endpoint monitoring
- [ ] Custom alert rules
- [ ] Advanced anomaly detection with ML
- [ ] Historical trend analysis
- [ ] API key management

### Long-term
- [ ] Distributed monitoring (multiple regions)
- [ ] SLA tracking and reporting
- [ ] Integration with monitoring tools
- [ ] White-label solution

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# View PostgreSQL logs
docker logs http-monitor-db

# Restart PostgreSQL
docker compose restart
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### TypeORM Synchronization Issues
If you encounter schema issues in development:
```bash
# Drop and recreate database
docker exec http-monitor-db psql -U postgres -c "DROP DATABASE http_monitor;"
docker exec http-monitor-db psql -U postgres -c "CREATE DATABASE http_monitor;"

# Restart backend
npm run start:dev
```

## 📄 License

MIT

## 👥 Contributors

Built for BizScout Engineering Team Take-Home Test

---

**Note**: This is a demonstration project. For production use, implement proper authentication, rate limiting, and monitoring.
