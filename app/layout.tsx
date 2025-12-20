import { getCurrentUser } from '@/features/auth/session';
import { RootProvider } from '@/ui/layout/RootProvider';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RNG App',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <RootProvider sessionUser={sessionUser}>{children}</RootProvider>
      </body>
    </html>
  );
}
