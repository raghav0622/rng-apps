'use client';
import { DarkMode, LightMode } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

export default function DarkModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const isDarkMode = systemMode === 'dark' || mode === 'dark';

  if (!mode) {
    return null;
  }

  return (
    <Tooltip title={isDarkMode ? 'Swith to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton onClick={() => (isDarkMode ? setMode('light') : setMode('dark'))}>
        {isDarkMode ? <DarkMode color="inherit" /> : <LightMode color="inherit" />}
      </IconButton>
    </Tooltip>
  );
}
