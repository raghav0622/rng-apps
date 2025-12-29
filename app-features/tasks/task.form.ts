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

export interface MemberOption {
  label: string;
  value: string;
}

/**
 * Task Form UI Definition (Sync Autocomplete Version)
 * 
 * Defines the form layout with smart defaults and preloaded member options:
 * - Resource type defaults to GENERAL
 * - Economics section only visible to ADMIN/OWNER
 * - Reviewer field shows only ADMIN/OWNER members
 * - Member options must be preloaded before rendering
 * 
 * @param memberOptions - Preloaded list of all members
 * @param reviewerOptions - Preloaded list of reviewer members (ADMIN/OWNER)
 */
export const createTaskFormUI = (
  memberOptions: MemberOption[],
  reviewerOptions: MemberOption[],
) =>
  defineForm<typeof TaskFormSchema>((t) => [
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
      t.autocomplete('assignedTo', memberOptions, {
        label: 'Assign To',
        placeholder: 'Select team member',
        description: 'Select a team member to assign this task',
        colProps: { size: { xs: 12, md: 6 } },
      }),
      t.autocomplete('reviewerId', reviewerOptions, {
        label: 'Reviewer (Admin/Owner)',
        placeholder: 'Select reviewer',
        description: 'Only admins and owners can review tasks',
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
          description: 'Defaults to General if not specified',
        },
      ),
      t.text('resourceId', {
        label: 'Linked Resource ID',
        placeholder: 'Enter resource ID (optional)',
        description: 'Link this task to a specific project, invoice, etc.',
        colProps: { size: { xs: 12, md: 6 } },
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
        },
      ),
      t.text('submissionNotes', {
        label: 'Notes',
        multiline: true,
        rows: 2,
        placeholder: 'Additional notes or comments...',
        colProps: { size: { xs: 12, md: 6 } },
      }),
    ]),
  ]);

/**
 * Task Form UI with Economics Section (Admin/Owner only, Sync Version)
 * 
 * Extended version that includes economics and time tracking fields.
 * Should only be used when user has ADMIN or OWNER role.
 * 
 * @param memberOptions - Preloaded list of all members
 * @param reviewerOptions - Preloaded list of reviewer members (ADMIN/OWNER)
 */
export const createTaskFormUIWithEconomics = (
  memberOptions: MemberOption[],
  reviewerOptions: MemberOption[],
) =>
  defineForm<typeof TaskFormSchema>((t) => [
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
      t.autocomplete('assignedTo', memberOptions, {
        label: 'Assign To',
        placeholder: 'Select team member',
        description: 'Select a team member to assign this task',
        colProps: { size: { xs: 12, md: 6 } },
      }),
      t.autocomplete('reviewerId', reviewerOptions, {
        label: 'Reviewer (Admin/Owner)',
        placeholder: 'Select reviewer',
        description: 'Only admins and owners can review tasks',
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
          description: 'Defaults to General if not specified',
        },
      ),
      t.text('resourceId', {
        label: 'Linked Resource ID',
        placeholder: 'Enter resource ID (optional)',
        description: 'Link this task to a specific project, invoice, etc.',
        colProps: { size: { xs: 12, md: 6 } },
      }),
    ]),

    t.section('Economics & Time Tracking (Admin/Owner Only)', [
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
        colProps: { size: { xs: 12, md: 4 } },
      }),
      t.number('costRate', {
        label: 'Cost Rate ($/hour)',
        placeholder: '50',
        min: 0,
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
        },
      ),
      t.text('submissionNotes', {
        label: 'Notes',
        multiline: true,
        rows: 2,
        placeholder: 'Additional notes or comments...',
        colProps: { size: { xs: 12, md: 6 } },
      }),
    ]),
  ]);
