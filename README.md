# HTTP Monitor Backend

A NestJS service that monitors HTTP responses, stores data in PostgreSQL, and provides real-time updates via WebSockets.

## Prerequisites

- Node.js 18+
- Docker
- npm

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   _Update `.env` with your database credentials and port settings._

3. **Start database**
   ```bash
   docker compose up -d
   ```

## Development

```bash
# Start in watch mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## API

| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| POST   | `/api/ping/trigger`            | Manually trigger a ping |
| GET    | `/api/responses`               | Get paginated history   |
| GET    | `/api/responses/:id`           | Get specific response   |
| GET    | `/api/responses/latest/data`   | Get most recent data    |
| GET    | `/api/responses/stats/summary` | Get statistical summary |

## WebSocket

- **Event:** `new-response`
- **Description:** Broadcasts every time a new response is recorded.

## Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```
