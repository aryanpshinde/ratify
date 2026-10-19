import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { FeedbackReplyResponse, FeedbackThreadResponse } from '@ratify/shared';
import { timeAgo } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackThreadsProps {
  threads: FeedbackThreadResponse[];
  canReply: boolean;
  replyPending?: boolean;
  onReply: (parentId: string, body: string, onDone: (ok: boolean) => void) => void;
}

interface ReplyBoxProps {
  parentId: string;
  pending: boolean;
  onSend: (parentId: string, body: string, onDone: (ok: boolean) => void) => void;
  onClose: () => void;
}

function ReplyBox({ parentId, pending, onSend, onClose }: ReplyBoxProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        aria-label="Write a reply"
        placeholder="Write a reply..."
        value={body}
        maxLength={2000}
        rows={2}
        onChange={(event) => setBody(event.target.value)}
      />
      {error && <p className="text-caption text-error">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          size="xs"
          disabled={pending}
          onClick={() => {
            if (body.trim().length === 0) {
              setError('Write a reply first');
              return;
            }
            setError(null);
            onSend(parentId, body, (ok) => {
              if (ok) {
                setBody('');
                setError(null);
                onClose();
              }
            });
          }}
        >
          {pending ? 'Posting...' : 'Post reply'}
        </Button>
      </div>
    </div>
  );
}

export function FeedbackThreads({
  threads,
  canReply,
  replyPending = false,
  onReply,
}: FeedbackThreadsProps) {
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  const sendReply = (parentId: string, body: string, onDone: (ok: boolean) => void) => {
    onReply(parentId, body, onDone);
  };

  const renderMeta = (
    name: string | null,
    role: 'admin' | 'client',
    createdAt: string,
    versionNumber?: number,
  ) => (
    <div className="flex items-center gap-2">
      <span className="text-caption font-medium text-foreground">{name ?? 'Former member'}</span>
      {role === 'admin' && <Badge variant="secondary">Admin</Badge>}
      {versionNumber !== undefined && (
        <span className="font-mono text-caption text-muted-foreground tabular-nums">
          v{versionNumber}
        </span>
      )}
      <span className="font-mono text-caption text-muted-foreground tabular-nums">
        {timeAgo(createdAt)}
      </span>
    </div>
  );

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread.id} className="group/thread relative flex gap-3 pb-6">
          <>
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {renderMeta(
                  thread.author.name,
                  thread.author.role,
                  thread.createdAt,
                  thread.versionNumber,
                )}
                {canReply && (
                  <div className="flex items-center gap-1">
                    {openReplyId === thread.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Close reply"
                        onClick={() => setOpenReplyId(null)}
                      >
                        <X />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setOpenReplyId(thread.id)}
                      >
                        <MessageCircle />
                        Reply
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-body text-foreground">{thread.body}</p>

              {thread.replies.length > 0 && (
                <div className="mt-3 space-y-3 border-l-2 border-border-subtle pl-4">
                  {thread.replies.map((reply: FeedbackReplyResponse) => (
                    <div key={reply.id}>
                      {renderMeta(reply.author.name, reply.author.role, reply.createdAt)}
                      <p className="mt-0.5 text-body-sm text-foreground">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {canReply && openReplyId === thread.id && (
                <ReplyBox
                  parentId={thread.id}
                  pending={replyPending}
                  onSend={sendReply}
                  onClose={() => setOpenReplyId(null)}
                />
              )}
            </div>
          </>
        </div>
      ))}
    </div>
  );
}
