# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Al Fin Entendí EDU is a multi-tenant educational digital library platform for managing and accessing digital books/PDFs. It supports 5 user roles: ADMIN, COORDINATOR, TEACHER, STUDENT, PUBLIC.

## Commands

```bash
npm run dev          # Next.js 16 dev server with Turbopack
npm run build        # prisma generate && next build
npm run lint         # ESLint
npm run db:seed      # Seed database

npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma studio                       # Open Prisma Studio
npx prisma generate                     # Regenerate Prisma client (auto-runs on postinstall)
```

No test framework is configured.

## Architecture

**Data sources (dual):**
- **Supabase** — Auth, RLS, Storage, and relational database accessed via Prisma
- **Sanity CMS** — Book metadata, guides content, forum posts (via `next-sanity`)

**Authentication (dual strategy):**
- Students: Supabase Magic Link (OTP via email, sent by `app/api/send-magic-link`)
- Admin/Teacher/Coordinator: Password login + JWT stored in `sessions` table in Prisma DB

**Access control:** Book access is temporal, tracked in the `book_access` table (`ACTIVE`/`EXPIRED`/`SUSPENDED`). Permissions are validated in `lib/permissions/`. Supabase RLS policies enforce row-level security at the database level.

**PDF Viewer:** EmbedPDF (`@embedpdf/*`) renders PDFs fetched from Sanity CDN. Annotations are stored in Supabase. Reading progress is cached in localStorage for offline-first behavior.

## Key File Locations

| Concern | Path |
|---------|------|
| Supabase client (browser) | `lib/supabase/client.ts` |
| Supabase client (server/SSR) | `lib/supabase/server.ts` |
| Middleware (auth guards) | `middleware.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Sanity client | `lib/sanity/` |
| Book access logic | `lib/permissions/` |
| Annotation service | `lib/annotations/` |
| Email templates | `emails/` |
| shadcn/ui components | `components/ui/` |
| PDF viewer component | `components/pdf-viewer/` |
| Dashboard components | `components/dashboard/` |

## App Router Structure

```
app/
├── auth/                    # Login, sign-up, magic-link callback, password recovery
├── (dashboard)/             # Protected routes (requires auth)
│   ├── libros/[slug]/       # Book detail + PDF viewer (/vista sub-route)
│   ├── mis-libros/          # Student's library
│   ├── usuarios/            # User management (admin)
│   ├── accesos-libros/      # Book access management
│   ├── guias/[slug]/        # Educational guides
│   └── perfil/              # User profile
├── dashboard/               # Role-based dashboard redirect
└── api/                     # API routes (books, users, annotations, book-access,
                             #   annotations, checkout, send-magic-link, webhooks, etc.)
```

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DIRECT_URL` (Prisma), SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`), Sanity (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`), Stripe (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).

## Conventions

- UI components use **shadcn/ui** (`new-york` style, Lucide icons). Add new components via `npx shadcn@latest add <component>`.
- All paths use `@/` alias pointing to the repository root.
- Database changes require a Prisma migration (`prisma migrate dev`) — never edit the DB directly outside of migrations.
- The project is documented in Spanish (see `Overview.md` for the full specification).
