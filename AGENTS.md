# Reusable Project Engineering Instructions

## Purpose

These are the default engineering rules for every project in this repository. Follow them unless the user explicitly requests a different approach or the existing project has a documented conflicting convention.

## 1. Determine the Project Scope

At the start of a new project, determine whether the work is frontend-only, backend-only, or fullstack.

If the user or repository already makes the scope clear, do not ask again. If it is unclear, ask exactly one question:

> Is this project frontend-only, backend-only, or fullstack?

Apply only the relevant sections. For fullstack projects, apply the frontend, backend, and API-contract rules.

## 2. General Working Rules

- Inspect the repository before creating files or changing architecture.
- Preserve established conventions unless the user requests a migration.
- Briefly explain the architecture before implementing a major feature.
- Write complete, production-ready, typed, secure, maintainable code.
- Follow Clean Code, SOLID, and separation of concerns.
- Avoid pseudocode and placeholders when the required information exists.
- Do not duplicate business logic across components, views, serializers, hooks, or stores.
- Do not add dependencies when the existing stack can solve the problem cleanly.
- Never create both npm and pnpm lockfiles.
- Run relevant type checks, linting, and tests after changes.
- Report any command or test that could not be run.

## 3. Package Management

- Prefer `pnpm` for new JavaScript or TypeScript projects.
- If an existing project uses npm, continue using npm unless asked to migrate.
- Respect the existing lockfile:
  - `pnpm-lock.yaml` means pnpm.
  - `package-lock.json` means npm.
- Never mix package managers in one project.


## 4. VS Code Tasks and Fixed Development Ports

Every project should include a committed `.vscode/tasks.json` that can start the project from VS Code without manually retyping commands.

### Port rules

- Assign a fixed, project-specific development port when creating a new project.
- Ports should differ between projects to reduce conflicts when several projects run at once.
- For fullstack projects, assign separate fixed ports for the frontend and backend.
- Check existing environment files, scripts, documentation, and tasks before choosing ports.
- If the user already provided ports, use them.
- Otherwise, choose uncommon available development ports and record them clearly.
- Once a project port is established, do not silently change it.
- Never terminate another process merely to take its port. Report the conflict or deliberately update the project configuration.
- Keep all port references synchronized across `.vscode/tasks.json`, package scripts, environment files, CORS settings, CSRF trusted origins, callback URLs, and documentation.

### Task rules

Frontend-only projects should have a task such as:

```text
Start frontend
```

Backend-only projects should have a task such as:

```text
Start backend
```

Fullstack projects should normally have:

```text
Start frontend
Start backend
Start project
```

`Start project` should be a compound task that starts the frontend and backend in parallel.

Use the package manager already selected for the repository. Prefer `pnpm` for new frontend projects.

Example fullstack `.vscode/tasks.json`:

```jsonc
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start frontend",
      "type": "shell",
      "command": "pnpm dev -- --port 4317",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "clear": false
      }
    },
    {
      "label": "Start backend",
      "type": "shell",
      "command": "python manage.py runserver 127.0.0.1:8317",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "clear": false
      }
    },
    {
      "label": "Start project",
      "dependsOn": [
        "Start backend",
        "Start frontend"
      ],
      "dependsOrder": "parallel",
      "problemMatcher": []
    }
  ]
}
```

The numbers above are examples only. Each real project must receive its own fixed ports.

## 5. Frontend Technology Standard

Use these defaults for new frontend projects:

- Next.js App Router
- TypeScript with strict typing
- `src/` directory
- Tailwind CSS
- ShadCN UI
- React Hook Form
- Zod
- TanStack Query for server state, queries, and mutations
- Zustand for client and editor state
- Vitest and React Testing Library
- Playwright when end-to-end testing is needed
- pnpm

Use Server Components by default. Add `"use client"` only when interaction, browser APIs, React state, client hooks, or client libraries require it.

## 6. Frontend Folder Structure

Use this base structure when the project needs the relevant folders:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── shared/
│   ├── site/
│   ├── admin/
│   └── dashboard/
├── api/
├── hooks/
├── stores/
├── schemas/
├── types/
├── lib/
├── config/
└── utils/
```

Do not create empty folders merely to match the example.

## 7. Mirror App Routes Inside Components

Mirror route organization from `src/app` inside `src/components`.

```text
src/app/(site)/page.tsx
→ src/components/site/home/

src/app/(site)/about/page.tsx
→ src/components/site/about/

src/app/(admin)/templates/page.tsx
→ src/components/admin/templates/

