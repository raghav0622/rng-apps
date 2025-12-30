'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, ButtonGroup } from '@mui/material';
import { CheckCircle, Cancel, RateReview, Check } from '@mui/icons-material';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { reviewTaskSubmissionAction, markTaskAsDoneAction } from '@/app-features/tasks/task-comment.actions';
import { Task } from '@/app-features/tasks/task.model';
import { FileAttachmentList } from './FileAttachmentList';
import { formatDistanceToNow } from 'date-fns';

interface TaskReviewPanelProps {
  task: Task;
  userRole: string;
  onReviewed?: () => void;
}

export function TaskReviewPanel({ task, userRole, onReviewed }: TaskReviewPanelProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null>(null);

  const { execute: reviewSubmission, isExecuting: isReviewing } = useRngAction(reviewTaskSubmissionAction, {
    onSuccess: () => {
      setReviewNotes('');
      setSelectedAction(null);
      setError(null);
      if (onReviewed) {
        onReviewed();
      }
    },
    onError: (message) => {
      setError(message);
    },
  });

  const { execute: markDone, isExecuting: isMarkingDone } = useRngAction(markTaskAsDoneAction, {
    onSuccess: () => {
      if (onReviewed) {
        onReviewed();
      }
    },
    onError: (message) => {
      setError(message);
    },
  });

  // Only admins/owners can review
  const canReview = userRole === 'ADMIN' || userRole === 'OWNER';

  if (!canReview) {
    return null;
  }

  // Show for submitted tasks
  const showReviewPanel = task.status === 'SUBMITTED' && task.currentSubmission;
  const showMarkDoneButton = task.status === 'APPROVED';

  if (!showReviewPanel && !showMarkDoneButton) {
    return null;
  }

  const handleReview = async () => {
    if (!selectedAction) {
      setError('Please select an action');
      return;
    }

    setError(null);

    await reviewSubmission({
      taskId: task.id,
      action: selectedAction,
      reviewNotes: reviewNotes.trim() || undefined,
    });
  };

  const handleMarkDone = async () => {
    setError(null);
    await markDone({ taskId: task.id });
  };

  const isSubmitting = isReviewing || isMarkingDone;

  if (showMarkDoneButton) {
    return (
      <Paper elevation={2} sx={{ p: 3, border: 2, borderColor: 'success.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircle color="success" />
          <Typography variant="h6">Task Approved</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This task has been approved. Mark it as done to close it.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={isMarkingDone ? <CircularProgress size={16} /> : <Check />}
          onClick={handleMarkDone}
          disabled={isMarkingDone}
          fullWidth
        >
          {isMarkingDone ? 'Marking as Done...' : 'Mark as Done'}
        </Button>
      </Paper>
    );
  }

  const submission = task.currentSubmission;
  if (!submission) return null;

  const submittedAt = submission.submittedAt instanceof Date ? submission.submittedAt : new Date(submission.submittedAt);

  return (
    <Paper elevation={2} sx={{ p: 3, border: 2, borderColor: 'warning.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <RateReview color="warning" />
        <Typography variant="h6">Review Submission</Typography>
      </Box>

      {/* Submission Details */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Submitted {formatDistanceToNow(submittedAt, { addSuffix: true })}
        </Typography>
        {submission.notes && (
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {submission.notes}
          </Typography>
        )}
        {submission.attachments && submission.attachments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <FileAttachmentList attachments={submission.attachments} title="Submitted Files" />
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Review Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ButtonGroup fullWidth size="large">
          <Button
            variant={selectedAction === 'APPROVE' ? 'contained' : 'outlined'}
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => setSelectedAction('APPROVE')}
            disabled={isSubmitting}
          >
            Approve
          </Button>
          <Button
            variant={selectedAction === 'REQUEST_CHANGES' ? 'contained' : 'outlined'}
            color="warning"
            startIcon={<RateReview />}
            onClick={() => setSelectedAction('REQUEST_CHANGES')}
            disabled={isSubmitting}
          >
            Request Changes
          </Button>
          <Button
            variant={selectedAction === 'REJECT' ? 'contained' : 'outlined'}
            color="error"
            startIcon={<Cancel />}
            onClick={() => setSelectedAction('REJECT')}
            disabled={isSubmitting}
          >
            Reject
          </Button>
        </ButtonGroup>

        <TextField
          multiline
          rows={3}
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          label="Review Notes (Optional)"
          placeholder="Add feedback or notes..."
          disabled={isSubmitting}
          fullWidth
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleReview}
          disabled={!selectedAction || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
        </Button>
      </Box>
    </Paper>
  );
}
