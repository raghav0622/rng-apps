'use client';

import { getTaskAction } from '@/app-features/tasks/task.actions';
import { Task } from '@/app-features/tasks/task.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { useRNGAuth } from '@/core/auth/useRNGAuth';
import { LoadingSpinner } from '@/rng-ui/LoadingSpinner';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Tabs,
  Tab,
  Button,
  Divider,
} from '@mui/material';
import { Edit, ArrowBack } from '@mui/icons-material';
import { TaskCommentThread } from '../_components/TaskCommentThread';
import { TaskCommentForm } from '../_components/TaskCommentForm';
import { TaskSubmissionPanel } from '../_components/TaskSubmissionPanel';
import { TaskReviewPanel } from '../_components/TaskReviewPanel';
import { StatusTransitionButtons } from '../_components/StatusTransitionButtons';
import { FileAttachmentList } from '../_components/FileAttachmentList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { user } = useRNGAuth();

  const { execute: getTask } = useRngAction(getTaskAction);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const loadTask = async () => {
    if (taskId) {
      setLoading(true);
      const result = await getTask({ id: taskId });
      if (result && typeof result === 'object' && 'id' in result) {
        setTask(result as Task);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  if (loading) {
    return <LoadingSpinner message="Loading task..." />;
  }

  if (!task || !user) {
    return (
      <RNGPage title="Task Not Found" description="The requested task could not be found.">
        <div>No task found with ID: {taskId}</div>
      </RNGPage>
    );
  }

  const isAssigned = task.assignedTo === user.uid;
  const isAdmin = user.orgRole === 'ADMIN' || user.orgRole === 'OWNER';

  return (
    <RNGPage
      title={task.title}
      description={task.description}
      breadcrumbs={[
        { label: 'Tasks', href: '/tasks' },
        { label: task.title, href: `/tasks/${taskId}` },
      ]}
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.push('/tasks')}
          >
            Back
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/tasks/${taskId}/edit`)}
            >
              Edit
            </Button>
          )}
        </Box>
      }
    >
      <Grid container spacing={3}>
        {/* Left Column - Task Details */}
        <Grid item xs={12} md={8}>
          {/* Task Info Card */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label={task.status} color="primary" />
              <Chip label={task.priority} color={task.priority === 'HIGH' ? 'error' : 'default'} />
              {task.resourceType && <Chip label={task.resourceType} variant="outlined" />}
            </Box>

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description provided'}
            </Typography>

            {task.initialAttachments && task.initialAttachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <FileAttachmentList
                  attachments={task.initialAttachments}
                  title="Reference Files"
                />
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <StatusTransitionButtons
              task={task}
              userId={user.uid}
              userRole={user.orgRole}
              onStatusChanged={loadTask}
            />
          </Paper>

          {/* Tabs for Comments/History */}
          <Paper elevation={1}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Comments" />
              <Tab label="Details" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 3 }}>
                <TaskCommentThread comments={task.comments || []} />
                <Divider sx={{ my: 3 }} />
                <TaskCommentForm
                  taskId={taskId}
                  orgId={task.orgId}
                  userId={user.uid}
                  onCommentAdded={loadTask}
                />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Task ID
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {task.id}
                </Typography>

                {task.assignedTo && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Assigned To
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {task.assignedTo}
                    </Typography>
                  </>
                )}

                {task.reviewerId && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Reviewer
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {task.reviewerId}
                    </Typography>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Economics
                    </Typography>
                    <Typography variant="body2">
                      Estimated: {task.estimatedMinutes} minutes
                    </Typography>
                    <Typography variant="body2">
                      Billable Rate: ${task.billableRate}/hr
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Cost Rate: ${task.costRate}/hr
                    </Typography>
                  </>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Right Column - Actions */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Submission Panel (for assigned user) */}
            {isAssigned && (
              <TaskSubmissionPanel
                task={task}
                orgId={task.orgId}
                userId={user.uid}
                onSubmitted={loadTask}
              />
            )}

            {/* Review Panel (for admin) */}
            {isAdmin && (
              <TaskReviewPanel
                task={task}
                userRole={user.orgRole}
                onReviewed={loadTask}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </RNGPage>
  );
}
