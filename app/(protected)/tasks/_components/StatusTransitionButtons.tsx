'use client';

import { Button, Box } from '@mui/material';
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
  const { execute: updateTask, isExecuting } = useRngAction(updateTaskAction, {
    onSuccess: () => {
      if (onStatusChanged) {
        onStatusChanged();
      }
    },
  });

  const isAssigned = task.assignedTo === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';

  // Determine available actions based on current status and user role
  const canStartWork = isAssigned && task.status === TaskStatus.TODO;
  const canPauseWork = isAssigned && task.status === TaskStatus.IN_PROGRESS;
  const canResumeWork = isAssigned && task.status === TaskStatus.CHANGES_REQUESTED;

  if (!isAssigned && !isAdmin) {
    return null;
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask({
      id: task.id,
      status: newStatus,
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {canStartWork && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
          disabled={isExecuting}
        >
          Start Work
        </Button>
      )}

      {canPauseWork && (
        <Button
          variant="outlined"
          color="warning"
          startIcon={<Pause />}
          onClick={() => handleStatusChange(TaskStatus.TODO)}
          disabled={isExecuting}
        >
          Pause Work
        </Button>
      )}

      {canResumeWork && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
          disabled={isExecuting}
        >
          Resume Work
        </Button>
      )}
    </Box>
  );
}
