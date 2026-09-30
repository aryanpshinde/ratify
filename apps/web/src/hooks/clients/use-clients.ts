import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { type ClientResponse } from '@ratify/shared';

async function fetchClients(): Promise<ClientResponse[]> {
  return apiFetch<ClientResponse[]>('/clients');
}

export function useClients(enabled = true) {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled,
  });
}
