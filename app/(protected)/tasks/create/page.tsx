'use client';

import { createTaskAction } from '@/app-features/tasks/task.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { useRouter } from 'next/navigation';
import { TaskForm } from '../_components/TaskForm';

export default function CreateTaskPage() {
  const router = useRouter();
  const { execute, isExecuting } = useRngAction(createTaskAction, {
    successMessage: 'Task created successfully',
    onSuccess: () => router.push('/tasks'),
  });

  const handleSubmit = async (data: any) => {
    await execute(data);
  };

  return (
    <RNGPage
      title="Create New Task"
      description="Define a new task with resource linking and economics tracking"
      breadcrumbs={[
        { label: 'Tasks', href: '/tasks' },
        { label: 'Create', href: '/tasks/create' },
      ]}
    >
      <TaskForm onSubmit={handleSubmit} isLoading={isExecuting} />
    </RNGPage>
  );
}
