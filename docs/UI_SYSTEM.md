# UI Design System Guidelines

## Philosophy
The RNG UI System is built for **Density**, **Speed**, and **Consistency**. We do not use random MUI components; we use our **RNG Primitives**.

## 1. Atoms (The Basics)

### `RNGButton`
*   **Usage**: All clickable actions.
*   **Variants**:
    *   `primary`: Main call to action (Save, Submit).
    *   `secondary`: Alternative actions (Cancel, Back).
    *   `danger`: Destructive actions (Delete).
    *   `ghost`: Low priority actions.
*   **Features**: Automatically handles `isLoading` state.

### `RNGIcon`
*   **Usage**: All icons.
*   **Why**: Enforces consistent sizing (`20px` default) and allows switching icon sets globally.

### `RNGChip`
*   **Usage**: Status indicators (Active, Pending, Paid).
*   **Variants**: `tonal` (Light background, dark text) is the default for ERPs.

## 2. Layouts

### `RNGPage`
*   **Usage**: The root container for every route.
*   **Props**: `title`, `description`, `actions`.
*   **Why**: Enforces standard header spacing and typography.

### `RNGCard`
*   **Usage**: Grouping related content.
*   **Structure**: Header (Title + Actions) -> Divider -> Content.

## 3. Data Display

### `RNGDataGrid`
*   **Usage**: Displaying lists of records.
*   **Features**: Server-side pagination, sorting, and filtering built-in.

### `RNGStatCard`
*   **Usage**: Dashboard metrics.

## 4. Forms (`rng-form`)
We do **not** write `<form>` tags or use `useState` for inputs.
We define a **Schema** using Zod, and render it using `RNGForm`.

```tsx
const schema = z.object({ name: z.string() });
const uiSchema = defineForm((f) => [
  f.text('name', { label: 'Org Name' })
]);

<RNGForm schema={schema} uiSchema={uiSchema} onSubmit={...} />
```
