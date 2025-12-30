# RNG-Form Documentation

## Overview

RNG-Form is a schema-driven form engine that eliminates boilerplate code by defining forms through a declarative DSL (Domain-Specific Language). It integrates seamlessly with Zod for validation and provides a type-safe API for building complex data entry forms.

## Philosophy

**"Configuration over Code"**

Instead of manually rendering form fields and managing state, RNG-Form lets you define forms through configuration:

```typescript
// ❌ Manual Approach (100+ lines of code)
<form onSubmit={handleSubmit}>
  <TextField name="title" value={values.title} onChange={handleChange} />
  <TextField name="description" value={values.description} onChange={handleChange} />
  {errors.title && <span>{errors.title}</span>}
  {/* ... repeat for 20 fields */}
</form>

// ✅ RNG-Form Approach (10 lines of configuration)
export const taskFormUI = defineForm<typeof TaskSchema>((t) => [
  t.text('title', { label: 'Title', required: true }),
  t.text('description', { label: 'Description', multiline: true }),
  // ... rest of fields
]);
```

## Core Concepts

### 1. Schema Definition (Zod)

Forms start with a Zod schema that defines the data structure:

```typescript
import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assignedTo: z.string().optional(),
  dueDate: z.date().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
```

### 2. UI Definition (DSL)

The UI layout is defined using the DSL:

```typescript
import { defineForm } from '@/rng-form/dsl';

export const taskFormUI = defineForm<typeof TaskSchema>((t) => [
  t.section('Basic Information', [
    t.text('title', {
      label: 'Task Title',
      required: true,
      placeholder: 'Enter task title',
      colProps: { size: { xs: 12, md: 8 } },
    }),
    t.select('priority', [
      { label: 'Low', value: 'LOW' },
      { label: 'Medium', value: 'MEDIUM' },
      { label: 'High', value: 'HIGH' },
    ], {
      label: 'Priority',
      required: true,
      colProps: { size: { xs: 12, md: 4 } },
    }),
    t.text('description', {
      label: 'Description',
      multiline: true,
      rows: 4,
      placeholder: 'Provide details...',
    }),
  ]),
  
  t.section('Assignment', [
    t.asyncAutocomplete('assignedTo', {
      label: 'Assign To',
      placeholder: 'Select team member',
      fetchOptions: fetchMembers,
    }),
  ]),
]);
```

### 3. Form Rendering

Render the form using the RNGForm component:

```typescript
import { RNGForm } from '@/rng-form/components/RNGForm';

<RNGForm
  schema={TaskSchema}
  uiSchema={taskFormUI}
  defaultValues={task}
  onSubmit={handleSubmit}
  submitLabel="Save Task"
/>
```

## Field Types

### Text Input

```typescript
t.text('fieldName', {
  label: 'Field Label',
  required: boolean,
  placeholder: string,
  multiline: boolean,
  rows: number,
  helperText: string,
  colProps: { size: { xs: 12, md: 6 } },
})
```

**Use cases:**
- Single-line text (name, email, URL)
- Multi-line text (description, notes, comments)

### Number Input

```typescript
t.number('estimatedHours', {
  label: 'Estimated Hours',
  min: 0,
  max: 1000,
  step: 0.5,
  helperText: 'Enter estimated duration',
  colProps: { size: { xs: 12, md: 4 } },
})
```

**Use cases:**
- Integers (quantity, count)
- Decimals (price, rate, percentage)

### Select (Dropdown)

```typescript
t.select('status', [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
], {
  label: 'Status',
  required: true,
  helperText: 'Select current status',
})
```

**Use cases:**
- Fixed set of options
- Status/type selection
- Enums

### Async Autocomplete

```typescript
t.asyncAutocomplete('assignedTo', {
  label: 'Assign To',
  placeholder: 'Search team members',
  fetchOptions: async (query: string) => {
    const members = await fetchMembers(query);
    return members.map(m => ({
      label: m.name,
      value: m.id,
    }));
  },
  helperText: 'Start typing to search',
})
```

**Features:**
- Debounced search (default 300ms)
- Loading indicator
- No results message
- Clear button

**Use cases:**
- User selection
- Resource linking
- Large datasets

### Date Picker

```typescript
t.date('dueDate', {
  label: 'Due Date',
  helperText: 'When should this be completed?',
  minDate: new Date(),
  colProps: { size: { xs: 12, md: 6 } },
})
```

**Use cases:**
- Single date selection
- Date ranges (use two date fields)

### Checkbox

```typescript
t.checkbox('isUrgent', {
  label: 'Mark as Urgent',
  helperText: 'Priority task requiring immediate attention',
})
```

**Use cases:**
- Boolean flags
- Terms acceptance
- Feature toggles

### Radio Group

