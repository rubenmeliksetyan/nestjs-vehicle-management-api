# Vehicle Management API

NestJS API for managing vehicles, categories, tags and listings. Public car listing with pagination and search; authenticated endpoints for admin CRUD and for nearest cars (Haversine).

## Requirements

- **Node.js 20 LTS** or newer (`engines.node` in `package.json`). Use `nvm use` if you have [nvm](https://github.com/nvm-sh/nvm).
- MySQL (local or Docker).

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your database and JWT settings. Key variables:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` | Secret for JWT signing |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `3600s`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin user created by seed |

## Database

Run migrations and seed (creates admin user and sample data):

```bash
npm run migration:run
npm run seed
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

API base: `http://localhost:3000/api/v1` (or your `PORT`).

## Docker

Use the project's Docker setup to run the app and MySQL. From the repo root:

```bash
docker compose up -d
```

Then run migrations and seed against the containerized DB (see `.env` / `docker-compose` for connection details).

## API overview

- **Auth** (no prefix): `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me` (Bearer).
- **Public cars**: `GET /cars` (pagination, search, categoryId, tagIds), `GET /cars/grouped-by-category`.
- **Me** (Bearer): `GET /me/nearest-cars?latitude=&longitude=&radiusKm=10`.
- **Admin** (Bearer, admin role): categories `GET/POST/PATCH/DELETE /categories`, tags `GET/POST/PATCH/DELETE /tags`, cars `GET/POST/PATCH/DELETE /admin/cars`.

## Swagger

With the app running:

**http://localhost:3000/api/docs**

Use “Authorize” with a Bearer token (e.g. from signin) for protected routes.

## Postman

Import the collection:

**File → Import →** choose `postman/Vehicle-Management-API.postman_collection.json`.

Collection variable `baseUrl` defaults to `http://localhost:3000/api/v1`. Run **Signin** once; the script stores the token in `accessToken` for protected requests.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build |
| `npm run start` / `start:dev` / `start:prod` | Run app |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run migration:run` | Run DB migrations |
| `npm run migration:generate -- --name <name>` | Generate migration |
| `npm run seed` | Seed DB (admin + sample data) |
