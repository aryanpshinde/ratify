import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: 'approve' | 'reject';
  deliverableTitle: string;
  isPending: boolean;
  onConfirm: (data: { note?: string }, onDone: (ok: boolean) => void) => void;
}

export function DecisionDialog({
  open,
  onOpenChange,
  decision,
  deliverableTitle,
  isPending,
  onConfirm,
}: DecisionDialogProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2">
            {decision === 'approve' ? 'Approve deliverable?' : 'Reject deliverable?'}
          </DialogTitle>
          <DialogDescription>
            {decision === 'approve'
              ? `${deliverableTitle} will be locked as final, and no further versions can be added.`
              : `${deliverableTitle} will be returned to your team for revisions.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="decision-note">
            Note <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="decision-note"
            aria-label="Decision note"
            placeholder={
              decision === 'approve'
                ? 'e.g. Looks great, shipping this.'
                : 'e.g. The hero section needs a darker palette.'
            }
            value={note}
            maxLength={2000}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
          />
          {error && <p className="text-caption text-error">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={decision === 'approve' ? 'default' : 'destructive'}
            disabled={isPending}
            onClick={() => {
              const trimmed = note.trim();
              setError(null);
              onConfirm(trimmed.length > 0 ? { note: trimmed } : {}, (ok) => {
                if (ok) {
                  onOpenChange(false);
                }
              });
            }}
          >
            {isPending
              ? decision === 'approve'
                ? 'Approving...'
                : 'Rejecting...'
              : decision === 'approve'
                ? 'Approve deliverable'
                : 'Reject deliverable'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
