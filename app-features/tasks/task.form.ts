import { defineForm } from '@/rng-form/dsl';
import { TaskResourceType, TaskSchema, TaskStatus } from './task.model';

// 1. Zod Schema Pick for form fields
export const TaskFormSchema = TaskSchema.pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  assignedTo: true,
  reviewerId: true,
  resourceType: true,
  resourceId: true,
  estimatedMinutes: true,
  billableRate: true,
  costRate: true,
  submissionNotes: true,
});

// 2. UI Layout using RNG-Form DSL
export const taskFormUI = defineForm<typeof TaskFormSchema>((t) => [
  t.section('Basic Information', [
    t.text('title', {
      label: 'Task Title',
      required: true,
      placeholder: 'e.g., Review construction drawings',
      colProps: { size: { xs: 12, md: 8 } },
      autoFocus: true,
    }),
    t.select(
      'priority',
      [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
      ],
      {
        label: 'Priority',
        required: true,
        colProps: { size: { xs: 12, md: 4 } },
      },
    ),
    t.text('description', {
      label: 'Description',
      multiline: true,
      rows: 3,
      placeholder: 'Provide detailed task description...',
      colProps: { size: { xs: 12 } },
    }),
  ]),

  t.section('Assignment', [
    t.asyncAutocomplete('assignedTo', {
      label: 'Assign To',
      placeholder: 'Select team member',
      fetchOptions: async (query: string) => {
        // TODO: Implement member fetching from organization service
        return [];
      },
      colProps: { size: { xs: 12, md: 6 } },
    }),
    t.asyncAutocomplete('reviewerId', {
      label: 'Reviewer',
      placeholder: 'Select reviewer (Admin/Owner)',
      fetchOptions: async (query: string) => {
        // TODO: Implement reviewer fetching (ADMIN/OWNER only)
        return [];
      },
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),

  t.section('Resource Linking', [
    t.select(
      'resourceType',
      [
        { label: 'General', value: TaskResourceType.GENERAL },
        { label: 'Project', value: TaskResourceType.PROJECT },
        { label: 'Research', value: TaskResourceType.RESEARCH },
        { label: 'Invoice', value: TaskResourceType.INVOICE },
        { label: 'Drawing', value: TaskResourceType.DRAWING },
      ],
      {
        label: 'Resource Type',
        colProps: { size: { xs: 12, md: 6 } },
      },
    ),
    t.text('resourceId', {
      label: 'Resource ID',
      placeholder: 'Link to specific resource (optional)',
      helperText: 'Connects this task to a project, invoice, etc.',
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),

  t.section('Economics & Time Tracking', [
    t.number('estimatedMinutes', {
      label: 'Estimated Time (minutes)',
      placeholder: '120',
      min: 0,
      colProps: { size: { xs: 12, md: 4 } },
    }),
    t.number('billableRate', {
      label: 'Billable Rate ($/hour)',
      placeholder: '150',
      min: 0,
      helperText: 'Revenue generated per hour',
      colProps: { size: { xs: 12, md: 4 } },
    }),
    t.number('costRate', {
      label: 'Cost Rate ($/hour)',
      placeholder: '50',
      min: 0,
      helperText: 'Internal staff cost per hour',
      colProps: { size: { xs: 12, md: 4 } },
    }),
  ]),

  t.section('Status & Notes', [
    t.select(
      'status',
      [
        { label: 'To Do', value: TaskStatus.TODO },
        { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
        { label: 'Under Review', value: TaskStatus.UNDER_REVIEW },
        { label: 'Changes Requested', value: TaskStatus.CHANGES_REQUESTED },
        { label: 'Done', value: TaskStatus.DONE },
      ],
      {
        label: 'Status',
        colProps: { size: { xs: 12, md: 6 } },
        helperText: 'Only reviewers can mark as Done',
      },
    ),
    t.text('submissionNotes', {
      label: 'Submission Notes',
      multiline: true,
      rows: 2,
      placeholder: 'Notes when submitting for review...',
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),
]);
