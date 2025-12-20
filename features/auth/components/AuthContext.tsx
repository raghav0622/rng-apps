'use client';

import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';
import { UserInSession } from '../auth.model';

const RNGAuthContext = createContext<{
  user: UserInSession | null;
  setUser: Dispatch<SetStateAction<UserInSession | null>>;
}>({ user: null, setUser: () => {} });

export const useRNGAuth = () => useContext(RNGAuthContext);

export function RNGAuthContextProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserInSession | null;
}) {
  const [state, setState] = useState(user);

  return (
    <RNGAuthContext.Provider value={{ user: state, setUser: setState }}>
      {children}
    </RNGAuthContext.Provider>
  );
}
