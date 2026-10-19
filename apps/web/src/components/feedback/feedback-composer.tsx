import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackComposerProps {
  versions: { id: string; versionNumber: number }[];
  isPending: boolean;
  submitLabel?: string;
  onSend: (input: { versionId: string; body: string }, onDone: (ok: boolean) => void) => void;
}

export function FeedbackComposer({
  versions,
  isPending,
  submitLabel = 'Post feedback',
  onSend,
}: FeedbackComposerProps) {
  const latestVersion = versions[0];
  const [versionId, setVersionId] = useState(latestVersion?.id ?? '');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="feedback-version" className="text-caption text-muted-foreground">
          On version
        </Label>
        <Select
          value={versionId}
          onValueChange={(value) => {
            if (value) {
              setVersionId(value);
            }
          }}
        >
          <SelectTrigger id="feedback-version" className="h-7 w-32 text-caption">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                <span className="font-mono tabular-nums">v{version.versionNumber}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        aria-label="Write feedback"
        placeholder="Share your thoughts on this deliverable..."
        value={body}
        maxLength={2000}
        rows={3}
        onChange={(event) => setBody(event.target.value)}
      />
      {error && <p className="text-caption text-error">{error}</p>}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={isPending || !versionId}
          onClick={() => {
            if (body.trim().length === 0) {
              setError('Write your feedback first');
              return;
            }
            setError(null);
            onSend({ versionId, body: body.trim() }, (ok) => {
              if (ok) {
                setBody('');
                setError(null);
              }
            });
          }}
        >
          {isPending ? 'Posting...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
