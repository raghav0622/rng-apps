'use client';

import {
  createTaskFormUI,
  createTaskFormUIWithEconomics,
  MemberOption,
  TaskFormSchema,
} from '@/app-features/tasks/task.form';
import { Task, TaskResourceType, TaskStatus } from '@/app-features/tasks/task.model';
import { useRNGAuth } from '@/core/auth/auth.context';
import { getMembersAction } from '@/core/organization/organization.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
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
 * - Fetches member and reviewer options using useRngAction
 * - Shows loading state while fetching options
 * - Uses sync autocomplete for better UX
 * - Role-based form (with/without economics section)
 * - Smart defaults for new tasks
 */
export function TaskForm({ defaultValues, onSubmit, isEdit }: TaskFormProps) {
  const { user } = useRNGAuth();
  const { execute: fetchMembers } = useRngAction(getMembersAction);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<MemberOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  
  // Determine if user is admin/owner to show economics section
  const isAdminOrOwner = user?.orgRole === 'ADMIN' || user?.orgRole === 'OWNER';
  
  // Fetch member and reviewer options using useRngAction
  useEffect(() => {
    async function loadOptions() {
      try {
        setIsLoadingOptions(true);
        const membersResult = await fetchMembers({});
        
        if (membersResult && Array.isArray(membersResult)) {
          // Map all members for assignment
          const members = membersResult.map((m) => ({
            label: m.user?.displayName || m.user?.email || m.userId,
            value: m.userId,
          }));
          setMemberOptions(members);
          
          // Filter and map reviewers (only ADMIN/OWNER)
          const reviewers = membersResult
            .filter((m) => m.role === 'ADMIN' || m.role === 'OWNER')
            .map((m) => ({
              label: `${m.user?.displayName || m.user?.email || m.userId} (${m.role})`,
              value: m.userId,
            }));
          setReviewerOptions(reviewers);
        } else {
          // Set empty arrays so form can still render
          setMemberOptions([]);
          setReviewerOptions([]);
        }
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
  }, [fetchMembers]);
  
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

