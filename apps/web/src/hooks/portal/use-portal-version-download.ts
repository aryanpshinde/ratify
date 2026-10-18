import { useMutation } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface VersionDownloadResponse {
  url: string;
}

export function usePortalDownloadVersion() {
  return useMutation({
    mutationFn: async (versionId: string) => {
      const result = await apiFetch<VersionDownloadResponse>(
        `/portal/versions/${versionId}/download`,
      );
      return result.url;
    },
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
