'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Box, Button } from '@mui/material';
import React, { useRef } from 'react';

interface RNGSignatureProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'signature' };
}

export function RNGSignature<S extends FormSchema>({ item }: RNGSignatureProps<S>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        const startDrawing = (e: React.MouseEvent) => {
          if (mergedItem.disabled) return;
          isDrawing.current = true;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }
        };
        const draw = (e: React.MouseEvent) => {
          if (!isDrawing.current || mergedItem.disabled) return;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctx.stroke();
          }
        };
        const stopDrawing = () => {
          isDrawing.current = false;
          if (canvasRef.current && !mergedItem.disabled) {
            field.onChange(canvasRef.current.toDataURL());
          }
        };

        const clear = () => {
          if (mergedItem.disabled) return;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            field.onChange('');
          }
        };

        return (
          <Box
            sx={{
              border: '1px solid #ccc',
              borderRadius: 1,
              overflow: 'hidden',
              opacity: mergedItem.disabled ? 0.6 : 1,
            }}
          >
            <canvas
              ref={canvasRef}
              width={500}
              height={mergedItem.height || 150}
              style={{
                display: 'block',
                background: '#fff',
                cursor: mergedItem.disabled ? 'not-allowed' : 'crosshair',
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              tabIndex={0}
            />
            <Box sx={{ p: 1, borderTop: '1px solid #eee', bgcolor: '#f9f9f9' }}>
              <Button size="small" onClick={clear} disabled={mergedItem.disabled}>
                Clear Signature
              </Button>
            </Box>
          </Box>
        );
      }}
    </FieldWrapper>
  );
}
