'use client';

import { getTaskAction, updateTaskAction } from '@/app-features/tasks/task.actions';
import { Task } from '@/app-features/tasks/task.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { LoadingSpinner } from '@/rng-ui/LoadingSpinner';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TaskForm } from '../_components/TaskForm';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { execute: getTask } = useRngAction(getTaskAction);
  const { execute: updateTask, isExecuting } = useRngAction(updateTaskAction, {
    successMessage: 'Task updated successfully',
    onSuccess: () => router.push('/tasks'),
  });

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTask() {
      if (taskId) {
        const result = await getTask({ id: taskId });
        if (result) setTask(result);
      }
      setLoading(false);
    }
    loadTask();
  }, [taskId, getTask]);

  if (loading) {
    return <LoadingSpinner message="Loading task..." />;
  }

  if (!task) {
    return (
      <RNGPage title="Task Not Found" description="The requested task could not be found.">
        <div>No task found with ID: {taskId}</div>
      </RNGPage>
    );
  }

  return (
    <RNGPage
      title={`Edit Task: ${task.title}`}
      description="Update task details and assignment"
      breadcrumbs={[
        { label: 'Tasks', href: '/tasks' },
        { label: task.title, href: `/tasks/${taskId}` },
      ]}
    >
      <TaskForm defaultValues={task} onSubmit={async (data) => {
        await updateTask({ id: taskId, data });
      }} isEdit />
    </RNGPage>
  );
}
