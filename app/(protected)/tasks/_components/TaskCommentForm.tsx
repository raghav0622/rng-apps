'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import { Send, AttachFile, Close } from '@mui/icons-material';
import { uploadMultipleFiles, createAttachmentsFromUploads } from '@/lib/utils/file-upload';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { addTaskCommentAction } from '@/app-features/tasks/task-comment.actions';
import { TaskComment } from '@/app-features/tasks/task.model';

interface TaskCommentFormProps {
  taskId: string;
  orgId: string;
  userId: string;
  onCommentAdded?: () => void;
  defaultCommentType?: TaskComment['commentType'];
}

export function TaskCommentForm({
  taskId,
  orgId,
  userId,
  onCommentAdded,
  defaultCommentType = 'NOTE',
}: TaskCommentFormProps) {
  const [content, setContent] = useState('');
  const [commentType, setCommentType] = useState<TaskComment['commentType']>(defaultCommentType);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic comments for instant feedback
  const [optimisticPending, setOptimisticPending] = useOptimistic(false);

  const { execute: addComment, isExecuting } = useRngAction(addTaskCommentAction, {
    onSuccess: () => {
      setContent('');
      setFiles([]);
      setError(null);
      if (onCommentAdded) {
        onCommentAdded();
      }
    },
    onError: (message) => {
      setError(message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setError(null);

    // Optimistic update
    startTransition(() => {
      setOptimisticPending(true);
    });

    try {
      let attachments = [];

      // Upload files if any
      if (files.length > 0) {
        setIsUploading(true);
        const uploadResults = await uploadMultipleFiles(files, orgId, userId, `tasks/${taskId}`);
        attachments = createAttachmentsFromUploads(uploadResults, userId);
        setIsUploading(false);
      }

      // Add comment
      await addComment({
        taskId,
        content: content.trim(),
        commentType,
        attachments,
      });

      // Reset optimistic state on success
      startTransition(() => {
        setOptimisticPending(false);
      });
    } catch (err) {
      setIsUploading(false);
      // Revert optimistic update
      startTransition(() => {
        setOptimisticPending(false);
      });
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  };

  const isSubmitting = isExecuting || isUploading || isPending;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {optimisticPending && (
        <Alert severity="info" icon={<CircularProgress size={16} />}>
          Posting comment...
        </Alert>
      )}

      <FormControl fullWidth size="small">
        <InputLabel>Comment Type</InputLabel>
        <Select
          value={commentType}
          label="Comment Type"
          onChange={(e) => setCommentType(e.target.value as TaskComment['commentType'])}
          disabled={isSubmitting}
        >
          <MenuItem value="NOTE">Note</MenuItem>
          <MenuItem value="FEEDBACK">Feedback</MenuItem>
          <MenuItem value="RESPONSE">Response</MenuItem>
          <MenuItem value="APPROVAL">Approval</MenuItem>
          <MenuItem value="REJECTION">Rejection</MenuItem>
        </Select>
      </FormControl>

      <TextField
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        disabled={isSubmitting}
        fullWidth
        required
      />

      {/* Simplified File Upload */}
      <Box>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<AttachFile />}
          disabled={isSubmitting || files.length >= 5}
        >
          Attach Files (Max 5)
          <input type="file" multiple hidden onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
        </Button>
      </Box>

      {/* Selected Files */}
      {files.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {files.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              size="small"
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
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send />}
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (isUploading ? 'Uploading...' : 'Posting...') : 'Post Comment'}
        </Button>
      </Box>
    </Box>
  );
}
