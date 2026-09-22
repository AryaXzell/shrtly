# SHRTLY

> Short links, without the noise.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Storage](https://img.shields.io/badge/Storage-Upstash_Redis_%2B_Local_Engine-FF4F8B?style=flat-square)](https://upstash.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

SHRTLY is a fast, quiet, and privacy-conscious URL shortener. It offers an uncluttered workflow for generating short links with optional custom aliases, expiration rules, instant QR code export, and privacy-respecting analytics without requiring user account creation.

---

## Core Principles

- **Fast:** Sub-millisecond local routing and low-latency global redirects via HTTP 302.
- **Quiet:** Restrained visual design, zero unsolicited ads, and calm, purposeful interactions.
- **Clear:** Non-reusable short codes (tombstoning), transparent security warnings, and full owner control via cryptographic tokens.

---

## Key Features

- **Anonymous Ownership:** Manage, edit, or delete your short links using browser-stored cryptographic tokens without creating a user account.
- **Permanent Code Tombstones:** Deleted codes are permanently reserved to prevent link impersonation, typosquatting, or security hijacking.
- **Progressive Disclosure:** Simple one-click shortening by default, with advanced settings (custom alias, custom expiration) available on demand.
- **Privacy-Respecting Analytics & Filtering:** Tracks total clicks, daily trends, referrer sources, device categories, and top countries with zero IP storage. Includes a **multi-dimensional filtering system** to toggle visibility by device type (dynamically scaling charts) and filter history using presets or **custom date range pickers**.
- **Touch-Safe Mobile Layouts:** Fully responsive mobile dashboard featuring a persistent sliding bottom sheet with click-outside protection to ensure actions trigger smoothly on mobile viewports.
- **Status Toggle Safety Modal:** Double-confirmation modal engine using high-contrast amber/emerald indicators and haptic feedback to prevent accidental link enabling or disabling.
- **Security Scanner:** Automatically screens URLs against high-risk patterns and malicious destination indicators, presenting an interstitial warning before routing visitors.
- **QR Code Generator:** Downloadable vector-ready QR codes for offline and mobile sharing with responsive overlay layouts.
- **Abuse Reporting:** Built-in community flagging workflow for malicious or phishing links.
- **Dual-Engine Persistence:** Native support for Upstash Redis with automatic fallback and self-healing local storage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons |
| **Backend** | Express 4.x, TypeScript (Node.js runtime) |
| **Bundling** | Vite 8, esbuild, tsx |
| **Storage Engine** | Upstash Redis (Cloud) + File/Memory Engine (Local Fallback) |
| **Security** | SHA-256 token hashing, URL protocol sanitization, Rate limiting |

---

## Project Structure

```
.
├── api/
│   └── index.ts           # Vercel Function entrypoint
├── server/
│   ├── app.ts             # Core Express application and route handlers
│   ├── storage.ts         # Dual-engine storage (Upstash Redis + Local JSON)
│   ├── urlUtils.ts        # URL validation, normalization, and code generator
│   └── runTests.ts        # Backend unit and integration test suite
├── src/
│   ├── components/        # Modular UI components (Views, Modals, Empty States)
│   │   ├── AppShell.tsx   # Responsive container & navigation layout
│   │   ├── HomeView.tsx   # Shortening input & progressive options
│   │   ├── LinksView.tsx  # Link management, search, and filtering
│   │   └── ...
│   ├── utils/
│   │   └── api.ts         # Type-safe client API wrapper & local storage sync
│   ├── types.ts           # Shared TypeScript interfaces and domain types
│   ├── App.tsx            # Main application router and state coordinator
│   └── main.tsx           # React entry point
├── server.ts              # Local development / standalone Express entrypoint
├── package.json           # Dependencies and build scripts
└── vite.config.ts         # Vite and Tailwind configuration
```

- **`api/index.ts`** is the production Vercel Function entrypoint used for deployments.
- **`server.ts`** is the standalone Express entrypoint used for local development.

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 (or pnpm / yarn / bun)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aryaxzell/shrtly.git
   cd shrtly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | Optional | Base URL of the deployed application (used for short link generation). Defaults to `http://localhost:3000`. |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST URL for distributed cloud persistence. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST bearer token. |
| `PORT` | Optional | Application listening port (defaults to `3000`). |

> **Note:** If Upstash credentials are omitted, the application automatically uses the integrated local persistent storage engine (`data/storage.json`). No external database setup is strictly required for local development.

### Development

Run the development server with live reload:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Type Checking & Linting

```bash
npm run lint
```

### Production Build

Compile the React frontend with Vite and bundle the Express server with esbuild:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

---

## API Reference

### 1. Shorten URL
`POST /api/links`

Creates a new short link.

**Request Body:**
```json
{
  "destination": "https://example.com/very/long/url",
  "custom_code": "my-alias",
  "expires_in": "7d"
}
```

**Response (`201 Created`):**
```json
{
  "link": {
    "internal_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "code": "my-alias",
    "destination": "https://example.com/very/long/url",
    "created_at": "2026-09-21T08:00:00.000Z",
    "expires_at": "2026-09-28T08:00:00.000Z",
    "owner_id": "anon_owner_12345",
    "status": "active",
    "click_count": 0
  },
  "management_token": "shrt_tok_xxxxxxxxxxxx"
}
```

### 2. List Managed Links
`GET /api/links`

Fetches all active and expired links associated with the caller's anonymous identity.

**Headers:**
```
x-owner-id: <anon_owner_id>
```

### 3. Update Destination
`PATCH /api/links/:internal_id`

Updates the destination of an existing short link. Requires the management token.

**Headers:**
```
x-management-token: <token>
```

**Request Body:**
```json
{
  "destination": "https://example.com/new-destination"
}
```

### 4. Delete Link
`DELETE /api/links/:internal_id`

Soft-deletes or permanently tombstones a link.

**Headers:**
```
x-management-token: <token>
```

### 5. Link Analytics
`GET /api/links/:internal_id/analytics`

Retrieves detailed click metrics, referrers, device types, and geographical breakdown.

### 6. Health & Storage Status
`GET /api/health`

Returns uptime, system health, and current storage engine connection status.

---

## Security & Architecture Notes

1. **Code Reservation & Collision Handling:**
   Base62 short codes (e.g., `s9Xy2z`) are generated using cryptographically secure random values. Alias reservations are checked atomically against both active code sets and deleted tombstones to ensure zero reuse.
2. **Token Security:**
   Management tokens are generated using 32 bytes of secure random data and stored as SHA-256 hashes on the server. The raw token is stored solely in the client browser's local storage.
3. **Graceful Degradation:**
   If Upstash Redis encounters network latency or downtime, `DynamicStorageManager` routes operations to the local engine and reconciles state upon restoration.
4. **Link Abuse Mitigation:**
   Links reported multiple times are automatically flagged for administrative review, triggering the interstitial safety screen (`/warning`) to protect visitors.

---

## License

This project is licensed under the [MIT License](LICENSE).
