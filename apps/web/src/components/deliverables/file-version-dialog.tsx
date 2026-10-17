import { useState } from 'react';
import { MAX_FILE_SIZE_BYTES, fileVersionAcceptAttribute } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { useCreateFileVersion } from '@/hooks/deliverables/use-create-file-version';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FileVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverableId: string;
  projectId: string;
  deliverableTitle: string;
  nextVersionNumber: number;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileVersionDialog({
  open,
  onOpenChange,
  deliverableId,
  projectId,
  deliverableTitle,
  nextVersionNumber,
}: FileVersionDialogProps) {
  const createFileVersion = useCreateFileVersion();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('File is required');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError('File exceeds the 10 MB limit');
      return;
    }
    createFileVersion.mutate(
      { deliverableId, projectId, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setError(null);
          onOpenChange(false);
        },
        onError: (mutationError) => {
          if (mutationError instanceof ApiError) {
            if (mutationError.status === 400 || mutationError.status === 403 || mutationError.status === 404) {
              const issues = Array.isArray(mutationError.issues)
                ? (mutationError.issues as Array<{ message?: string }>)
                : [];
              setError(issues[0]?.message ?? mutationError.message);
            }
            return;
          }
          setError('Upload failed. Please try again');
        },
      },
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFile(null);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">Upload File Version</DialogTitle>
          <DialogDescription>
            Upload a file to{' '}
            <span className="font-medium text-foreground">{deliverableTitle}</span>. It becomes{' '}
            <span className="font-mono tabular-nums">v{nextVersionNumber}</span>; previous versions
            are preserved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file-version-input">File</Label>
            <Input
              id="file-version-input"
              type="file"
              accept={fileVersionAcceptAttribute}
              autoFocus
              onChange={(event) => {
                setError(null);
                setSelectedFile(event.target.files?.[0] ?? null);
              }}
            />
            {selectedFile && (
              <p className="text-caption text-muted-foreground">
                {selectedFile.name} · {formatBytes(selectedFile.size)}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              Max 10 MB · PNG, JPEG, GIF, WebP, PDF, TXT, MD, DOC, DOCX, ZIP
            </p>
            {error && <p className="text-caption text-error">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFileVersion.isPending}>
              {createFileVersion.isPending ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
