import { LOGIN_ROUTE } from '@/routes';
import { redirect } from 'next/navigation';

export default function Page() {
  redirect(LOGIN_ROUTE);
}
