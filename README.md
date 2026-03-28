# DocuMind

**AI-Powered Knowledge Base & Document Chat**

DocuMind is a multi-tenant SaaS platform that lets teams upload internal documents, automatically process them into a searchable knowledge base, and get instant AI-powered answers with source citations. Think of it as ChatGPT trained on your own documents.

---

## Key Features

### Authentication & Workspaces
- Google and GitHub OAuth via NextAuth.js (JWT strategy)
- Multi-workspace support with slug-based routing (e.g., `/acme-corp/dashboard`)
- Onboarding wizard for new users to create their first workspace
- Maximum 3 workspaces per user on the free tier

### Team Collaboration
- Email invitations via Resend with 7-day expiry and auto-acceptance
- Role-based access control (RBAC) with four roles: Owner > Admin > Member > Viewer
- Role management with safeguards (cannot demote the last owner)
- Pending invitations visible in settings with revoke option

### Document Pipeline
- Drag-and-drop file upload supporting PDF, DOCX, TXT, MD, and CSV (up to 10MB each, 50 documents per workspace)
- Automated 4-stage processing pipeline via Inngest background jobs: Parsing > Chunking > Embedding > Indexing
- PDF parsing with pdf-parse, DOCX with mammoth.js, plain text for TXT/MD/CSV
- Text splitting into 1000-character chunks with 200-character overlap (LangChain RecursiveCharacterTextSplitter)
- Vector embeddings via OpenAI text-embedding-3-small stored in Pinecone with workspace-scoped namespaces
- Real-time status tracking (UPLOADED, PARSING, CHUNKING, EMBEDDING, INDEXED, ERROR)
- Document deletion cleans up both Postgres records and Pinecone vectors
- Re-processing support for already-indexed documents

### AI Chat (RAG)
- Retrieval-Augmented Generation powered by Pinecone vector search and OpenAI GPT
- Streaming responses via Vercel AI SDK with token-by-token delivery
- Source citations displayed as clickable chips below each AI response
- Conversation history per user per workspace with auto-generated titles
- AI-generated starter questions based on uploaded document titles (cached in Redis for 24 hours)
- Rate limiting: 30 requests per minute per user

### Dashboard & Analytics
- Overview dashboard with stats cards: total documents, total chunks, total queries, queries today
- Queries-per-day line chart (Recharts) for the last 30 days
- Unanswered questions tracking to identify knowledge base gaps
- Advanced analytics page with date range filtering (7d / 30d / 90d / custom)
- CSV export of query logs for external analysis

### Embeddable Widget
- Standalone JavaScript widget loadable via a single `<script>` tag on any website
- Shadow DOM isolation to avoid CSS conflicts with the host page
- API key authentication with bcrypt hashing (keys shown only once at creation, max 3 per workspace)
- Customizable primary colour, welcome message, and suggested questions per API key
- Rate limiting: 100 requests per minute per API key
- Streaming responses with source citations, identical to the main app experience
- Responsive design: fixed panel on desktop, full-width on mobile

### Polish
- Dark mode support via next-themes
- Public landing page with hero, feature grid, and "How It Works" section
- Offline detection banner
- Skeleton loading states throughout the UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Database | PostgreSQL via Neon (serverless), Prisma ORM |
| Auth | NextAuth.js v4 (Google + GitHub OAuth, JWT strategy) |
| Vector DB | Pinecone (namespace-per-workspace for tenant isolation) |
| LLM | OpenAI (text-embedding-3-small for embeddings, GPT for chat) |
| AI SDK | Vercel AI SDK (streaming), LangChain (text splitting) |
| File Storage | Vercel Blob |
| Background Jobs | Inngest (document processing pipeline, suggestion generation, invitation expiry) |
| Email | Resend + React Email |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Caching | Upstash Redis |
| Charts | Recharts |
| Widget Build | Vite (IIFE bundle) |
| Deployment | Vercel |

---

## Folder Structure

