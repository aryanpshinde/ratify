import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MAX_FILE_SIZE_BYTES, allowedFileMimeTypes } from '@ratify/shared';
import { ApiError } from '@/lib/api';
import { useCreateFileVersion } from '@/hooks/deliverables/use-create-file-version';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { File as FileIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: Object.fromEntries(allowedFileMimeTypes.map((mime) => [mime, []])),
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    onDrop: (acceptedFiles, rejections) => {
      setError(null);
      const code = rejections[0]?.errors[0]?.code;
      if (code) {
        setError(
          code === 'file-too-large'
            ? 'File exceeds the 10 MB limit'
            : 'That file type is not supported.',
        );
        return;
      }
      setSelectedFile(acceptedFiles[0] ?? null);
    },
  });

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
            if (
              mutationError.status === 400 ||
              mutationError.status === 403 ||
              mutationError.status === 404
            ) {
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
            Upload a file to <span className="font-medium text-foreground">{deliverableTitle}</span>
            . It becomes <span className="font-mono tabular-nums">v{nextVersionNumber}</span>;
            previous versions are preserved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file-version-input">File</Label>
            <div
              {...getRootProps({
                className: cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-ring hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isDragActive && 'border-ring bg-muted/50',
                ),
              })}
            >
              <input {...getInputProps({ id: 'file-version-input', autoFocus: true })} />
              {selectedFile ? (
                <>
                  <FileIcon
                    size={28}
                    strokeWidth={1.5}
                    className="text-accent"
                    aria-hidden="true"
                  />
                  <p className="max-w-full truncate text-body-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="font-mono text-caption text-muted-foreground tabular-nums">
                    {formatBytes(selectedFile.size)} · Click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload
                    size={28}
                    strokeWidth={1.5}
                    className="text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-body-sm font-medium text-foreground">
                    Drop your file here, or <span className="text-primary">browse for one</span>
                  </p>
                  <p className="text-caption text-muted-foreground">
                    PNG, JPEG, GIF, WebP, PDF, TXT, MD, DOC, DOCX, ZIP
                  </p>
                </>
              )}
            </div>
            <p className="text-caption text-muted-foreground">Max 10 MB</p>
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
