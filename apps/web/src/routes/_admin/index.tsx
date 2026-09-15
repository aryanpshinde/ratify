import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/projects/use-projects';
import type { ProjectStatus, ProjectListItem } from '@ratify/shared';
import { useUpdateProject } from '@/hooks/projects/use-update-project';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { ProjectsEmptyState } from '@/components/projects/projects-empty-state';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';
import { JUST_SIGNED_UP_KEY } from '@/lib/constants';

export const Route = createFileRoute('/_admin/')({
  component: DashboardHome,
});

const STATUS_GROUPS: Array<{ status: ProjectStatus; label: string }> = [
  { status: 'planning', label: 'Planning' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'completed', label: 'Completed' },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="noise-overlay rounded-lg border border-border bg-card p-5">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-2 text-h1 text-foreground">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-44" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-4 h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const { data: session } = useSession();
  const { data: projects, isPending, isError, error } = useProjects();
  const navigate = useNavigate();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectListItem | null>(null);
  const updateProject = useUpdateProject();

  const handleToggleArchive = (project: ProjectListItem) => {
    const archived = project.status === 'archived';
    updateProject.mutate({
      id: project.id,
      data: { status: archived ? 'planning' : 'archived' },
      successMessage: archived ? 'Project unarchived' : 'Project archived',
    });
  };

  useEffect(() => {
    if (!sessionStorage.getItem(JUST_SIGNED_UP_KEY)) return;
    sessionStorage.removeItem(JUST_SIGNED_UP_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomeOpen(true);
  }, []);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load projects', {
        description: error?.message || 'Please try again later.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  const dashboard = useMemo(() => {
    if (!projects) return null;
    const counts = {
      active: projects.filter((p) => p.status === 'planning' || p.status === 'in_progress').length,
      review: projects.filter((p) => p.status === 'review').length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };
    const groups = STATUS_GROUPS.map((group) => ({
      ...group,
      projects: projects.filter((p) => p.status === group.status),
    })).filter((group) => group.projects.length > 0);
    const archived = projects.filter((p) => p.status === 'archived');
    return { counts, groups, archived, recent: projects.slice(0, 5), total: projects.length };
  }, [projects]);

  const name = session?.user.name;

  const handleGetStarted = () => {
    setWelcomeOpen(false);
    navigate({ to: '/clients' });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-h1 text-foreground">Dashboard</h2>
        {dashboard && dashboard.total > 0 && (
          <Button onClick={() => setCreateOpen(true)}>New Project</Button>
        )}
      </div>

      {isPending && <DashboardSkeleton />}

      {!isPending && !isError && dashboard && dashboard.total === 0 && (
        <ProjectsEmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {!isPending && !isError && dashboard && dashboard.total > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active Projects" value={dashboard.counts.active} />
            <StatCard label="Awaiting Review" value={dashboard.counts.review} />
            <StatCard label="Completed" value={dashboard.counts.completed} />
          </div>

          <section className="space-y-3">
            <h3 className="text-h2 text-foreground">Recently Updated</h3>
            <Card className="noise-overlay">
              <div className="divide-y divide-border">
                {dashboard.recent.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-foreground">
                        {project.title}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {project.clientName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <ProjectStatusBadge status={project.status} />
                      <span className="text-caption text-muted-foreground">
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {dashboard.groups.map((group) => (
            <section key={group.status} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-h2 text-foreground">{group.label}</h3>
                <span className="text-caption text-muted-foreground">{group.projects.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleArchive={handleToggleArchive}
                    onDelete={setDeletingProject}
                  />
                ))}
              </div>
            </section>
          ))}

          {dashboard.archived.length > 0 && (
            <details>
              <summary className="cursor-pointer text-body-sm text-muted-foreground transition-colors hover:text-foreground">
                Archived ({dashboard.archived.length})
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.archived.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleArchive={handleToggleArchive}
                    onDelete={setDeletingProject}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteProjectDialog
        open={!!deletingProject}
        onOpenChange={(o) => !o && setDeletingProject(null)}
        project={deletingProject}
      />

      <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <PartyPopper
              size={48}
              strokeWidth={1}
              aria-hidden="true"
              className="mx-auto text-primary"
            />
            <DialogTitle>Account created successfully!</DialogTitle>
            <DialogDescription>
              Welcome to Ratify{name ? `, ${name}` : ''}. Your workspace is ready — add your first
              client to get started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={handleGetStarted}>
              Create your first client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
