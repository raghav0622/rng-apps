# RNG App Architecture Documentation

## 1. High-Level Architecture (The "Platinum" Standard)

The RNG App follows a strict, layered architecture designed for scalability, maintainability, and enterprise-grade resilience. We avoid "magic" and enforce explicit data flow.

### The Layers

1.  **UI Layer (`app/`, `ui/`)**:
    *   **Responsibility**: Rendering views, handling user interaction, and invoking Server Actions.
    *   **Rules**:
        *   NO business logic.
        *   NO direct database access.
        *   MUST use `rng-form` for data entry.
        *   MUST use the `RNG` UI Design System components.

2.  **Action Layer (`core/{domain}/*.actions.ts`)**:
    *   **Responsibility**: The public API surface for the frontend. Handles input validation (Zod) and permission checks.
    *   **Rules**:
        *   MUST be defined using `actionClient`, `authActionClient`, or `orgActionClient`.
        *   MUST validate inputs using Zod schemas.
        *   MUST delegate actual work to the Service Layer.
        *   MUST NOT contain core business logic (e.g., pricing calculations, complex state changes).

3.  **Service Layer (`core/{domain}/*.service.ts`)**:
    *   **Responsibility**: The "Brain" of the application. Orchestrates transactions, business rules, and cross-domain logic.
    *   **Rules**:
        *   MUST extend `AbstractService`.
        *   MUST return `Promise<Result<T>>`.
        *   MUST ensure atomicity (all-or-nothing transactions).
        *   MUST emit Domain Events for side effects (e.g., sending emails).

4.  **Data Access Layer (`core/{domain}/*.repository.ts`)**:
    *   **Responsibility**: Pure data persistence and retrieval.
    *   **Rules**:
        *   MUST extend `FirestoreRepository`.
        *   MUST handle Firestore-specific logic (collections, queries, converters).
        *   MUST NOT contain business rules (e.g., "User cannot be deleted if active").

5.  **Event Layer (`core/events/`)**:
    *   **Responsibility**: Decoupling side effects from main transactions.
    *   **Pattern**: Transactional Outbox (Events are saved to DB first, then processed).

---

## 2. Key Directories

| Path | Purpose |
| :--- | :--- |
| `app/(auth)` | Public authentication pages (Login, Signup, Reset Password). |
| `app/(protected)` | Authenticated application shell (Dashboard, Org Settings). |
| `core/` | The heart of the backend logic. Grouped by domain. |
| `core/auth` | User identity, session management (Redis), and profiles. |
| `core/organization` | Multi-tenancy, RBAC, Member management. |
| `core/billing` | Subscription lifecycle, payment abstraction. |
| `core/audit` | Compliance logging and history tracking. |
| `lib/` | Shared utilities, abstractions, and 3rd-party integrations. |
| `ui/` | The RNG Design System (Atoms, Molecules, Layouts). |
| `rng-form/` | The Schema-Driven Form Engine. |

---

## 3. Core Flows (How things work)

### A. The "Dual Write" Auth Flow
When a user signs up:
1.  **Action**: `signUpAction` receives email/password.
2.  **Service**: `AuthService.signup` calls Firebase Auth to create the identity.
3.  **Service**: Immediately creates a User Profile in Firestore.
4.  **Rollback**: If Firestore fails, the Firebase Auth user is deleted to maintain consistency.

### B. Organization & Billing
We enforce a "No Org Left Behind" policy:
1.  **Creation**: `OrganizationService.createOrganization` starts a transaction.
2.  **Billing**: Inside the *same* transaction, `BillingService.initializeFreeTier` creates a subscription record.
3.  **Audit**: An `ORG_CREATE` audit log is written.
4.  **Result**: An Org never exists without a Subscription and an Owner.

### C. The Safe Action Pattern
Every server action is wrapped in a "Safe Client" that provides:
1.  **Rate Limiting**: Prevents abuse (e.g., 50 reqs/30s).
2.  **Authentication**: Validates Session Cookies + Redis Session state.
3.  **Authorization**: Checks RBAC permissions (e.g., `ORG_UPDATE`).
4.  **Error Handling**: Catches errors, logs them with trace IDs, and sanitizes the message for the UI.

---

## 4. Developer Guide

### Creating a New Feature
1.  **Define Model**: Create `core/{feature}/{feature}.model.ts` (Zod schemas).
2.  **Create Repository**: Extend `FirestoreRepository` in `{feature}.repository.ts`.
3.  **Build Service**: Implement logic in `{feature}.service.ts` extending `AbstractService`.
4.  **Expose Action**: Create `{feature}.actions.ts` using `orgActionClient`.
5.  **Build UI**: Use `RNGPage`, `RNGCard`, and `rng-form` in `app/(protected)/{feature}/page.tsx`.

### Common Gotchas
*   **Never** use `console.log` for errors. Use `throw new CustomError(...)`.
*   **Never** access `firestore()` directly in the UI or Actions.
*   **Always** wait for `SessionService.requireUserAndOrg()` in `layout.tsx` or `page.tsx`.

