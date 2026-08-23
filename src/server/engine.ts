import { CARD_MAP, isUnicorn } from '../shared/cards';
import type {
  CardDef,
  ChoiceOption,
  GameState,
  PlayerState,
  PublicPlayer,
  Resolution,
  ServerView,
} from '../shared/types';
import { HANDLERS } from './effects';
import { ENTRY_REQ_BASIC } from './effects2';

export function createState(): GameState {
  return {
    phase: 'lobby',
    players: [],
    turn: 0,
    turnPhase: 'turn_start',
    playsLeft: 0,
    extraTurns: 0,
    turnEnded: false,
    deck: [],
    discard: [],
    nursery: [],
    queue: [],
    prompt: null,
    neighWindow: null,
    riders: {},
    lasso: {},
    log: [],
    winner: null,
    winTarget: 7,
    seed: (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0,
    uidSeq: 1,
  };
}

export class Engine {
  constructor(public s: GameState) {}

  // ── 基礎工具 ──────────────────────────────────────────────

  consumeRand(): () => number {
    let a = this.s.seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      this.s.seed = a >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  defOf(uid: string): CardDef | undefined {
    return CARD_MAP.get(uid.split('#')[0]!);
  }

  player(id: string): PlayerState | undefined {
    return this.s.players.find((p) => p.id === id);
  }

  cur(): PlayerState {
    return this.s.players[this.s.turn]!;
  }

  log(msg: string, cls?: string): void {
    this.s.log.push({ t: Date.now(), msg, cls });
    if (this.s.log.length > 200) this.s.log.splice(0, this.s.log.length - 200);
  }

  nameOf(pid: string): string {
    return this.player(pid)?.name ?? '???';
  }

  // ── 解析佇列 ──────────────────────────────────────────────

  makeRes(key: string, playerId: string, data: Record<string, unknown> = {}): Resolution {
    return { key, playerId, rid: `r${this.s.uidSeq++}`, data };
  }

  pushFront(...res: Resolution[]): void {
    this.s.queue.unshift(...res);
  }

  pushBack(...res: Resolution[]): void {
    this.s.queue.push(...res);
  }

  advance(): void {
    for (let guard = 0; guard < 100000; guard++) {
      if (this.s.phase === 'ended') return;
      if (this.s.prompt) return;
      if (this.s.neighWindow) return;
      const res = this.s.queue[0];
      if (!res) return;
      const h = HANDLERS[res.key];
      if (!h) {
        this.log(`未知解析步驟：${res.key}`, 'sys');
        this.s.queue.shift();
        continue;
      }
      h(this, res);
    }
  }

  done(res: Resolution): void {
    if (this.s.queue[0] === res) this.s.queue.shift();
  }

  ask(
    res: Resolution,
    field: string,
    spec: { playerId: string; title: string; kind?: 'choice' | 'multi'; min?: number; max?: number; options: ChoiceOption[] },
  ): void {
    res.data.__field = field;
    this.s.prompt = {
      id: `pr${this.s.uidSeq++}`,
      resId: res.rid,
      playerId: spec.playerId,
      title: spec.title,
      kind: spec.kind ?? 'choice',
      min: spec.min,
      max: spec.max,
      options: spec.options,
    };
  }

  submitAnswer(playerId: string, values: unknown[]): string | null {
    const pr = this.s.prompt;
    if (!pr) return '目前沒有等待中的選擇';
    if (pr.playerId !== playerId) return '現在不是你的回合';
    const min = pr.kind === 'multi' ? pr.min ?? pr.max ?? 1 : 1;
    const max = pr.kind === 'multi' ? pr.max ?? min : 1;
    if (values.length < min || values.length > max) return '選項數量不符';
    for (const v of values) {
      if (!pr.options.some((o) => o.value === v)) return '無效的選項';
    }
    const res = this.s.queue.find((r) => r.rid === pr.resId);
    if (!res) {
      this.log('提示已失效，自動略過', 'sys');
      this.s.prompt = null;
      this.advance();
      return null;
    }
    const field = String(res.data.__field ?? '');
    if (!field) return '解析步驟缺少欄位';
    res.data[field] = pr.kind === 'multi' ? values : values[0];
    delete res.data.__field;
    this.s.prompt = null;
    this.advance();
    return null;
  }

  // ── 牌庫操作 ──────────────────────────────────────────────

  buildDecks(rand: () => number): void {
    const main: string[] = [];
    const nursery: string[] = [];
    for (const def of CARD_MAP.values()) {
      const uids: string[] = [];
      for (let i = 0; i < def.copies; i++) uids.push(`${def.id}#${this.s.uidSeq++}`);
      if (def.type === 'baby') nursery.push(...uids);
      else main.push(...uids);
    }
    this.s.deck = shuffleArr(main, rand);
    this.s.nursery = shuffleArr(nursery, rand);
  }

  drawTo(pid: string, n: number): void {
    for (let i = 0; i < n; i++) {
      if (this.s.phase !== 'playing') return;
      if (this.s.deck.length === 0) {
        this.endByDeckEmpty();
        return;
      }
      this.player(pid)?.hand.push(this.s.deck.pop()!);
    }
  }

  discardUids(uids: string[]): void {
    for (const uid of uids) {
      const d = this.defOf(uid);
      if (d?.type === 'baby') {
        if (!this.s.nursery.includes(uid)) this.s.nursery.unshift(uid);
      } else {
        this.s.discard.push(uid);
      }
    }
  }

  topDiscard(): string | null {
    return this.s.discard.length ? this.s.discard[this.s.discard.length - 1]! : null;
  }

  reshuffleDiscard(): void {
    const cards = this.s.discard.splice(0);
    shuffleArr(cards, this.consumeRand());
    this.s.deck.unshift(...cards);
    this.log(`棄牌堆 ${cards.length} 張洗回牌庫`, 'sys');
  }

  searchDeck(pred: (d: CardDef) => boolean): string | null {
    const idx = this.s.deck.findIndex((u) => pred(this.defOf(u)!));
    if (idx < 0) return null;
    const uid = this.s.deck.splice(idx, 1)[0]!;
    shuffleArr(this.s.deck, this.consumeRand());
    return uid;
  }

  // ── 馬廄／狀態查詢 ────────────────────────────────────────

  stableHas(pid: string, defId: string): boolean {
    return !!this.player(pid)?.stable.some((c) => c.defId === defId);
  }

  unicornCount(pid: string): number {
    const p = this.player(pid);
    if (!p) return 0;
    let n = 0;
    for (const c of p.stable) {
      const d = this.defOf(c.uid);
      if (d && isUnicorn(d.type)) n += d.id === 'ginormous-unicorn' ? 2 : 1;
    }
    return n;
  }

  realUnicornCount(pid: string): number {
    return this.player(pid)?.stable.filter((c) => isUnicorn(this.defOf(c.uid)!.type)).length ?? 0;
  }

  blindingLighted(pid: string): boolean {
    return this.stableHas(pid, 'blinding-light');
  }

  canPlayInstant(pid: string): boolean {
    return !this.stableHas(pid, 'slowdown') && !this.stableHas(pid, 'ginormous-unicorn');
  }

  canPlayType(pid: string, t: CardDef['type']): boolean {
    if (t === 'instant') return this.canPlayInstant(pid);
    if (t === 'upgrade' && this.stableHas(pid, 'broken-stable')) return false;
    return true;
  }

  hasBasicUnicorn(pid: string): boolean {
    return !!this.player(pid)?.stable.some((c) => {
      const id = c.defId;
      return id.startsWith('basic-') || id === 'narwhal-basic';
    });
  }

  entryReqOk(pid: string, defId: string): boolean {
    if (!ENTRY_REQ_BASIC.has(defId)) return true;
    return this.hasBasicUnicorn(pid);
  }

  handPublic(pid: string): boolean {
    return this.stableHas(pid, 'nanny-cam');
  }

  queenBeeBlocksBasicEnter(targetPid: string): boolean {
    if (this.stableHas(targetPid, 'queen-bee-unicorn')) return false;
    return this.s.players.some((p) => p.id !== targetPid && this.stableHas(p.id, 'queen-bee-unicorn'));
  }

  // ── Neigh 視窗（堆疊語義）────────────────────────────────

  respondersFor(exceptPid: string): string[] {
    return this.s.players
      .filter(
        (p) =>
          p.id !== exceptPid &&
          p.connected &&
          p.hand.some((u) => this.defOf(u)?.type === 'instant') &&
          this.canPlayInstant(p.id),
      )
      .map((p) => p.id);
  }

  initiatePlay(byId: string, uid: string): string | null {
    const p = this.player(byId);
    const d = this.defOf(uid);
    if (!p || !d || !p.hand.includes(uid)) return '你沒有這張卡';
    if (d.type === 'baby' || d.type === 'instant') return '這張卡不能在此時打出';
    if (d.type === 'basic' && this.queenBeeBlocksBasicEnter(byId)) return '蜂后獨角獸封鎖基本獨角獸進場';

    p.hand = p.hand.filter((c) => c !== uid);
    this.log(`${p.name} 打出了「${d.nameZh}」`, 'play');

    const canNeigh =
      !this.stableHas(byId, 'yay') &&
      this.respondersFor(byId).length > 0;

    if (canNeigh) {
      this.s.neighWindow = { chain: [{ uid, byId }], awaiting: this.respondersFor(byId) };
      this.log('—— 是否要 Neigh？——', 'neigh');
    } else {
      this.applyPlayedCard(byId, uid);
    }
    return null;
  }

  neighResponse(playerId: string, uid?: string): string | null {
    const w = this.s.neighWindow;
    if (!w) return '目前沒有可回應的卡';
    if (!w.awaiting.includes(playerId)) return '你已表態或無需回應';
    if (uid === undefined || uid === '__pass') {
      w.awaiting = w.awaiting.filter((x) => x !== playerId);
      if (w.awaiting.length === 0) this.resolveWindow();
      else this.advance();
      return null;
    }
    const p = this.player(playerId)!;
    const d = this.defOf(uid);
    if (!d || d.type !== 'instant' || !p.hand.includes(uid)) return '你沒有這張瞬間卡';
    if (!this.canPlayInstant(playerId)) return '你不能打出瞬間卡';
    p.hand = p.hand.filter((c) => c !== uid);
    w.chain.push({ uid, byId: playerId });
    this.log(`${p.name} 打出「${d.nameZh}」！`, 'neigh');
    if (d.id === 'super-neigh') {
      this.resolveWindow();
    } else {
      w.awaiting = this.respondersFor(playerId);
      if (w.awaiting.length === 0) this.resolveWindow();
    }
    this.advance();
    return null;
  }

  resolveWindow(): void {
    const w = this.s.neighWindow;
    if (!w) return;
    this.s.neighWindow = null;
    const chain = w.chain.slice();
    const dead = new Set<string>();
    let i = chain.length - 1;
    while (i >= 0) {
      const c = chain[i]!;
      if (dead.has(c.uid)) {
        i--;
        continue;
      }
      const d = this.defOf(c.uid)!;
      if (d.type === 'instant' && i > 0) {
        dead.add(c.uid);
        dead.add(chain[i - 1]!.uid);
        this.log(`「${this.defOf(chain[i - 1]!.uid)?.nameZh}」被取消了！`, 'neigh');
        i -= 2;
        continue;
      }
      break;
    }
    this.discardUids([...dead]);
    const survivor = chain.find((c) => !dead.has(c.uid));
    if (survivor) {
      this.applyPlayedCard(survivor.byId, survivor.uid);
    }
    this.advance();
  }

  // ── 卡牌進場／離場 ────────────────────────────────────────

  applyPlayedCard(byId: string, uid: string): void {
    const d = this.defOf(uid)!;
    switch (d.type) {
      case 'basic':
        this.enterStable(byId, uid);
        break;
      case 'magic_unicorn': {
        this.enterStable(byId, uid);
        this.tryEntryEffect(byId, uid);
        break;
      }
      case 'upgrade':
      case 'downgrade':
        this.pushFront(this.makeRes('place_attach', byId, { src: uid }));
        break;
      case 'magic':
        this.pushFront(this.makeRes(`magic_${d.id}`, byId, { src: uid }));
        break;
      default:
        this.discardUids([uid]);
    }
  }

  tryEntryEffect(pid: string, uid: string): void {
    if (this.blindingLighted(pid)) return;
    const d = this.defOf(uid)!;
    if (HANDLERS[`entry_${d.id}`]) {
      this.pushFront(this.makeRes(`entry_${d.id}`, pid, { src: uid }));
    }
  }

  enterStable(pid: string, uid: string): void {
    const p = this.player(pid);
    const d = this.defOf(uid);
    if (!p || !d) return;
    p.stable.push({ uid, defId: d.id });
    this.log(`${d.nameZh} 進入了 ${p.name} 的馬廄`, 'enter');
    this.afterStableChange(pid);
    this.checkWin();
  }

  attachTo(pid: string, uid: string): void {
    const p = this.player(pid);
    const d = this.defOf(uid);
    if (!p || !d) return;
    p.stable.push({ uid, defId: d.id });
    this.log(`「${d.nameZh}」（${d.type === 'upgrade' ? '升級' : '降級'}）掛到 ${p.name} 的馬廄`, 'enter');
  }

  moveAttachTo(toPid: string, uid: string): boolean {
    const entry = this.locateStableCard(uid);
    if (!entry) return false;
    entry.ref.stable = entry.ref.stable.filter((c) => c.uid !== uid);
    this.attachTo(toPid, uid);
    return true;
  }

  removeFromStable(uid: string): { owner: PlayerState; uid: string; defId: string } | null {
    for (const p of this.s.players) {
      const idx = p.stable.findIndex((c) => c.uid === uid);
      if (idx >= 0) {
        p.stable.splice(idx, 1);
        this.afterStableChange(p.id);
        if (this.stableHas(p.id, 'barbed-wire')) {
          this.pushFront(this.makeRes('barbed_discard', p.id, {}));
        }
        return { owner: p, uid, defId: uid.split('#')[0]! };
      }
    }
    return null;
  }

  locateStableCard(uid: string): { pid: string; ref: PlayerState } | null {
    for (const p of this.s.players) {
      if (p.stable.some((c) => c.uid === uid)) return { pid: p.id, ref: p };
    }
    return null;
  }

  afterStableChange(pid: string): void {
    if (this.stableHas(pid, 'tiny-stable') && this.realUnicornCount(pid) > 5) {
      this.pushFront(this.makeRes('tiny_enforce', pid, {}));
    }
  }

  leaveStableDisposal(owner: PlayerState, uid: string, reason: 'sacrifice' | 'destroy'): void {
    const d = this.defOf(uid)!;
    const blinded = this.blindingLighted(owner.id);

    const rider = this.s.riders[uid];
    if (rider) {
      delete this.s.riders[uid];
      const orig = this.player(rider.pid);
      if (orig) {
        const stolenEntry = this.locateStableCard(rider.uid);
        if (stolenEntry?.pid === owner.id) {
          stolenEntry.ref.stable = stolenEntry.ref.stable.filter((c) => c.uid !== rider.uid);
          orig.stable.push({ uid: rider.uid, defId: rider.uid.split('#')[0]! });
          this.log(`${this.defOf(rider.uid)?.nameZh} 回到原主人的馬廄`, 'move');
        }
      }
    }

    if (d.type === 'baby') {
      this.s.nursery.unshift(uid);
      this.log(`${d.nameZh} 返回育嬰室`, 'sys');
      return;
    }

    if (!blinded && BOUNCE_ON_LEAVE.has(d.id)) {
      owner.hand.push(uid);
      this.log(`${d.nameZh} 彈回 ${owner.name} 的手牌`, 'sys');
      return;
    }

    if (!blinded && d.id === 'unicorn-phoenix' && owner.hand.length > 0) {
      owner.stable.push({ uid, defId: d.id });
      this.log(`不死鳳凰獨角獸重生，回到 ${owner.name} 的馬廄！`, 'enter');
      this.afterStableChange(owner.id);
      return;
    }

    this.s.discard.push(uid);

    if (!blinded && d.id === 'stabby-the-unicorn') {
      this.log(`刺刺獨角獸留下遺言……`, 'sys');
      this.pushFront(
        this.makeRes('destroy_unicorn_any', owner.id, {
          __optional: true,
          __title: `${owner.name}：要發動刺刺獨角獸的效果嗎？`,
        }),
      );
    }
    this.checkWin();
  }

  sacrificeCard(byId: string, uid: string): boolean {
    const loc = this.locateStableCard(uid);
    if (!loc || loc.pid !== byId) return false;
    const d = this.defOf(uid)!;
    if (d.id === 'puppicorn') {
      this.log(`小狗獨角獸搖搖尾巴，拒絕被犧牲！`, 'block');
      return false;
    }
    this.log(`${this.nameOf(byId)} 犧牲了 ${d.nameZh}`, 'leave');
    const removed = this.removeFromStable(uid);
    if (removed) this.leaveStableDisposal(removed.owner, uid, 'sacrifice');
    this.checkWin();
    return true;
  }

  forceRemoveToDiscard(uid: string, verb: string): boolean {
    const loc = this.locateStableCard(uid);
    if (!loc) return false;
    const removed = this.removeFromStable(uid);
    if (removed) this.leaveStableDisposal(removed.owner, uid, 'destroy');
    this.log(`${verb}：${this.defOf(uid)?.nameZh}`, 'leave');
    return true;
  }

  destroyUnicorn(res: Resolution | null, byId: string, uid: string): boolean {
    const loc = this.locateStableCard(uid);
    if (!loc) return false;
    const flag = `dk_${uid}`;
    if (res && flag in res.data) {
      this.destroyNow(loc.pid, uid, byId);
      return false;
    }
    const d = this.defOf(uid)!;
    if (d.id === 'puppicorn') {
      this.log(`小狗獨角獸躲開了攻擊！`, 'block');
      return false;
    }
    if (d.id === 'magical-kittencorn' && byId !== loc.pid) {
      this.log(`魔法小貓獨角獸不受影響！`, 'block');
      return false;
    }
    if (this.stableHas(loc.pid, 'rainbow-aura')) {
      this.log(`彩虹光環守護了 ${this.nameOf(loc.pid)} 的獨角獸！`, 'block');
      return false;
    }
    if (this.stableHas(loc.pid, 'pandamonium') && byId !== loc.pid) {
      this.log(`${this.nameOf(loc.pid)} 的馬廄裡是貓熊，效果無效！`, 'block');
      return false;
    }
    if (d.id !== 'black-knight-unicorn' && this.stableHas(loc.pid, 'black-knight-unicorn') && res) {
      res.data[flag] = 1;
      this.pushFront(this.makeRes('shield_black_knight', loc.pid, { byId, uid }));
      return true;
    }
    this.destroyNow(loc.pid, uid, byId);
    return false;
  }

  destroyNow(pid: string, uid: string, byId: string): void {
    const d = this.defOf(uid)!;
    this.log(`${this.nameOf(byId)} 消滅了 ${this.nameOf(pid)} 的 ${d.nameZh}`, 'leave');
    const removed = this.removeFromStable(uid);
    if (removed) this.leaveStableDisposal(removed.owner, uid, 'destroy');
    this.checkWin();
  }

  moveUnicorn(fromPid: string, uid: string, toPid: string, tag: string): boolean {
    const from = this.player(fromPid);
    if (!from) return false;
    const idx = from.stable.findIndex((c) => c.uid === uid);
    if (idx < 0) return false;
    const card = from.stable.splice(idx, 1)[0]!;
    this.player(toPid)?.stable.push(card);
    this.log(`${tag}：${this.defOf(uid)?.nameZh} → ${this.nameOf(toPid)} 的馬廄`, 'move');
    if (this.stableHas(fromPid, 'barbed-wire')) this.pushFront(this.makeRes('barbed_discard', fromPid, {}));
    this.afterStableChange(fromPid);
    this.afterStableChange(toPid);
    this.checkWin();
    return true;
  }

  stealUnicorn(fromPid: string, uid: string, toPid: string, tag = '偷走'): boolean {
    if (!this.moveUnicorn(fromPid, uid, toPid, tag)) return false;
    this.tryEntryEffect(toPid, uid);
    return true;
  }

  enterViaEffect(pid: string, uid: string, tag = ''): void {
    this.enterStable(pid, uid);
    if (tag) this.log(tag, 'sys');
    this.tryEntryEffect(pid, uid);
  }

  // ── 選項建構 ──────────────────────────────────────────────

  ynOptions(yesLabel = '發動', noLabel = '跳過'): ChoiceOption[] {
    return [
      { label: yesLabel, value: 'y' },
      { label: noLabel, value: 'n' },
    ];
  }

  isYes(v: unknown): boolean {
    return v === 'y' || v === true;
  }

  stableCardOptions(filter: (d: CardDef) => boolean, excludePids: string[] = []): ChoiceOption[] {
    const opts: ChoiceOption[] = [];
    for (const p of this.s.players) {
      if (excludePids.includes(p.id)) continue;
      for (const c of p.stable) {
        const d = this.defOf(c.uid)!;
        if (!filter(d)) continue;
        opts.push({ label: `${d.nameZh}（${p.name}）`, value: JSON.stringify({ pid: p.id, uid: c.uid }) });
      }
    }
    return opts;
  }

  unicornOptionsAny(excludePids: string[] = []): ChoiceOption[] {
    return this.stableCardOptions((d) => isUnicorn(d.type), excludePids);
  }

  parseStableChoice(v: unknown): { pid: string; uid: string } | null {
    try {
      const o = JSON.parse(String(v)) as { pid?: unknown; uid?: unknown };
      if (o && typeof o.pid === 'string' && typeof o.uid === 'string') return { pid: o.pid, uid: o.uid };
    } catch {}
    return null;
  }

  playerOptions(excludeIds: string[] = []): ChoiceOption[] {
    return this.s.players
      .filter((p) => !excludeIds.includes(p.id))
      .map((p) => ({ label: p.name, value: p.id }));
  }

  handOptions(pid: string, filter?: (d: CardDef) => boolean): ChoiceOption[] {
    return (this.player(pid)?.hand ?? [])
      .filter((u) => {
        const d = this.defOf(u)!;
        return filter ? filter(d) : true;
      })
      .map((u) => ({ label: this.defOf(u)!.nameZh, value: u }));
  }

  discardOptions(filter?: (d: CardDef) => boolean): ChoiceOption[] {
    return this.s.discard
      .filter((u) => {
        const d = this.defOf(u)!;
        return filter ? filter(d) : true;
      })
      .map((u) => ({ label: `${this.defOf(u)!.nameZh}`, value: u }));
  }

  finishMagicDiscard(res: Resolution): void {
    const src = String(res.data.src ?? '');
    if (src) this.discardUids([src]);
  }

  // ── 勝利與結束 ────────────────────────────────────────────

  checkWin(): void {
    if (this.s.phase !== 'playing') return;
    for (const p of this.s.players) {
      if (this.unicornCount(p.id) >= this.s.winTarget) {
        this.endGame(p.id, `🏆 ${p.name} 的馬廄達成 ${this.s.winTarget} 隻獨角獸，獲勝！`);
        return;
      }
    }
  }

  endGame(winnerId: string | null, reason: string): void {
    this.s.phase = 'ended';
    this.s.winner = winnerId;
    this.s.prompt = null;
    this.s.neighWindow = null;
    this.s.queue = [];
    this.log(reason, 'win');
  }

  endByDeckEmpty(): void {
    let best: PlayerState | undefined;
    let bestN = -1;
    let bestLetters = -1;
    for (const p of this.s.players) {
      const n = this.unicornCount(p.id);
      const letters = p.stable.reduce((a, c) => a + (this.defOf(c.uid)?.name.replace(/[^A-Za-z]/g, '').length ?? 0), 0);
      if (n > bestN || (n === bestN && letters > bestLetters)) {
        best = p;
        bestN = n;
        bestLetters = letters;
      }
    }
    this.endGame(best?.id ?? null, best ? `牌庫耗盡！${best.name} 以最多獨角獸（${bestN}）獲勝` : '牌庫耗盡，遊戲結束');
  }

  // ── 大廳／啟動 ────────────────────────────────────────────

  addLobbyPlayer(seatId: string, name: string): string | null {
    if (this.s.phase !== 'lobby') return '遊戲已開始，無法中途加入';
    const existing = this.s.players.find((p) => p.id === seatId);
    if (existing) {
      existing.name = name;
      existing.connected = true;
      return null;
    }
    if (this.s.players.length >= 8) return '房間已滿（最多 8 人）';
    this.s.players.push({ id: seatId, wsId: null, name, hand: [], stable: [], connected: true, isHost: this.s.players.length === 0 });
    this.log(`${name} 加入了房間`);
    return null;
  }

  reconnectSeat(seatId: string, wsId: string): boolean {
    const p = this.player(seatId);
    if (!p) return false;
    p.wsId = wsId;
    p.connected = true;
    return true;
  }

  dropConnection(wsId: string): string | null {
    const p = this.s.players.find((x) => x.wsId === wsId);
    if (!p) return null;
    p.connected = false;
    p.wsId = null;
    this.log(`${p.name} 斷線了`);
    return p.id;
  }

  startGame(): string | null {
    if (this.s.phase !== 'lobby') return '遊戲已經開始';
    if (this.s.players.length < 2) return '至少需要 2 位玩家';
    const rand = this.consumeRand();
    this.buildDecks(rand);
    this.s.winTarget = this.s.players.length >= 6 ? 6 : 7;
    this.s.phase = 'playing';
    this.s.turn = 0;
    for (const p of this.s.players) {
      const baby = this.s.nursery.pop();
      if (baby) p.stable.push({ uid: baby, defId: baby.split('#')[0]! });
      this.drawTo(p.id, 5);
    }
    this.log(`遊戲開始！率先湊齊 ${this.s.winTarget} 隻獨角獸者獲勝 🦄`, 'win');
    this.beginTurn(0);
    return null;
  }

  beginTurn(idx: number): void {
    if (this.s.phase !== 'playing') return;
    this.s.turn = idx % this.s.players.length;
    this.s.turnPhase = 'turn_start';
    this.s.playsLeft = 0;
    this.s.extraTurns = 0;
    this.s.turnEnded = false;
    const pup = this.s.players.flatMap((p) => p.stable.map((c) => ({ p, c }))).find((x) => x.c.defId === 'puppicorn');
    if (pup && pup.p.id !== this.cur().id) {
      this.moveUnicorn(pup.p.id, pup.c.uid, this.cur().id, '小狗獨角獸蹦蹦跳跳換了馬廄');
    }
    this.log(`—— ${this.cur().name} 的回合 ——`, 'turn');
    this.pushBack(this.makeRes('phase_start', this.cur().id));
    this.advance();
  }

  nextTurnIndex(): number {
    if (this.s.extraTurns > 0) {
      this.s.extraTurns--;
      return this.s.turn;
    }
    return (this.s.turn + 1) % this.s.players.length;
  }

  restart(): void {
    const players = this.s.players.map((p) => ({ ...p, hand: [], stable: [] }));
    const fresh = createState();
    fresh.players = players;
    fresh.seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    fresh.log = this.s.log;
    this.s = fresh;
    this.log('回到大廳，可以再次開始遊戲', 'sys');
  }

  // ── 玩家操作入口 ─────────────────────────────────────────

  handleAction(pid: string, act: { a: string; uid?: string; promptId?: string; values?: unknown[] }): string | null {
    if (act.a === 'answer') {
      if (!act.promptId || this.s.prompt?.id !== act.promptId) return '提示已過期';
      return this.submitAnswer(pid, act.values ?? []);
    }
    if (act.a === 'neigh') {
      if (this.s.prompt) return '請先完成當前選擇';
      return this.neighResponse(pid, act.uid);
    }
    if (this.s.phase !== 'playing') return '遊戲未在進行中';
    if (this.s.prompt || this.s.neighWindow) return '請先完成當前的行動';
    const me = this.player(pid);
    if (!me) return '你不是本場玩家';

    if (act.a === 'play_card') {
      if (this.cur().id !== pid) return '還沒輪到你';
      if (this.s.turnPhase !== 'action') return '現在不是行動階段';
      if (this.s.playsLeft <= 0) return '沒有剩餘的出牌次數';
      const d = this.defOf(act.uid ?? '');
      if (!d) return '找不到卡片';
      if (!me.hand.includes(act.uid!)) return '你沒有這張卡';
      if (!this.canPlayType(pid, d.type)) return '你目前不能打出這類卡';
      if (!this.entryReqOk(pid, d.id)) return '進場需求未滿足：馬廄需有基本獨角獸';
      const err = this.initiatePlay(pid, act.uid!);
      if (!err) this.advance();
      return err;
    }

    if (act.a === 'draw_instead') {
      if (this.cur().id !== pid) return '還沒輪到你';
      if (this.s.turnPhase !== 'action') return '現在不是行動階段';
      if (this.s.playsLeft <= 0) return '沒有剩餘的出牌次數';
      this.drawTo(pid, 1);
      this.log(`${me.name} 選擇改為抽一張牌`, 'play');
      this.s.playsLeft = 0;
      this.advance();
      return null;
    }

    if (act.a === 'sacrifice') {
      if (!act.uid || !me.stable.some((c) => c.uid === act.uid)) return '你沒有這張場上卡';
      return this.sacrificeCard(pid, act.uid) ? null : '犧牲失敗';
    }

    if (act.a === 'restart') {
      if (!me.isHost) return '只有房主可以重新開始';
      this.restart();
      return null;
    }

    return '未知操作';
  }

  // ── 視圖 ─────────────────────────────────────────────────

  view(youId: string): ServerView {
    const pub = (p: PlayerState): PublicPlayer => {
      const isYou = p.id === youId;
      const pubHand = isYou || this.handPublic(p.id);
      return {
        id: p.id,
        name: p.name,
        connected: p.connected,
        isHost: p.isHost,
        stable: p.stable,
        handCount: p.hand.length,
        handPublic: pubHand,
        hand: pubHand ? [...p.hand] : undefined,
        unicornCount: this.unicornCount(p.id),
      };
    };
    const w = this.s.neighWindow;
    return {
      youId,
      state: {
        phase: this.s.phase,
        players: this.s.players.map(pub),
        turn: this.s.turn,
        turnPhase: this.s.turnPhase,
        playsLeft: this.s.playsLeft,
        deckCount: this.s.deck.length,
        discardTop: this.topDiscard(),
        discardCount: this.s.discard.length,
        nurseryCount: this.s.nursery.length,
        prompt: this.s.prompt,
        neighWindow: w
          ? {
              sourceUid: w.chain[0]!.uid,
              byId: w.chain[0]!.byId,
              canRespond: w.awaiting.includes(youId),
              responded: this.s.players.filter((p) => !w.awaiting.includes(p.id)).map((p) => p.id),
            }
          : null,
        log: this.s.log.slice(-60),
        winner: this.s.winner,
        winTarget: this.s.winTarget,
      },
    };
  }
}

const BOUNCE_ON_LEAVE = new Set([
  'annoying-flying-unicorn',
  'greedy-flying-unicorn',
  'magical-flying-unicorn',
  'majestic-flying-unicorn',
  'swift-flying-unicorn',
]);

function shuffleArr<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
