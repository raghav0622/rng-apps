'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { AddPhotoAlternate, Delete, Edit } from '@mui/icons-material';
import { Box, Grid, IconButton, Paper, styled, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { ImageEditorModal } from './ImageEditorModal';

interface RNGMultiImageEditorProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'multi-image-editor' };
}

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

function MultiImageEditorInner({
  field,
  fieldState,
  mergedItem,
}: {
  field: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergedItem: any;
}) {
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSrc, setEditSrc] = useState<string | null>(null);

  useEffect(() => {
    const files = Array.isArray(field.value) ? field.value : [];
    const newUrls: string[] = [];

    // Create new URLs
    const calculatedPreviews = files.map((file: File | string) => {
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
        return url;
      }
      return file as string;
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrls(calculatedPreviews);

    // Cleanup function to revoke old URLs
    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [field.value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = Array.isArray(field.value) ? field.value : [];
      field.onChange([...currentFiles, ...newFiles]);

      // Reset input value to allow re-selection of same file if needed
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const currentFiles = Array.isArray(field.value) ? field.value : [];
    const newFiles = currentFiles.filter((_: unknown, i: number) => i !== index);
    field.onChange(newFiles);
  };

  const handleEditOpen = (index: number) => {
    const src = objectUrls[index];
    if (!src) return;
    setEditSrc(src);
    setEditingIndex(index);
  };

  const handleEditSave = async (newFile: File) => {
    if (editingIndex === null) return;
    const currentFiles = [...(Array.isArray(field.value) ? field.value : [])];
    currentFiles[editingIndex] = newFile;
    field.onChange(currentFiles);
    // Note: The useEffect will trigger and regenerate the preview URL
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {objectUrls.map((src, index) => (
          <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                position: 'relative',
                aspectRatio: '1',
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover .actions': { opacity: 1 },
              }}
            >
              <Box
                className="actions"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <IconButton
                  size="small"
                  sx={{ bgcolor: 'white', color: '#000', '&:hover': { bgcolor: 'grey.200' } }}
                  onClick={() => handleEditOpen(index)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' } }}
                  onClick={() => handleRemove(index)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        ))}

        {(!mergedItem.maxFiles || objectUrls.length < mergedItem.maxFiles) && (
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              component="label"
              sx={{
                width: '100%',
                aspectRatio: '1',
                border: '2px dashed',
                borderColor: fieldState.error ? 'error.main' : 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                },
              }}
            >
              <VisuallyHiddenInput
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
              <AddPhotoAlternate sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="caption">Add Photos</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Ensure error message is displayed if validation fails */}
      {fieldState.error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {fieldState.error.message}
        </Typography>
      )}

      <ImageEditorModal
        open={editingIndex !== null}
        onClose={() => {
          setEditingIndex(null);
          setEditSrc(null);
        }}
        src={editSrc}
        onSave={handleEditSave}
        aspectRatio={mergedItem.aspectRatio}
      />
    </Box>
  );
}

export function RNGMultiImageEditor<S extends FormSchema>({ item }: RNGMultiImageEditorProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <MultiImageEditorInner field={field} fieldState={fieldState} mergedItem={mergedItem} />
      )}
    </FieldWrapper>
  );
}
