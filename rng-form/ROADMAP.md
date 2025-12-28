# RNG Form Roadmap (Enterprise Data Entry)

This roadmap outlines the evolution of `rng-form` into a comprehensive, schema-driven form engine capable of handling the most complex data entry requirements of an ERP system.

**Philosophy**: "Configuration over Code." Complex forms should be defined via type-safe schemas (DSL), not manual React rendering.

## Phase 1: Advanced Validation & Logic
*Enhancing the "Brain" of the form engine.*

- [ ] **Cross-Field Validation**: Rules that depend on multiple fields (e.g., "EndDate must be after StartDate").
- [ ] **Async Validation**: Server-side checks (e.g., "Is Email Taken?", "Is SKU Valid?") with debouncing and loading states.
- [ ] **Conditional Logic Engine**:
    - **Visibility**: Show/Hide fields based on complex expressions (AND/OR groups).
    - **Reactivity**: Auto-calculate values or reset fields when dependencies change.
    - **Read-Only**: Dynamically disable fields based on user role or record status.
- [ ] **Dirty Checking Strategy**: Smart tracking of changes to prevent data loss (warn on exit) and enable "Save Draft" features.

## Phase 2: High-Density & Complex Inputs
*Specialized components for heavy-duty data entry.*

- [ ] **RNGAddressInput**: A multi-field composite (Street, City, State, Zip) with Google Places Autocomplete integration.
- [ ] **RNGLookup**: A powerful "Search & Select" modal for linking records (e.g., Assign Customer to Invoice) with filtering and sorting inside the modal.
- [ ] **RNGTagInput**: Free-text tagging with auto-complete suggestions and color coding.
- [ ] **RNGCodeEditorInput**: Embedded Monaco editor for JSON/SQL/Script fields within a form.
- [ ] **RNGMoneyInput**: Precision-safe currency input with locale formatting and currency switching.
- [ ] **RNGPhoneNumber**: International phone input with country flag and validation.

## Phase 3: Layouts & Workflows
*Structuring massive forms into manageable flows.*

- [ ] **RNGWizard (Enhanced)**:
    - Branching logic (Skip steps based on answers).
    - Persisted progress (Resume where you left off).
    - Sidebar navigation mode for very long wizards.
- [ ] **RNGFormRepeater (Arrays)**:
    - **Inline Mode**: Add rows directly in a table.
    - **Modal Mode**: Add items via a popup form.
    - **Drag & Drop**: Reorder items easily.
    - **Bulk Actions**: Delete multiple rows at once.
- [ ] **RNGCollapsibleSection**: Sections that can be expanded/collapsed to declutter the UI.
- [ ] **RNGFormTabs**: Organizing fields into tabs (e.g., "General", "Shipping", "Billing") with error indicators on the tab header.

## Phase 4: Developer Experience & DSL
*Making it a joy to build complex forms.*

- [ ] **Form Builder UI**: A drag-and-drop visual editor that generates the DSL code (Low-Code).
- [ ] **Schema Export/Import**: Ability to save form definitions as JSON for dynamic server-driven UI.
- [ ] **Strict Typing 2.0**: Enhanced TypeScript inference to autocomplete field names in `conditional` logic and `dependencies`.
- [ ] **DevTools**: A debug panel to inspect form state, validation errors, and dirty fields in real-time.

## Phase 5: AI & Automation
- [ ] **AI Form Fill**: "Paste raw text here" -> AI parses it and fills the structured fields.
- [ ] **Smart Suggestions**: Suggest field values based on historical data.
- [ ] **Voice Input**: Speech-to-text integration for long text fields.

## Current Component Inventory (To Be Enhanced)
- `AsyncAutocomplete`
- `DateInput` / `DateRange`
- `ArrayField` (Repeater)
- `DataGrid` (Editable)
- `FileUpload` / `MultiImageEditor`
- `RichText`
- `Signature`
- `TransferList`
- `WizardLayout` / `StepperLayout`
