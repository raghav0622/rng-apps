import { Toolbar } from '@mui/material';
import AppHeader from '../(protected)/AppHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader drawerDisabled />
      <Toolbar variant="dense" />
      {children}
    </>
  );
}
