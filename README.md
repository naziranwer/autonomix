# Autonomix - AI-Powered Task Dependency Engine

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-4169E1?logo=postgresql)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google)

Autonomix analyzes meeting transcripts using Google Gemini AI to extract actionable tasks, identify dependencies between them, detect circular dependency chains, and visualize everything in an interactive graph.

## Features

- **AI Task Extraction** - Paste a meeting transcript and get structured tasks with priorities (P0-P3), assignees, and dependency relationships
- **Dependency Graph** - Interactive visualization powered by ReactFlow with pan, zoom, and minimap
- **Cycle Detection** - Automatic detection and highlighting of circular dependencies using DFS
- **Task Tracking** - Click ready tasks to mark them complete; dependent tasks unlock automatically
- **Idempotent Processing** - SHA-256 transcript hashing ensures the same transcript returns cached results instantly

## Architecture

```
┌─────────────────────┐     HTTP/REST      ┌─────────────────────┐
│                     │ ──────────────────> │                     │
│   React Frontend    │                     │  Express Backend    │
│   (Vite, port 8080) │ <────────────────── │  (Node.js, port 3001)│
│                     │                     │                     │
└─────────────────────┘                     └──────────┬──────────┘
                                                       │
                                            ┌──────────┴──────────┐
                                            │                     │
                                  ┌─────────┤   Task Processor    ├─────────┐
                                  │         │                     │         │
                                  v         └─────────────────────┘         v
                         ┌────────────────┐                      ┌─────────────────┐
                         │  PostgreSQL    │                      │  Google Gemini   │
                         │  (jobs, tasks) │                      │  2.5 Flash       │
                         └────────────────┘                      └─────────────────┘
```

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript 5.8 | Type safety |
| Vite 5.4 | Build tool and dev server |
| TailwindCSS 3.4 | Utility-first styling |
| shadcn/ui | Component library (Radix UI) |
| ReactFlow | Dependency graph visualization |
| Framer Motion | Animations and transitions |
| TanStack React Query | Server state management |

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express 4.21 | HTTP framework |
| TypeScript 5.8 | Type safety |
| pg (node-postgres) | PostgreSQL driver |
| @google/genai | Google Gemini SDK |
| dotenv | Environment configuration |

## Project Structure

```
autonomix/
├── src/                          # Frontend source
│   ├── pages/
│   │   └── Index.tsx             # Main page (input -> processing -> results)
│   ├── components/
│   │   ├── graph/
│   │   │   ├── DependencyGraph.tsx  # ReactFlow graph visualization
│   │   │   └── TaskNode.tsx         # Individual task card in graph
│   │   ├── transcript/
│   │   │   └── TranscriptInput.tsx  # Transcript input form
│   │   ├── ProcessingState.tsx      # Loading/error display
│   │   └── ui/                      # shadcn components
│   ├── services/
│   │   └── api.ts                # API client (fetch calls to backend)
│   ├── hooks/
│   │   ├── useJobStatus.ts       # Job status polling (2s interval)
│   │   └── useTaskState.ts       # Task completion state management
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces
├── server/                       # Backend source
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── config.ts             # Environment variable loading
│   │   ├── db.ts                 # PostgreSQL connection pool
│   │   ├── migrate.ts            # Database migration runner
│   │   ├── types.ts              # Backend TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── transcripts.ts    # POST /process-transcript
│   │   │   ├── jobs.ts           # GET /get-job-status
│   │   │   └── tasks.ts          # PATCH /tasks/:id
│   │   ├── services/
│   │   │   ├── llm.ts            # Google Gemini integration
│   │   │   └── taskProcessor.ts  # Processing orchestration
│   │   └── utils/
│   │       ├── hash.ts           # SHA-256 transcript hashing
│   │       ├── sanitize.ts       # Dependency validation
│   │       └── cycles.ts         # DFS cycle detection
│   └── migrations/
│       └── 001_initial.sql       # Database schema
├── package.json                  # Frontend dependencies
└── server/package.json           # Backend dependencies
```

## Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 13.0 (for `gen_random_uuid()` support)
- **Google Gemini API Key** - Get one at [Google AI Studio](https://aistudio.google.com/apikey)

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd autonomix
```

### 2. Install dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### 3. Configure environment variables

**Backend** - Create `server/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/autonomix
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:8080
```

**Frontend** - The `.env` file in the root should have:

```env
VITE_API_URL=http://localhost:3001
```

### 4. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE autonomix;"

# Run migrations
cd server
npm run migrate
```

### 5. Start both servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

The frontend runs at **http://localhost:8080** and the backend at **http://localhost:3001**.

## API Reference

### Health Check

```
GET /health
```

**Response:**

```json
{ "status": "ok" }
```

### Process Transcript

```
POST /process-transcript
Content-Type: application/json

{ "transcript": "Meeting transcript text..." }
```

**Response (200):**

```json
{
  "jobId": "uuid",
  "status": "completed",
  "cached": false
}
```

If the same transcript was processed before, returns `"cached": true` immediately.

### Get Job Status

```
GET /get-job-status?jobId=<uuid>
```

**Response (200):**

```json
{
  "job": {
    "id": "uuid",
    "status": "completed",
    "error_message": null,
    "created_at": "2026-02-06T...",
    "updated_at": "2026-02-06T..."
  },
  "tasks": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "task_id": "TASK-1",
      "description": "Fix Stripe payment gateway race condition",
      "priority": "P0",
      "dependencies": [],
      "has_cycle": false,
      "is_completed": false,
      "assigned_to": "David",
      "created_at": "2026-02-06T..."
    }
  ],
  "hasCycles": false
}
```

### Update Task Completion

```
PATCH /tasks/:id
Content-Type: application/json

{ "is_completed": true }
```

**Response (200):** Updated task object.

## Database Schema

### jobs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| transcript_hash | TEXT | SHA-256 hash for idempotency (unique index) |
| original_transcript | TEXT | Full transcript text |
| status | ENUM | `pending` \| `processing` \| `completed` \| `failed` |
| result | JSONB | Processed tasks and cycle info |
| error_message | TEXT | Error details if failed |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

### tasks

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| job_id | UUID | Foreign key to jobs (CASCADE delete) |
| task_id | TEXT | LLM-generated ID (e.g., "TASK-1") |
| description | TEXT | Task description |
| priority | TEXT | P0 (critical) / P1 (high) / P2 (medium) / P3 (low) |
| dependencies | TEXT[] | Array of task_id values this task depends on |
| has_cycle | BOOLEAN | Whether this task is part of a circular dependency |
| is_completed | BOOLEAN | Completion status |
| assigned_to | TEXT | Person assigned (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Deployment

### Option A: Vercel (Frontend) + Railway (Backend) + Neon (Database)

This is the recommended approach for a quick, managed deployment.

#### 1. Database (Neon)

1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project and database named `autonomix`
3. Copy the connection string (e.g., `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/autonomix?sslmode=require`)
4. Run the migration against Neon:

```bash
DATABASE_URL="your_neon_connection_string" npm run migrate --prefix server
```

#### 2. Backend (Railway)

1. Create an account at [railway.app](https://railway.app)
2. Create a new project -> Deploy from GitHub repo
3. Set the root directory to `server`
4. Configure environment variables:

| Variable | Value |
|----------|-------|
| `PORT` | `3001` (Railway assigns automatically, but set as fallback) |
| `DATABASE_URL` | Your Neon connection string |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://autonomix.vercel.app`) |

5. Set the build command: `npm run build`
6. Set the start command: `npm run start`
7. Note the deployed URL (e.g., `https://autonomix-server-production.up.railway.app`)

#### 3. Frontend (Vercel)

1. Create an account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the framework preset to **Vite**
4. Configure environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL (e.g., `https://autonomix-server-production.up.railway.app`) |

5. Deploy. Vercel will run `npm run build` and serve the `dist/` directory.

#### 4. Update Backend CORS

After deploying the frontend, update the `FRONTEND_URL` environment variable on Railway to match your Vercel URL so CORS allows requests from the frontend.

---

### Option B: Render (Full Stack) + Neon (Database)

#### 1. Database (Neon)

Same as Option A above.

#### 2. Backend (Render)

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set root directory: `server`
4. Build command: `npm install && npm run build`
5. Start command: `npm run start`
6. Add environment variables: `DATABASE_URL`, `GEMINI_API_KEY`, `FRONTEND_URL`, `PORT=3001`

#### 3. Frontend (Render)

1. Create a **Static Site** on Render
2. Connect the same repository
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

---

### Option C: VPS / Self-Hosted (Docker or PM2)

#### 1. Database

Install PostgreSQL on your server:

```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb autonomix
```

Run the migration:

```bash
cd server
DATABASE_URL="postgresql://postgres:password@localhost:5432/autonomix" npm run migrate
```

#### 2. Backend with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the backend
cd server
npm install
npm run build

# Start with PM2
PORT=3001 \
DATABASE_URL="postgresql://postgres:password@localhost:5432/autonomix" \
GEMINI_API_KEY="your_key" \
FRONTEND_URL="https://yourdomain.com" \
pm2 start dist/index.js --name autonomix-server

# Save PM2 process list and set up startup
pm2 save
pm2 startup
```

#### 3. Frontend

```bash
# Build the frontend
cd /path/to/autonomix
VITE_API_URL="https://api.yourdomain.com" npm run build
```

Serve the `dist/` folder with Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/autonomix/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable HTTPS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | HTTP server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `FRONTEND_URL` | No | `http://localhost:8080` | Allowed CORS origin |

### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3001` | Backend API base URL |

## License

MIT
