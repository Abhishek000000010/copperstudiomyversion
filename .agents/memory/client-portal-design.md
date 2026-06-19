---
name: Client portal design system
description: Design tokens, fonts, and component conventions for the client portal copper UI.
---

## Design tokens
All defined as CSS custom properties in `copper-crm/src/index.css` under `:root`:
- `--cs-primary: #894d0d` (copper brand color)
- `--cs-primary-container: #a76526`
- `--cs-primary-fixed: #ffdcc2`
- `--cs-background: #f8f9fb`
- `--cs-surface-container-lowest: #ffffff`
- `--cs-surface-container-low: #f2f4f6`
- `--cs-outline-variant: #d8c3b4`
- `--cs-on-surface: #191c1e`
- `--cs-secondary: #555f6d`
- `--cs-error: #ba1a1a`

## Fonts
- Loaded via Google Fonts in `copper-crm/index.html`
- Material Symbols Outlined (icon font — use `<span className="material-symbols-outlined">icon_name</span>`)
- Inter (body text in client portal)
- Syne + DM Sans (admin CRM, headings)

## Client portal components pattern
- CSS vars referenced as `style={{ color: "var(--cs-primary)" }}` — no Tailwind utility classes for portal colors
- `ClientLayout`: responsive fixed sidebar (w-64) + hamburger mobile menu, Material Symbols icons
- `ClientPages.jsx`: all 6 portal pages: `ClientTimelinePage`, `ClientMeetingsPage`, `ClientDocumentsPage`, `ClientBillingPage`, `ClientSettingsPage`, `ClientSupportPage`
- `ClientDashboard.jsx`: real API data from `/api/client/*`

**Why:** Provided HTML UI uses a specific Material Design 3 color system. Using CSS vars (not Tailwind classes) avoids conflicts with the admin CRM's global Tailwind overrides in index.css.
