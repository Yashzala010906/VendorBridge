# VendorBridge
The vision for VendorBridge is to simplify and digitize procurement operations for organizations through a centralized ERP platform that manages vendors, RFQs, quotations, approvals, purchase orders, and invoice generation. 


# VendorBridge — Procurement & Vendor Management ERP

> Simplify and digitize procurement operations through a single, role-based platform
> that manages **vendors, RFQs, quotations, approvals, purchase orders, and invoices** —
> with structured workflows, centralized vendor communication, and real-time tracking.

VendorBridge is a hackathon-built ERP that takes a procurement request from first
draft to a printed/emailed invoice, enforcing the right approvals and keeping a full
audit trail along the way.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [User roles](#user-roles)
- [Procurement workflow](#procurement-workflow)
- [Tech stack](#tech-stack)
- [Architecture highlights](#architecture-highlights)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database & Supabase](#database--supabase)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Scripts](#scripts)
- [Notes & caveats](#notes--caveats)

---

## Overview

Organizations waste time on manual procurement: chasing vendor quotes over email,
approving purchases in spreadsheets, and re-keying data into purchase orders and
invoices. VendorBridge replaces that with one structured system where:

- Procurement officers **register vendors** and **create RFQs** (requests for quotation).
- Invited vendors **submit quotations** online.
- The team **compares quotations** side-by-side and routes the best one for **approval**.
- Approved quotations become **purchase orders**, which generate **tax invoices**.
- Invoices can be **downloaded as PDF, printed, or emailed** to the vendor.
- Every action is **logged and surfaced** through notifications and analytics.

> Original mock-up: <https://app.excalidraw.com/l/65VNwvy7c4X/5ywnm0v3qhK>

---

## Features

The app implements all ten modules from the problem statement:

| # | Module | What it does |
|---|--------|--------------|
| 1 | **Login / Signup** | Email + password auth, signup with role selection, forgot/reset password, session handling, validation, role-based access. |
| 2 | **Dashboard** | Role-aware home: pending approvals, active RFQs, recent POs & invoices, analytics cards, quick actions. |
| 3 | **Vendor management** | Register & track vendors, categories, GST & contact details, ratings, search + status/category filtering. |
| 4 | **RFQ creation** | Title, line items with quantities/units, **file attachments**, deadline, and multi-vendor invitations. |
| 5 | **Vendor quotation submission** | Per-item pricing, delivery timeline, notes, editable & re-submittable quotations. |
| 6 | **Quotation comparison** | Side-by-side matrix, lowest-price highlighting, delivery & rating indicators, sort/filter. |
| 7 | **Approval workflow** | Approve/reject with remarks, status tracking, approval timeline, automatic state transitions. |
| 8 | **Purchase order & invoice** | Auto-generated PO/invoice numbers, tax & total calculation, **PDF download, print, email**, status updates. |
| 9 | **Activity & notifications** | RFQ/approval/invoice alerts, in-app notifications, full audit log. |
| 10 | **Reports & analytics** | Spend totals, monthly trend, PO-status & quotation breakdowns, top vendors, CSV export. |

---

## User roles

| Role | Can do |
|------|--------|
| **Admin** | Everything — manage users (assign roles), manage vendors, view analytics. |
| **Procurement Officer** | Create RFQs, compare quotations, generate purchase orders & invoices, send invoices. |
| **Manager / Approver** | Approve or reject procurement requests, monitor workflows, view POs & invoices. |
| **Vendor** | Submit quotations, track RFQ status, view their purchase orders & invoices. |

Access is enforced both in the UI **and** at the database via Postgres Row-Level
Security — a vendor only ever sees their own RFQ invitations, quotations, POs and
invoices.

---

## Procurement workflow

```
Procurement Officer            Vendor                 Manager/Approver        System
        │                        │                          │                   │
   1. Create RFQ ───invite──▶    │                          │                   │
        │                  2. Submit quotation              │                   │
   3. Compare quotations         │                          │                   │
        │ ──────send for approval──────────────────▶  4. Approve / Reject       │
        │                        │                          │            (cascade statuses)
   5. Generate Purchase Order ◀──────────────────────approved                   │
        │                                                                        │
   6. Generate Invoice from PO ───────────────────────────────────────▶  notify approvers
        │                                                                        │
   7. Download PDF / Print / Email invoice                                       │
        │                                                                        │
   8. Everything tracked in Activity log + Reports ◀───────────────────────────┘
```

1. Procurement Officer creates an RFQ and invites vendors.
2. Invited vendors receive a notification and submit quotations.
3. The procurement team compares quotations.
4. A quotation is sent into the approval workflow; a Manager approves or rejects it.
5. An approved quotation generates a Purchase Order.
6. An Invoice is generated from the Purchase Order (approvers are notified).
7. The invoice can be downloaded as PDF, printed, or emailed to the vendor.
8. All activity is recorded in logs, notifications, and analytics.

---

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions, Turbopack)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4, Plus Jakarta Sans, lucide-react icons
- **Backend:** Supabase — Postgres, Auth (`@supabase/ssr`), Storage
- **PDF:** `@react-pdf/renderer` (server-rendered invoice PDF)
- **Charts:** Recharts
- **Validation / dates:** Zod, date-fns
- **Email:** pluggable mock provider, or Resend when `RESEND_API_KEY` is set

---

## Architecture highlights

- **Server Actions everywhere** — all mutations (`src/lib/actions/*`) run on the server
  with auth checks via a small data-access layer (`src/lib/auth/dal.ts`).
- **Row-Level Security** — every table has RLS policies; `SECURITY DEFINER` helper
  functions (`is_staff()`, `current_vendor_id()`, `can_see_rfq()`, …) keep policies
  fast and non-recursive.
- **Automatic document numbering** — Postgres triggers issue `RFQ-2026-0001`,
  `QUO-…`, `PO-…`, `INV-…`.
- **Auth → profile bootstrap** — a trigger creates a `profiles` row on signup (and a
  vendor record for vendor signups); the **first user becomes admin**.
- **Auditing & notifications** — a shared `logActivity()` / `notify()` layer records
  every action and fans out role-targeted alerts.
- **Proxy (middleware)** — Next.js 16 renames middleware to *Proxy* (`src/proxy.ts`);
  it refreshes the Supabase session and guards routes.

---

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)

### 1. Install

```bash
cd vendorbridge
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL and anon/publishable key (see [below](#environment-variables)).

### 3. Set up the database

Apply the migrations in `supabase/migrations/` in order, using the Supabase SQL
editor (or the Supabase MCP / CLI):

1. `0001_init.sql` — schema, enums, triggers, RLS, grants
2. `0002_storage.sql` — private `attachments` bucket + storage policies (RFQ files)
3. `0003_auto_confirm_email.sql` — auto-confirm emails so signup logs in immediately

Optionally load demo data:

```sql
-- supabase/seed.sql  (vendors, RFQs, quotations, an approved PO + invoice)
```

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign up — **the first account becomes the workspace admin.**

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-only; for admin/seed scripts |
| `NEXT_PUBLIC_APP_NAME` | optional | App name (default `VendorBridge`) |
| `EMAIL_FROM` | optional | From-address for the invoice mailer |
| `RESEND_API_KEY` | optional | Enables real invoice emails via Resend (otherwise mock) |

---

## Database & Supabase

15 tables model the full domain:

```
vendors · profiles
rfqs · rfq_items · rfq_vendors · rfq_attachments
quotations · quotation_items
approvals
purchase_orders · po_items
invoices · invoice_items
activity_logs · notifications
```

- **Storage:** a private `attachments` bucket holds RFQ files; downloads use
  short-lived signed URLs, gated by the same RLS that protects the RFQ.
- **Tax:** default rate 18%; amounts formatted as INR (lakh/crore grouping).

---

## Project structure

```
vendorbridge/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/            # login, signup, forgot-password, reset-password
│  │  ├─ (app)/             # dashboard, vendors, rfqs, quotations, approvals,
│  │  │                     # purchase-orders, invoices, activity, reports, users
│  │  ├─ auth/confirm/      # email-link callback (password recovery)
│  │  ├─ api/invoices/[id]/pdf/   # invoice PDF route handler
│  │  ├─ layout.tsx · globals.css
│  ├─ components/           # ui/ primitives, layout/ shell, feature components
│  ├─ lib/
│  │  ├─ actions/           # server actions (rfqs, quotations, approvals, …)
│  │  ├─ auth/              # data-access layer + auth actions
│  │  ├─ supabase/          # server / client / admin clients
│  │  ├─ pdf/ · activity.ts · email.ts · attachments.ts · utils.ts · constants.ts
│  └─ proxy.ts              # Next.js "Proxy" (middleware) — session + route guard
└─ supabase/
   ├─ migrations/           # 0001_init, 0002_storage, 0003_auto_confirm_email
   └─ seed.sql              # demo data
```

---

## Design system

The UI follows an enterprise **"Trust & Authority"** direction:

- **Palette:** professional azure/blue brand (CTA `#0369A1`) with deep-navy hero
  surfaces; soft `#F8FAFC` background.
- **Typography:** Plus Jakarta Sans.
- **Motion:** a small, reduced-motion-aware animation system (page-entrance fade-ups,
  staggered card reveals, hover lifts, an animated notification indicator). All motion
  honours `prefers-reduced-motion`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

---

## Notes & caveats

- **First user = admin.** Create the admin account first, then add staff/vendors.
- **Vendor accounts:** sign up choosing the **Vendor** role to test the quotation side;
  a vendor record is created automatically and linked to the login.
- **Email is mocked** unless `RESEND_API_KEY` is set — the flow still records `sent_at`
  and shows a preview, but no real email is delivered.
- Built against a customized Next.js 16 where **middleware is called *Proxy*** — see
  `src/proxy.ts`.
