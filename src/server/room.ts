import { Engine, createState } from './engine';
import type { ClientMsg, GameState, ServerMsg, ServerView } from '../shared/types';
import { AIPlayer } from './ai-player';

interface Conn {
  ws: WebSocket;
  wsId: string;
  seat: string | null;
  isAI: boolean;
  aiPlayer?: any;
}

export class Room {
  private engine: Engine | null = null;
  private loaded = false;
  private conns = new Map<string, any>();
  private aiPlayers: any[] = [];
  private nextAIId = 1;

  constructor(private state: DurableObjectState) {}

  private async ensureLoaded(): Promise<any> {
    if (!this.loaded) {
      this.loaded = true;
      const raw = await this.state.storage.get<string>('game');
      if (raw) {
        try {
          const s = JSON.parse(raw) as any;
          for (const p of s.players) {
            p.connected = false;
            p.wsId = null;
          }
          s.lasso ??= {};
          s.riders ??= {};
          const { Engine } = await import('./engine');
          this.engine = new Engine(s);
        } catch {}
      }
      if (!this.engine) this.engine = new (await import('./engine')).Engine(createState());
    }
    if (!this.engine) this.engine = new (await import('./engine')).Engine(createState());
    return this.engine;
  }

  private async persist(): Promise<void> {
    if (!this.engine) return;
    await this.state.storage.put('game', JSON.stringify(this.engine.s));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const eng = await this.ensureLoaded();

    if (url.pathname.endsWith('/ws') && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair() as unknown as [WebSocket, WebSocket];
      const wsId = crypto.randomUUID();
      const server = pair[1];
      (server as unknown as { accept(): void }).accept();
      const conn: any = { ws: server, wsId, seat: null, isAI: false };
      this.conns.set(wsId, conn);
      (server as unknown as { accept(): void }).accept();
      server.addEventListener('message', (ev: MessageEvent) => {
        void this.onMessage(conn, String(ev.data)).catch((err) => {
          this.sendTo(conn, { t: 'error', msg: `伺服器錯誤：${String(err)}` });
        });
      });
      server.addEventListener('close', () => {
        void this.onClose(conn);
      });
      server.addEventListener('error', () => {
        void this.onClose(conn);
      });
      this.sendTo(conn, { t: 'welcome' });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (url.pathname === '/api/add-ai') {
      return this.addAI(request);
    }

    if (url.pathname === '/api/remove-ai') {
      return this.removeAI(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  private async addAI(request: Request): Promise<Response> {
    const eng = await this.ensureLoaded();
    const url = new URL(request.url);
    const aiName = url.searchParams.get('name') || `AI-${this.nextAIId++}`;
    const difficulty = url.searchParams.get('difficulty') || 'normal';

    const roomId = new URL(request.url).pathname.split('/').pop() || '';
    const roomUrl = `ws://${new URL(request.url).host}/api/room/${roomId}/ws`;
    
    const ai = new AIPlayer(`AI-${aiName}`, `ws://${new URL(request.url).host}/api/room/${roomId}/ws`, 'uu-smoke');
    this.aiPlayers.push(ai);
    
    await ai.connect();
    await new Promise(r => setTimeout(r, 1000));

    return new Response(JSON.stringify({ success: true, aiName: `AI-${aiName}` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async removeAI(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const aiName = url.searchParams.get('name');
    const ai = this.aiPlayers.find((a: any) => a.name === aiName);
    if (ai) {
      ai.send({ t: 'leave' });
      ai.ws?.close();
      this.aiPlayers = this.aiPlayers.filter((a: any) => a.name !== aiName);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private sendTo(conn: any, msg: any): void {
    try {
      conn.ws.send(JSON.stringify(msg));
    } catch {}
  }

  private broadcast(): void {
    const eng = this.engine;
    if (!eng) return;
    for (const conn of this.conns.values()) {
      if (!conn.seat) continue;
      this.sendTo(conn, { t: 'sync', view: eng.view(conn.seat) });
    }
    void this.persist();
  }

  private seatOf(wsId: string): string | null {
    return this.conns.get(wsId)?.seat ?? null;
  }

  private async onMessage(conn: any, raw: string): Promise<void> {
    const eng = await this.ensureLoaded();
    let msg: any;
    try {
      msg = JSON.parse(raw) as any;
    } catch {
      this.sendTo(conn, { t: 'error', msg: '無法解析訊息' });
      return;
    }

    switch (msg.t) {
      case 'join': {
        const name = String(msg.name ?? '').trim().slice(0, 16) || '無名獨角獸';
        let seat = msg.seat && eng.player(msg.seat) ? msg.seat : null;
        if (!seat) {
          if (eng.s.players.length >= 8) {
            this.sendTo(conn, { t: 'error', msg: '房間已滿（最多 8 人）' });
            return;
          }
          seat = `seat-${crypto.randomUUID().slice(0, 8)}`;
          const err = eng.addLobbyPlayer(seat, name);
          if (err) {
            this.sendTo(conn, { t: 'error', msg: err });
            return;
          }
        } else {
          for (const c of this.conns.values()) {
            if (c !== conn && c.seat === seat) {
              c.seat = null;
              try { c.ws.close(4000, 'replaced'); } catch {}
            }
          }
          eng.reconnectSeat(seat, conn.wsId);
          eng.log(`${eng.nameOf(seat)} 重新連線`);
        }
        conn.seat = seat;
        eng.reconnectSeat(seat, conn.wsId);
        this.sendTo(conn, { t: 'joined', seat });
        this.broadcast();
        return;
      }

      case 'start': {
        const seat = conn.seat;
        if (!seat) return;
        const p = eng.player(seat);
        if (!p?.isHost) {
          this.sendTo(conn, { t: 'error', msg: '只有房主可以開始遊戲' });
          return;
        }
        const err = eng.startGame();
        if (err) this.sendTo(conn, { t: 'error', msg: err });
        this.broadcast();
        return;
      }

      case 'action': {
        const seat = conn.seat;
        if (!seat) return;
        const err = eng.handleAction(seat, msg as any);
        if (err) this.sendTo(conn, { t: 'error', msg: err });
        this.broadcast();
        return;
      }

      case 'chat': {
        const seat = conn.seat;
        if (!seat) return;
        const text = String(msg.text ?? '').slice(0, 200);
        if (!text.trim()) return;
        for (const c of this.conns.values()) {
          this.sendTo(c, { t: 'chat', from: eng.nameOf(seat), text });
        }
        return;
      }

      case 'leave': {
        conn.ws.close(1000, 'bye');
        return;
      }

      default:
        return;
    }
  }

  private async onClose(conn: any): Promise<void> {
    this.conns.delete(conn.wsId);
    const eng = await this.ensureLoaded();
    if (conn.seat) eng.dropConnection(conn.wsId);
    this.broadcast();
    if (this.conns.size === 0) {
      await this.state.storage.setAlarm(Date.now() + 10 * 60 * 1000);
    }
  }

  async alarm(): Promise<void> {
    if (this.conns.size > 0) return;
    await this.state.storage.deleteAlarm();
    await this.state.storage.deleteAll();
    this.loaded = false;
    this.engine = null;
  }
}
