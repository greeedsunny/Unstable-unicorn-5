import { isUnicorn } from '../shared/cards';
import type { CardDef, ChoiceOption, Resolution } from '../shared/types';
import type { Engine } from './engine';
import type { Handler } from './effects';

export const TS_TRIGGERS = new Set([
  'sadistic-ritual',
  'rhinocorn',
  'zombie-unicorn',
  'double-dutch',
  'rainbow-lasso',
  'stable-artillery',
  'caffeine-overload',
  'claw-machine',
  'glitter-bomb',
]);

export function guardEnded(e: Engine, res: Resolution): boolean {
  if (e.s.phase === 'playing') return false;
  e.done(res);
  return true;
}

export function ownUnicorns(e: Engine, pid: string): ChoiceOption[] {
  const p = e.player(pid);
  if (!p) return [];
  return p.stable.filter((c) => isUnicorn(e.defOf(c.uid)!.type)).map((c) => ({ label: e.defOf(c.uid)!.nameZh, value: c.uid }));
}

export function ownAnyCards(e: Engine, pid: string): ChoiceOption[] {
  const p = e.player(pid);
  if (!p) return [];
  return p.stable.map((c) => ({ label: e.defOf(c.uid)!.nameZh, value: c.uid }));
}

export function stableAnyCards(e: Engine, excludePids: string[] = []): ChoiceOption[] {
  return e.stableCardOptions(() => true, excludePids);
}

export function stableAttachCards(
  e: Engine,
  filter?: (d: CardDef) => boolean,
  excludePids: string[] = [],
): ChoiceOption[] {
  const f = filter ?? ((d: CardDef) => d.type === 'upgrade' || d.type === 'downgrade');
  return e.stableCardOptions(f, excludePids);
}

export function bounceToOwnerHand(e: Engine, uid: string): void {
  const loc = e.locateStableCard(uid);
  if (!loc) return;
  releaseRider(e, loc.ref, uid);
  loc.ref.stable = loc.ref.stable.filter((c) => c.uid !== uid);
  e.afterStableChange(loc.pid);
  if (e.stableHas(loc.pid, 'barbed-wire')) e.pushFront(e.makeRes('barbed_discard', loc.pid, {}));
  loc.ref.hand.push(uid);
  e.log(`${e.defOf(uid)?.nameZh} 回到 ${loc.ref.name} 的手上`, 'move');
  e.checkWin();
}

function releaseRider(e: Engine, ownerRef: { id: string }, uid: string): void {
  const r = e.s.riders[uid];
  if (!r) return;
  delete e.s.riders[uid];
  const loc = e.locateStableCard(r.uid);
  if (loc && loc.pid === ownerRef.id) {
    loc.ref.stable = loc.ref.stable.filter((c) => c.uid !== r.uid);
    const orig = e.player(r.pid);
    if (orig) orig.stable.push({ uid: r.uid, defId: r.uid.split('#')[0]! });
    e.log(`${e.defOf(r.uid)?.nameZh} 回到原主人的馬廄`, 'move');
  }
}

export function reviveFromDiscard(e: Engine, pid: string, uid: string): void {
  const idx = e.s.discard.lastIndexOf(uid);
  if (idx < 0) return;
  e.s.discard.splice(idx, 1);
  e.enterViaEffect(pid, uid, `${e.nameOf(pid)} 讓 ${e.defOf(uid)?.nameZh} 重返戰場`);
}

export function discardWalker(e: Engine, res: Resolution): boolean {
  if (e.s.phase !== 'playing') {
    e.done(res);
    return true;
  }
  const players = e.s.players;
  let j = Number(res.data.j ?? 0);
  while (j < players.length && players[j]!.hand.length === 0) j++;
  if (j >= players.length) return true;
  const f = `w${j}`;
  if (!(f in res.data)) {
    e.ask(res, f, {
      playerId: players[j]!.id,
      title: String(res.data.wTitle ?? '請棄 1 張牌'),
      options: e.handOptions(players[j]!.id),
    });
    return false;
  }
  e.discardUids([String(res.data[f])]);
  res.data.j = j + 1;
  return false;
}

