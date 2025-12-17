'use client';

import { Box, Button } from '@mui/material';
import React, { useRef } from 'react';
import { SignatureItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGSignature({ item }: { item: SignatureItem<any> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const startDrawing = (e: React.MouseEvent) => {
          isDrawing.current = true;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }
        };
        const draw = (e: React.MouseEvent) => {
          if (!isDrawing.current) return;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctx.stroke();
          }
        };
        const stopDrawing = () => {
          isDrawing.current = false;
          if (canvasRef.current) {
            field.onChange(canvasRef.current.toDataURL());
          }
        };

        const clear = () => {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            field.onChange('');
          }
        };

        return (
          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
            {/* Added tabIndex to prevent trapping but allow focus if needed */}
            <canvas
              ref={canvasRef}
              width={500}
              height={item.height || 150}
              style={{ display: 'block', background: '#fff' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              tabIndex={0}
            />
            <Box sx={{ p: 1, borderTop: '1px solid #eee', bgcolor: '#f9f9f9' }}>
              <Button size="small" onClick={clear}>
                Clear Signature
              </Button>
            </Box>
          </Box>
        );
      }}
    </FieldWrapper>
  );
}
