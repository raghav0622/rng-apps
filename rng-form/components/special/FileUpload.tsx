/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { CloudUpload, Delete } from '@mui/icons-material';
import { Box, Chip, styled, Typography } from '@mui/material';

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

interface RNGFileUploadProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'file' };
}

export function RNGFileUpload<S extends FormSchema>({ item }: RNGFileUploadProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        const handleDelete = (indexToRemove: number) => {
          if (mergedItem.multiple && Array.isArray(field.value)) {
            const newFiles = field.value.filter((_: any, idx: number) => idx !== indexToRemove);
            field.onChange(newFiles.length > 0 ? newFiles : null);
          } else {
            field.onChange(null);
          }
        };

        const renderChip = (file: File | any, index: number) => {
          const label = file instanceof File ? file.name : file?.name || 'Unknown File';
          return (
            <Chip
              key={index}
              label={label}
              onDelete={!mergedItem.disabled ? () => handleDelete(index) : undefined}
              deleteIcon={<Delete />}
            />
          );
        };

        return (
          <Box>
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
                cursor: mergedItem.disabled ? 'not-allowed' : 'pointer',
                opacity: mergedItem.disabled ? 0.6 : 1,
                transition: 'border .2s ease-in-out',
                bgcolor: fieldState.error ? 'error.lighter' : 'background.paper',
                borderColor: fieldState.error ? 'error.main' : 'divider',
                '&:hover': !mergedItem.disabled
                  ? { borderColor: 'primary.main', bgcolor: 'action.hover' }
                  : {},
              }}
            >
              <VisuallyHiddenInput
                type="file"
                multiple={mergedItem.multiple}
                accept={mergedItem.accept}
                disabled={mergedItem.disabled}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const value = mergedItem.multiple ? Array.from(files) : files[0];
                    field.onChange(value);
                  }
                }}
              />
              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {mergedItem.placeholder || 'Click or Drag to Upload'}
              </Typography>
            </Box>

            {/* Selected Files Display */}
            {field.value && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.isArray(field.value)
                  ? field.value.map((f: any, i: number) => renderChip(f, i))
                  : renderChip(field.value, 0)}
              </Box>
            )}
          </Box>
        );
      }}
    </FieldWrapper>
  );
}
