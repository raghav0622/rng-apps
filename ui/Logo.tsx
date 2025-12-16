import { Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

export default function Logo() {
  const { mode, systemMode } = useColorScheme();
  const isDarkMode = systemMode === 'dark' || mode === 'dark';

  return <Typography variant="h6">RNG Apps</Typography>;
}
