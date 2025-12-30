'use client';

import { deleteTaskAction, getTasksAction } from '@/app-features/tasks/task.actions';
import { Task, TaskStatus } from '@/app-features/tasks/task.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/rng-ui/components/RNGButton';
import { RNGCard } from '@/rng-ui/components/RNGCard';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { Add, Assignment, Delete, Edit, TableView } from '@mui/icons-material';
import { Box, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type SortField = 'title' | 'priority' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function TasksDashboard() {
  const router = useRouter();
  const { execute, result } = useRngAction(getTasksAction);
  const { execute: deleteTask } = useRngAction(deleteTaskAction);
  
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ALL'>('ALL');

  useEffect(() => {
    execute({});
  }, [execute]);

  const tasks = result.data?.success ? result.data.data : [];

  // Apply sorting and filtering
  const sortedAndFiltered = useMemo(() => {
    let filtered = [...tasks];
    
    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((t: Task) => t.status === filterStatus);
    }
    
    // Filter by priority
    if (filterPriority !== 'ALL') {
      filtered = filtered.filter((t: Task) => t.priority === filterPriority);
    }

    // Sort
    filtered.sort((a: Task, b: Task) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, sortField, sortDirection, filterStatus, filterPriority]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This action cannot be undone.`)) {
      await deleteTask({ id });
      execute({}); // Refresh list
    }
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
    sortedAndFiltered.forEach((task: Task) => {
      if (groups[task.status]) groups[task.status].push(task);
    });
    return groups;
  }, [sortedAndFiltered]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = sortedAndFiltered.length;
    const inProgress = groupedByStatus[TaskStatus.IN_PROGRESS].length;
    const completed = groupedByStatus[TaskStatus.DONE].length;
    const underReview = groupedByStatus[TaskStatus.UNDER_REVIEW].length;

    return { total, inProgress, completed, underReview };
  }, [sortedAndFiltered, groupedByStatus]);

  return (
    <RNGPage
      title="Task Command"
      description="Workflow management with economics tracking and review gates"
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={<TableView />}
            component={Link}
            href="/tasks/grid-view"
            rngVariant="secondary"
          >
            Grid View
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

      {/* Filters and Sorting */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value={TaskStatus.TODO}>To Do</MenuItem>
            <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
            <MenuItem value={TaskStatus.UNDER_REVIEW}>Under Review</MenuItem>
            <MenuItem value={TaskStatus.CHANGES_REQUESTED}>Changes Requested</MenuItem>
            <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Priority</InputLabel>
          <Select
            value={filterPriority}
            label="Filter by Priority"
            onChange={(e) => setFilterPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'ALL')}
          >
            <MenuItem value="ALL">All Priority</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortField}
            label="Sort By"
            onChange={(e) => setSortField(e.target.value as SortField)}
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="createdAt">Created Date</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortDirection}
            label="Order"
            onChange={(e) => setSortDirection(e.target.value as SortDirection)}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />
        
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {sortedAndFiltered.length} {sortedAndFiltered.length === 1 ? 'task' : 'tasks'}
        </Typography>
      </Box>

      {/* Task Display */}
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
                      sx={{
                        height: '100%',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3,
                        },
                      }}
                    >
                      {/* Action Buttons */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          display: 'flex',
                          gap: 0.5,
                          zIndex: 1,
                        }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tasks/${task.id}`);
                            }}
                            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id, task.title);
                            }}
                            sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light' } }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Card Content */}
                      <Box
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        sx={{ cursor: 'pointer', pt: 1 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pr: 7 }}>
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
                      </Box>
                    </RNGCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>

      {sortedAndFiltered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filterStatus !== 'ALL' || filterPriority !== 'ALL'
              ? 'No tasks match your filters.'
              : 'Start by creating your first task.'}
          </Typography>
          <RNGButton
            startIcon={<Add />}
            component={Link}
            href="/tasks/create"
            rngVariant="primary"
          >
            New Task
          </RNGButton>
        </Box>
      )}
    </RNGPage>
  );
}
