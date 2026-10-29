import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './lib/env.js';
import { pool } from './db/index.js';

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`API running on http://localhost:${info.port}`);
  },
);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    process.exit(0);
  }
  shuttingDown = true;

  console.log(`[server] ${signal} received, shutting down`);

  server.close((err) => {
    if (err) {
      console.error('[server] error while closing server', err);
    }
    pool
      .end()
      .then(() => {
        console.log('[server] pool closed');
      })
      .catch((closeErr: unknown) => {
        console.error('[server] failed to close connection pool', closeErr);
      })
      .finally(() => {
        process.exit(0);
      });
  });

  setTimeout(() => {
    console.error('[server] graceful shutdown timed out, forcing exit');
    process.exit(0);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
