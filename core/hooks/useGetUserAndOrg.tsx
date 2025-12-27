import { getUserAction } from '../auth/auth.actions';
import { useRNGServerAction } from '../safe-action/use-rng-action';

export default function useGetUserAndOrg() {
  const { runAction } = useRNGServerAction(getUserAction);

  return runAction;
}
