'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Chip, LinearProgress, Alert } from '@mui/material';
import { Upload, Close, InsertDriveFile, Image as ImageIcon } from '@mui/icons-material';
import { validateFile, formatFileSize, isImageFile } from '@/lib/utils/file-upload';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUploadZone({
  onFilesSelected,
  maxFiles = 5,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return;

      const fileArray = Array.from(files);
      const errors: string[] = [];

      // Validate each file
      const validFiles = fileArray.filter((file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          return false;
        }
        return true;
      });

      // Check total count
      const totalFiles = selectedFiles.length + validFiles.length;
      if (totalFiles > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      if (errors.length > 0) {
        setError(errors.join('; '));
        return;
      }

      setError(null);
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, maxFiles, disabled, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!disabled) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, onFilesSelected]
  );

  return (
    <Box>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragging ? 'primary.main' : disabled ? 'grey.300' : 'grey.400',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: isDragging ? 'action.hover' : disabled ? 'action.disabledBackground' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': !disabled && {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <Upload sx={{ fontSize: 48, color: disabled ? 'grey.400' : 'primary.main', mb: 2 }} />
        <Typography variant="body1" gutterBottom>
          Drag and drop files here, or click to select
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Images, PDFs, Documents (Max {maxFiles} files, 10MB each)
        </Typography>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length}/{maxFiles})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={isImageFile(file.type) ? <ImageIcon /> : <InsertDriveFile />}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={() => removeFile(index)}
                deleteIcon={<Close />}
                sx={{ justifyContent: 'space-between' }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
