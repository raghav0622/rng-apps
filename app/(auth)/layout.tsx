import AppContent from '@/ui/layout/AppContent';
import AppHeader from '@/ui/layout/AppHeader';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <AppContent drawerDisabled>{children}</AppContent>
    </>
  );
}
