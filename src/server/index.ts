import { Room } from './room';

export { Room };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/room/')) {
      const rest = url.pathname.slice('/api/room/'.length);
      const roomId = decodeURIComponent(rest.split('/')[0] ?? '');
      if (!/^[A-Za-z0-9-]{3,32}$/.test(roomId)) {
        return new Response('Bad room id', { status: 400 });
      }
      const stub = env.ROOM.get(env.ROOM.idFromName(roomId));
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: true, name: 'unstable-unicorns-online' }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
