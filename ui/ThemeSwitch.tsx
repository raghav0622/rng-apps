'use client';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useColorScheme } from '@mui/material/styles';
import { IconButton, Tooltip } from '@mui/material';

export default function DarkModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const isDarkMode = systemMode === 'dark' || mode === 'dark';

  if (!mode) {
    return null;
  }

  return (
    <Tooltip title={isDarkMode ? 'Swith to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton onClick={() => (isDarkMode ? setMode('light') : setMode('dark'))}>
        {isDarkMode ? (
          <DarkMode color="inherit" />
        ) : (
          <LightMode color="inherit" style={{ color: '#fff' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
