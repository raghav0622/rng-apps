import { getCurrentUser } from '@/features/auth/session';
import { RootProvider } from '@/ui/layout/RootProvider';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'RNG App',
  description: 'Next.js Enterprise Starter',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Fetch Session on Server (Zero Latency)
  const sessionUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className={roboto.variable}>
        {/* 2. Hydrate Client with Session */}
        <RootProvider sessionUser={sessionUser}>{children}</RootProvider>
      </body>
    </html>
  );
}
