# ShopSphere — Full-Stack E-Commerce Web Application

A production-style e-commerce platform with a customer storefront and an admin console, built on the MERN stack.

**Stack:** React 18 · Vite · Tailwind CSS · Node.js · Express · MongoDB Atlas · Mongoose · JWT · bcrypt · Cloudinary
**Deployment:** Frontend → Vercel · Backend → Render · Database → MongoDB Atlas · Images → Cloudinary

---

## Table of contents

1. [What it does](#what-it-does)
2. [Architecture](#architecture)
3. [Project structure](#project-structure)
4. [Data model](#data-model)
5. [API reference](#api-reference)
6. [Running it locally](#running-it-locally)
7. [Environment variables](#environment-variables)
8. [Seeding the database](#seeding-the-database)
9. [Testing with Postman](#testing-with-postman)
10. [Deployment](#deployment)
11. [Security notes](#security-notes)

---

## What it does

### Customer

| Area | Capabilities |
|---|---|
| **Account** | Register, log in, log out, forgot password, reset password, change password, edit profile, manage saved addresses |
| **Browsing** | Product grid, full-text-ish name/brand search, filter by category / brand / price range / rating / availability, sort by price ↑↓ / newest / rating / popularity, server-side pagination |
| **Product page** | Image gallery, pricing with discount, live stock state, ratings and reviews, related products |
| **Reviews** | Write, edit and delete your own review (one per product); purchases are flagged as verified |
| **Cart** | Add, increase, decrease, remove, clear; subtotal, savings, shipping, tax and total; stock-aware quantity caps; guest cart in browser storage that merges into the server cart on login |
| **Checkout** | Simple checkout (no payment gateway) — name, phone and shipping address, then Cash on Delivery |
| **Orders** | Order history with status filters, full order detail, live status timeline, self-service cancellation while Pending or Confirmed |

### Admin

| Area | Capabilities |
|---|---|
| **Dashboard** | Revenue, orders, products, customers, recent orders, stock health, "needs attention" queue |
| **Analytics** | Sales & revenue over time, order statistics by status, top-selling products, revenue by category, customer growth and top spenders, inventory and stock insights |
| **Products** | Full CRUD, multi-image upload/replacement via Cloudinary, pricing and discounts, stock adjustment, category and brand assignment, archive instead of delete when orders reference the product |
| **Categories** | Create, read, update, delete; deletion blocked while products still reference the category |
| **Orders** | All orders with filters, full customer and shipping detail, workflow-validated status transitions, status history |
| **Customers** | List and search, per-customer spend and order history, activate/deactivate, promote/demote admin |

Every analytics figure is computed live with MongoDB aggregation pipelines. Nothing is hard-coded.

---

## Architecture

### Request flow

```
React (Vite) ──HTTPS + JWT Bearer──▶ Express ──▶ Mongoose ──▶ MongoDB Atlas
    │                                   │
    │                                   └──▶ Cloudinary (image upload stream)
    └── Tailwind UI, Context state, axios service layer
```

### Frontend design system

Tokens live in `frontend/tailwind.config.js` (violet `brand` primary, gold `accent`, slate `ink` neutrals, deep-navy `night` surfaces, semantic success/warning/danger/info) with shared classes in `src/index.css` (`.card`, `.glass`, `.input-base`, `.reveal`, `.eyebrow`, `.skeleton`). Motion is CSS-only — transforms and opacity, a shared IntersectionObserver for scroll reveals, route-level fade on navigation — and every animation collapses under `prefers-reduced-motion`. Chart colours were validated for colour-blind separation against the white card surface; the one low-contrast hue (amber) is always paired with direct value labels.

### Backend layering

```
routes/        HTTP surface only — path, middleware chain, controller
  ↓
middleware/    auth (JWT + roles), validation, uploads, rate limits, errors
  ↓
controllers/   request → response translation; no business rules
  ↓
services/      business logic: pricing, stock reservation, analytics, Cloudinary
  ↓
models/        Mongoose schemas, indexes, hooks, instance methods
```

Key decisions:

- **The client is never trusted for money.** Checkout accepts only contact and address fields. Item prices, quantities, shipping, tax and the order total are all recomputed on the server from the persisted cart and the live product documents.
- **Stock is reserved atomically.** `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` makes the update itself the concurrency check, so two simultaneous checkouts can never oversell a unit. Partial reservations are rolled back if any line fails.
- **Order lines are snapshots.** Name, image and unit price are copied onto the order, so editing or deleting a product later never rewrites order history.
- **`effectivePrice` is denormalized** onto each product (`discountPrice ?? price`), so price filtering and price sorting run as indexed MongoDB queries rather than in application code.
- **Errors funnel through one handler.** Mongoose validation/cast/duplicate-key errors, Multer errors, JWT errors and Cloudinary errors are each translated into a consistent `{ success, message, errors }` envelope with the right status code.

---

## Project structure

```
E-Commerce Web Application/
├── backend/
│   ├── src/
│   │   ├── config/        env validation, database, Cloudinary, CORS allow-list
│   │   ├── models/        User, Category, Product, Review, Cart, Order
│   │   ├── controllers/   auth, user, product, category, cart, order, review, analytics
│   │   ├── routes/        one router per resource + index
│   │   ├── middleware/    auth, validate, upload, rateLimit, error
│   │   ├── services/      cart, order, product, analytics, cloudinary, email
│   │   ├── validations/   express-validator chains per resource
│   │   ├── utils/         ApiError, ApiResponse, asyncHandler, token, pagination, constants, logger
│   │   ├── seed/          seed data + CLI
│   │   ├── app.js         Express app assembly
│   │   └── server.js      bootstrap, graceful shutdown
│   ├── postman/           collection + environment (95 requests)
│   ├── render.yaml        Render blueprint
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/           axios client + one module per resource
    │   ├── components/
    │   │   ├── ui/        Button, Input, Modal, Badge, Pagination, DataTable, Rating, Toast, states
    │   │   ├── layout/    Navbar (categories menu, drawer), Footer, MobileTabBar, Logo
    │   │   ├── product/   ProductCard, ProductGrid, FilterSidebar, Gallery, QuantityStepper, ReviewSection
    │   │   ├── cart/      CartItemRow, OrderSummary
    │   │   ├── admin/     StatCard, Charts
    │   │   └── common/    RouteGuards, ErrorBoundary, PageHeader, OrderTimeline, Motion (Reveal, PageTransition, Aurora)
    │   ├── context/       Auth, Cart, Toast providers
    │   ├── hooks/         useAuth, useCart, useToast, useForm, useApiResource, useDebounce, useReveal
    │   ├── layouts/       Public, Auth, Admin shells
    │   ├── pages/         storefront + auth/ + customer/ + admin/
    │   ├── routes/        route table with guards and lazy-loaded admin
    │   └── utils/         format, validators, cn, storage
    ├── vercel.json
    └── .env.example
```

---

## Data model

```
User ──1:1──▶ Cart ──*──▶ Product ◀──*── Category
 │                            ▲
 │                            │
 ├──1:*──▶ Order ──items[]────┘   (items snapshot name/price/image)
 │
 └──1:*──▶ Review ──*:1──▶ Product
```

| Collection | Notable fields | Indexes |
|---|---|---|
| **users** | name, email (unique), password (bcrypt, `select:false`), role, phone, avatar, addresses[], isActive, passwordChangedAt, resetPasswordToken (SHA-256), resetPasswordExpires | email, role |
| **categories** | name (unique), slug, description, image, isActive | slug, isActive |
| **products** | name, slug, description, price, discountPrice, **effectivePrice**, images[{url, publicId}], category→ref, brand, stock, sold, ratingsAverage, ratingsCount, isActive, isFeatured, timestamps | `{isActive, category, effectivePrice}`, `{isActive, createdAt}`, text index on name/brand/description |
| **reviews** | product→ref, user→ref, rating 1-5, comment, isVerifiedPurchase | **unique `{product, user}`**, `{product, createdAt}` |
| **carts** | user→ref (unique), items[{product→ref, quantity}] | user |
| **orders** | orderNumber, user→ref, items[] (snapshots), shippingAddress, itemsPrice, shippingPrice, taxPrice, totalPrice, status, statusHistory[], timestamps per status | orderNumber, `{user, createdAt}`, `{status, createdAt}` |

Carts deliberately store **only** product references and quantities — prices and stock are always re-read from the product collection, so a stale cart can never influence what a customer is charged.

### Order workflow

```
Pending ──▶ Confirmed ──▶ Shipped ──▶ Delivered
   │            │
   └────────────┴──▶ Cancelled      (stock returned to the catalogue)
```

Transitions are validated server-side. Customers may cancel only while Pending or Confirmed; only admins can advance a status; Delivered and Cancelled are terminal.

---

## API reference

Base URL: `/api/v1` — every response is `{ success, message, data, meta? }`.

<details>
<summary><b>Authentication</b> <code>/auth</code></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account, returns a JWT |
| POST | `/auth/login` | Public | Log in, returns a JWT |
| POST | `/auth/logout` | Public | Clear the optional cookie |
| GET | `/auth/me` | Private | Current user |
| POST | `/auth/forgot-password` | Public | Email a reset link (always 200) |
| POST | `/auth/reset-password/:token` | Public | Set a new password |
| PATCH | `/auth/change-password` | Private | Change password with the current one |
</details>

<details>
<summary><b>Products</b> <code>/products</code></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | Search + filter + sort + paginate |
| GET | `/products/filters` | Public | Categories, brands and price range |
| GET | `/products/featured` | Public | Featured products |
| GET | `/products/:idOrSlug` | Public | Detail + reviews + related |
| GET | `/products/admin/all` | Admin | Includes archived products |
| POST | `/products` | Admin | Create (multipart, up to 6 images) |
| PUT | `/products/:id` | Admin | Update, add/remove images |
| PATCH | `/products/:id/stock` | Admin | Adjust stock |
| DELETE | `/products/:id` | Admin | Delete, or archive if ordered |

Query parameters: `search`, `category` (id or slug, comma-separated), `brand`, `minPrice`, `maxPrice`, `rating`, `inStock`, `sort` (`price-asc|price-desc|newest|oldest|rating|popular`), `page`, `limit`.
</details>

<details>
<summary><b>Categories</b> <code>/categories</code></summary>

| Method | Endpoint | Access |
|---|---|---|
| GET | `/categories` | Public |
| GET | `/categories/:id` | Public |
| POST | `/categories` | Admin |
| PUT | `/categories/:id` | Admin |
| DELETE | `/categories/:id` | Admin (409 if products reference it) |
</details>

<details>
<summary><b>Cart</b> <code>/cart</code> — all private</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Cart with server-computed totals |
| POST | `/cart` | Add a product |
| POST | `/cart/merge` | Merge a guest cart after login |
| PUT | `/cart/:productId` | Set an absolute quantity (0 removes) |
| DELETE | `/cart/:productId` | Remove one line |
| DELETE | `/cart` | Clear the cart |
</details>

<details>
<summary><b>Orders</b> <code>/orders</code></summary>

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders` | Private | Checkout — server computes every amount |
| GET | `/orders/my` | Private | Own orders, paginated |
| GET | `/orders/:id` | Owner or Admin | Order detail |
| PATCH | `/orders/:id/cancel` | Owner | Cancel while Pending/Confirmed |
| GET | `/orders` | Admin | All orders + status counts |
| GET | `/orders/user/:userId` | Admin | One customer's orders |
| PATCH | `/orders/:id/status` | Admin | Workflow-validated transition |
</details>

<details>
<summary><b>Reviews</b> <code>/reviews</code></summary>

| Method | Endpoint | Access |
|---|---|---|
| GET | `/reviews/product/:productId` | Public |
| GET | `/reviews/my` | Private |
| POST | `/reviews/product/:productId` | Private (one per product) |
| PUT | `/reviews/:id` | Author |
| DELETE | `/reviews/:id` | Author or Admin |
</details>

<details>
<summary><b>Users</b> <code>/users</code></summary>

| Method | Endpoint | Access |
|---|---|---|
| GET | `/users/profile` | Private |
| PUT | `/users/profile` | Private |
| GET / POST | `/users/addresses` | Private |
| PUT / DELETE | `/users/addresses/:addressId` | Private |
| GET | `/users` | Admin |
| GET | `/users/:id` | Admin |
| PATCH | `/users/:id` | Admin (role, isActive) |
| DELETE | `/users/:id` | Admin (409 if they have orders) |
</details>

<details>
<summary><b>Analytics</b> <code>/analytics</code> — all admin</summary>

| Endpoint | Returns |
|---|---|
| `/analytics/dashboard` | Totals + recent orders |
| `/analytics/overview?days=30` | Everything below in one call |
| `/analytics/sales?days=30` | Daily and monthly revenue, AOV, tax and shipping |
| `/analytics/orders` | Counts and value by status, fulfilment and cancellation rates |
| `/analytics/products?limit=10` | Best sellers and revenue by category |
| `/analytics/users?months=6` | Growth, conversion, top customers |
| `/analytics/inventory` | Stock totals, low stock, out of stock, per-category |
</details>

### Status codes

`200` OK · `201` Created · `400` Bad request · `401` Not authenticated · `403` Wrong role or another user's resource · `404` Not found · `409` Conflict (duplicate, stock, workflow) · `422` Validation failed · `429` Rate limited · `500` Server error · `502/503` Upstream (Cloudinary / database) unavailable

---

## Running it locally

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier is fine)
- A Cloudinary account (needed only for uploading product images)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in MONGODB_URI, JWT_SECRET, Cloudinary keys
npm run seed                # optional: populate the catalogue and demo data
npm run dev                 # http://localhost:5000
```

Verify it: `curl http://localhost:5000/api/v1/health`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api/v1
npm run dev                 # http://localhost:5173
```

### Confirming you are on Atlas

`GET /api/v1/health` reports `databaseMode` (`atlas` or `memory`) and `databaseName`. The startup log prints the same line. The real application must always show `atlas` / `ecommerce_db`.

### No Atlas credentials yet?

For a quick local look with no external services, the backend can run against a throwaway in-memory MongoDB that seeds itself on boot:

```bash
cd backend
npm run dev:memory
```

This is a development convenience only — it is rejected when `NODE_ENV=production`, and the data disappears when the process exits. Everything else (auth, cart, checkout, analytics) behaves exactly as it does against Atlas. Image **uploads** still need real Cloudinary credentials; without them the upload endpoints return a clear `503`.

---

## Environment variables

Nothing sensitive is committed. Both apps ship a `.env.example` listing every variable.

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | — | `development` / `production` |
| `PORT` | — | Default `5000` (Render sets this) |
| `API_PREFIX` | — | Default `/api/v1` |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string (Cluster → Connect → Drivers) |
| `MONGODB_DB_NAME` | — | Database on that cluster; default `ecommerce_db`. Always wins over any path in the URI, so other databases on the cluster are never touched |
| `USE_MEMORY_DB` | — | Must be `false` for the real application. `true` starts a throwaway in-memory MongoDB for local demos only; rejected in production |
| `JWT_SECRET` | **Yes** | ≥ 32 characters; the app refuses to boot otherwise |
| `JWT_EXPIRES_IN` | — | Default `7d` |
| `BCRYPT_SALT_ROUNDS` | — | Default `12` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | **In production** | Image storage |
| `CLIENT_URL` | **Yes** | The only origin CORS accepts in production |
| `ADDITIONAL_CORS_ORIGINS` | — | Comma-separated; `*.vercel.app` opts into preview deployments |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASS` / `EMAIL_FROM` | — | Password-reset email; without it links are logged in development |
| `FREE_SHIPPING_THRESHOLD` / `SHIPPING_FEE` / `TAX_RATE` | — | Server-side pricing rules |
| `RATE_LIMIT_*` | — | Request throttling |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL including `/api/v1` |
| `VITE_DEV_PROXY_TARGET` | Dev-server proxy target (development only) |
| `VITE_APP_NAME` | Store name shown in the UI |

Everything prefixed `VITE_` is bundled into the browser build — never put a secret there.

---

## Seeding the database

```bash
npm run seed            # wipes MONGODB_DB_NAME, then writes categories, products, users, orders, reviews
npm run seed:destroy    # wipes only
```

The seed is scoped to `MONGODB_DB_NAME` only — no other database on the cluster is read or written. It logs the target database name before clearing anything, and against `NODE_ENV=production` it refuses to run without `--yes`.

The seed writes 6 categories, 24 products, 6 users, 60 reviews and 12 orders spread across every status and the past 60 days — enough for the analytics pages to show a realistic picture. If Cloudinary is configured, seed images are uploaded through the same code path an admin upload uses.

Default credentials (override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_PASSWORD`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopsphere.dev` | `Admin@12345` |
| Customer | `aarav@example.com` | `Customer@12345` |

**Change these before deploying anywhere public.**

---

## Testing with Postman

1. Import `backend/postman/ShopSphere-API.postman_collection.json`
2. Import `backend/postman/ShopSphere.postman_environment.json` and select it
3. Run **Authentication → Login (admin)** and **Login (customer)** — tokens are captured automatically
4. Run the rest, or use the collection runner

95 requests across Health, Authentication, Products, Categories, Cart, Orders, Reviews, Users, Admin, Analytics and Error handling. Each folder covers the success path plus the failures worth proving: `400` invalid request, `401` unauthenticated, `403` wrong role / another user's resource, `404` not found, `409` conflict and `422` validation errors. Requests carry test scripts asserting status codes, response shape, that totals are server-computed, and that password fields never appear in a response.

---

## Deployment

### 1. MongoDB Atlas

1. Create a cluster and a database user.
2. **Network Access → Add IP Address → `0.0.0.0/0`** so Render can connect (Render does not publish static outbound IPs on the free plan).
3. Copy the connection string; URL-encode any special characters in the password.

### 2. Cloudinary

Copy the cloud name, API key and API secret from the dashboard.

### 3. Backend → Render

- **New → Web Service**, connect the repository
- Root directory `backend`, build `npm ci`, start `npm start`
- Health check path `/api/v1/health`
- Add the environment variables from the table above — critically `MONGODB_URI`, `JWT_SECRET`, the three Cloudinary keys, and `CLIENT_URL` (your Vercel URL)
- `backend/render.yaml` is a ready-made blueprint if you prefer that route

### 4. Frontend → Vercel

- **New Project**, root directory `frontend` (framework auto-detects as Vite)
- Environment variable: `VITE_API_URL = https://<your-service>.onrender.com/api/v1`
- `frontend/vercel.json` already rewrites all routes to `index.html`, so deep links like `/orders/123` work on refresh

### 5. Connect them

After both are live, set `CLIENT_URL` on Render to the exact Vercel URL (no trailing slash) and redeploy. To also allow Vercel preview deployments, set `ADDITIONAL_CORS_ORIGINS=*.vercel.app`.

### Deployment checklist

- [ ] Atlas network access allows Render
- [ ] `MONGODB_DB_NAME=ecommerce_db` and `USE_MEMORY_DB=false` on Render
- [ ] `JWT_SECRET` is a fresh random value, not the example
- [ ] `CLIENT_URL` on Render matches the Vercel domain exactly
- [ ] `VITE_API_URL` on Vercel points at the Render URL including `/api/v1`
- [ ] Seed admin password changed
- [ ] `/api/v1/health` returns `database: connected` and `cloudinary: configured`
- [ ] No `localhost` left in any production environment variable

> On Render's free plan the service sleeps after inactivity, so the first request after an idle period takes ~30 seconds to wake it.

---

## Security notes

| Concern | How it is handled |
|---|---|
| Password storage | bcrypt, 12 rounds, `select: false` so it is never fetched by accident |
| Password exposure | Stripped in the model's `toJSON`; Postman tests assert no hash ever appears in a response |
| Authentication | JWT with issuer claim; tokens minted before a password change are rejected via `passwordChangedAt` |
| Authorization | `protect` → `authorize(role)` middleware; ownership re-checked inside controllers for user-scoped resources |
| Account enumeration | Login and forgot-password return identical responses for unknown and known emails |
| Reset tokens | Random 32 bytes; only the SHA-256 digest is stored; 15-minute expiry; single use |
| Input validation | express-validator on every write endpoint, plus Mongoose schema validation, plus mirrored client-side validation |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` operators from user input |
| Parameter pollution | `hpp` with an allow-list for the repeatable filter parameters |
| Rate limiting | Global limiter, a tighter one on credential endpoints, a strict one on password resets |
| CORS | Explicit allow-list; no wildcard in production |
| Headers | `helmet` |
| Privilege escalation | `role` is never read from a registration or profile-update body |
| Admin lockout | An admin cannot demote or deactivate themselves, and the last admin cannot be removed |
| Secrets | Everything from environment variables; `.env` is git-ignored; the app refuses to boot with a missing or weak `JWT_SECRET` |

---

## License

MIT — free to use as a portfolio or learning reference.
