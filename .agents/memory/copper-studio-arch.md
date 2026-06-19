---
name: Copper Studio architecture
description: Core technical architecture, ports, routes, and auth flow for The Copper Studio app.
---

## Stack
- Backend: Node.js + Express, port 3000, `server/server.js`
- Frontend: React + Vite, port 5000, `copper-crm/`
- DB: MongoDB at `127.0.0.1:27017/copper-studio`
- Auth: JWT (7d expiry), role `user` (client portal) or `superadmin` (admin CRM)

## Routes
- `/api/auth/*` — login, me, set-password, forgot-password, reset-password
- `/api/crm/:type` — CRUD for CRM collections (companies, contacts, leads, deals, tasks, coupons)
- `/api/client/*` — client portal (requireAuth, any role): profile, orders, projects, documents, meetings
- `/api/admin/*` — admin portal (requireAuth + requireRole superadmin): clients, projects, documents, meetings

## Models
- User (role, status, invite, resetPassword, preferences, jobTitle, phone, company)
- Order (package, customer, payment, workspace, email)
- Project (clientId, stages[], progress, currentPhase, adminNotes)
- Document (clientId, projectId, scope: client_shared|internal, status, fileUrl)
- Meeting (clientId, type, status: requested|confirmed|completed|cancelled, meetingLink, participants)
- Plus: Company, Contact, Deal, Task, CrmLead, Coupon, Lead

## Key conventions
- Shared auth middleware: `server/middleware/auth.js` exports `requireAuth` and `requireRole(...roles)`
- Client API helpers: `copper-crm/src/lib/clientApi.js` exports `clientApi` and `adminApi`
- AuthContext has `updateUser(partial)` to sync profile changes to localStorage

**Why:** Before this was refactored, `requireAuth` was defined inline in `auth.js` only. Now it's shared so all new routes can import it without duplication.
