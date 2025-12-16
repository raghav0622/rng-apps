'use client';
import { Box, Button, ButtonGroup, FormHelperText, Paper, Typography } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { FieldWrapper } from '../FieldWrapper';
import { FormSchema, RichTextItem } from '../types';

// Simple Toolbar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: 'background.default' }}>
      <ButtonGroup size="small" variant="text">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'contained' : 'text'}
        >
          <b>B</b>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'contained' : 'text'}
        >
          <i>I</i>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          variant={editor.isActive('strike') ? 'contained' : 'text'}
        >
          <s>S</s>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleCode().run()}
          variant={editor.isActive('code') ? 'contained' : 'text'}
        >
          Code
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export function RNGRichText<S extends FormSchema>({ item }: { item: RichTextItem<S> }) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {item.label}
      </Typography>
      <Controller
        name={item.name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const editor = useEditor({
            extensions: [StarterKit],
            content: field.value || '',
            // FIX: Disable immediate render to prevent Next.js SSR hydration mismatch
            immediatelyRender: false,
            onUpdate: ({ editor }) => {
              // Get HTML content
              field.onChange(editor.getHTML());
            },
            editorProps: {
              attributes: {
                style: `min-height: ${item.minHeight || 150}px; padding: 16px; outline: none;`,
              },
            },
          });

          // Sync external changes (e.g. form reset) via useEffect
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (editor && field.value !== editor.getHTML()) {
              // If the field value is empty (reset) or completely different, sync it.
              // We check if it is focused to avoid cursor jumping while typing
              if (!editor.isFocused) {
                editor.commands.setContent(field.value || '');
              }
            }
          }, [field.value, editor]);

          return (
            <>
              <Paper
                variant="outlined"
                sx={{
                  borderColor: error ? 'error.main' : 'divider',
                  overflow: 'hidden',
                }}
              >
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
              </Paper>
              {error && <FormHelperText error>{error.message}</FormHelperText>}
            </>
          );
        }}
      />
    </FieldWrapper>
  );
}
