import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.use(logger());

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ratify-api',
  });
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
