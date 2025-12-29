# 🏗️ RNG-APPS CONSTRUCTION ERP: ROADMAP

## 🏁 PHASE 1: THE FOUNDATION (Current Status: 95%)

**Objective:** Establish the Platinum-Standard Infrastructure and Core Schemas.

### ✅ Completed

1.  **System Architecture**
    - Strict Separation: `core/` (Infra) vs `app-features/` (Domain).
    - Base Classes: `AbstractFirestoreRepository`, `AbstractService`.
    - Tenancy: `organizations/{orgId}/{module}` strict isolation.

2.  **Core Modules (Backend)**
    - **Module 1: Entities (CRM)** - People & Business management.
    - **Module 2: R&D Lab** - Product vetting & logistics.
    - **Module 3: Project Nexus** - AIA Phases, Consulting Fees.
    - **Module 4: Task Command** - Gated Workflow, Profitability Tracking.
    - **Module 10: Taxonomy (Core)** - _Moved to `core/taxonomy`_. Dynamic tagging engine.

3.  **UI Engine (`rng-form`)**
    - **DSL Builder**: Type-safe schema definition (`t.text`, `t.taxonomy`).
    - **Taxonomy Input**: Auto-learning, creatable tags with `core` integration.
    - **Independent Components**: Decoupled `TaxonomyInput` from `AsyncAutocomplete` for stability.

### 🚧 In Progress

1.  **UI Assembly**
    - Building the `EntityForm` and `EntityTable`.
    - Connecting the Dashboard to `TaskService`.

### 📅 Upcoming (Phase 2)

1.  **Module 6: Financial Core**
    - Invoices, Estimates, Change Orders.
2.  **Module 5: Smart Docs**
    - PDF Generation (Valuations).
3.  **Module 9: Drawing Vault**
    - Plan versioning & transmittals.

## 🛠️ Developer Protocols

- **Repo Access:** Always use `getRepo(orgId)` (Cached Factory).
- **Actions:** Always use `orgActionClient` (Auth & Org Context).
- **Queries:** Always use Object Syntax `{ field, op, value }` for `where` clauses.
