'use client';

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import QRCode from 'react-qr-code';
import JsBarcode from 'jsbarcode';

interface RNGBarcodeProps {
  /**
   * The value to encode.
   */
  value: string;
  /**
   * Code type: 'qr' for 2D QR Code, 'code128' for 1D Barcode.
   * @default 'code128'
   */
  format?: 'qr' | 'code128';
  /**
   * Size in pixels.
   * For QR: width/height.
   * For Barcode: height.
   * @default 100
   */
  size?: number;
  /**
   * Show text value below barcode?
   * @default true
   */
  showValue?: boolean;
}

/**
 * 🎨 RNGBarcode
 * Generator for 1D barcodes (Code128) and 2D QR codes.
 * Essential for inventory labeling and asset tracking.
 */
export function RNGBarcode({ value, format = 'code128', size = 100, showValue = true }: RNGBarcodeProps) {
  const barcodeRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (format === 'code128' && barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: 'CODE128',
        displayValue: false, // We handle value display manually for consistency
        height: size,
        width: 2,
        margin: 0,
      });
    }
  }, [value, format, size]);

  if (format === 'qr') {
    return (
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}>
          <QRCode value={value} size={size} />
        </Box>
        {showValue && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {value}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <svg ref={barcodeRef} />
      {showValue && (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {value}
        </Typography>
      )}
    </Box>
  );
}