src/app/(dashboard)/settings/page.tsx
→ src/components/dashboard/settings/
```

Rules:

- Remove route-group parentheses in the matching component path.
- Use `home/` for the root `page.tsx` of a route group.
- Keep route files small and focused on composition and route-level server work.
- Put ShadCN primitives in `components/ui/`.
- Put application-wide reusable components in `components/shared/`.
- Put route-specific components in the mirrored route folder.

## 8. Frontend Data and State Layers

Use this flow:

```text
API function → TanStack Query hook → page/component
                         ↓
                    cache updates
```

### `src/api/`

- Store raw backend communication here.
- Create one configured client in `api/client.ts`.
- Group endpoints by domain instead of one large endpoint file.

```text
src/api/
├── client.ts
├── auth.ts
├── users.ts
├── products.ts
├── orders.ts
└── payments.ts
```

API modules must not contain React hooks or UI state.

### `src/hooks/`

- Put TanStack Query queries and mutations here.
- Group hooks by domain.
- Use descriptive names beginning with `use`.

```text
src/hooks/
├── auth/
│   ├── useLogin.ts
│   ├── useLogout.ts
│   └── useCurrentUser.ts
└── products/
    ├── useProducts.ts
    ├── useProduct.ts
    └── useCreateProduct.ts
```

### `src/stores/`

- Use Zustand for client state, not as a replacement for TanStack Query.
- Group stores by product area when useful.

```text
src/stores/
├── admin/
├── site/
├── user/
└── commerce/
```

Good Zustand use cases include selected editor nodes, panels, canvas zoom, unsaved local changes, temporary cart state, and UI preferences.

Backend-owned data such as users, products, orders, and templates should normally remain in TanStack Query.

## 9. Forms, Schemas, and Types

Use React Hook Form with Zod and ShadCN form components.

- Put runtime validation in `src/schemas/`.
- Put shared TypeScript structures in `src/types/`.
- Infer form input types from Zod schemas instead of duplicating structures.

```ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

Use Zod for forms, critical API responses, environment variables, local-storage data, and builder JSON.

Use normal TypeScript types for component props, store state, utility types, and trusted compile-time structures.

## 10. Django Backend Standard

For new Django backends:

- Name the project configuration package `serverConfig`.
- Use one main Django application named `api`.
- Organize `api` by layer.
- Split each layer into domain files such as `user.py`, `product.py`, and `order.py`.

```text
backend/
├── manage.py
├── serverConfig/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
└── api/
    ├── models/
    ├── serializers/
    ├── views/
    ├── urls/
    ├── services/
    ├── selectors/
    ├── permissions/
    ├── signals/
    ├── tasks/
    ├── admin/
    ├── tests/
    └── apps.py
```

Example:

```text
api/models/user.py
api/serializers/user.py
api/views/user.py
api/urls/user.py
api/services/user.py
api/selectors/user.py
api/tests/test_user.py
```

Import split models from `api/models/__init__.py` so Django discovers them. Combine domain URL modules through `api/urls.py`.

## 11. Django Responsibility Rules

- Models define persistence rules and small model-specific behavior.
- Serializers validate and transform API data.
- Views coordinate HTTP requests and responses.
- Services contain writes, workflows, transactions, and business logic.
- Selectors contain reusable read/query logic.
- Permissions control access.
- Signals are for decoupled side effects, not essential workflows.
- Tasks contain asynchronous work.
- Keep views, serializers, and models thin.

For admin CRUD APIs:

- Use `ModelViewSet` for full CRUD resources.
- Use `GenericViewSet` with selected mixins when only some operations are allowed.
- Use custom actions or dedicated endpoints for commands such as approve, publish, cancel, refund, or archive.
- Put command logic in services.
- Apply explicit permissions to every admin endpoint.

## 12. Authentication Standard

For normal browser-based Next.js and Django applications, prefer:

- Django session authentication
- Secure HTTP-only session cookies
- CSRF protection
- `dj-rest-auth` for standard auth endpoints when suitable
- A same-origin Next.js proxy or backend-for-frontend route when practical

Required flow:

1. Frontend requests a CSRF endpoint.
2. Django ensures the CSRF cookie exists.
3. Frontend sends credentials with requests.
4. Unsafe requests send `X-CSRFToken`.
5. Login creates the HTTP-only session cookie.
6. Logout destroys the server-side session.

Use standard DRF `SessionAuthentication` unless there is a proven reason to customize it. Protect login and other anonymous unsafe endpoints with CSRF explicitly.

