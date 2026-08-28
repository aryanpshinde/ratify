import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
}

async function fetchClients(): Promise<Client[]> {
  return apiFetch<Client[]>('/clients');
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });
}
