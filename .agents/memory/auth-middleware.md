---
name: Auth middleware
description: Where requireAuth lives and how to use it across routes.
---

## Location
`server/middleware/auth.js` exports:
- `requireAuth` — verifies Bearer JWT, sets `req.auth = { sub, role, email }`
- `requireRole(...roles)` — use after requireAuth; returns 403 if role not in list

## Usage
```js
import { requireAuth, requireRole } from "../middleware/auth.js";
router.use(requireAuth);
router.use(requireRole("superadmin")); // for admin-only routes
```

**Why:** Original codebase had `requireAuth` defined inline only in `server/routes/auth.js`. New routes (`client.js`, `admin.js`) needed it too, so it was extracted to a shared middleware file. Do not redefine it inline again — always import from `server/middleware/auth.js`.
