import { Engine } from './engine';
import type { ServerView, ClientMsg, CardDef } from '../shared/types';
import { CARD_MAP } from '../shared/cards';
import { isUnicorn } from '../shared/cards';

export class AIPlayer {
  private ws: WebSocket | null = null;
  private seatId: string = '';
  private name: string;
  private roomUrl: string;
  private token: string;
  private connected = false;
  private gameState: any = null;

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
      };

      ws.addEventListener('message', (ev: MessageEvent) => {
        const msg = JSON.parse(ev.data);
        if (msg.t === 'joined') {
          this.seatId = msg.seat;
          this.connected = true;
        }
        if (msg.t === 'sync') {
          this.gameState = msg.view;
          this.onSync();
        }
        if (msg.t === 'error') {
          console.error(`[${this.name}] Error: ${msg.msg}`);
        }
      };
      ws.addEventListener('close', () => {
        this.connected = false;
      };
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
    return this.gameState.state.players.findIndex(p => p.id === this.seatId);
  }

  private async makeDecision(): Promise<void> {
    const st = this.gameState.state;
    const me = st.players.find(p => p.id === this.seatId);
    if (!me) return;

    // Check for pending prompts first
    if (st.prompt) {
      await this.handlePrompt(st.prompt);
      return;
    }

    // Check for neigh window
    if (st.neighWindow && st.neighWindow.canRespond) {
      await this.handleNeighWindow();
      return;
    }

    // Action phase
    if (st.turnPhase === 'action' && st.playsLeft > 0) {
      await this.playCard();
    } else if (st.turnPhase === 'action' && st.playsLeft <= 0) {
      this.send({ t: 'action', a: 'draw_instead' });
    }
  }

  private async handlePrompt(prompt: any): Promise<void> {
    const me = this.gameState.state.players.find(p => p.id === this.seatId);
    if (!me) return;

    switch (pr.kind) {
      case 'choice':
        // Simple AI: pick first valid option
        const validOption = pr.options.find(o => this.isValidChoice(pr, o.value));
        if (validOption) {
          this.send({ t: 'action', a: 'answer', promptId: pr.id, values: [validOption.value] });
        }
        break;
      case 'multi':
        // Pick up to max options
        const validOpts = pr.options.filter(o => this.isValidChoice(pr, o.value));
        const toPick = Math.min(pr.max ?? pr.options.length, Math.max(1, pr.min ?? 1));
        const selected = validOpts.slice(0, toPick).map(o => o.value);
        if (selected.length > 0) {
          this.send({ t: 'action', a: 'answer', promptId: pr.id, values: selected });
        }
        break;
    }
  }

  private isValidChoice(prompt: any, value: any): boolean {
    // Basic validation
    return true;
  }

  private async handleNeighWindow(): Promise<void> {
    const me = this.gameState.state.players.find(p => p.id === this.seatId);
    const w = this.gameState.state.neighWindow;
    if (!w || !w.canRespond) return;

    // Check if we have any instants/Neigh cards
    const instants = (me?.hand ?? []).filter(u => {
      const d = CARD_MAP.get(u.split('#')[0]!);
      return d?.type === 'instant' || d?.id === 'chronocorn';
    });

    if (instants.length > 0) {
      // Use first available instant/Neigh
      this.send({ t: 'action', a: 'neigh', uid: instants[0] });
    } else {
      // Pass
      this.send({ t: 'action', a: 'neigh' });
    }
  }

  private async playCard(): Promise<void> {
    const me = this.gameState.state.players.find(p => p.id === this.seatId);
    if (!me) return;

    // Find playable cards
    const playable = (this.gameState.state.players.find(p => p.id === this.seatId)?.hand ?? [])
      .filter(uid => {
        const d = CARD_MAP.get(uid.split('#')[0]!);
        if (!d) return false;
        const types = ['basic', 'magic_unicorn', 'magic', 'upgrade', 'downgrade'];
        return types.includes(d.type);
      });

    if (playable.length === 0) {
      // Draw instead
      this.send({ t: 'action', a: 'draw_instead' });
      return;
    }

    // Simple AI: prefer playing unicorns, then upgrades, then magic
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
    
    // For upgrades/downgrades, need target selection
    const d = CARD_MAP.get(chosen.split('#')[0]!);
    if (d.type === 'upgrade' || d.type === 'downgrade') {
      // Target self for upgrades, random opponent for downgrades
      const target = d.type === 'upgrade' ? 'self' : 'opponent';
      this.send({ t: 'action', a: 'play_card', uid: chosen, targetPlayerId: target });
    } else {
      this.send({ t: 'action', a: 'play_card', uid: chosen });
    }
  }

  private async handleNeighWindow(): Promise<void> {
    // Already handled in makeDecision
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));