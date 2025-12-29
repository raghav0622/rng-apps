'use client';

import { createTaskAction } from '@/app-features/tasks/task.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { useRouter } from 'next/navigation';
import { TaskForm } from '../_components/TaskForm';

export default function CreateTaskPage() {
  const router = useRouter();
  const { execute, result, isPending } = useRngAction(createTaskAction);

  const handleSubmit = async (data: any) => {
    const response = await execute(data);
    if (response?.success) {
      router.push('/tasks');
    }
  };

  return (
    <RNGPage
      title="Create New Task"
      description="Define a new task with resource linking and economics tracking"
      backHref="/tasks"
    >
      <TaskForm onSubmit={handleSubmit} isLoading={isPending} />
    </RNGPage>
  );
}
