# RNG-UI Design System Documentation

## Overview

RNG-UI is a comprehensive, enterprise-grade design system built on top of Material-UI (MUI), specifically tailored for construction and architecture ERP applications. It provides a consistent set of components, patterns, and utilities that enable rapid development of complex business applications.

## Philosophy

**Atomic Design Principles**
- **Atoms**: Basic building blocks (Buttons, Icons, Chips)
- **Molecules**: Combinations of atoms (Cards with actions, Stat cards)
- **Organisms**: Complex components (Data grids, Kanban boards)
- **Templates**: Page layouts (Master-detail, Dashboard layouts)

**Key Principles**
1. **Consistency**: All components follow the same design language
2. **Accessibility**: WCAG 2.1 AA compliance throughout
3. **Performance**: Optimized for large datasets and complex UIs
4. **Type Safety**: Strict TypeScript typing for all component APIs
5. **Composability**: Components designed to work together seamlessly

## Component Catalog

### Core Components (Phase 1 - ✅ Complete)

#### RNGButton
Advanced button component with loading states, icons, and keyboard shortcuts.

```tsx
import { RNGButton } from '@/rng-ui/components/RNGButton';

// Basic usage
<RNGButton variant="contained" color="primary">
  Save
</RNGButton>

// With loading state
<RNGButton isLoading={true}>
  Processing...
</RNGButton>

// With icons and shortcuts
<RNGButton 
  startIcon={<Save />}
  shortcut="Ctrl+S"
  tooltip="Save changes"
>
  Save
</RNGButton>
```

**Props:**
- `variant`: 'contained' | 'outlined' | 'text'
- `color`: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
- `isLoading`: boolean - Shows spinner and disables button
- `startIcon`: ReactNode - Icon before text
- `endIcon`: ReactNode - Icon after text
- `shortcut`: string - Keyboard shortcut displayed in tooltip
- `fullWidth`: boolean - Stretches to container width

#### RNGCard
Container component with consistent padding, elevation, and shadows.

```tsx
import { RNGCard } from '@/rng-ui/components/RNGCard';

<RNGCard elevation={2}>
  <CardContent>
    Your content here
  </CardContent>
</RNGCard>
```

**Props:**
- `elevation`: number (0-24) - Shadow depth
- `variant`: 'elevation' | 'outlined'
- `sx`: MUI sx prop for custom styling

#### RNGActionCard
Enhanced card with built-in hover effects and action buttons.

```tsx
import { RNGActionCard } from '@/rng-ui/components/RNGActionCard';

<RNGActionCard
  onEdit={() => router.push(`/items/${id}`)}
  onDelete={async () => await deleteItem(id)}
  onClick={() => router.push(`/items/${id}/view`)}
  editTooltip="Edit item"
  deleteTooltip="Delete item"
>
  <Typography variant="h6">{item.name}</Typography>
  <Typography color="text.secondary">{item.description}</Typography>
</RNGActionCard>
```

