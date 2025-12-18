'use client';

import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { CameraAlt, Delete, Edit } from '@mui/icons-material';
import { Avatar, Box, FormLabel, IconButton, styled, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { ImageEditorModal } from './ImageEditorModal';

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

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  '&:hover .overlay': {
    opacity: 1,
  },
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  cursor: 'pointer',
}));

interface RNGAvatarUploadProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'avatar' };
}

function useFilePreview(file: File | string | null | undefined) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setObjectUrl(null);
      };
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  if (typeof file === 'string') return file;
  return objectUrl;
}

function AvatarUploadInner({
  field,
  fieldState,
  mergedItem,
}: {
  field: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergedItem: any;
}) {
  const preview = useFilePreview(field.value);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      field.onChange(e.target.files[0]);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    field.onChange(null);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (preview) setEditorOpen(true);
  };

  const handleSaveEdited = async (file: File) => {
    field.onChange(file);
  };

  const size = mergedItem.width || 120;
  const label = mergedItem.label;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      {label && (
        <FormLabel
          error={!!fieldState.error}
          sx={{ fontWeight: 500, color: fieldState.error ? 'error.main' : 'text.primary' }}
        >
          {label}
        </FormLabel>
      )}

      <Box component="label" htmlFor={field.name} sx={{ cursor: 'pointer', position: 'relative' }}>
        <VisuallyHiddenInput
          id={field.name}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={mergedItem.disabled}
        />

        <AvatarWrapper>
          <Avatar
            src={preview || undefined}
            alt={mergedItem.alt || 'Avatar'}
            sx={{
              width: size,
              height: size,
              border: fieldState.error ? '2px solid' : '1px solid',
              borderColor: fieldState.error ? 'error.main' : 'divider',
            }}
          >
            {!preview && (mergedItem.placeholder?.[0] || <CameraAlt />)}
          </Avatar>

          {!mergedItem.disabled && (
            <Overlay className="overlay">
              <CameraAlt sx={{ color: 'white', fontSize: 30 }} />
            </Overlay>
          )}
        </AvatarWrapper>
      </Box>

      {/* Action Buttons Row */}
      {preview && !mergedItem.disabled && (
        <Box display="flex" gap={1}>
          <Tooltip title="Edit Image">
            <IconButton onClick={handleEditClick} color="primary" size="small">
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove Image">
            <IconButton onClick={handleDelete} color="error" size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {!preview && mergedItem.placeholder && (
        <Typography variant="caption" color="text.secondary">
          {mergedItem.placeholder}
        </Typography>
      )}
      {fieldState.error && (
        <Typography variant="caption" color="error">
          {fieldState.error.message}
        </Typography>
      )}

      {/* EDITOR */}
      <ImageEditorModal
        open={isEditorOpen}
        onClose={() => setEditorOpen(false)}
        src={preview || null}
        onSave={handleSaveEdited}
        aspectRatio={1}
        cropShape="round"
        lockAspectRatio={true}
      />
    </Box>
  );
}

export function RNGAvatarUpload<S extends FormSchema>({ item }: RNGAvatarUploadProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => (
        <AvatarUploadInner field={field} fieldState={fieldState} mergedItem={mergedItem} />
      )}
    </FieldWrapper>
  );
}
