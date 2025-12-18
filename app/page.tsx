import { LOGIN_ROUTE } from '@/lib/routes';
import { redirect } from 'next/navigation';

export default function Page() {
  redirect(LOGIN_ROUTE);
}
