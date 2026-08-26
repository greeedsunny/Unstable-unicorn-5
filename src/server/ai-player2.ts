import { CARD_MAP, isUnicorn } from '../shared/cards';
import type { Resolution } from '../shared/types';
import { Engine } from './engine';

export class AIPlayer {
  private ws: WebSocket | null = null;
  private seatId: string = '';
  private name: string;
  private roomUrl: string;
  private token: string;
  private connected = false;
  private gameState: any = null;
  private errs: string[] = [];

  constructor(name: string, roomUrl: string, token: string) {
    this.name = name;
    this.roomUrl = roomUrl;
    this.token = token;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.roomUrl);
      this.ws = ws;

      ws.addEventListener('open', () => {
        this.send({ t: 'join', name: this.name });
      });

      ws.addEventListener('message', (ev: MessageEvent) => {
        const msg = JSON.parse(ev.data);
        if (msg.t === 'joined') this.seatId = msg.seat;
        if (msg.t === 'error') this.errs.push(msg.msg);
        if (msg.t === 'sync') {
          this.gameState = msg.view;
          if (this.onSync) this.onSync();
        }
      });

      ws.addEventListener('close', () => {
        this.connected = false;
      });

      ws.addEventListener('error', () => {});

      setTimeout(() => {
        if (!this.connected) reject(new Error('Connection timeout'));
        else resolve();
      }, 10000);
    });
  }

  send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onSync(): void {
    if (!this.gameState) return;
    const st = this.gameState.state;

    if (st.phase === 'playing' && st.turn === this.getMyIndex()) {
      this.makeDecision();
    }
  }

  getMyIndex(): number {
    if (!this.gameState) return -1;
    return this.gameState.state.players.findIndex((p: any) => p.id === this.seatId);
  }

  private async makeDecision(): Promise<void> {
    const st = this.gameState.state;
    const me = st.players.find((p: any) => p.id === this.seatId);
    if (!me) return;

    if (st.prompt) {
      await this.handlePrompt(st.prompt);
      return;
    }

    if (st.neighWindow && st.neighWindow.canRespond) {
      await this.handleNeighWindow();
      return;
    }

    if (st.turnPhase === 'action' && st.playsLeft > 0) {
      await this.playCard();
    } else if (st.turnPhase === 'action' && st.playsLeft <= 0) {
      this.send({ t: 'action', a: 'draw_instead' });
    }
  }

  private async handlePrompt(prompt: any): Promise<void> {
    const me = this.gameState.state.players.find((p: any) => p.id === this.seatId);
    if (!me) return;

    switch (prompt.kind) {
      case 'choice': {
        const validOption = prompt.options.find((o: any) => this.isValidChoice(prompt, o.value));
        if (validOption) {
          this.send({ t: 'action', a: 'answer', promptId: prompt.id, values: [validOption.value] });
        }
        break;
      case 'multi': {
        const validOpts = prompt.options.filter((o: any) => this.isValidChoice(prompt, o.value));
        const toPick = Math.min(prompt.max ?? prompt.options.length, Math.max(1, prompt.min ?? 1));
        const selected = validOpts.slice(0, toPick).map((o: any) => o.value);
        if (selected.length > 0) {
          this.send({ t: 'action', a: 'answer', promptId: prompt.id, values: selected });
        }
        break;
    }
  }

  private isValidChoice(prompt: any, value: any): boolean {
    return true;
  }

  private async handleNeighWindow(): Promise<void> {
    const me = this.gameState.state.players.find((p: any) => p.id === this.seatId);
    const w = this.gameState.state.neighWindow;
    if (!w || !w.canRespond) return;

    const instants = (me?.hand ?? []).filter((u: string) => {
      const d = CARD_MAP.get(u.split('#')[0]!);
      return d?.type === 'instant' || d?.id === 'chronocorn';
    });

    if (instants.length > 0) {
      this.send({ t: 'action', a: 'neigh', uid: instants[0] });
    } else {
      this.send({ t: 'action', a: 'neigh' });
    }
  }

  private async playCard(): Promise<void> {
    const me = this.gameState.state.players.find((p: any) => p.id === this.seatId);
    if (!me) return;

    const playable = (this.gameState.state.players.find((p: any) => p.id === this.seatId)?.hand ?? [])
      .filter((uid: string) => {
        const d = CARD_MAP.get(uid.split('#')[0]!);
        if (!d) return false;
        const types = ['basic', 'magic_unicorn', 'magic', 'upgrade', 'downgrade'];
        return types.includes(d.type);
      });

    if (playable.length === 0) {
      this.send({ t: 'action', a: 'draw_instead' });
      return;
    }

    const priority = (uid: string) => {
      const d = CARD_MAP.get(uid.split('#')[0]!);
      if (!d) return 999;
      const order: Record<string, number> = {
        'magic_unicorn': 1,
        'basic': 2,
        'upgrade': 3,
        'downgrade': 4,
        'magic': 5,
      };
      return order[d.type] ?? 999;
    };

    const sorted = playable.sort((a, b) => priority(a) - priority(b));
    const chosen = sorted[0];

    const d = CARD_MAP.get(chosen.split('#')[0]!);
    if (d.type === 'upgrade' || d.type === 'downgrade') {
      const target = d.type === 'upgrade' ? 'self' : 'opponent';
      this.send({ t: 'action', a: 'play_card', uid: chosen, targetPlayerId: target });
    } else {
      this.send({ t: 'action', a: 'play_card', uid: chosen });
    }
  }

  send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  myPrompt(P: any): any {
    const pr = P.lastView?.state.prompt;
    return pr && P.seat && pr.playerId === P.seat ? pr : null;
  }

  handUid(P: any, defId: string): string | null {
    return (P.lastView?.state.players.find((p: any) => p.id === P.seat)?.hand ?? []).find((u: string) => u.startsWith(defId + '#')) ?? null;
  }

  parseStableChoice(v: unknown): { pid: string; uid: string } | null {
    try {
      const o = JSON.parse(String(v)) as { pid?: unknown; uid?: unknown };
      if (o && typeof o.pid === 'string' && typeof o.uid === 'string') return { pid: o.pid, uid: o.uid };
    } catch {}
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export { AIPlayer };
