'use client';

import { deleteTaskAction, getTasksAction } from '@/app-features/tasks/task.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGButton } from '@/ui/components/RNGButton';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { Add, Dashboard } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TaskTable } from '../_components/TaskTable';

export default function TaskGridPage() {
  const router = useRouter();
  const { execute, result, isExecuting } = useRngAction(getTasksAction);
  const { execute: deleteTask } = useRngAction(deleteTaskAction, {
    successMessage: 'Task deleted successfully',
    onSuccess: () => execute({}),
  });

  useEffect(() => {
    execute({});
  }, [execute]);
  
  const tasks = result.data?.success ? result.data.data : [];

  return (
    <RNGPage
      title="Task Database"
      description="Tabular view of all tasks with economics tracking."
      breadcrumbs={[
        { label: 'Tasks', href: '/tasks' },
        { label: 'Grid View', href: '/tasks/grid-view' },
      ]}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <RNGButton
            startIcon={<Dashboard />}
            component={Link}
            href="/tasks"
            rngVariant="secondary"
          >
            Card View
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
      <TaskTable
        data={tasks}
        isLoading={isExecuting}
        onEdit={(task) => router.push(`/tasks/${task.id}`)}
        onDelete={(id) => {
          const task = tasks.find((t: any) => t.id === id);
          if (confirm(`Delete "${task?.title}"?`)) deleteTask({ id });
        }}
      />
    </RNGPage>
  );
}