Use JWT only for a real token requirement such as mobile apps, third-party API clients, or service-to-service authentication. Do not add JWT merely to avoid configuring CSRF.

Production auth must use HTTPS, secure cookies, trusted origins, strict permissions, suitable rate limits, and tests for login, logout, CSRF rejection, session expiry, and unauthorized access.

## 13. OpenAPI Contract

For fullstack projects:

- Use `drf-spectacular` to generate the Django OpenAPI schema.
- Treat OpenAPI as the frontend-backend contract.
- Generate TypeScript API types or a typed client from it.
- Frontend code must use generated types rather than guessing response shapes.
- Regenerate the schema and types whenever serializers or endpoints change.
- Add CI checks for stale generated types or schema drift.
- Use Zod for runtime validation where required; OpenAPI types provide compile-time safety.

## 14. Testing and Quality

Frontend:

- Test utilities, stores, hooks, and important components with Vitest.
- Use React Testing Library for user-facing component behavior.
- Use Playwright for critical end-to-end flows.

Backend:

- Test services, selectors, permissions, serializers, and API behavior.
- Include authentication, authorization, validation, and tenant-isolation tests when relevant.
- Test admin ViewSet permissions and custom actions.

Before completion:

- Run formatting and linting.
- Run TypeScript checks.
- Run relevant unit and integration tests.
- Run Django checks and migration checks when models change.
- Verify generated OpenAPI types when API contracts change.

## 15. Security Rules

- Never expose secrets in frontend code.
- Never store sensitive auth tokens in local storage when secure cookies are available.
- Validate all untrusted input.
- Enforce authorization on the backend regardless of frontend route protection.
- Use database transactions for multi-step writes.
- Avoid mass assignment and unrestricted serializer fields.
- Rate-limit authentication, forms, payments, uploads, and public actions where appropriate.
- Validate uploaded file type, size, and ownership.
- Do not trust client-provided tenant, owner, role, price, payment status, or permission values.
- Keep dependencies updated and avoid unnecessary packages.

## 16. Implementation Workflow

Before implementation:

1. Inspect the repository and existing conventions.
2. Determine frontend, backend, or fullstack scope.
3. Identify affected routes, domains, models, API contracts, and tests.
4. Reuse existing modules before creating new ones.
5. Briefly state the architecture for substantial features.

During implementation:

1. Keep each layer within its responsibility.
2. Update types and schemas with the implementation.
3. Handle loading, empty, success, and error states.
4. Add authorization and validation at the backend boundary.
5. Add or update tests.

After implementation:

1. Run the relevant checks.
2. Fix failures caused by the change.
3. Summarize changed files and important decisions.
4. Clearly disclose unverified behavior.

## 17. Project-Specific Overrides

Project requirements may extend this guide. Add them below or in a nearer nested `AGENTS.md`. More specific project instructions take priority, but do not silently abandon these defaults.

### This project

**Phone Sim** is a Manifest V3 browser extension (Chromium: Opera GX, Chrome, Edge, Brave) that opens
any website inside realistic phone, tablet and foldable frames, with a device picker, rotation,
screenshots and screen recording. Personal tool; free, no accounts, no paywall, no tracking.

- **Scope:** frontend-only browser extension. No backend, no server, no network calls of its own.
- **Stack:** TypeScript strict, React 19, Tailwind CSS v4 (`@tailwindcss/vite`), Zustand (UI state),
  Zod (validates the device catalog and saved settings), Vite (multi-entry build), Vitest, pnpm.
  The Next.js / ShadCN / TanStack Query rules in sections 5–8 do not apply: an extension has no
  routes or server data. Keep the spirit: small components, logic out of components, typed data.
- **Port:** none. The extension is built, not served. `pnpm dev` = `vite build --watch` into
  `dist/`; the VS Code task "Start frontend" runs it. Reload the extension after a rebuild.
- **Load it:** browser extensions page → Developer mode → "Load unpacked" → pick `dist/`.
- **Checks before done:** `pnpm typecheck`, `pnpm test`, `pnpm build`.
- **Devices:** one object per device in `src/devices/catalog/<brand>.ts`, validated by the Zod
  schema in `src/schemas/device.ts`. Adding a phone must never need code changes elsewhere.
  Device `id`s are permanent (saved settings use them). Mark estimated specs `approx: true`.
- **Originality:** all code and visuals are written for this project. Never copy code, images,
  device artwork or text from other simulator extensions. Frames are drawn with CSS from the
  device numbers.
- **Privacy:** header changes and the mobile-environment script apply only to tabs showing the
  simulator, never to the user's normal browsing.