```
documind/
├── prisma/
│   └── schema.prisma              # Database schema (13 models)
├── public/
│   └── widget.js                  # Built widget bundle
├── widget/
│   ├── index.js                   # Widget source (vanilla JS, Shadow DOM)
│   └── vite.config.js             # Widget build config
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/             # OAuth login page
│   │   │   └── callback/          # NextAuth callback
│   │   ├── (homepage)/            # Public landing page
│   │   ├── (app)/
│   │   │   ├── onboarding/        # Workspace creation wizard
│   │   │   ├── invite/[token]/    # Invitation acceptance flow
│   │   │   └── [workspaceSlug]/
│   │   │       ├── dashboard/     # Stats, charts, recent activity
│   │   │       ├── documents/     # Upload, list, manage documents
│   │   │       ├── chat/          # AI chat with conversation history
│   │   │       │   └── [conversationId]/
│   │   │       ├── analytics/     # Query analytics, unanswered questions
│   │   │       ├── settings/      # Team members, invitations, API keys
│   │   │       └── layout.tsx     # Sidebar navigation layout
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   │   ├── chat/              # Main RAG chat endpoint
│   │   │   ├── upload/            # Document upload to Vercel Blob
│   │   │   ├── suggestions/       # AI-generated starter questions
│   │   │   ├── workspaces/        # Create workspace, check slug
│   │   │   ├── documents/[id]/view/ # Secure document download
│   │   │   ├── analytics/export/  # CSV export
│   │   │   ├── widget/
│   │   │   │   ├── config/        # Widget configuration endpoint
│   │   │   │   └── chat/          # Widget chat with API key auth
│   │   │   └── webhooks/inngest/  # Inngest event processing
│   │   ├── layout.tsx             # Root layout (font, theme, toast)
│   │   └── globals.css            # Tailwind theme, CSS variables
│   ├── actions/
│   │   ├── invite.ts              # sendInvitation, revokeInvitation
│   │   ├── members.ts             # changeRole, removeMember
│   │   ├── documents.ts           # deleteDocument, reprocessDocument
│   │   ├── conversation.ts        # getConversations, deleteConversation
│   │   └── api-keys.ts            # createApiKey, revokeApiKey, listApiKeys
│   ├── inngest/
│   │   ├── process-document.ts    # 4-stage pipeline (parse > chunk > embed > index)
│   │   ├── generate-suggestions.ts # AI starter questions on document.indexed
│   │   └── expire-invitations.ts  # Daily cron to expire stale invitations
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config
│   │   ├── auth-session.ts        # getSession(), requireAuth() helpers
│   │   ├── permissions.ts         # checkUserPermission() with role hierarchy
│   │   ├── roles.ts               # VALID_ROLES, ROLE_HIERARCHY constants
│   │   ├── prisma.ts              # Prisma client (Neon HTTP adapter)
│   │   ├── prisma-adapter.ts      # NextAuth Prisma adapter
│   │   ├── openai.ts              # OpenAI client config
│   │   ├── pinecone.ts            # Pinecone index initialisation
│   │   ├── inngest.ts             # Inngest event client
│   │   ├── redis.ts               # Upstash Redis client
│   │   ├── ratelimit.ts           # Rate limiters (widget + chat)
│   │   ├── dashboard-data.ts      # Dashboard query helpers
│   │   └── utils.ts               # Tailwind/UI utilities
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (button, card, toast, etc.)
│   │   ├── layout/                # Sidebar nav, mobile sidebar, offline banner
│   │   ├── documents/             # Upload dropzone component
│   │   ├── auth/                  # Logout button
│   │   └── public-navbar/         # Homepage navigation
│   ├── emails/
│   │   └── invite-email.tsx       # React Email invitation template
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript type declarations
│   └── generated/prisma/          # Auto-generated Prisma client (do not edit)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── components.json                # shadcn/ui configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (recommend [Neon](https://neon.tech) for serverless)
- Accounts with: Google Cloud (OAuth), GitHub (OAuth), OpenAI, Pinecone, Vercel (Blob), Resend, Upstash (Redis)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd documind
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root with the following:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ── NextAuth ──────────────────────────────────────────────
NEXTAUTH_SECRET="your-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"

# ── OAuth Providers ───────────────────────────────────────
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# ── OpenAI ────────────────────────────────────────────────
OPENAI_API_KEY="sk-..."

# ── Pinecone (Vector DB) ─────────────────────────────────
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="your-index-name"

# ── Vercel Blob (File Storage) ────────────────────────────
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# ── Resend (Email) ────────────────────────────────────────
RESEND_API_KEY="re_..."

# ── Upstash Redis (Rate Limiting & Caching) ───────────────
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# ── Inngest (Background Jobs) ────────────────────────────
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# ── Widget ────────────────────────────────────────────────
WIDGET_API_BASE_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Inngest (background jobs)

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

This starts the Inngest dev server, which listens for events at `/api/webhooks/inngest`.

### 6. Build the widget (optional)

```bash
npm run build:widget
```

This compiles `widget/index.js` into `public/widget.js` as a self-contained IIFE bundle.

---

## How to Use

1. **Sign in** with your Google or GitHub account at `/login`.
2. **Create a workspace** during onboarding — give it a name and a unique slug.
3. **Upload documents** (PDF, DOCX, TXT, MD, CSV) on the Documents page. They will be automatically processed through the pipeline.
4. **Chat with your docs** on the Chat page — ask questions and get AI answers with source citations.
5. **Invite your team** from Settings — send email invitations with Member or Viewer roles.
6. **Monitor usage** on the Dashboard and Analytics pages.
7. **Embed the widget** on your website:
   - Go to Settings and generate an API key.
   - Customise the widget colour, welcome message, and suggested questions.
   - Add the script tag to your site:
     ```html
     <script src="https://your-domain.com/widget.js" data-key="dk_..."></script>
     ```

---

## Database Models

The Prisma schema defines 13 models:

| Model | Purpose |
|---|---|
| User | User profiles from OAuth |
| Account | OAuth provider accounts (NextAuth) |
| Session | Session tokens (NextAuth) |
| VerificationToken | Email verification (NextAuth) |
| Workspace | Team workspaces with unique slugs |
| Membership | User-workspace relationships with roles |
| Document | Uploaded files with processing status |
| Conversation | Chat sessions per user per workspace |
| Message | Chat messages with optional source citations (JSON) |
| QueryLog | Analytics: query text, success, response time, token count |
| ApiKey | Widget API keys with bcrypt hash, rate limit, customisation |
| Invitation | Team invitations with token, expiry, status |

---

## Data Flow

```
User Upload
  -> POST /api/upload (file -> Vercel Blob)
  -> DB: Document created (status = UPLOADED)
  -> Inngest event: document.uploaded

