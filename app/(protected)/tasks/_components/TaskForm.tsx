'use client';

import {
  createTaskFormUI,
  createTaskFormUIWithEconomics,
  fetchAllMembers,
  fetchAllReviewers,
  MemberOption,
  TaskFormSchema,
} from '@/app-features/tasks/task.form';
import { Task, TaskResourceType, TaskStatus } from '@/app-features/tasks/task.model';
import { useRNGAuth } from '@/core/auth/auth.context';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { LoadingSpinner } from '@/rng-ui/LoadingSpinner';
import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: any) => Promise<void>;
  isEdit?: boolean;
}

/**
 * Task Form Component
 * 
 * Features:
 * - Preloads member and reviewer options before rendering
 * - Shows loading state while fetching options
 * - Uses sync autocomplete for better UX
 * - Role-based form (with/without economics section)
 * - Smart defaults for new tasks
 */
export function TaskForm({ defaultValues, onSubmit, isEdit }: TaskFormProps) {
  const { user } = useRNGAuth();
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<MemberOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  
  // Determine if user is admin/owner to show economics section
  const isAdminOrOwner = user?.orgRole === 'ADMIN' || user?.orgRole === 'OWNER';
  
  // Preload member and reviewer options
  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoadingOptions(true);
        const [members, reviewers] = await Promise.all([
          fetchAllMembers(),
          fetchAllReviewers(),
        ]);
        setMemberOptions(members);
        setReviewerOptions(reviewers);
      } catch (error) {
        console.error('Failed to load options:', error);
        // Set empty arrays so form can still render
        setMemberOptions([]);
        setReviewerOptions([]);
      } finally {
        setIsLoadingOptions(false);
      }
    }
    
    loadOptions();
  }, []);
  
  // Set smart defaults for new tasks
  const formDefaults = {
    priority: 'MEDIUM',
    status: TaskStatus.TODO,
    resourceType: TaskResourceType.GENERAL,
    estimatedMinutes: 0,
    billableRate: 0,
    costRate: 0,
    ...defaultValues,
  };

  // Show loading state while fetching options
  if (isLoadingOptions) {
    return (
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
          <LoadingSpinner />
          <Typography variant="body2" color="text.secondary">
            Loading form options...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Create form UI with preloaded options
  const formUI = isAdminOrOwner
    ? createTaskFormUIWithEconomics(memberOptions, reviewerOptions)
    : createTaskFormUI(memberOptions, reviewerOptions);

  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEdit
            ? 'Update task details and assignment.'
            : 'Define a new task with resource linking and economics tracking.'}
        </Typography>
      </Box>

      <RNGForm
        schema={TaskFormSchema}
        uiSchema={formUI}
        defaultValues={formDefaults}
        onSubmit={async (data) => {
          await onSubmit(data);
        }}
        submitLabel={isEdit ? 'Save Changes' : 'Create Task'}
      />
    </Paper>
  );
}

