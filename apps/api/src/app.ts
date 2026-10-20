import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { auth } from './lib/auth.js';
import { isProd } from './lib/env.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import invitationRoutes from './routes/invitations.js';
import invitationTokenRoutes from './routes/invitation-tokens.js';
import projectDeliverableRoutes from './routes/project-deliverables.js';
import deliverableRoutes from './routes/deliverables.js';
import versionRoutes from './routes/versions.js';
import portalRoutes from './routes/portal.js';

export const app = new Hono();

app.use(logger());

app.use(
  secureHeaders({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    xFrameOptions: 'DENY',
    referrerPolicy: 'same-origin',
    contentSecurityPolicy: {
      frameAncestors: ["'none'"],
    },
  }),
);

app.all('/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/clients', clientRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/projects', invitationRoutes);
app.route('/api/projects', projectDeliverableRoutes);
app.route('/api/invitations', invitationTokenRoutes);
app.route('/api/deliverables', deliverableRoutes);
app.route('/api/versions', versionRoutes);
app.route('/api/portal', portalRoutes);

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ratify-api',
  });
});

app.get('/api/db-health', async (c) => {
  try {
    const result = await db.execute(sql`SELECT 1 AS connected`);
    return c.json({
      status: 'ok',
      database: 'connected',
      result: result.rows,
    });
  } catch (error) {
    return c.json(
      {
        status: 'error',
        database: 'disconnected',
        message: isProd
          ? 'Database disconnected'
          : error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      503,
    );
  }
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(`[Server Error] ${err.message}`);

  return c.json(
    {
      status: 'error',
      message: isProd ? 'Internal server error' : err.message,
    },
    500,
  );
});

app.notFound((c) => {
  return c.json({ status: 'error', message: 'Route Not Found' }, 404);
});