**Features:**
- Automatic hover effects (elevation + transform)
- Top-right action buttons with tooltips
- Event isolation (actions don't trigger card onClick)
- Customizable actions via customActions prop
- Selective hide edit/delete buttons

**Props:**
- `onEdit`: () => void - Edit button callback
- `onDelete`: () => void - Delete button callback
- `onClick`: () => void - Card body click callback
- `customActions`: ReactNode - Additional action buttons
- `hideEdit`: boolean - Hide edit button
- `hideDelete`: boolean - Hide delete button
- `editTooltip`: string - Edit button tooltip
- `deleteTooltip`: string - Delete button tooltip

#### RNGChip
Status indicator with dynamic color mapping.

```tsx
import { RNGChip } from '@/rng-ui/components/RNGChip';

<RNGChip label="Active" color="success" />
<RNGChip label="Pending" color="warning" />
<RNGChip label="Error" color="error" />
```

#### RNGDataGrid
Enterprise-grade data table with server-side pagination, sorting, and filtering.

```tsx
import { RNGDataGrid } from '@/rng-ui/components/RNGDataGrid';

<RNGDataGrid
  columns={[
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'status', headerName: 'Status', width: 130 }
  ]}
  rows={data}
  loading={isLoading}
  onRowClick={(row) => handleRowClick(row)}
/>
```

**Features:**
- Virtual scrolling for 100k+ rows
- Server-side pagination
- Column sorting and filtering
- Row selection (single/multiple)
- Custom cell renderers
- Export to CSV/Excel
- Column reordering and hiding

#### RNGStatCard
Metric display with trend indicators and sparklines.

```tsx
import { RNGStatCard } from '@/rng-ui/components/RNGStatCard';

<RNGStatCard
  title="Total Revenue"
  value="$45,231"
  change={12.5}
  trend="up"
  icon={<AttachMoney />}
  color="success"
/>
```

#### RNGEmptyState
Configurable empty state with illustrations and CTAs.

```tsx
import { RNGEmptyState } from '@/rng-ui/components/RNGEmptyState';

<RNGEmptyState
  title="No tasks yet"
  description="Create your first task to get started"
  icon={<Assignment />}
  action={
    <RNGButton onClick={handleCreate}>
      Create Task
    </RNGButton>
  }
/>
```

### Layout Components

#### RNGPage
Standard page container with header, breadcrumbs, and action buttons.

```tsx
import { RNGPage } from '@/rng-ui/layouts/RNGPage';

<RNGPage
  title="Project Dashboard"
  description="Manage your construction projects"
  backHref="/projects"
  actions={
    <RNGButton onClick={handleCreate}>
      New Project
    </RNGButton>
  }
>
  {/* Page content */}
</RNGPage>
```

## Design Tokens

### Colors

#### Primary Palette
- Primary: `#1976d2` - Used for main actions and highlights
- Secondary: `#dc004e` - Used for secondary actions
- Success: `#2e7d32` - Positive states
- Warning: `#ed6c02` - Caution states
- Error: `#d32f2f` - Error states
- Info: `#0288d1` - Informational states

#### Semantic Colors
- Active: Green (#4caf50)
- Inactive: Orange (#ff9800)
- Blacklisted: Red (#f44336)
- Pending: Blue (#2196f3)

### Typography

#### Font Family
- Primary: 'Inter', 'Roboto', sans-serif
- Monospace: 'Roboto Mono', 'Courier New', monospace

#### Font Sizes
- h1: 2.5rem (40px)
- h2: 2rem (32px)
- h3: 1.75rem (28px)
- h4: 1.5rem (24px)
- h5: 1.25rem (20px)
- h6: 1rem (16px)
- body1: 1rem (16px)
- body2: 0.875rem (14px)
- caption: 0.75rem (12px)

### Spacing

Based on 8px grid system:
- xs: 4px (0.5 spacing unit)
- sm: 8px (1 spacing unit)
- md: 16px (2 spacing units)
- lg: 24px (3 spacing units)
- xl: 32px (4 spacing units)

### Elevation (Shadows)

- 0: No shadow (flat)
- 1: Subtle shadow for slight elevation
- 2: Default card elevation
- 3: Hover state
- 4: Modal/Dialog
- 8: Drawer
- 16: AppBar
- 24: Maximum elevation

## Usage Patterns

### Card with Actions Pattern

```tsx
import { RNGActionCard } from '@/rng-ui/components/RNGActionCard';
import { useRouter } from 'next/navigation';

function EntityCard({ entity }) {
  const router = useRouter();
  
  const handleDelete = async () => {
    if (confirm(`Delete ${entity.name}?`)) {
      await deleteEntityAction({ id: entity.id });
    }
  };
  
  return (
    <RNGActionCard
      onEdit={() => router.push(`/entities/${entity.id}`)}
      onDelete={handleDelete}
      onClick={() => router.push(`/entities/${entity.id}/view`)}
    >
      <Typography variant="h6">{entity.name}</Typography>
      <RNGChip label={entity.type} />
      <Typography variant="body2" color="text.secondary">
        {entity.email}
      </Typography>
    </RNGActionCard>
  );
}
```

### Data Table Pattern

```tsx
import { RNGDataGrid } from '@/rng-ui/components/RNGDataGrid';
import { RNGChip } from '@/rng-ui/components/RNGChip';

function EntityTable({ entities, loading }) {
  const columns = [
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { field: 'type', headerName: 'Type', width: 150,
      renderCell: (params) => <RNGChip label={params.value} />
    },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <RNGChip 
          label={params.value}
          color={params.value === 'ACTIVE' ? 'success' : 'warning'}
        />
      )
    },
  ];
  
  return (
    <RNGDataGrid
      columns={columns}
      rows={entities}
      loading={loading}
      getRowId={(row) => row.id}
    />
  );
}
```

### Dashboard Statistics Pattern

```tsx
import { RNGStatCard } from '@/rng-ui/components/RNGStatCard';
import { Grid } from '@mui/material';

function DashboardStats({ stats }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <RNGStatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Assignment />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <RNGStatCard
          title="Active Tasks"
          value={stats.activeTasks}
          change={stats.taskChange}
          trend="up"
          icon={<CheckCircle />}
          color="success"
        />
      </Grid>
    </Grid>
  );
}
```

## Accessibility

All RNG-UI components follow WCAG 2.1 AA standards:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order maintained
- Escape key closes modals/dropdowns
- Enter/Space activates buttons

### Screen Readers
- Proper ARIA labels on all components
- Semantic HTML structure
- Alt text for images
- Live regions for dynamic content

### Color Contrast
- Minimum 4.5:1 contrast ratio for text
- 3:1 for large text and UI components
- Status indicated by more than color alone

## Performance Guidelines

### Component Optimization
```tsx
// ✅ Good: Memoize expensive cards
const EntityCard = memo(({ entity, onDelete }) => (
  <RNGActionCard onDelete={onDelete}>
    {/* content */}
  </RNGActionCard>
));

// ✅ Good: Virtual scrolling for large lists
<RNGDataGrid
  rows={largeDataset}
  pagination
  pageSize={50}
/>

// ❌ Bad: Rendering 1000+ cards at once
{items.map(item => <EntityCard key={item.id} {...item} />)}
```

### Loading States
Always show loading indicators for async operations:

```tsx
<RNGButton isLoading={isPending}>
  Save
</RNGButton>

<RNGDataGrid
  loading={isLoadingData}
  rows={data}
/>
```

## Best Practices

### DO:
✅ Use RNG components for all UI elements
✅ Follow the spacing system (8px grid)
✅ Use semantic color names (success, error, warning)
✅ Provide loading states for async operations
✅ Use tooltips for icon-only buttons
✅ Memoize expensive components
✅ Use RNGActionCard for cards with actions

### DON'T:
❌ Mix RNG components with raw MUI components without consistency
❌ Use arbitrary spacing values
❌ Hardcode colors (use theme)
❌ Forget loading/error states
❌ Render large lists without virtualization
❌ Duplicate action button patterns (use RNGActionCard)

## Migration Guide

### From Raw MUI to RNG-UI

**Before:**
```tsx
<Card elevation={2}>
  <CardContent>
    <Typography variant="h6">Title</Typography>
    <IconButton onClick={handleEdit}>
      <Edit />
    </IconButton>
  </CardContent>
</Card>
```

**After:**
```tsx
<RNGActionCard
  onEdit={handleEdit}
  onDelete={handleDelete}
>
  <Typography variant="h6">Title</Typography>
</RNGActionCard>
```

## Support & Resources

- **Component Storybook**: `/storybook` (coming soon)
- **GitHub Issues**: Report bugs and request features
- **Design Figma**: Access design specifications
- **Slack Channel**: #rng-ui for questions

## Version History

### v1.0.0 (Current)
- Initial release with core components
- RNGActionCard component
- Complete design token system
- Accessibility compliance

### Roadmap
- RNGStatCard enhancements
- RNGKanbanBoard
- RNGTimeline
- RNGResourceScheduler (Gantt)
- Advanced filtering components
