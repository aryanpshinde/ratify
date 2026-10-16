import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/projects/$projectId')({
  component: ProjectDetailLayout,
});

function ProjectDetailLayout() {
  return <Outlet />;
}
