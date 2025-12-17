# RNG Form

A type-safe, Zod-powered form builder for React/Next.js using MUI.

## Core Features

- **Type Safety**: Full TypeScript support with Zod schema inference.
- **DSL Builder**: Chainable API to define form UI without boilerplate.
- **Conditional Logic**: `renderLogic` and `propsLogic` for dynamic fields.
- **Complex Layouts**: Built-in support for Sections, Tabs, Wizards, and Accordions.
- **Performance**: Uses `react-hook-form` and `useWatch` for efficient re-renders.

## Basic Usage

1.  **Define Schema** (Zod)
2.  **Define UI** (DSL)
3.  **Render Form**

```tsx
import { z } from 'zod';
import { defineForm, RNGForm } from '@/rng-form';

// 1. Schema
const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

// 2. UI
const ui = defineForm<typeof schema>((f) => [
  f.section('User Details', [
    f.text('username', { label: 'Username' }),
    f.text('email', { label: 'Email Address' }),
  ]),
]);

// 3. Render
export default function MyForm() {
  return <RNGForm schema={schema} uiSchema={ui} onSubmit={(data) => console.log(data)} />;
}
```
