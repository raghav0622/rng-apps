import { Box, Toolbar } from '@mui/material';
import { useLayoutContext } from './LayoutContext';

export const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { padding, mobile, drawerWidth, drawerOpen } = useLayoutContext();
  return (
    <>
      {!mobile && drawerOpen && <div style={{ width: drawerWidth }} />}
      <Box
        component={'main'}
        sx={{
          display: 'flex',
          gap: padding,
          flexDirection: 'column',
          flexGrow: 1,
          p: padding,
          transition: 'ease-in-out 0.3s',
        }}
      >
        <Toolbar variant="dense" sx={{ marginBottom: -1 * padding }} />
        {children}
      </Box>
    </>
  );
};
