import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Banknote, Calendar } from 'lucide-react';
import { useProject } from '@/hooks/projects/use-project';
import { ActivityFeed } from '@/components/projects/activity-feed';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDeadline } from '@/lib/format';

export const Route = createFileRoute('/_admin/projects/$projectId')({
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

  if (isPending) return <ProjectDetailSkeleton />;

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-body text-muted-foreground">Project not found.</p>
        <Link to="/">
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
        <Link to="/">
          <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-h1 text-foreground">{project.title}</h2>
          <ProjectStatusBadge status={project.status} />
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
          <Card className="noise-overlay">
            <CardHeader>
              <CardTitle className="text-h3">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-body">
                {project.deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>Due {formatDeadline(project.deadline)}</span>
                  </div>
                )}
                {project.budgetDisplay && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Banknote size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>{project.budgetDisplay}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
    </div>
  );
}
