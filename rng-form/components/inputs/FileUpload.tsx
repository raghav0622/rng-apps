'use client';
import { CloudUpload } from '@mui/icons-material';
import { Box, Chip, styled, Typography } from '@mui/material';
import { FileItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Visually hidden but accessible input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export function RNGFileUpload({ item }: { item: FileItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box
          component="label"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            cursor: 'pointer',
            transition: 'border .2s ease-in-out',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            '&:focus-within': {
              borderColor: 'primary.main',
              outline: '2px solid',
              outlineColor: 'primary.main',
            },
          }}
        >
          <VisuallyHiddenInput
            type="file"
            multiple={mergedItem.multiple}
            accept={mergedItem.accept}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                field.onChange(mergedItem.multiple ? Array.from(files) : files[0]);
              }
            }}
          />
          <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography>Click or Drag to Upload {mergedItem.label}</Typography>

          {field.value && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Array.isArray(field.value) ? (
                field.value.map((f: File, i: number) => (
                  <Chip
                    key={i}
                    label={f.name}
                    onDelete={() => {
                      // Note: Removing individual files from a FileList is tricky naturally,
                      // usually requires maintaining a separate state or DataTransfer
                      // For now, this is a display-only chip unless we implement full state management
                    }}
                  />
                ))
              ) : (
                <Chip label={(field.value as File).name} />
              )}
            </Box>
          )}
        </Box>
      )}
    </FieldWrapper>
  );
}
