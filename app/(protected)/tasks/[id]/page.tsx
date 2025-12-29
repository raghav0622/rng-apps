'use client';

import { getTaskAction, updateTaskAction } from '@/app-features/tasks/task.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TaskForm } from '../_components/TaskForm';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { execute: getTask, result: taskResult } = useRngAction(getTaskAction);
  const { execute: updateTask, isPending } = useRngAction(updateTaskAction);

  useEffect(() => {
    if (taskId) {
      getTask({ id: taskId });
    }
  }, [taskId, getTask]);

  const task = taskResult.data?.success ? taskResult.data.data : null;

  const handleSubmit = async (data: any) => {
    const response = await updateTask({ id: taskId, data });
    if (response?.success) {
      router.push('/tasks');
    }
  };

  if (!task) {
    return <div>Loading...</div>;
  }

  return (
    <RNGPage
      title={`Edit Task: ${task.title}`}
      description="Update task details and assignment"
      backHref="/tasks"
    >
      <TaskForm defaultValues={task} onSubmit={handleSubmit} isLoading={isPending} isEdit />
    </RNGPage>
  );
}
