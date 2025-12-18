import { getCurrentUser } from '@/lib/auth/session';
import RootProvider from '@/ui/layout/RootProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RNG Apps',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user session server-side
  const sessionUser = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <RootProvider sessionUser={sessionUser}>{children}</RootProvider>
      </body>
    </html>
  );
}
