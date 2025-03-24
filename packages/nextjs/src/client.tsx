'use client';

import { createContext, ReactNode, useContext } from 'react';

const CsrfContext = createContext<string>('');

export const useCsrfToken = () => useContext(CsrfContext);

type CsrfProviderProps = {
  children: ReactNode;
  token: string;
};

export function CsrfClientProvider({ children, token }: CsrfProviderProps) {
  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>;
}

export function Csrf() {
  const token = useCsrfToken();

  return <input type="hidden" name="csrf_token" value={token} />;
}
