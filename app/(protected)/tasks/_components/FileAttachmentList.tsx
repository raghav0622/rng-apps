'use client';

import { Box, Typography, IconButton, Chip, Link } from '@mui/material';
import {
  Download,
  InsertDriveFile,
  Image as ImageIcon,
  PictureAsPdf,
  Description,
} from '@mui/icons-material';
import { TaskAttachment } from '@/app-features/tasks/task.model';
import { formatFileSize } from '@/lib/utils/file-upload';

interface FileAttachmentListProps {
  attachments: TaskAttachment[];
  title?: string;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <ImageIcon />;
  if (fileType === 'application/pdf') return <PictureAsPdf />;
  if (fileType.includes('word') || fileType.includes('document')) return <Description />;
  return <InsertDriveFile />;
}

export function FileAttachmentList({ attachments, title = 'Attachments' }: FileAttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        {title} ({attachments.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {attachments.map((attachment) => (
          <Box
            key={attachment.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {/* File Icon */}
            <Box sx={{ color: 'primary.main' }}>{getFileIcon(attachment.fileType)}</Box>

            {/* File Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {attachment.fileName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(attachment.fileSize)}
              </Typography>
            </Box>

            {/* Image Preview */}
            {attachment.isImage && attachment.thumbnailUrl && (
              <Box
                component="img"
                src={attachment.thumbnailUrl || attachment.fileUrl}
                alt={attachment.fileName}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'cover',
                }}
              />
            )}

            {/* Download Button */}
            <IconButton
              component={Link}
              href={attachment.fileUrl}
              download={attachment.fileName}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: 'primary.main' }}
            >
              <Download />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
