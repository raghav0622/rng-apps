'use client';

import { deleteTaskAction, getTasksAction } from '@/app-features/tasks/task.actions';
import { Task, TaskStatus } from '@/app-features/tasks/task.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/ui/components/RNGButton';
import { RNGCard } from '@/ui/components/RNGCard';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Add, Assignment, CheckCircle, TableView } from '@mui/icons-material';
import { Box, Chip, Grid, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { TaskTable } from './_components/TaskTable';

export default function TasksDashboard() {
  const router = useRouter();
  const [view, setView] = useState<'cards' | 'grid'>('cards');
  const { execute, result } = useRngAction(getTasksAction);
  const { execute: deleteTask } = useRngAction(deleteTaskAction);

  useEffect(() => {
    execute({});
  }, [execute]);

  const tasks = result.data?.success ? result.data.data : [];

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask({ id });
      execute({}); // Refresh list
    }
  };

  const handleEdit = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  // Group tasks by status
  const groupedByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.UNDER_REVIEW]: [],
      [TaskStatus.CHANGES_REQUESTED]: [],
      [TaskStatus.DONE]: [],
    };
    tasks.forEach((task: Task) => {
      if (groups[task.status]) groups[task.status].push(task);
    });
    return groups;
  }, [tasks]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = groupedByStatus[TaskStatus.IN_PROGRESS].length;
    const completed = groupedByStatus[TaskStatus.DONE].length;
    const underReview = groupedByStatus[TaskStatus.UNDER_REVIEW].length;

    return { total, inProgress, completed, underReview };
  }, [tasks, groupedByStatus]);

  return (
    <RNGPage
      title="Task Command"
      description="Workflow management with economics tracking and review gates"
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={view === 'cards' ? <TableView /> : <Assignment />}
            onClick={() => setView(view === 'cards' ? 'grid' : 'cards')}
            rngVariant="secondary"
          >
            {view === 'cards' ? 'Grid View' : 'Card View'}
          </RNGButton>
          <RNGButton
            startIcon={<Add />}
            component={Link}
            href="/tasks/create"
            rngVariant="primary"
          >
            New Task
          </RNGButton>
        </div>
      }
    >
      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <RNGCard>
            <Typography variant="h4" fontWeight={700} color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
          </RNGCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <RNGCard>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {stats.inProgress}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </RNGCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <RNGCard>
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {stats.underReview}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Under Review
            </Typography>
          </RNGCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <RNGCard>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </RNGCard>
        </Grid>
      </Grid>

      {/* Task Display */}
      {view === 'grid' ? (
        <TaskTable data={tasks} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(groupedByStatus).map(([status, taskList]) => {
            if (taskList.length === 0) return null;

            const statusColors: Record<TaskStatus, string> = {
              [TaskStatus.TODO]: 'default',
              [TaskStatus.IN_PROGRESS]: 'primary.main',
              [TaskStatus.UNDER_REVIEW]: 'warning.main',
              [TaskStatus.CHANGES_REQUESTED]: 'error.main',
              [TaskStatus.DONE]: 'success.main',
            };

            return (
              <Box key={status}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    borderLeft: '4px solid',
                    borderColor: statusColors[status as TaskStatus],
                    pl: 2,
                    fontWeight: 600,
                  }}
                >
                  {status.replace(/_/g, ' ')}
                  <Chip label={taskList.length} size="small" sx={{ ml: 1, borderRadius: 1 }} />
                </Typography>

                <Grid container spacing={2}>
                  {taskList.map((task) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={task.id}>
                      <RNGCard
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        sx={{
                          cursor: 'pointer',
                          height: '100%',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>
                            {task.title}
                          </Typography>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={
                              task.priority === 'HIGH'
                                ? 'error'
                                : task.priority === 'MEDIUM'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </Box>

                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                            noWrap
                          >
                            {task.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                          {task.resourceType !== 'GENERAL' && (
                            <Chip
                              label={task.resourceType}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          )}
                          {task.assignedTo && (
                            <Chip
                              icon={<Assignment />}
                              label="Assigned"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          )}
                        </Box>

                        {task.estimatedMinutes > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Est: {(task.estimatedMinutes / 60).toFixed(1)}h
                            </Typography>
                            {task.timeLogs.length > 0 && (
                              <>
                                <Typography variant="caption" color="text.disabled">
                                  •
                                </Typography>
                                <Typography variant="caption" color="primary">
                                  Logged:{' '}
                                  {(
                                    task.timeLogs.reduce(
                                      (sum, log) => sum + log.durationMinutes,
                                      0,
                                    ) / 60
                                  ).toFixed(1)}
                                  h
                                </Typography>
                              </>
                            )}
                          </Box>
                        )}
                      </RNGCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </Box>
      )}
    </RNGPage>
  );
}
