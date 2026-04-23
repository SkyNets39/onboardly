# Onboardly

Onboardly is an internal onboarding assistant for companies. Admins can manage users and upload HR/policy documents, then employees can ask onboarding questions through an AI chat that uses company-specific RAG context from those documents.

## Features

- Role-based app experience:
  - Admin: dashboard, document management, user management
  - Employee: onboarding chat assistant
- Supabase Auth + row-level security (multi-tenant isolation by `company_id`)
- Document pipeline:
  - Upload files to private `documents` storage bucket
  - Chunk + embed content into `document_chunks`
  - Query relevant chunks in chat using pgvector similarity search
- Two sync modes:
  - Queue mode via worker (`process_pending_documents.py`)
  - Immediate mode via webhook (`pipeline.sync_webhook`)

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind, shadcn/ui
- Backend services: Supabase Postgres/Auth/Storage + Supabase Edge Functions (Deno)
- AI/RAG pipeline: Python, Docling, Google Gemini embeddings + generation
- Search: pgvector + HNSW index

## Project Structure

```text
src/                    # Frontend app (admin + employee flows)
pipeline/               # Python document parsing/chunking/embedding/worker/webhook
supabase/
  migrations/           # Database schema, RLS, storage policies
  functions/            # Edge functions: chat, admin-users, documents-sync
```

## Prerequisites

- Node.js 20+
- pnpm (recommended, lockfile is `pnpm-lock.yaml`)
- Python 3.11+
- Supabase CLI
- A Supabase project
- A Google Gemini API key

## Environment Variables

Create `.env.local` in the repository root (do not commit real secrets):

```bash
# Supabase client (frontend)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_ANON_KEY=<anon-key>

# Supabase server access (python pipeline)
VITE_SUPABASE_SECRET_KEY=<service-role-key>

# AI provider
GEMINI_API_KEY=<gemini-api-key>

# Optional: immediate document sync webhook auth
DOCUMENT_SYNC_WEBHOOK_SECRET=<long-random-secret>
```

## Setup

### 1) Install dependencies

```bash
pnpm install
```

For Python pipeline:

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" python-dotenv supabase google-genai docling tiktoken
```

### 2) Start frontend

```bash
pnpm dev
```

## Database Setup (Supabase)

### Option A: Remote project (recommended for this repo state)

1. Link CLI to your Supabase project:
   ```bash
   npx supabase@latest login
   npx supabase@latest link --project-ref <your-project-ref>
   ```
2. Push migrations:
   ```bash
   pnpm db:push
   ```

This applies:
- core schema + RLS + `match_chunks` RPC
- user management additions (`position`, admin update policy, `admin_list_company_users` RPC)
- private storage bucket policies for documents

### Option B: Local Supabase

```bash
npx supabase@latest start
pnpm db:push
```

Local ports are configured in `supabase/config.toml` (API `54321`, DB `54322`, Studio `54323`).

## Supabase Functions

This project uses three edge functions:

- `chat`: RAG answer generation and message persistence
- `admin-users`: admin-only create/delete user accounts
- `documents-sync`: admin-triggered document sync orchestration

Deploy:

```bash
npx supabase@latest functions deploy chat
npx supabase@latest functions deploy admin-users
npx supabase@latest functions deploy documents-sync
```

Set function secrets:

```bash
npx supabase@latest secrets set \
  SUPABASE_URL=https://<project-ref>.supabase.co \
  SUPABASE_ANON_KEY=<anon-key> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  GEMINI_API_KEY=<gemini-api-key> \
  DOCUMENT_SYNC_WEBHOOK_URL=https://<your-webhook-host>/sync \
  DOCUMENT_SYNC_WEBHOOK_SECRET=<webhook-secret>
```

Notes:
- `documents-sync` supports fallback queue mode when `DOCUMENT_SYNC_WEBHOOK_URL` is not set.
- `chat` and `admin-users` require auth JWT (`verify_jwt = true` in config).

## Document Processing Pipeline

### Queue worker mode

Run one cycle:

```bash
python pipeline/process_pending_documents.py --once
```

Run as worker loop:

```bash
python pipeline/process_pending_documents.py --interval 10
```

### Immediate webhook mode (optional)

Start webhook service:

```bash
python -m uvicorn pipeline.sync_webhook:app --host 0.0.0.0 --port 8001
```

Webhook endpoint:
- `POST /sync`
- protected by `Authorization: Bearer <DOCUMENT_SYNC_WEBHOOK_SECRET>`

Health check:
- `GET /health`

## App Routes

- `/login`
- `/chat` (employee only)
- `/admin/dashboard` (admin only)
- `/admin/documents` (admin only)
- `/admin/users` (admin only)

## Development Scripts

- `pnpm dev` - start Vite dev server
- `pnpm build` - TypeScript build + Vite production build
- `pnpm preview` - preview built app
- `pnpm lint` - run ESLint
- `pnpm db:push` - push Supabase migrations

## Operational Notes

- Storage bucket used by document manager: `documents` (private)
- Accepted upload file types in UI: `.pdf`, `.docx`
- Document lifecycle: `processing` -> `ready` or `failed`
- If immediate sync is disabled, admins can still click Sync and then process via worker.

### Windows + Docling note

On some Windows setups, Hugging Face model downloads may need symlink permission. If Docling model downloads fail, enable Developer Mode in Windows (or run with sufficient privilege), then retry the pipeline.

## Security Checklist Before Sharing/Deploying

- Rotate any key that was ever committed to git history.
- Keep `.env.local` local-only and never commit it.
- Use least privilege keys in each runtime.
- Restrict webhook URL/network access in production.

## Troubleshooting

- **`documents-sync` returns queued mode**: `DOCUMENT_SYNC_WEBHOOK_URL` is not configured.
- **Document stuck in `processing`**: run worker or webhook service and inspect logs.
- **`403 Forbidden` in admin actions**: verify `users.role = 'admin'` for your account and company consistency.
- **Chat returns no context**: ensure chunks exist in `document_chunks` and embedding dimension matches DB vector definition.

## Video Demo
https://github.com/user-attachments/assets/9c45debb-c10f-4015-9160-5d38893f7ea4


