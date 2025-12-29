'use client';

import { TaskFormSchema, taskFormUI } from '@/app-features/tasks/task.form';
import { Task } from '@/app-features/tasks/task.model';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Paper, Typography } from '@mui/material';

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function TaskForm({ defaultValues, onSubmit, isLoading, isEdit }: TaskFormProps) {
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
        uiSchema={taskFormUI}
        defaultValues={defaultValues || {}}
        onSubmit={async (data) => {
          await onSubmit(data);
        }}
        submitLabel={isEdit ? 'Save Changes' : 'Create Task'}
      />
    </Paper>
  );
}
