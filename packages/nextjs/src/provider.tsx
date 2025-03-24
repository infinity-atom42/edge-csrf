import { getCsrfToken } from '.';
import { CsrfClientProvider } from './client';

export async function CsrfProvider({ children }: { children: React.ReactNode }) {
  const token = await getCsrfToken();
  return <CsrfClientProvider token={token}>{children}</CsrfClientProvider>;
}
