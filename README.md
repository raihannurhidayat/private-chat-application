# Private Chat Application

A **Next.js** application that provides private, self-destructing chat rooms. Each room supports up to two participants, expires after a set time, and can be destroyed manually—messages are not stored permanently.

## Features

- **Private rooms** — Create a room and share the link; only the first two visitors can join.
- **Self-destruct** — Rooms expire after 10 minutes (TTL). All messages are removed when the room is destroyed or expires.
- **Real-time messaging** — Messages are delivered instantly via [Upstash Realtime](https://upstash.com/docs/realtime/overall/aboutrealtime).
- **Anonymous identity** — Each user gets a random username (e.g. `anonymous-wolf-xxxxx`) stored in `localStorage`.
- **Manual destroy** — Room creator or participants can destroy the room and its messages at any time.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **API** | [Elysia](https://elysiajs.com/) (typed API, mounted under `/api`) |
| **Client API** | [Eden](https://elysiajs.com/eden/overview.html) (type-safe Elysia client) |
| **Data & cache** | [Upstash Redis](https://upstash.com/docs/redis) |
| **Real-time** | [Upstash Realtime](https://upstash.com/docs/realtime) |
| **State** | [TanStack Query](https://tanstack.com/query/latest) (React Query) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── [[...slug]]/     # Elysia API (rooms, messages)
│   │   │   ├── auth.ts      # Cookie-based room auth middleware
│   │   │   └── route.ts     # Room + message routes
│   │   └── realtime/        # Upstash Realtime HTTP handler
│   ├── room/[roomId]/       # Chat room page
│   ├── layout.tsx
│   ├── page.tsx             # Home: create room, show identity
│   └── globals.css
├── components/
│   └── providers.tsx        # React Query provider
├── hooks/
│   └── use-username.ts      # Anonymous username (localStorage)
├── lib/
│   ├── client.ts            # Eden API client (typed)
│   ├── redis.ts             # Upstash Redis client
│   ├── realtime.ts          # Upstash Realtime server + schema
│   └── realtime-client.ts   # useRealtime hook for client
└── proxy.ts                 # Room access: cookie auth, 2-user limit (use in middleware)
```

## How It Works

1. **Home (`/`)** — User sees their anonymous identity and can click **Create Secure Room**. The app calls `POST /api/room/create`, gets a `roomId`, and redirects to `/room/[roomId]`.

2. **Room access** — Before entering a room, your middleware (using `proxy.ts` logic) should:
   - Check if the room exists in Redis (`meta:${roomId}`).
   - Allow access if the user already has a valid `x-auth-token` cookie for that room.
   - If not, and the room has fewer than 2 connected users, issue a new token in a cookie and add it to `meta:${roomId}.connected`.
   - Otherwise redirect with `?error=room-not-found` or `?error=room-full`.

3. **Chat** — In the room page:
   - **TTL** is fetched with `GET /api/room/ttl?roomId=...` and a countdown is shown; when it hits 0, the user is redirected to `/?destroyed=true`.
   - **Messages** are loaded with `GET /api/messages?roomId=...` and updated in real time via Upstash Realtime (events `chat.message`, `chat.destroy`).
   - **Send** uses `POST /api/messages` with `roomId` in query and `sender` + `text` in body; the API broadcasts `chat.message` so all participants see new messages.
   - **Destroy** uses `DELETE /api/room?roomId=...`; the API emits `chat.destroy`, then deletes room and message keys in Redis. Clients redirect to `/?destroyed=true`.

4. **Auth** — API routes that need room access use `authMiddleware`: they read `roomId` from query and `x-auth-token` from cookies, and verify the token is in `meta:${roomId}.connected`.

## Getting Started

### Prerequisites

- Node.js 18+
- [Upstash](https://upstash.com/) account (Redis + Realtime)

### Environment Variables

Create a `.env.local` (or set in your Upstash dashboard and use [@upstash/redis](https://github.com/upstash/redis-js#with-upstash-console) / Realtime env):

- **Redis** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (from Upstash Redis).
- **Realtime** — Realtime env vars as required by `@upstash/realtime` (see [Upstash Realtime](https://upstash.com/docs/realtime)).

### Install and run

```bash
# Install dependencies
npm install
# or
pnpm install
# or
bun install

# Run development server
npm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Create a room and open the same room URL in another browser or incognito window to test two participants.

### Build for production

```bash
npm run build
npm run start
```

## API Overview (Elysia)

- `POST /api/room/create` — Create room, return `{ roomId }`. Sets Redis key `meta:${roomId}` with TTL (e.g. 10 minutes).
- `GET /api/room/ttl?roomId=...` — Returns `{ ttl }` (seconds). Requires room auth cookie.
- `DELETE /api/room?roomId=...` — Destroy room: emit `chat.destroy`, delete Redis keys. Requires room auth cookie.
- `GET /api/messages?roomId=...` — List messages for room. Requires room auth cookie.
- `POST /api/messages?roomId=...` — Body: `{ sender, text }`. Appends message in Redis, emits `chat.message`. Requires room auth cookie.

Room auth is enforced by `authMiddleware`: cookie `x-auth-token` must be present and listed in `meta:${roomId}.connected`.

## License

See [LICENSE](LICENSE) in the repository.
