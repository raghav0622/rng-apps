'use client';
import { Box, Button, ButtonGroup, Paper } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { FormSchema, RichTextItem } from '../types';
import { FieldWrapper } from './FieldWrapper';

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
      </ButtonGroup>
    </Box>
  );
};

export function RNGRichText<S extends FormSchema>({ item }: { item: RichTextItem<S> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const editor = useEditor({
          extensions: [StarterKit],
          content: field.value || '',
          immediatelyRender: false,
          onUpdate: ({ editor }) => field.onChange(editor.getHTML()),
          editorProps: {
            attributes: {
              style: `min-height: ${mergedItem.minHeight || 150}px; padding: 16px; outline: none;`,
            },
          },
        });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (editor && field.value !== editor.getHTML()) {
            if (!editor.isFocused) editor.commands.setContent(field.value || '');
          }
        }, [field.value, editor]);

        return (
          <>
            <Paper
              variant="outlined"
              sx={{ borderColor: fieldState.error ? 'error.main' : 'divider', overflow: 'hidden' }}
            >
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </Paper>
          </>
        );
      }}
    </FieldWrapper>
  );
}
