import { Engine, createState } from './engine';
import type { ClientMsg, GameState, ServerMsg } from '../shared/types';

interface Conn {
  ws: WebSocket;
  wsId: string;
  seat: string | null;
}

export class Room {
  private engine: Engine | null = null;
  private loaded = false;
  private conns = new Map<string, Conn>();

  constructor(private state: DurableObjectState) {}

  private async ensureLoaded(): Promise<Engine> {
    if (!this.loaded) {
      this.loaded = true;
      const raw = await this.state.storage.get<string>('game');
      if (raw) {
        try {
          const s = JSON.parse(raw) as GameState;
          for (const p of s.players) {
            p.connected = false;
            p.wsId = null;
          }
          this.engine = new Engine(s);
        } catch {}
      }
      if (!this.engine) this.engine = new Engine(createState());
    }
    if (!this.engine) this.engine = new Engine(createState());
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
      const conn: Conn = { ws: server, wsId, seat: null };
      this.conns.set(wsId, conn);
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

    return new Response('Not Found', { status: 404 });
  }

  private sendTo(conn: Conn, msg: ServerMsg): void {
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

  private async onMessage(conn: Conn, raw: string): Promise<void> {
    const eng = await this.ensureLoaded();
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw) as ClientMsg;
    } catch {
      this.sendTo(conn, { t: 'error', msg: '無法解析訊息' });
      return;
    }

    switch (msg.t) {
      case 'join': {
        const name = String(msg.name ?? '').trim().slice(0, 16) || '無名獨角獸';
        let seat = msg.seat && eng.player(msg.seat) ? msg.seat : null;
        if (!seat) {
          seat = `seat-${crypto.randomUUID().slice(0, 8)}`;
          const err = eng.addLobbyPlayer(seat, name);
          if (err) {
            this.sendTo(conn, { t: 'error', msg: err });
            return;
          }
        } else {
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
        const err = eng.handleAction(seat, msg as unknown as { a: string; uid?: string; promptId?: string; values?: unknown[] });
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

  private async onClose(conn: Conn): Promise<void> {
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
