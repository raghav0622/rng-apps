'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, Chip } from '@mui/material';
import { Send, CheckCircle, AttachFile, Close } from '@mui/icons-material';
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
  const [isPending, startTransition] = useTransition();

  // Optimistic status for instant feedback
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 10)); // Max 10 files
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Start optimistic update
    startTransition(() => {
      setOptimisticStatus('SUBMITTED');
    });

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
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticStatus(task.status);
      });
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    }
  };

  const isSubmitting = isExecuting || isUploading || isPending;

  return (
    <Paper elevation={2} sx={{ p: 3, border: 2, borderColor: 'primary.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CheckCircle color="primary" />
        <Typography variant="h6">Submit Work for Review</Typography>
        {optimisticStatus === 'SUBMITTED' && optimisticStatus !== task.status && (
          <Chip label="Submitting..." size="small" color="info" />
        )}
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

        {/* File Upload - Simple Input */}
        <Box>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFile />}
            disabled={isSubmitting || files.length >= 10}
          >
            Attach Files (Max 10)
            <input type="file" multiple hidden onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Images, PDFs, Documents (Max 10MB each)
          </Typography>
        </Box>

        {/* Selected Files */}
        {files.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {files.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                onDelete={() => removeFile(index)}
                deleteIcon={<Close />}
                disabled={isSubmitting}
              />
            ))}
          </Box>
        )}

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
