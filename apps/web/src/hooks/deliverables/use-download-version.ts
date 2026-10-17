import { useMutation } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface VersionDownloadResponse {
  url: string;
}

async function fetchVersionDownloadUrl(versionId: string): Promise<string> {
  const result = await apiFetch<VersionDownloadResponse>(`/versions/${versionId}/download`);
  return result.url;
}

export function useDownloadVersion() {
  return useMutation({
    mutationFn: fetchVersionDownloadUrl,
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Download failed. Please try again';
      toast.error('Download failed', { description: message });
    },
  });
}
