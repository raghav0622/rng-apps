import { getCurrentUser } from '@/lib/auth/session'; // Import from step 1
import { RootProvider } from '@/ui/layout/RootProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RNG App',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <RootProvider initialUser={user}>{children}</RootProvider>
      </body>
    </html>
  );
}
