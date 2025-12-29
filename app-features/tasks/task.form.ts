import { getMembersAction } from '@/core/organization/organization.actions';
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

/**
 * Fetch organization members for assignment
 * Returns list of members with their display names
 */
async function fetchMembers(query: string) {
  try {
    const result = await getMembersAction({});
    if (result?.success && result.data) {
      const members = result.data;
      return members
        .filter((m: any) => {
          const searchText = query.toLowerCase();
          const displayName = m.user?.displayName || m.user?.email || '';
          return displayName.toLowerCase().includes(searchText);
        })
        .map((m: any) => ({
          label: m.user?.displayName || m.user?.email || m.userId,
          value: m.userId,
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return [];
  }
}

/**
 * Fetch organization admins/owners for reviewer assignment
 * Returns only members with ADMIN or OWNER roles
 */
async function fetchReviewers(query: string) {
  try {
    const result = await getMembersAction({});
    if (result?.success && result.data) {
      const members = result.data;
      return members
        .filter((m: any) => {
          const isReviewer = m.role === 'ADMIN' || m.role === 'OWNER';
          const searchText = query.toLowerCase();
          const displayName = m.user?.displayName || m.user?.email || '';
          return isReviewer && displayName.toLowerCase().includes(searchText);
        })
        .map((m: any) => ({
          label: `${m.user?.displayName || m.user?.email || m.userId} (${m.role})`,
          value: m.userId,
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch reviewers:', error);
    return [];
  }
}

/**
 * Task Form UI Definition
 * 
 * Defines the form layout with smart defaults and conditional visibility:
 * - Resource type defaults to GENERAL
 * - Economics section only visible to ADMIN/OWNER
 * - Reviewer field shows only ADMIN/OWNER members
 * 
 * @param userRole - Current user's role for conditional field visibility
 */
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
      fetchOptions: fetchMembers,
      colProps: { size: { xs: 12, md: 6 } },
    }),
    t.asyncAutocomplete('reviewerId', {
      label: 'Reviewer (Admin/Owner)',
      placeholder: 'Select reviewer',
      fetchOptions: fetchReviewers,
      helperText: 'Only admins and owners can review tasks',
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
        helperText: 'Defaults to General if not specified',
      },
    ),
    t.asyncAutocomplete('resourceId', {
      label: 'Linked Resource',
      placeholder: 'Search and select resource (optional)',
      helperText: 'Link this task to a specific project, invoice, etc.',
      fetchOptions: async (query: string) => {
        // TODO: Implement resource fetching based on resourceType
        // For now, return empty array
        return [];
      },
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
        helperText: 'Only reviewers can mark as Done',
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
 * Task Form UI with Economics Section (Admin/Owner only)
 * 
 * Extended version that includes economics and time tracking fields.
 * Should only be used when user has ADMIN or OWNER role.
 */
export const taskFormUIWithEconomics = defineForm<typeof TaskFormSchema>((t) => [
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
      fetchOptions: fetchMembers,
      colProps: { size: { xs: 12, md: 6 } },
    }),
    t.asyncAutocomplete('reviewerId', {
      label: 'Reviewer (Admin/Owner)',
      placeholder: 'Select reviewer',
      fetchOptions: fetchReviewers,
      helperText: 'Only admins and owners can review tasks',
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
        helperText: 'Defaults to General if not specified',
      },
    ),
    t.asyncAutocomplete('resourceId', {
      label: 'Linked Resource',
      placeholder: 'Search and select resource (optional)',
      helperText: 'Link this task to a specific project, invoice, etc.',
      fetchOptions: async (query: string) => {
        // TODO: Implement resource fetching based on resourceType
        return [];
      },
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),

  t.section('Economics & Time Tracking (Admin/Owner Only)', [
    t.number('estimatedMinutes', {
      label: 'Estimated Time (minutes)',
      placeholder: '120',
      min: 0,
      helperText: 'Expected duration for this task',
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
      label: 'Notes',
      multiline: true,
      rows: 2,
      placeholder: 'Additional notes or comments...',
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),
]);
