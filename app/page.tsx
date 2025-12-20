import { LOGIN_ROUTE } from '@/routes';
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect(LOGIN_ROUTE);
}
