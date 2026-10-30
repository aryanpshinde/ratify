import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Banknote, Calendar, UserPlus } from 'lucide-react';
import { useProject } from '@/hooks/projects/use-project';
import { useUpdateProject } from '@/hooks/projects/use-update-project';
import { ActivityFeed } from '@/components/projects/activity-feed';
import { ProjectDeliverablesSection } from '@/components/deliverables/project-deliverables-section';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_STATUS_GROUPS } from '@/lib/constants';
import { formatDeadline } from '@/lib/format';
import { useInvitations } from '@/hooks/projects/use-invitations';
import { InviteClientDialog } from '@/components/projects/invite-client-dialog';
import { PendingInvitationsList } from '@/components/projects/pending-invitations-list';

export const Route = createFileRoute('/admin/projects/$projectId/')({
  component: ProjectDetailPage,
});

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { data: project, isPending, isError } = useProject(projectId);
  const {
    data: invitations,
    isPending: invitesPending,
    isError: invitesError,
  } = useInvitations(projectId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const updateProject = useUpdateProject();

  const statusOptions = PROJECT_STATUS_GROUPS.map((group) => ({
    value: group.status,
    label: group.label,
  }));

  if (isPending) return <ProjectDetailSkeleton />;

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">Project not found.</p>
        <Link to="/admin">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard">
                  <ArrowLeft />
                </Button>
              }
            />
            <TooltipContent>Back to dashboard</TooltipContent>
          </Tooltip>
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-h1 text-foreground">{project.title}</h2>
          <Select
            value={project.status}
            items={statusOptions}
            onValueChange={(value) => {
              if (value === null || value === project.status) return;
              updateProject.mutate({
                id: project.id,
                data: { status: value },
                successMessage: 'Project status updated',
              });
            }}
          >
            <SelectTrigger className="w-fit" disabled={updateProject.isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-body text-muted-foreground">
        {project.clientName}
        {project.clientCompany ? ` · ${project.clientCompany}` : ''}
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <Card className="noise-overlay">
              <CardHeader>
                <CardTitle className="text-h3">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          )}

          <ProjectDeliverablesSection projectId={projectId} projectTitle={project.title} />

          <Card className="noise-overlay">
            <CardHeader>
              <CardTitle className="text-h3">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed projectId={projectId} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {(project.deadline || project.budgetDisplay) && (
            <Card className="noise-overlay">
              <CardHeader>
                <CardTitle className="text-h3">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-body">
                  {project.deadline && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
                      <span className="font-mono tabular-nums">
                        Due {formatDeadline(project.deadline)}
                      </span>
                    </div>
                  )}
                  {project.budgetDisplay && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote size={16} strokeWidth={1.5} aria-hidden="true" />
                      <span className="font-mono tabular-nums">{project.budgetDisplay}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="noise-overlay">
            <CardHeader>
              <CardTitle className="text-h3">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body font-medium text-foreground">{project.clientName}</p>
              {project.clientCompany && (
                <p className="text-caption text-muted-foreground">{project.clientCompany}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="noise-overlay">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-h3">Client Access</CardTitle>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus />
              Invite Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PendingInvitationsList
            invitations={invitations}
            isPending={invitesPending}
            isError={invitesError}
          />
        </CardContent>
      </Card>

      {project && (
        <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} project={project} />
      )}
    </div>
  );
}