Inngest Pipeline (process-document)
  -> Fetch file from Blob
  -> Parse text (PDF / DOCX / TXT)       -> status = PARSING
  -> Split into chunks (1000 chars)        -> status = CHUNKING
  -> Generate embeddings (OpenAI)          -> status = EMBEDDING
  -> Upsert vectors to Pinecone            -> status = INDEXED
  -> Emit event: document.indexed

Inngest (generate-suggestions)
  -> Fetch document titles
  -> Generate starter questions via LLM
  -> Cache in Redis (24h TTL)

User Chat
  -> POST /api/chat
  -> Embed user message (text-embedding-3-small)
  -> Query Pinecone (top 5 chunks, score > 0.35)
  -> Stream response (GPT with retrieved context)
  -> Persist: Conversation, Messages, QueryLog
  -> Return source citations in response
```

---

## Future Roadmap

### Agentic RAG
- Implement multi-step reasoning where the AI agent can decide to refine its search query, fetch additional chunks, or ask clarifying questions before answering
- Add query rewriting: use the LLM to rephrase vague user questions into better search queries
- Incorporate conversation history into RAG retrieval (currently only the last message is embedded)
- Multi-factor relevance scoring combining semantic similarity, keyword matching, and recency

### RAG Quality Improvements
- Lower and tune the similarity score threshold (currently 0.35) with A/B testing
- Add hybrid search (vector + keyword) for better recall
- Implement chunk re-ranking with a cross-encoder model
- Add document summarisation during ingestion for better context in retrieval
- Support larger documents with hierarchical chunking (document > section > paragraph)

### Mobile Responsive Design
- Fully responsive chat interface for mobile and tablet
- Swipe-based navigation for conversation sidebar on mobile
- Touch-friendly document upload with camera/file picker integration
- Responsive widget that adapts to all screen sizes

### Additional Features
- Real-time collaboration: shared conversations visible to team members
- Document versioning: track changes when the same document is re-uploaded
- Webhook integrations: notify Slack/Discord when documents are processed or questions go unanswered
- Multi-language support: document parsing and chat in multiple languages
- Custom embedding models: allow workspaces to choose between different embedding providers
- Usage-based billing: Stripe integration for paid tiers with higher limits
- Audit logging: track all workspace actions for compliance
- SSO/SAML: enterprise single sign-on support
- Bulk operations: batch upload, batch delete, bulk role changes
- Search page: dedicated full-text search across all documents without using chat

### Developer Experience
- End-to-end tests with Playwright
- CI/CD pipeline with GitHub Actions
- Seed script for local development with sample data
- OpenAPI/Swagger documentation for all API routes
- Storybook for UI components

### Infrastructure
- Add middleware.ts for centralised auth and workspace validation
- Migrate role strings to a Prisma enum for type safety
- Add database indexes on frequently queried columns (QueryLog.createdAt, Document.status)
- Implement proper error boundaries throughout the app
- Add structured logging (Pino or Winston) to replace console.log/error

---

## Known Limitations

- **Resend sandbox**: email invitations only work with the verified sender email until a custom domain is configured at resend.com/domains
- **Calibri font**: the UI uses Calibri as the primary font, which is a system font available on Windows and most Macs with Office installed. Other systems fall back to Gill Sans, Trebuchet MS, or the default sans-serif
- **No middleware**: auth and workspace validation are handled per-route rather than in a centralised middleware file
- **Role storage**: roles are stored as plain strings in the database rather than a Prisma enum, which means invalid values are not caught at the DB level

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run build:widget` | Build the embeddable widget |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |

---

## License

This project is private and not open-sourced.
