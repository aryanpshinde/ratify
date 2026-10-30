interface Env {
  RENDER_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    return fetch(new Request(`${env.RENDER_URL}${url.pathname}${url.search}`, request));
  },
};
