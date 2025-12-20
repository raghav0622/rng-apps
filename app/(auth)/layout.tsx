import AppContent from '@/ui/layout/AppContent';
import AuthAppHeader from '@/ui/layout/AuthAppHeader';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthAppHeader />
      <AppContent drawerDisabled>{children}</AppContent>
    </>
  );
}
