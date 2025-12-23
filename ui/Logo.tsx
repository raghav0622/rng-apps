import { Chip } from '@mui/material';

export default function Logo() {
  return (
    <Chip
      label="RNG Apps"
      color="primary"
      variant="filled"
      size="small"
      sx={{ borderColor: 'divider', border: 1 }}
    />
  );
}
