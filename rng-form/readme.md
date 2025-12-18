# Introduction to RNG Form

**RNG Form** is a robust, schema-driven form builder designed for modern Next.js and React applications. It bridges the gap between data validation and UI rendering by generating type-safe, accessible forms directly from Zod schemas.

## Core Philosophy

1.  **Schema First**: The source of truth is your Zod schema. If the data structure changes, the form definition must change, ensuring your UI never drifts from your data requirements.
2.  **Type Safety**: The entire DSL is generic over your specific Zod schema. You get TypeScript autocomplete for field names and immediate errors if you reference a non-existent field.
3.  **Separation of Concerns**:
    - **Data Validation**: Handled by **Zod**.
    - **State Management**: Handled by **React Hook Form**.
    - **Rendering**: Handled by **Material UI** (MUI) components.
    - **Definition**: Handled by the **RNG Form DSL**.

## Key Features

- **Recursive Layouts**: Build complex UIs with nested Sections, Wizards, Tabs, and Accordions.
- **Reactive Logic**: Define powerful conditional logic (`renderLogic`, `propsLogic`) that reacts to field changes in real-time without rerendering the entire form tree.
- **Rich Component Library**: Out-of-the-box support for:
  - Autocompletes (Sync & Async)
  - Date Ranges & Pickers
  - Rich Text Editors
  - File Uploads
  - Signatures
  - Data Grids & Arrays
- **Performance**: Optimized rendering engine that minimizes repaints, suitable for large enterprise forms.

# Getting Started

## 1. Installation

Ensure you have the required dependencies installed in your project:

````bash
npm install react-hook-form zod @hookform/resolvers @mui/material @mui/icons-material @mui/x-date-pickers date-fns

Here is the raw content for each documentation file. You can copy the text inside each code block directly into your markdown files.

rng-form/documentation/01-introduction.md
Markdown

# Introduction to RNG Form

**RNG Form** is a robust, schema-driven form builder designed for modern Next.js and React applications. It bridges the gap between data validation and UI rendering by generating type-safe, accessible forms directly from Zod schemas.

## Core Philosophy

1.  **Schema First**: The source of truth is your Zod schema. If the data structure changes, the form definition must change, ensuring your UI never drifts from your data requirements.
2.  **Type Safety**: The entire DSL is generic over your specific Zod schema. You get TypeScript autocomplete for field names and immediate errors if you reference a non-existent field.
3.  **Separation of Concerns**:
    * **Data Validation**: Handled by **Zod**.
    * **State Management**: Handled by **React Hook Form**.
    * **Rendering**: Handled by **Material UI** (MUI) components.
    * **Definition**: Handled by the **RNG Form DSL**.

## Key Features

* **Recursive Layouts**: Build complex UIs with nested Sections, Wizards, Tabs, and Accordions.
* **Reactive Logic**: Define powerful conditional logic (`renderLogic`, `propsLogic`) that reacts to field changes in real-time without rerendering the entire form tree.
* **Rich Component Library**: Out-of-the-box support for:
    * Autocompletes (Sync & Async)
    * Date Ranges & Pickers
    * Rich Text Editors
    * File Uploads
    * Signatures
    * Data Grids & Arrays
* **Performance**: Optimized rendering engine that minimizes repaints, suitable for large enterprise forms.
rng-form/documentation/02-getting-started.md
Markdown

# Getting Started

## 1. Installation

Ensure you have the required dependencies installed in your project:

```bash
npm install react-hook-form zod @hookform/resolvers @mui/material @mui/icons-material @mui/x-date-pickers date-fns
2. Basic Usage
The workflow consists of three steps: defining the data schema, defining the UI layout, and rendering the component.

Step 1: Define the Zod Schema
Describe your data shape. Validations defined here (like .min(2)) automatically become form errors.

TypeScript

import { z } from 'zod';

const UserSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest']),
  preferences: z.object({
    notifications: z.boolean(),
  }),
});
Step 2: Define the UI Schema
Use the defineForm helper. This provides the form builder which is typed to UserSchema.

TypeScript

import { defineForm } from '@/rng-form'; // Adjust path

const uiSchema = defineForm<typeof UserSchema>((form) => [
  form.section('Account Details', [
    form.text('fullName', { label: 'Full Name', placeholder: 'John Doe' }),
    form.text('email', { label: 'Email Address' }),
    form.radio('role', [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
      { label: 'Guest', value: 'guest' },
    ], { label: 'User Role', row: true }),
  ]),

  form.section('Settings', [
    form.switch('preferences.notifications', { label: 'Enable Notifications' })
  ])
]);
Step 3: Render the Form
Pass the schema and UI definition to the RNGForm component.

TypeScript

import { RNGForm } from '@/rng-form';

export default function RegistrationPage() {
  const handleSubmit = (data: z.infer<typeof UserSchema>) => {
    console.log('Form Submitted:', data);
  };

  return (
    <RNGForm
      title="Create Account"
      schema={UserSchema}
      uiSchema={uiSchema}
      defaultValues={{
        fullName: '',
        email: '',
        role: 'user',
        preferences: { notifications: true }
      }}
      onSubmit={handleSubmit}
    />
  );
}

### `rng-form/documentation/03-dsl-reference.md`

```markdown
# DSL Reference

The `FormBuilderDSL` class is your primary tool for constructing forms. It provides methods for every supported field type.

## Primitives

| Method | Description | Key Props |
| :--- | :--- | :--- |
| `form.text(name, props)` | Standard text input | `multiline`, `rows`, `placeholder` |
| `form.password(name, props)` | Masked password input | `placeholder` |
| `form.number(name, props)` | Numeric input | `min`, `max`, `formatOptions` (currency, units) |
| `form.date(name, props)` | Date picker | `minDate`, `maxDate` |
| `form.hidden(name, props)` | Hidden input | - |
| `form.color(name, props)` | Color picker | - |

## Selection Controls

### Boolean & Toggles
```typescript
form.switch('isActive', { label: 'Active Status' })
form.checkbox('tags', options, { row: true }) // Checkbox Group
````
