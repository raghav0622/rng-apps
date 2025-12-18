'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
} from '@mui/icons-material';
import { Box, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

function TiptapToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <Box sx={{ borderBottom: '1px solid #ddd', p: 1, display: 'flex', gap: 1 }}>
      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bold"
          selected={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBold />
        </ToggleButton>
        <ToggleButton
          value="italic"
          selected={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalic />
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup size="small">
        <ToggleButton
          value="bulletList"
          selected={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulleted />
        </ToggleButton>
        <ToggleButton
          value="orderedList"
          selected={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumbered />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

interface RNGRichTextProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'rich-text' };
}

export function RNGRichText<S extends FormSchema>({ item }: RNGRichTextProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState, mergedItem) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const editor = useEditor({
          extensions: [StarterKit],
          content: field.value || '',
          editable: !mergedItem.disabled,
          onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            field.onChange(html === '<p></p>' ? '' : html);
          },
          editorProps: {
            attributes: {
              class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
              style: `min-height: ${mergedItem.minHeight || 150}px; padding: 16px;`,
            },
          },
          immediatelyRender: false,
        });

        // Sync external value changes
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (editor && field.value !== editor.getHTML()) {
            if (field.value === '' && editor.getHTML() === '<p></p>') return;
            if (!editor.isFocused) {
              editor.commands.setContent(field.value || '');
            }
          }
        }, [field.value, editor]);

        // Sync disabled state
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (editor) {
            editor.setEditable(!mergedItem.disabled);
          }
        }, [mergedItem.disabled, editor]);

        return (
          <Paper
            variant="outlined"
            sx={{
              borderColor: fieldState.error ? 'error.main' : 'inherit',
              overflow: 'hidden',
              bgcolor: mergedItem.disabled ? 'action.disabledBackground' : 'background.paper',
            }}
          >
            <TiptapToolbar editor={editor} />
            <Box sx={{ '& .ProseMirror': { outline: 'none' } }}>
              <EditorContent editor={editor} />
            </Box>
          </Paper>
        );
      }}
    </FieldWrapper>
  );
}
