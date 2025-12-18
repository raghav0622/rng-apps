'use client';

import { applyFiltersAndSave, resizeImageForEditor } from '@/rng-form/utils/image-processing';
import {
  Brightness6,
  Close,
  Contrast,
  Flip,
  InvertColors,
  Refresh,
  RotateLeft,
  RotateRight,
  Save,
  Tune,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Slider,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Cropper, CropperRef, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

// --- Types ---

export interface EditorFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ImageEditorModalProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  aspectRatio?: number;
  lockAspectRatio?: boolean;
  cropShape?: 'rect' | 'round';
}

const DEFAULT_FILTERS: EditorFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '2:3', value: 2 / 3 },
];

/**
 * OPTIMIZATION 1: Independent Filter Control
 * This component manages its OWN state. Dragging the slider only re-renders THIS component.
 * It communicates to the outside world via direct callback and ref updates.
 */
interface FilterControlRef {
  reset: (val: number) => void;
}

const IndependentFilterControl = React.forwardRef(
  (
    {
      label,
      icon,
      field,
      initialValue,
      onChange,
      min = 0,
      max = 200,
    }: {
      label: string;
      icon: React.ReactNode;
      field: keyof EditorFilters;
      initialValue: number;
      onChange: (field: keyof EditorFilters, val: number) => void;
      min?: number;
      max?: number;
    },
    ref: React.Ref<FilterControlRef>,
  ) => {
    const [value, setValue] = useState(initialValue);

    // Allow parent to reset this component's local state
    useImperativeHandle(ref, () => ({
      reset: (val: number) => setValue(val),
    }));

    const handleChange = (newVal: number) => {
      setValue(newVal);
      onChange(field, newVal);
    };

    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Box display="flex" alignItems="center" gap={1} color="text.secondary">
            {icon}
            <Typography variant="body2" fontWeight={500}>
              {label}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight="mono">
            {value}%
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 8, sm: 9 }}>
            <Slider
              size="small"
              value={value}
              min={min}
              max={max}
              onChange={(_, v) => handleChange(v as number)}
              aria-label={label}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 3 }}>
            <TextField
              variant="outlined"
              size="small"
              value={value}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) handleChange(num);
              }}
              slotProps={{
                htmlInput: {
                  min,
                  max,
                  step: 1,
                  style: {
                    textAlign: 'center',
                    padding: '4px 2px',
                    fontSize: '0.85rem',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  },
);
IndependentFilterControl.displayName = 'IndependentFilterControl';

/**
 * OPTIMIZATION 2: Memoized Cropper Stage
 * Strictly memoized to ensure NO re-renders happen when sliders move.
 */
const MemoizedCropperStage = React.memo(
  React.forwardRef(
    (
      {
        loading,
        optimizedSrc,
        stencilProps, // Passing complex object? Must be memoized in parent!
        onCropperInit,
        cropShape,
      }: {
        loading: boolean;
        optimizedSrc: string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stencilProps: any;
        onCropperInit: (ref: CropperRef) => void;
        cropShape: 'rect' | 'round';
      },
      forwardedRef: React.ForwardedRef<HTMLDivElement>,
    ) => {
      return (
        <Grid
          size={{ xs: 12, md: 9 }}
          ref={forwardedRef} // This ref receives the CSS Variable injections
          className="rng-editor-stage"
          sx={{
            position: 'relative',
            bgcolor: '#000000',
            height: { xs: '50%', md: '100%' },
            borderRight: { md: 1 },
            borderColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress color="primary" />
              <Typography variant="caption" color="text.secondary">
                Optimizing image...
              </Typography>
            </Box>
          ) : optimizedSrc ? (
            <Box sx={{ width: '100%', height: '100%' }}>
              <Cropper
                ref={onCropperInit}
                src={optimizedSrc}
                className="rng-cropper"
                stencilProps={stencilProps}
                style={{ height: '100%', width: '100%', outline: 'none' }}
                imageRestriction={ImageRestriction.stencil}
              />

              {/* CSS INJECTION FOR FILTERS
                  This applies the variables set on the parent Grid to the internal image.
                  "will-change" hints the browser to promote this to a GPU layer.
              */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .rng-editor-stage .rng-cropper img,
                  .rng-editor-stage .rng-cropper .rac-image {
                     filter: brightness(var(--brightness, 100%)) 
                             contrast(var(--contrast, 100%)) 
                             saturate(var(--saturation, 100%));
                     will-change: filter; 
                     transition: none; /* Instant updates for sliders */
                  }
                  ${
                    cropShape === 'round'
                      ? `
                  .circle-preview {
                    border-radius: 50%;
                    cursor: move;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
                  }
                  `
                      : ''
                  }
                `,
                }}
              />
            </Box>
          ) : null}
        </Grid>
      );
    },
  ),
);
MemoizedCropperStage.displayName = 'MemoizedCropperStage';

export function ImageEditorModal({
  open,
  src,
  onClose,
  onSave,
  aspectRatio: initialAspectRatio,
  lockAspectRatio = false,
  cropShape = 'rect',
}: ImageEditorModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Refs
  const cropperRef = useRef<CropperRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // References to child components to reset them without re-rendering parent
  const brightnessRef = useRef<FilterControlRef>(null);
  const contrastRef = useRef<FilterControlRef>(null);
  const saturationRef = useRef<FilterControlRef>(null);

  // State (Only structural state causes re-renders)
  const [aspect, setAspect] = useState<number | undefined>(initialAspectRatio);
  const [flipState, setFlipState] = useState({ h: false, v: false });
  const [saving, setSaving] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mutable State for Logic (Does not trigger renders)
  const currentFilters = useRef<EditorFilters>({ ...DEFAULT_FILTERS });

  // --- Optimization Logic ---
  useEffect(() => {
    let active = true;

    if (open && src) {
      setLoading(true);

      // Reset logic state
      currentFilters.current = { ...DEFAULT_FILTERS };
      setAspect(initialAspectRatio);
      setFlipState({ h: false, v: false });

      // Reset Visuals
      updateCSSVariables(DEFAULT_FILTERS);
      brightnessRef.current?.reset(100);
      contrastRef.current?.reset(100);
      saturationRef.current?.reset(100);

      // Resize logic
      resizeImageForEditor(src, 1600) // Lowered to 1600 for safer mobile performance
        .then((url) => {
          if (active) {
            setOptimizedSrc(url);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Optimization failed', err);
          if (active) {
            setOptimizedSrc(src);
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (optimizedSrc && optimizedSrc !== src && optimizedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(optimizedSrc);
      }
      setOptimizedSrc(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, src]);

  // --- Helpers ---

  const updateCSSVariables = (vals: EditorFilters) => {
    if (editorContainerRef.current) {
      const el = editorContainerRef.current;
      // Direct DOM update - Zero React overhead
      el.style.setProperty('--brightness', `${vals.brightness}%`);
      el.style.setProperty('--contrast', `${vals.contrast}%`);
      el.style.setProperty('--saturation', `${vals.saturation}%`);
    }
  };

  // Callback passed to independent children
  const handleFilterUpdate = useCallback((field: keyof EditorFilters, val: number) => {
    // 1. Update the mutable ref (source of truth for Save)
    currentFilters.current[field] = val;

    // 2. Update the visual preview immediately
    if (editorContainerRef.current) {
      editorContainerRef.current.style.setProperty(`--${field}`, `${val}%`);
    }
  }, []); // Empty dependency array = never re-creates

  const handleSave = async () => {
    if (!cropperRef.current || !optimizedSrc) return;

    setSaving(true);
    try {
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) throw new Error('Could not create canvas');

      // Use the ref values
      const file = await applyFiltersAndSave(
        canvas,
        currentFilters.current,
        `edited_${Date.now()}.jpg`,
      );

      if (file) {
        await onSave(file);
        onClose();
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const rotateImage = (angle: number) => cropperRef.current?.rotateImage(angle);

  const flipImage = (type: 'h' | 'v') => {
    if (!cropperRef.current) return;
    const newH = type === 'h' ? !flipState.h : flipState.h;
    const newV = type === 'v' ? !flipState.v : flipState.v;
    cropperRef.current.flipImage(newH, newV);
    setFlipState({ h: newH, v: newV });
  };

  const handleReset = () => {
    currentFilters.current = { ...DEFAULT_FILTERS };
    updateCSSVariables(DEFAULT_FILTERS);

    // Reset independent components
    brightnessRef.current?.reset(100);
    contrastRef.current?.reset(100);
    saturationRef.current?.reset(100);

    setAspect(initialAspectRatio);
    setFlipState({ h: false, v: false });
    cropperRef.current?.reset();
  };

  // OPTIMIZATION 3: Memoize stencil props to prevent Cropper re-renders
  const stencilProps = useMemo(
    () => ({
      aspectRatio: aspect,
      grid: true,
      previewClassName: cropShape === 'round' ? 'circle-preview' : undefined,
    }),
    [aspect, cropShape],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: fullScreen ? '100%' : '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#121212',
          color: '#ffffff',
        },
      }}
    >
      <AppBar
        position="relative"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          bgcolor: '#1e1e1e',
          color: 'white',
        }}
      >
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Photo Editor
          </Typography>
          <Button
            color="primary"
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={<Save />}
            sx={{ fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid container sx={{ flex: 1, height: '100%' }}>
          {/* --- LEFT: CANVAS AREA --- */}
          <MemoizedCropperStage
            ref={editorContainerRef}
            loading={loading}
            optimizedSrc={optimizedSrc}
            stencilProps={stencilProps}
            cropShape={cropShape}
            onCropperInit={(ref) => {
              cropperRef.current = ref;
            }}
          />

          {/* --- RIGHT: CONTROLS SIDEBAR --- */}
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              height: { xs: '50%', md: '100%' },
              overflowY: 'auto',
              bgcolor: '#1e1e1e',
              borderTop: { xs: 1, md: 0 },
              borderColor: 'rgba(255,255,255,0.1)',
              pointerEvents: loading ? 'none' : 'auto',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Transform Section */}
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight="bold"
                  display="block"
                  mb={2}
                >
                  Transform
                </Typography>

                {!lockAspectRatio && (
                  <Box mb={2}>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {ASPECT_RATIOS.map((r) => (
                        <Chip
                          key={r.label}
                          label={r.label}
                          clickable
                          size="small"
                          variant={
                            (r.value === undefined && aspect === undefined) || aspect === r.value
                              ? 'filled'
                              : 'outlined'
                          }
                          color="primary"
                          onClick={() => setAspect(r.value)}
                          sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                <Grid container spacing={1}>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => rotateImage(-90)}
                    >
                      <RotateLeft />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => rotateImage(90)}
                    >
                      <RotateRight />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant={flipState.h ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => flipImage('h')}
                    >
                      <Flip />
                    </Button>
                  </Grid>
                  <Grid size={3}>
                    <Button
                      fullWidth
                      variant={flipState.v ? 'contained' : 'outlined'}
                      color="inherit"
                      onClick={() => flipImage('v')}
                    >
                      <Flip sx={{ transform: 'rotate(90deg)' }} />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

              {/* Adjustments Section - Completely Isolated */}
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Tune fontSize="small" color="primary" />
                  <Typography variant="overline" color="text.secondary" fontWeight="bold">
                    Adjustments
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <IndependentFilterControl
                    ref={brightnessRef}
                    label="Brightness"
                    field="brightness"
                    initialValue={100}
                    icon={<Brightness6 fontSize="small" />}
                    onChange={handleFilterUpdate}
                  />
                  <IndependentFilterControl
                    ref={contrastRef}
                    label="Contrast"
                    field="contrast"
                    initialValue={100}
                    icon={<Contrast fontSize="small" />}
                    onChange={handleFilterUpdate}
                  />
                  <IndependentFilterControl
                    ref={saturationRef}
                    label="Saturation"
                    field="saturation"
                    initialValue={100}
                    icon={<InvertColors fontSize="small" />}
                    onChange={handleFilterUpdate}
                  />
                </Stack>
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  Reset All Changes
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
