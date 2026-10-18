import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/portal/projects/$projectId')({
  component: PortalProjectLayout,
});

function PortalProjectLayout() {
  return <Outlet />;
}
