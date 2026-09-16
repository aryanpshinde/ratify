import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/projects/use-projects';
import type { ProjectListItem } from '@ratify/shared';
import { useUpdateProject } from '@/hooks/projects/use-update-project';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ProjectsEmptyState } from '@/components/projects/projects-empty-state';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { StatCard } from '@/components/dashboard/stat-card';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { RecentProjectsSection } from '@/components/projects/dashboard/recent-projects-section';
import { ProjectStatusSection } from '@/components/projects/dashboard/project-status-section';
import { ArchivedProjectsSection } from '@/components/projects/dashboard/archived-projects-section';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/auth-client';
import { JUST_SIGNED_UP_KEY, PROJECT_STATUS_GROUPS } from '@/lib/constants';

export const Route = createFileRoute('/_admin/')({
  component: DashboardHome,
});

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
    const groups = PROJECT_STATUS_GROUPS.map((group) => ({
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

          <RecentProjectsSection projects={dashboard.recent} />

          {dashboard.groups.map((group) => (
            <ProjectStatusSection
              key={group.status}
              group={group}
              onToggleArchive={handleToggleArchive}
              onDelete={setDeletingProject}
            />
          ))}

          {dashboard.archived.length > 0 && (
            <ArchivedProjectsSection
              projects={dashboard.archived}
              onToggleArchive={handleToggleArchive}
              onDelete={setDeletingProject}
            />
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
