'use client';

import { Box, Typography, Avatar, Chip, Paper } from '@mui/material';
import { TaskComment } from '@/app-features/tasks/task.model';
import { FileAttachmentList } from './FileAttachmentList';
import { formatDistanceToNow } from 'date-fns';

interface TaskCommentThreadProps {
  comments: TaskComment[];
}

function getCommentTypeColor(
  type: TaskComment['commentType']
): 'default' | 'primary' | 'success' | 'error' | 'warning' {
  switch (type) {
    case 'APPROVAL':
      return 'success';
    case 'REJECTION':
      return 'error';
    case 'FEEDBACK':
      return 'warning';
    case 'RESPONSE':
      return 'primary';
    default:
      return 'default';
  }
}

function getCommentTypeLabel(type: TaskComment['commentType']): string {
  switch (type) {
    case 'APPROVAL':
      return 'Approved';
    case 'REJECTION':
      return 'Rejected';
    case 'FEEDBACK':
      return 'Feedback';
    case 'RESPONSE':
      return 'Response';
    case 'NOTE':
      return 'Note';
    default:
      return type;
  }
}

export function TaskCommentThread({ comments }: TaskCommentThreadProps) {
  if (comments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No comments yet. Add a comment to start the conversation.
        </Typography>
      </Box>
    );
  }

  // Sort comments by date (newest first for display, but we'll reverse for chronological)
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sortedComments.map((comment, index) => {
        const createdAt = comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt);
        const isAdmin = comment.userRole === 'ADMIN' || comment.userRole === 'OWNER';

        return (
          <Paper
            key={comment.id}
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: isAdmin ? 'primary.50' : 'background.paper',
            }}
          >
            {/* Comment Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: isAdmin ? 'primary.main' : 'secondary.main',
                }}
              >
                {comment.userName.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {comment.userName}
                  </Typography>
                  <Chip
                    label={comment.userRole}
                    size="small"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                  <Chip
                    label={getCommentTypeLabel(comment.commentType)}
                    size="small"
                    color={getCommentTypeColor(comment.commentType)}
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </Typography>
              </Box>
            </Box>

            {/* Comment Content */}
            <Typography
              variant="body2"
              sx={{
                ml: 6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {comment.content}
            </Typography>

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <Box sx={{ ml: 6, mt: 2 }}>
                <FileAttachmentList attachments={comment.attachments} title="Attached Files" />
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
