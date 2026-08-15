import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ratify-api',
  });
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
