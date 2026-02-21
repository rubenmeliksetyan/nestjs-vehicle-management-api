# Redis Scaling Plan for Car Location Queries

## Objective

Scale nearest-cars and live car-location features for high traffic (for example, 100,000 users in one city) while keeping low latency and stable database load.

## Current State

- Nearest cars currently use MySQL distance query logic (`ST_Distance_Sphere`) with a bounding-box prefilter.
- This is correct and works well for moderate traffic.
- At high concurrency, repeated geo reads can still overload MySQL.

## Why Redis

- Redis provides in-memory geo indexing (`GEOADD`, `GEOSEARCH`) with very low read latency.
- Redis can absorb heavy read traffic and reduce pressure on MySQL.
- Redis pub/sub supports near-real-time car position updates for map clients.

## Target Architecture

- **MySQL**: source of truth for cars, categories, tags, and persistent location.
- **Redis**: hot geo index and short-lived read cache.
- **API service**: orchestrates read path, write path, and fallback behavior.
- **Optional queue/worker**: coalesces frequent location updates before MySQL writes.

## Redis Data Model

- Geo keys:
  - `geo:cars:city:{cityId}:available`
  - Member: `carId`
  - Coordinates: car longitude/latitude
- Car metadata cache:
  - `car:meta:{carId}` (JSON or hash: make, model, categoryId, tags, status, updatedAt)
- Optional viewport clusters:
  - `geo:cluster:{cityId}:{zoom}:{tile}`

## Read Path (Nearest Cars)

1. Client sends `latitude`, `longitude`, `radiusKm`, and filters.
2. API calls Redis `GEOSEARCH` to get candidate car IDs in radius.
3. API loads metadata (from Redis hashes or MySQL for cache misses).
4. API applies filters (category, tags, status).
5. API returns sorted results by distance.
6. If Redis is unavailable, API falls back to MySQL spatial query.

## Write Path (Car Location Updates)

1. Driver/car tracker sends location update.
2. API validates payload and updates Redis geo key immediately.
3. API updates cached metadata (status, timestamp).
4. API persists to MySQL asynchronously (batched/coalesced).

## Live Map Updates

- Use WebSocket channels per city + viewport/geohash bucket.
- Emit delta events only:
  - `car_entered_view`
  - `car_moved`
  - `car_left_view`
- Avoid full map refresh payloads.
- Throttle updates per car (for example, every 1-3 seconds) to control event volume.

## Consistency Strategy

- MySQL remains the source of truth.
- Redis is eventually consistent and optimized for read speed.
- Reconciliation job (periodic):
  - compare recent MySQL updates with Redis data
  - repair missing/stale geo members

## Performance and Reliability Controls

- Use Redis connection pooling and command timeouts.
- Add circuit breaker for Redis outages; auto-fallback to MySQL.
- Add request rate limits for nearest-cars and websocket subscriptions.
- Keep payloads small (pagination/limit, strict fields).

## Phased Rollout

### Phase 1: Read Acceleration

- Add Redis geo keys and read path for nearest-cars.
- Keep MySQL fallback enabled.
- Validate latency and correctness in production shadow mode.

### Phase 2: Realtime Delivery

- Add WebSocket live updates with delta events.
- Partition subscribers by city and viewport/geohash.

### Phase 3: Write Optimization

- Add queue/worker for batched location persistence.
- Add reconciliation and observability dashboards.

## Key Metrics (Go/No-Go)

- p95 nearest-cars latency: target < 100ms (cache hit path).
- Redis cache hit rate: target > 90% for active cities.
- MySQL read reduction for geo queries: target > 70%.
- WebSocket reconnect/error rate: stable under peak load.

## Risks and Mitigations

- **Risk**: stale Redis positions.
  - **Mitigation**: TTL + reconciliation + timestamp validation.
- **Risk**: Redis outage.
  - **Mitigation**: fallback to MySQL + circuit breaker.
- **Risk**: high write throughput from frequent GPS updates.
  - **Mitigation**: coalescing and batch persistence.