'use client';

import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { Send, CheckCircle } from '@mui/icons-material';
import { FileUploadZone } from './FileUploadZone';
import { uploadMultipleFiles, createAttachmentsFromUploads } from '@/lib/utils/file-upload';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { submitTaskForReviewAction } from '@/app-features/tasks/task-comment.actions';
import { Task } from '@/app-features/tasks/task.model';

interface TaskSubmissionPanelProps {
  task: Task;
  orgId: string;
  userId: string;
  onSubmitted?: () => void;
}

export function TaskSubmissionPanel({ task, orgId, userId, onSubmitted }: TaskSubmissionPanelProps) {
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { execute: submitTask, isExecuting } = useRngAction(submitTaskForReviewAction, {
    onSuccess: () => {
      setNotes('');
      setFiles([]);
      setError(null);
      if (onSubmitted) {
        onSubmitted();
      }
    },
    onError: (message) => {
      setError(message);
    },
  });

  // Only show if user is assigned and task is in correct state
  const canSubmit =
    task.assignedTo === userId &&
    (task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED');

  if (!canSubmit) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let attachments = [];

      // Upload files if any
      if (files.length > 0) {
        setIsUploading(true);
        const uploadResults = await uploadMultipleFiles(files, orgId, userId, `tasks/${task.id}`);
        attachments = createAttachmentsFromUploads(uploadResults, userId);
        setIsUploading(false);
      }

      // Submit task
      await submitTask({
        taskId: task.id,
        notes: notes.trim() || undefined,
        attachments,
      });
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    }
  };

  const isSubmitting = isExecuting || isUploading;

  return (
    <Paper elevation={2} sx={{ p: 3, border: 2, borderColor: 'primary.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CheckCircle color="primary" />
        <Typography variant="h6">Submit Work for Review</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {task.status === 'CHANGES_REQUESTED'
          ? 'Submit your revised work for review'
          : 'Submit your completed work for review by the admin'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          label="Submission Notes (Optional)"
          placeholder="Describe what you've completed..."
          disabled={isSubmitting}
          fullWidth
        />

        <FileUploadZone onFilesSelected={setFiles} disabled={isSubmitting} maxFiles={10} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send />}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isUploading ? 'Uploading Files...' : 'Submitting...') : 'Submit for Review'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