```typescript
t.radio('paymentMethod', [
  { label: 'Credit Card', value: 'CARD' },
  { label: 'Bank Transfer', value: 'BANK' },
  { label: 'Cash', value: 'CASH' },
], {
  label: 'Payment Method',
  required: true,
})
```

**Use cases:**
- Mutually exclusive options
- Better UX than select for 2-5 options

## Layout & Organization

### Sections

Group related fields into collapsible sections:

```typescript
defineForm<typeof Schema>((t) => [
  t.section('Personal Information', [
    t.text('firstName', { label: 'First Name' }),
    t.text('lastName', { label: 'Last Name' }),
    t.text('email', { label: 'Email' }),
  ]),
  
  t.section('Address Details', [
    t.text('street', { label: 'Street Address' }),
    t.text('city', { label: 'City' }),
    t.text('zipCode', { label: 'ZIP Code' }),
  ]),
])
```

### Column Layouts

Control field widths using the grid system:

```typescript
t.text('title', {
  label: 'Title',
  colProps: { 
    size: { 
      xs: 12,  // Full width on mobile
      sm: 12,  // Full width on small tablets
      md: 8,   // 2/3 width on desktop
      lg: 6,   // 1/2 width on large screens
    } 
  },
})
```

**Grid System:**
- Based on 12-column grid
- Responsive breakpoints: xs, sm, md, lg, xl
- Automatic spacing between fields

### Helper Text & Tooltips

Provide contextual help:

```typescript
t.number('billableRate', {
  label: 'Billable Rate ($/hour)',
  helperText: 'Revenue generated per hour of work',
  tooltip: 'This is what you charge clients',
})
```

## Advanced Features

### Async Validation

Validate against the server:

```typescript
export const EmailSchema = z.object({
  email: z.string().email().refine(async (email) => {
    const available = await checkEmailAvailable(email);
    return available;
  }, {
    message: 'Email already taken',
  }),
});
```

### Conditional Fields

Show/hide fields based on other field values:

```typescript
// Coming soon - Phase 1 of RNG-Form Roadmap
t.text('otherType', {
  label: 'Specify Other Type',
  visible: (values) => values.type === 'OTHER',
})
```

### Dynamic Defaults

Set default values dynamically:

```typescript
<RNGForm
  schema={TaskSchema}
  uiSchema={taskFormUI}
  defaultValues={{
    priority: 'MEDIUM',
    status: TaskStatus.TODO,
    resourceType: TaskResourceType.GENERAL,
    estimatedMinutes: 0,
  }}
  onSubmit={handleSubmit}
/>
```

### Field Dependencies

Auto-update fields when dependencies change:

```typescript
// Coming soon - Phase 1 of RNG-Form Roadmap
t.number('totalPrice', {
  label: 'Total Price',
  calculate: (values) => values.quantity * values.unitPrice,
  readOnly: true,
})
```

## Integration Examples

### Complete Task Form Example

```typescript
// task.form.ts
import { defineForm } from '@/rng-form/dsl';
import { TaskSchema } from './task.model';

export const TaskFormSchema = TaskSchema.pick({
  title: true,
  description: true,
  priority: true,
  assignedTo: true,
  resourceType: true,
  estimatedMinutes: true,
});

async function fetchMembers(query: string) {
  const result = await getMembersAction({});
  if (result?.success) {
    return result.data
      .filter(m => m.user?.displayName?.includes(query))
      .map(m => ({
        label: m.user?.displayName || m.user?.email,
        value: m.userId,
      }));
  }
  return [];
}

export const taskFormUI = defineForm<typeof TaskFormSchema>((t) => [
  t.section('Basic Information', [
    t.text('title', {
      label: 'Task Title',
      required: true,
      placeholder: 'e.g., Review construction drawings',
      colProps: { size: { xs: 12, md: 8 } },
      autoFocus: true,
    }),
    t.select('priority', [
      { label: 'Low', value: 'LOW' },
      { label: 'Medium', value: 'MEDIUM' },
      { label: 'High', value: 'HIGH' },
    ], {
      label: 'Priority',
      required: true,
      colProps: { size: { xs: 12, md: 4 } },
    }),
    t.text('description', {
      label: 'Description',
      multiline: true,
      rows: 3,
      placeholder: 'Provide detailed task description...',
    }),
  ]),

  t.section('Assignment', [
    t.asyncAutocomplete('assignedTo', {
      label: 'Assign To',
      placeholder: 'Select team member',
      fetchOptions: fetchMembers,
    }),
  ]),

  t.section('Time Tracking', [
    t.number('estimatedMinutes', {
      label: 'Estimated Time (minutes)',
      placeholder: '120',
      min: 0,
      helperText: 'Expected duration for this task',
    }),
  ]),
]);
```

### Using the Form in a Page

