# Roadmap & Future Features

This document tracks the evolution of the platform.

## Completed Core
- [x] **Authentication**: Dual-write Signup, Login, Reset Password, Magic Link.
- [x] **Organization**: Creation, Settings, Invites, Role Management.
- [x] **Billing**: Free Tier auto-provisioning, Stripe Integration (Mocked).
- [x] **Audit**: Full activity logging with readable details.
- [x] **Notifications**: Preference-gated alerts.

## Immediate Next Steps (The "God Tier" ERP)
1.  **Event Outbox Processing**: We have the schema (`EventOutbox`), but need the background worker to process `PENDING` events.
2.  **Advanced UI Components**: Implement `RNGSpreadsheet`, `RNGKanban`, `RNGResourceScheduler`.
3.  **Global Search**: Implement the `RNGSearchCenter` and `RNGCommandPalette`.

## Long-Term Vision
*   **Phase 15**: Digital Twins & Predictive Sandbox.
*   **Phase 23**: High-Fidelity Physics Simulations.
*   **Phase 26**: Cognitive Interfaces (BCI).

See `ui/ROADMAP.md` for the detailed UI breakdown.
