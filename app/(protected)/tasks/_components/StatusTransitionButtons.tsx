'use client';

import { useOptimistic, useTransition } from 'react';
import { Button, Box, CircularProgress, Chip } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { updateTaskAction } from '@/app-features/tasks/task.actions';
import { Task, TaskStatus } from '@/app-features/tasks/task.model';

interface StatusTransitionButtonsProps {
  task: Task;
  userId: string;
  userRole: string;
  onStatusChanged?: () => void;
}

export function StatusTransitionButtons({
  task,
  userId,
  userRole,
  onStatusChanged,
}: StatusTransitionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  const { execute: updateTask, isExecuting } = useRngAction(updateTaskAction, {
    onSuccess: () => {
      if (onStatusChanged) {
        onStatusChanged();
      }
    },
    onError: () => {
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticStatus(task.status);
      });
    },
  });

  const isAssigned = task.assignedTo === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  // Determine available actions based on optimistic status and user role
  const canStartWork = isAssigned && optimisticStatus === TaskStatus.TODO;
  const canPauseWork = isAssigned && optimisticStatus === TaskStatus.IN_PROGRESS;
  const canResumeWork = isAssigned && optimisticStatus === TaskStatus.CHANGES_REQUESTED;

  if (!isAssigned && !isAdmin) {
    return null;
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    // Optimistic update
    startTransition(() => {
      setOptimisticStatus(newStatus);
    });

    // Server update
    await updateTask({
      id: task.id,
      status: newStatus,
    });
  };

  const isUpdating = isExecuting || isPending;
  const isOptimistic = optimisticStatus !== task.status;

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {isOptimistic && (
        <Chip
          label="Updating..."
          size="small"
          color="info"
          icon={<CircularProgress size={12} />}
        />
      )}

      {canStartWork && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={isUpdating ? <CircularProgress size={16} /> : <PlayArrow />}
          onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
          disabled={isUpdating}
        >
          Start Work
        </Button>
      )}

      {canPauseWork && (
        <Button
          variant="outlined"
          color="warning"
          size="small"
          startIcon={isUpdating ? <CircularProgress size={16} /> : <Pause />}
          onClick={() => handleStatusChange(TaskStatus.TODO)}
          disabled={isUpdating}
        >
          Pause Work
        </Button>
      )}

      {canResumeWork && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={isUpdating ? <CircularProgress size={16} /> : <PlayArrow />}
          onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
          disabled={isUpdating}
        >
          Resume Work
        </Button>
      )}
    </Box>
  );
}