```typescript
// app/(protected)/tasks/create/page.tsx
'use client';

import { TaskForm } from '../_components/TaskForm';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';

export default function CreateTaskPage() {
  const router = useRouter();
  const { execute, isPending } = useRngAction(createTaskAction);

  const handleSubmit = async (data: any) => {
    const response = await execute(data);
    if (response?.success) {
      router.push('/tasks');
    }
  };

  return (
    <RNGPage
      title="Create New Task"
      description="Define a new task with resource linking"
      backHref="/tasks"
    >
      <TaskForm onSubmit={handleSubmit} isLoading={isPending} />
    </RNGPage>
  );
}
```

### Form Component Wrapper

```typescript
// _components/TaskForm.tsx
'use client';

import { TaskFormSchema, taskFormUI } from '@/app-features/tasks/task.form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Paper } from '@mui/material';

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function TaskForm({ defaultValues, onSubmit, isLoading }: TaskFormProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <RNGForm
        schema={TaskFormSchema}
        uiSchema={taskFormUI}
        defaultValues={defaultValues || {}}
        onSubmit={onSubmit}
        submitLabel="Create Task"
      />
    </Paper>
  );
}
```

## Best Practices

### DO:
✅ Define schemas in `.model.ts` files
✅ Define UI layouts in `.form.ts` files
✅ Use sections to organize related fields
✅ Provide helpful labels and placeholders
✅ Use asyncAutocomplete for large datasets
✅ Set appropriate column widths for responsiveness
✅ Add helper text for complex fields
✅ Use smart defaults to reduce data entry

### DON'T:
❌ Mix form logic with UI components
❌ Hardcode validation rules in multiple places
❌ Create deeply nested sections (max 2 levels)
❌ Use select for 20+ options (use asyncAutocomplete)
❌ Forget required field indicators
❌ Skip placeholder text
❌ Ignore mobile responsiveness

## Validation Patterns

### Required Fields

```typescript
z.string().min(1, 'This field is required')
z.string().email('Must be a valid email')
z.number().positive('Must be positive')
```

### Custom Validation

```typescript
z.string().refine(
  (val) => val.length >= 8,
  'Password must be at least 8 characters'
)
```

### Cross-Field Validation

```typescript
z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)
```

## Error Handling

### Field-Level Errors

Automatically displayed below fields:

```typescript
// Zod validation error automatically shows
z.string().email() // Shows "Invalid email" below field
```

### Form-Level Errors

```typescript
<RNGForm
  schema={schema}
  uiSchema={ui}
  onSubmit={async (data) => {
    try {
      await saveData(data);
    } catch (error) {
      // Error is caught and displayed
      throw new Error('Failed to save: ' + error.message);
    }
  }}
/>
```

## Performance Optimization

### Memoize Form Definitions

```typescript
export const taskFormUI = defineForm<typeof TaskSchema>((t) => [
  // Form definition
]);

// Reused across create/edit without re-definition
```

### Debounced Async Autocomplete

```typescript
t.asyncAutocomplete('assignedTo', {
  label: 'Assign To',
  fetchOptions: fetchMembers,
  debounceMs: 300, // Wait 300ms after typing stops
})
```

## Roadmap

### Phase 1: Advanced Validation & Logic (Coming Soon)
- Cross-field validation
- Conditional visibility
- Dynamic read-only fields
- Dirty checking

### Phase 2: Complex Inputs (Planned)
- Address input with autocomplete
- Money input with currency
- Phone number with country codes
- Code editor for JSON/SQL

### Phase 3: Advanced Layouts (Planned)
- Wizard/Stepper forms
- Array fields (repeaters)
- Tabbed forms
- Collapsible sections

## Migration Guide

### From React Hook Form

**Before:**
```typescript
const { register, handleSubmit, errors } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('title', { required: true })} />
  {errors.title && <span>Required</span>}
  <button type="submit">Save</button>
</form>
```

**After:**
```typescript
const schema = z.object({ title: z.string().min(1) });
const ui = defineForm<typeof schema>((t) => [
  t.text('title', { label: 'Title', required: true }),
]);

<RNGForm
  schema={schema}
  uiSchema={ui}
  onSubmit={onSubmit}
/>
```

## Support

- **Documentation**: `/docs/RNG-FORM.md`
- **Examples**: `/app-features/*/**.form.ts`
- **Issues**: GitHub repository
- **Slack**: #rng-form channel

## Version History

### v1.0.0 (Current)
- Core DSL with type safety
- Basic field types (text, number, select, autocomplete, date, checkbox, radio)
- Section layouts
- Zod integration
- Column-based responsive grid
- Helper text and tooltips

### v2.0.0 (Planned)
- Conditional logic
- Dynamic dependencies
- Array fields
- Wizard layouts
- Advanced validation
