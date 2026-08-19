import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { auth } from './lib/auth.js';

const app = new Hono();

app.use(logger());

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/*', (c) => auth.handler(c.req.raw));

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
        message: error instanceof Error ? error.message : 'Unknown error',
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

  const isProd = process.env.NODE_ENV === 'production';

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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  },
);