export function destroyAnySync(e: Engine, res: Resolution, pid: string, uid: string): boolean {
  const d = e.defOf(uid)!;
  if (isUnicorn(d.type)) return e.destroyUnicorn(res, res.playerId, uid);
  e.forceRemoveToDiscard(uid, '消滅');
  return false;
}

export function shuffleLocal<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

// ── 其餘進場效果與回合觸發註冊 ───────────────────────────────

export function registerMore(HANDLERS: Record<string, Handler>): void {
  HANDLERS['entry_search_deck'] = (e, res) => {
    const mode = String(res.data.mode ?? '');
    const pred =
      mode === 'upgrade'
        ? (d: CardDef) => d.type === 'upgrade'
        : mode === 'downgrade'
          ? (d: CardDef) => d.type === 'downgrade'
          : (d: CardDef) => d.name.toLowerCase().includes('narwhal');
    const label = mode === 'upgrade' ? '升級卡' : mode === 'downgrade' ? '降級卡' : '名稱含 Narwhal 的卡';
    if (!('go' in res.data)) {
      const exists = e.s.deck.some((u) => pred(e.defOf(u)!));
      if (!exists) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: `從牌庫搜尋一張${label}加入手牌？`, options: e.ynOptions('搜尋') });
      return;
    }
    if (e.isYes(res.data.go)) {
      const uid = e.searchDeck(pred);
      if (uid) {
        e.player(res.playerId)?.hand.push(uid);
        e.log(`${e.nameOf(res.playerId)} 搜尋到了一張${label}`, 'draw');
      }
    }
    e.done(res);
  };
  HANDLERS['entry_classy-narwhal'] = alias('entry_search_deck', { mode: 'upgrade' }, HANDLERS);
  HANDLERS['entry_shabby-the-narwhal'] = alias('entry_search_deck', { mode: 'downgrade' }, HANDLERS);
  HANDLERS['entry_the-great-narwhal'] = alias('entry_search_deck', { mode: 'narwhal' }, HANDLERS);

  HANDLERS['entry_take_from_discard'] = (e, res) => {
    const mode = String(res.data.mode ?? '');
    const pred =
      mode === 'instant'
        ? (d: CardDef) => d.type === 'instant'
        : mode === 'magic'
          ? (d: CardDef) => d.type === 'magic'
          : (d: CardDef) => isUnicorn(d.type);
    const label = mode === 'instant' ? '瞬間卡' : mode === 'magic' ? '魔法卡' : '獨角獸';
    if (!('go' in res.data)) {
      const opts = e.discardOptions(pred);
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', {
        playerId: res.playerId,
        title: `從棄牌堆拿一張${label}加入手牌？`,
        options: [{ label: '跳過', value: '__n' }, ...opts],
      });
      return;
    }
    if (res.data.go !== '__n') {
      const uid = String(res.data.go);
      const idx = e.s.discard.lastIndexOf(uid);
      if (idx >= 0) {
        e.s.discard.splice(idx, 1);
        e.player(res.playerId)?.hand.push(uid);
      }
    }
    e.done(res);
  };
  HANDLERS['entry_magical-flying-unicorn'] = alias('entry_take_from_discard', { mode: 'magic' }, HANDLERS);
  HANDLERS['entry_swift-flying-unicorn'] = alias('entry_take_from_discard', { mode: 'instant' }, HANDLERS);
  HANDLERS['entry_majestic-flying-unicorn'] = alias('entry_take_from_discard', { mode: 'unicorn' }, HANDLERS);

  HANDLERS['entry_greedy-flying-unicorn'] = (e, res) => {
    e.drawTo(res.playerId, 1);
    e.done(res);
  };

  HANDLERS['entry_llamacorn'] = (e, res) => {
    if (!('wTitle' in res.data)) res.data.wTitle = '草泥馬獨角獸：每人棄 1 張牌';
    if (!discardWalker(e, res)) return;
    e.reshuffleDiscard();
    e.done(res);
  };

  HANDLERS['entry_mermaid-unicorn'] = (e, res) => {
    if (!('t' in res.data)) {
      const opts = stableAnyCards(e);
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '美人魚獨角獸：把哪張卡送回主人手上？', options: [{ label: '跳過', value: '__n' }, ...opts] });
      return;
    }
    if (!('sent' in res.data)) {
      res.data.sent = 1;
      if (res.data.t !== '__n') {
        const c = e.parseStableChoice(res.data.t);
        if (c) bounceToOwnerHand(e, c.uid);
      }
    }
    e.done(res);
  };

  HANDLERS['entry_mother-goose-unicorn'] = (e, res) => {
    if (!('go' in res.data)) {
      if (e.s.nursery.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '鵝媽媽獨角獸：從育嬰室帶一隻幼獨角獸回來？', options: e.ynOptions('帶回') });
      return;
    }
    if (!('got' in res.data)) {
      res.data.got = 1;
      if (e.isYes(res.data.go)) {
        const baby = e.s.nursery.pop();
        if (baby) e.enterStable(res.playerId, baby);
      }
    }
    e.done(res);
  };

  HANDLERS['entry_narwhal-torpedo'] = (e, res) => {
    const downs = e
      .player(res.playerId)!
      .stable.filter((c) => e.defOf(c.uid)!.type === 'downgrade')
      .map((c) => c.uid);
    for (const uid of downs) e.sacrificeCard(res.playerId, uid);
    e.done(res);
  };

  HANDLERS['entry_necromancer-unicorn'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (!('go' in res.data)) {
      const ok = me.hand.length >= 2 && e.discardOptions((d) => isUnicorn(d.type)).length > 0;
      if (!ok) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '死靈法師獨角獸：棄 2 張牌，喚醒一隻獨角獸？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('ds' in res.data)) {
      e.ask(res, 'ds', { playerId: res.playerId, title: '死靈法師：棄 2 張牌', kind: 'multi', min: 2, max: 2, options: e.handOptions(res.playerId) });
      return;
    }
    if (!('paid' in res.data)) {
      res.data.paid = 1;
      e.discardUids(res.data.ds as string[]);
    }
    if (!('rv' in res.data)) {
      const opts = e.discardOptions((d) => isUnicorn(d.type));
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'rv', { playerId: res.playerId, title: '死靈法師：喚醒哪一隻？', options: opts });
      return;
    }
    reviveFromDiscard(e, res.playerId, String(res.data.rv));
    e.done(res);
  };

  HANDLERS['entry_rainbow-unicorn'] = (e, res) => {
    if (!('u' in res.data)) {
      const basics = e.handOptions(res.playerId, (d) => d.type === 'basic');
      if (basics.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'u', {
        playerId: res.playerId,
        title: '彩虹獨角獸：直接帶一隻基本獨角獸進馬廄？（不消耗出牌次數）',
        options: [{ label: '跳過', value: '__n' }, ...basics],
      });
      return;
    }
    if (!('brought' in res.data)) {
      res.data.brought = 1;
      if (res.data.u !== '__n') {
        const uid = String(res.data.u);
        const me = e.player(res.playerId)!;
        if (me.hand.includes(uid)) {
          me.hand = me.hand.filter((x) => x !== uid);
          e.enterStable(res.playerId, uid);
        }
      }
    }
    e.done(res);
  };

  HANDLERS['entry_seductive-unicorn'] = (e, res) => {
    if (!('t' in res.data)) {
      const opts = e.unicornOptionsAny([res.playerId]);
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '妖豔獨角獸：偷走一隻獨角獸', options: opts });
      return;
    }
    if (!('stole' in res.data)) {
      res.data.stole = 1;
      const c = e.parseStableChoice(res.data.t);
      if (c) {
        const src = String(res.data.src);
        if (e.stealUnicorn(c.pid, c.uid, res.playerId, '魅惑擄走')) {
          e.s.riders[src] = { uid: c.uid, pid: c.pid };
        }
      }
    }
    e.done(res);
  };

  HANDLERS['entry_shark-with-a-horn'] = (e, res) => {
    if (!('go' in res.data)) {
      if (e.unicornOptionsAny().length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '獨角鯊：犧牲自己來消滅一隻獨角獸？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('saced' in res.data)) {
      res.data.saced = 1;
      e.sacrificeCard(res.playerId, String(res.data.src));
    }
    if (!('t' in res.data)) {
      const opts = e.unicornOptionsAny();
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '獨角鯊：消滅一隻獨角獸', options: opts });
      return;
    }
    const c = e.parseStableChoice(res.data.t)!;
    if (c && !('killed' in res.data) && e.destroyUnicorn(res, res.playerId, c.uid)) {
      res.data.killed = 1;
      return;
    }
    e.done(res);
  };

  HANDLERS['entry_unicorn-oracle'] = (e, res) => {
    if (!('keep' in res.data)) {
      if (e.s.deck.length === 0) {
        e.done(res);
        return;
      }
      const top = e.s.deck.slice(-Math.min(3, e.s.deck.length)).reverse();
      e.ask(res, 'keep', {
        playerId: res.playerId,
        title: `預言家：檢視牌庫頂 ${top.length} 張，保留一張（其餘放回頂端）`,
        options: top.map((u) => ({ label: e.defOf(u)?.nameZh ?? '?', value: u })),
      });
      return;
    }
    if (!('kept' in res.data)) {
      res.data.kept = 1;
      const keep = String(res.data.keep);
      const idx = e.s.deck.lastIndexOf(keep);
      if (idx >= 0) e.s.deck.splice(idx, 1);
      e.player(res.playerId)?.hand.push(keep);
      e.log(`${e.nameOf(res.playerId)} 窺探了命運……`, 'draw');
    }
    e.done(res);
  };

  HANDLERS['entry_unicorn-phoenix'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (me.hand.length > 0 && !('d' in res.data)) {
      e.ask(res, 'd', { playerId: res.playerId, title: '不死鳳凰獨角獸：棄 1 張牌', options: e.handOptions(res.playerId) });
      return;
    }
    if ('d' in res.data && !('discarded' in res.data)) {
      res.data.discarded = 1;
      e.discardUids([String(res.data.d)]);
    }
    e.done(res);
  };

  // ── 回合開始觸發 ──

  HANDLERS['ts_double-dutch'] = (e, res) => {
    if (!('go' in res.data)) {
      e.ask(res, 'go', { playerId: res.playerId, title: '雙人跳繩：本回合改為可出 2 張牌？', options: e.ynOptions('加倍！') });
      return;
    }
    if (!('done' in res.data)) {
      res.data.done = 1;
      if (e.isYes(res.data.go)) {
        e.s.playsLeft = 2;
        e.log(`${e.nameOf(res.playerId)} 本回合可以出兩張牌！`, 'sys');
      }
    }
    e.done(res);
  };

  HANDLERS['ts_rainbow-lasso'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (!('go' in res.data)) {
      const ok = me.hand.length >= 3 && e.unicornOptionsAny([res.playerId]).length > 0;
      if (!ok) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '彩虹套索：棄 3 張牌，永久偷一隻獨角獸？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('ds' in res.data)) {
      e.ask(res, 'ds', { playerId: res.playerId, title: '彩虹套索：棄 3 張牌', kind: 'multi', min: 3, max: 3, options: e.handOptions(res.playerId) });
      return;
    }
    if (!('paid' in res.data)) {
      res.data.paid = 1;
      e.discardUids(res.data.ds as string[]);
    }
    if (!('t' in res.data)) {
      const opts = e.unicornOptionsAny([res.playerId]);
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '彩虹套索：套走哪一隻？', options: opts });
      return;
    }
    if (!('stole' in res.data)) {
      res.data.stole = 1;
      const c = e.parseStableChoice(res.data.t);
      if (c) e.stealUnicorn(c.pid, c.uid, res.playerId, '套走');
    }
    e.done(res);
  };

  HANDLERS['ts_stable-artillery'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (!('go' in res.data)) {
      if (me.hand.length < 2 || e.unicornOptionsAny().length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '馬廄砲台：棄 2 張牌，轟掉一隻獨角獸？', options: e.ynOptions('開炮') });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('ds' in res.data)) {
      e.ask(res, 'ds', { playerId: res.playerId, title: '馬廄砲台：棄 2 張牌', kind: 'multi', min: 2, max: 2, options: e.handOptions(res.playerId) });
      return;
    }
    if (!('paid' in res.data)) {
      res.data.paid = 1;
      e.discardUids(res.data.ds as string[]);
    }
    if (!('t' in res.data)) {
      const opts = e.unicornOptionsAny();
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '馬廄砲台：瞄準哪一隻？', options: opts });
      return;
    }
    const c = e.parseStableChoice(res.data.t)!;
    if (c && !('fired' in res.data) && e.destroyUnicorn(res, res.playerId, c.uid)) {
      res.data.fired = 1;
      return;
    }
    e.done(res);
  };

  HANDLERS['ts_caffeine-overload'] = (e, res) => {
    if (!('go' in res.data)) {
      if (ownAnyCards(e, res.playerId).length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '咖啡因過量：犧牲 1 張卡，抽 2 張牌？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('sac' in res.data)) {
      e.ask(res, 'sac', { playerId: res.playerId, title: '咖啡因過量：犧牲哪張卡？', options: ownAnyCards(e, res.playerId) });
      return;
    }
    if (!('saced' in res.data)) {
      res.data.saced = 1;
      e.sacrificeCard(res.playerId, String(res.data.sac));
      e.drawTo(res.playerId, 2);
      e.log(`${e.nameOf(res.playerId)} 咖啡因爆發，抽了 2 張牌`, 'draw');
    }
    e.done(res);
  };

  HANDLERS['ts_claw-machine'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (!('go' in res.data)) {
      if (me.hand.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '夾娃娃機：棄 1 張牌，再抽 1 張？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('d' in res.data)) {
      e.ask(res, 'd', { playerId: res.playerId, title: '夾娃娃機：棄哪張？', options: e.handOptions(res.playerId) });
      return;
    }
    if (!('exchanged' in res.data)) {
      res.data.exchanged = 1;
      e.discardUids([String(res.data.d)]);
      e.drawTo(res.playerId, 1);
      e.log(`${me.name} 操作夾娃娃機換了一張牌`, 'draw');
    }
    e.done(res);
  };

  HANDLERS['ts_glitter-bomb'] = (e, res) => {
    if (!('go' in res.data)) {
      const canSac = ownAnyCards(e, res.playerId).length > 0;
      const canHit = stableAnyCards(e).length > 0;
      if (!canSac || !canHit) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '閃光炸彈：犧牲 1 張卡，引爆 1 張卡？', options: e.ynOptions('引爆') });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('sac' in res.data)) {
      e.ask(res, 'sac', { playerId: res.playerId, title: '閃光炸彈：先犧牲哪張？', options: ownAnyCards(e, res.playerId) });
      return;
    }
    if (!('boom' in res.data)) {
      if (!('saced' in res.data)) {
        res.data.saced = 1;
        e.sacrificeCard(res.playerId, String(res.data.sac));
      }
      const opts = stableAnyCards(e);
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'boom', { playerId: res.playerId, title: '閃光炸彈：炸掉哪張？', options: opts });
      return;
    }
    const c = e.parseStableChoice(res.data.boom)!;
    if (c && !('boomed' in res.data) && destroyAnySync(e, res, c.pid, c.uid)) {
      res.data.boomed = 1;
      return;
    }
    e.done(res);
  };

  HANDLERS['ts_rhinocorn'] = (e, res) => {
    if (!('go' in res.data)) {
      if (e.unicornOptionsAny().length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '犀牛獨角獸：衝撞一隻獨角獸？（若發動，回合立即結束）', options: e.ynOptions('衝撞！') });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('t' in res.data)) {
      e.ask(res, 't', { playerId: res.playerId, title: '犀牛獨角獸：撞誰？', options: e.unicornOptionsAny() });
      return;
    }
    if (!('charged' in res.data)) {
      res.data.charged = 1;
      const c = e.parseStableChoice(res.data.t);
      if (c) e.destroyUnicorn(res, res.playerId, c.uid);
      e.s.turnEnded = true;
      e.log(`${e.nameOf(res.playerId)} 的回合因犀牛衝撞而結束`, 'sys');
    }
    e.done(res);
  };

  HANDLERS['ts_sadistic-ritual'] = (e, res) => {
    const opts = ownUnicorns(e, res.playerId);
    if (opts.length === 0) {
      e.done(res);
      return;
    }
    if (!('sac' in res.data)) {
      e.ask(res, 'sac', { playerId: res.playerId, title: '虐待狂儀式：必須犧牲一隻獨角獸……', options: opts });
      return;
    }
    if (!('ritualized' in res.data)) {
      res.data.ritualized = 1;
      e.sacrificeCard(res.playerId, String(res.data.sac));
      e.drawTo(res.playerId, 1);
      e.log(`${e.nameOf(res.playerId)} 完成儀式，抽 1 張牌`, 'draw');
    }
    e.done(res);
  };

  HANDLERS['ts_zombie-unicorn'] = (e, res) => {
    const me = e.player(res.playerId)!;
    if (!('go' in res.data)) {
      const canPay = e.handOptions(res.playerId, (d) => isUnicorn(d.type)).length > 0;
      const canRevive = e.discardOptions((d) => isUnicorn(d.type)).length > 0;
      if (!canPay || !canRevive) {
        e.done(res);
        return;
      }
      e.ask(res, 'go', { playerId: res.playerId, title: '殭屍獨角獸：餵食一隻，喚醒一隻？', options: e.ynOptions() });
      return;
    }
    if (!e.isYes(res.data.go)) {
      e.done(res);
      return;
    }
    if (!('pay' in res.data)) {
      e.ask(res, 'pay', {
        playerId: res.playerId,
        title: '殭屍獨角獸：從手中丟一隻進去',
        options: e.handOptions(res.playerId, (d) => isUnicorn(d.type)),
      });
      return;
    }
    if (!('fed' in res.data)) {
      res.data.fed = 1;
      e.discardUids([String(res.data.pay)]);
    }
    if (!('rv' in res.data)) {
      const opts = e.discardOptions((d) => isUnicorn(d.type));
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      e.ask(res, 'rv', { playerId: res.playerId, title: '殭屍獨角獸：喚醒哪一隻？', options: opts });
      return;
    }
    if (!('revived' in res.data)) {
      res.data.revived = 1;
      reviveFromDiscard(e, res.playerId, String(res.data.rv));
    }
    e.done(res);
  };
}

function alias(target: string, extra: Record<string, unknown>, HANDLERS: Record<string, Handler>): Handler {
  return (e, res) => {
    for (const [k, v] of Object.entries(extra)) {
      if (!(k in res.data)) res.data[k] = v;
    }
    HANDLERS[target]!(e, res);
  };
}
