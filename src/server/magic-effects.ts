import type { Resolution } from '../shared/types';
import type { Engine } from './engine';
import type { Handler } from './effects';
import {
  bounceToOwnerHand,
  destroyAnySync,
  discardWalker,
  guardEnded,
  ownAnyCards,
  reviveFromDiscard,
  shuffleLocal,
  stableAnyCards,
  stableAttachCards,
} from './effects2';

export const MAGIC_HANDLERS: Record<string, Handler> = {
  'magic_unicorn-poison': (e, res) => {
    if (!('t' in res.data)) {
      e.ask(res, 't', { playerId: res.playerId, title: '獨角獸毒藥：選擇一隻獨角獸消滅', options: e.destroyUnicornOptions(res.playerId) });
      return;
    }
    const c = e.parseStableChoice(res.data.t)!;
    if (c && !('k' in res.data) && e.destroyUnicorn(res, res.playerId, c.uid)) {
      res.data.k = 1;
      return;
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_two-for-one': (e, res) => {
    if (!('sac' in res.data)) {
      e.ask(res, 'sac', { playerId: res.playerId, title: '二換一：先犧牲你的一張卡', options: ownAnyCards(e, res.playerId) });
      return;
    }
    if (!('saced' in res.data)) {
      res.data.saced = 1;
      e.sacrificeCard(res.playerId, String(res.data.sac));
    }
    if (!('d1' in res.data)) {
      const opts = e.destroyAnyOptions(res.playerId);
      if (opts.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'd1', { playerId: res.playerId, title: '二換一：消滅第 1 張卡', options: opts });
      return;
    }
    if (!('k1' in res.data)) {
      const c1 = e.parseStableChoice(res.data.d1);
      if (c1 && destroyAnySync(e, res, c1.pid, c1.uid)) {
        res.data.k1 = 1;
        return;
      }
      res.data.k1 = 1;
    }
    if (!('d2' in res.data)) {
      const opts = e.destroyAnyOptions(res.playerId);
      if (opts.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'd2', { playerId: res.playerId, title: '二換一：消滅第 2 張卡', options: opts });
      return;
    }
    if (!('k2' in res.data)) {
      const c2 = e.parseStableChoice(res.data.d2);
      if (c2 && destroyAnySync(e, res, c2.pid, c2.uid)) {
        res.data.k2 = 1;
        return;
      }
      res.data.k2 = 1;
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_targeted-destruction': (e, res) => {
    if (!('t' in res.data)) {
      const opts = stableAttachCards(e);
      if (opts.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '定點破壞：選擇一張升級／降級卡', options: opts });
      return;
    }
    if (!('hit' in res.data)) {
      res.data.hit = 1;
      const c = e.parseStableChoice(res.data.t);
      if (c) {
        if (c.pid === res.playerId) e.sacrificeCard(c.pid, c.uid);
        else e.forceRemoveToDiscard(c.uid, '消滅');
      }
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_back-kick': (e, res) => {
    if (!('t' in res.data)) {
      const opts = stableAnyCards(e, [res.playerId]);
      if (opts.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '後踢腿：把別人馬廄的一張卡踢回他手上', options: opts });
      return;
    }
    const c = e.parseStableChoice(res.data.t)!;
    if (c && !('kicked' in res.data)) {
      res.data.kicked = 1;
      bounceToOwnerHand(e, c.uid);
    }
    if (c) {
      const victim = e.player(c.pid);
      if (victim && victim.hand.length > 0) {
        if (!('d' in res.data)) {
          e.ask(res, 'd', { playerId: c.pid, title: '後踢腿：再棄 1 張牌', options: e.handOptions(c.pid) });
          return;
        }
        if (!('discarded' in res.data)) {
          res.data.discarded = 1;
          e.discardUids([String(res.data.d)]);
        }
      }
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_blatant-thievery': (e, res) => {
    if (!('v' in res.data)) {
      const victims = e.s.players.filter((p) => p.id !== res.playerId && p.hand.length > 0);
      if (victims.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'v', {
        playerId: res.playerId,
        title: '公然竊盜：選擇對象',
        options: victims.map((p) => ({ label: `${p.name}（${p.hand.length} 張）`, value: p.id })),
      });
      return;
    }
    if (!('c' in res.data)) {
      const v = String(res.data.v);
      e.ask(res, 'c', { playerId: res.playerId, title: `檢視 ${e.nameOf(v)} 的手牌，拿走一張`, options: e.handOptions(v) });
      return;
    }
    if (!('took' in res.data)) {
      res.data.took = 1;
      const v = String(res.data.v);
      const victim = e.player(v);
      const uid = String(res.data.c);
      if (victim?.hand.includes(uid)) {
        victim.hand = victim.hand.filter((x) => x !== uid);
        e.player(res.playerId)?.hand.push(uid);
        e.log(`${e.nameOf(res.playerId)} 從 ${victim.name} 手上拿走了一張牌`, 'move');
      }
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_change-of-luck': (e, res) => {
    if (!('dr' in res.data)) {
      res.data.dr = 1;
      e.drawTo(res.playerId, 2);
      if (e.s.phase !== 'playing') return;
    }
    const me = e.player(res.playerId)!;
    const n = Math.min(3, me.hand.length);
    if (n > 0 && !('ds' in res.data)) {
      e.ask(res, 'ds', { playerId: res.playerId, title: `轉運：棄 ${n} 張牌`, kind: 'multi', min: n, max: n, options: e.handOptions(res.playerId) });
      return;
    }
    if (!('done' in res.data)) {
      res.data.done = 1;
      if ('ds' in res.data) e.discardUids(res.data.ds as string[]);
      e.s.extraTurns += 1;
      e.log(`${e.nameOf(res.playerId)} 獲得一次額外回合！`, 'sys');
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_glitter-tornado': (e, res) => {
    if (guardEnded(e, res)) return;
    const targets = e.s.players.filter((p) => p.stable.length > 0);
    const i = Number(res.data.i ?? 0);
    if (i >= targets.length) {
      e.finishMagicDiscard(res);
      e.done(res);
      return;
    }
    const t = targets[i]!;
    const f = `b${i}`;
    if (!(f in res.data)) {
      e.ask(res, f, {
        playerId: res.playerId,
        title: `閃光龍捲風：${t.name} 的馬廄吹回一張卡`,
        options: t.stable.map((c) => ({ label: e.defOf(c.uid)?.nameZh ?? '?', value: c.uid })),
      });
      return;
    }
    if (!('blown' in res.data) || Number(res.data.blown) < i + 1) {
      bounceToOwnerHand(e, String(res.data[f]));
      res.data.blown = i + 1;
      res.data.i = i + 1;
    }
  },

  'magic_good-deal': (e, res) => {
    if (!('dr' in res.data)) {
      res.data.dr = 1;
      e.drawTo(res.playerId, 3);
      if (e.s.phase !== 'playing') return;
    }
    if (!('d' in res.data)) {
      e.ask(res, 'd', { playerId: res.playerId, title: '好交易：棄 1 張牌', options: e.handOptions(res.playerId) });
      return;
    }
    if (!('discarded' in res.data)) {
      res.data.discarded = 1;
      e.discardUids([String(res.data.d)]);
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_kiss-of-life': (e, res) => {
    if (!('u' in res.data)) {
      const opts = e.discardOptions((d) => ['baby', 'basic', 'magic_unicorn'].includes(d.type));
      if (opts.length === 0) {
        e.log('棄牌堆裡沒有獨角獸', 'sys');
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'u', { playerId: res.playerId, title: '起死回生之吻：揀一隻獨角獸回你的馬廄', options: opts });
      return;
    }
    if (!('revived' in res.data)) {
      res.data.revived = 1;
      reviveFromDiscard(e, res.playerId, String(res.data.u));
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_mystical-vortex': (e, res) => {
    if (!('wTitle' in res.data)) res.data.wTitle = '神秘漩渦：每人棄 1 張牌';
    if (!discardWalker(e, res)) return;
    if (!('shuffled' in res.data)) {
      res.data.shuffled = 1;
      e.reshuffleDiscard();
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_re-target': (e, res) => {
    if (!('t' in res.data)) {
      const opts = stableAttachCards(e);
      if (opts.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 't', { playerId: res.playerId, title: '重新瞄準：選擇一張升級／降級卡', options: opts });
      return;
    }
    if (!('to' in res.data)) {
      const c = e.parseStableChoice(res.data.t)!;
      e.ask(res, 'to', { playerId: res.playerId, title: '移到誰的馬廄？', options: e.playerOptions([c?.pid ?? '']) });
      return;
    }
    if (!('moved' in res.data)) {
      res.data.moved = 1;
      const c = e.parseStableChoice(res.data.t);
      if (c) e.moveAttachTo(String(res.data.to), c.uid);
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_reset-button': (e, res) => {
    if (!('done' in res.data)) {
      res.data.done = 1;
      for (const p of [...e.s.players]) {
        for (const c of [...p.stable]) {
          const d = e.defOf(c.uid)!;
          if (d.type === 'upgrade' || d.type === 'downgrade') e.sacrificeCard(p.id, c.uid);
        }
      }
      if (e.s.phase !== 'playing') return;
      e.reshuffleDiscard();
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_shake-up': (e, res) => {
    if (!('done' in res.data)) {
      res.data.done = 1;
      const src = String(res.data.src ?? '');
      const pile = [...e.s.discard.splice(0)];
      if (src) pile.push(src);
      shuffleLocal(pile, e.consumeRand());
      e.s.deck.unshift(...pile);
      e.log(`洗牌：棄牌堆 ${pile.length} 張（含此卡）已洗入牌庫深處`, 'sys');
      e.drawTo(res.playerId, 5);
      e.log(`${e.nameOf(res.playerId)} 從牌庫頂抽了 5 張新牌`, 'play');
    }
    e.done(res);
  },

  'magic_unfair-bargain': (e, res) => {
    if (!('v' in res.data)) {
      const victims = e.s.players.filter((p) => p.id !== res.playerId);
      e.ask(res, 'v', {
        playerId: res.playerId,
        title: '不公平交易：與誰交換整手手牌？',
        options: victims.map((p) => ({ label: `${p.name}（${p.hand.length} 張）`, value: p.id })),
      });
      return;
    }
    if (!('swapped' in res.data)) {
      res.data.swapped = 1;
      const me = e.player(res.playerId)!;
      const v = e.player(String(res.data.v))!;
      const tmp = me.hand;
      me.hand = v.hand;
      v.hand = tmp;
      e.log(`${me.name} 與 ${v.name} 交換了整手手牌！`, 'move');
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_unicorn-shrinkray': (e, res) => {
    if (!('v' in res.data)) {
      const victims = e.s.players.filter((p) => p.stable.some((c) => ['baby', 'basic', 'magic_unicorn'].includes(e.defOf(c.uid)!.type)));
      if (victims.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'v', {
        playerId: res.playerId,
        title: '縮小光線：射誰？',
        options: victims.map((p) => ({ label: `${p.name}（${p.stable.filter((c) => ['baby', 'basic', 'magic_unicorn'].includes(e.defOf(c.uid)!.type)).length} 隻）`, value: p.id })),
      });
      return;
    }
    if (!('zapped' in res.data)) {
      res.data.zapped = 1;
      const victim = e.player(String(res.data.v))!;
      const unicorns = victim.stable.filter((c) => ['baby', 'basic', 'magic_unicorn'].includes(e.defOf(c.uid)!.type));
      for (const c of unicorns) {
        victim.stable = victim.stable.filter((x) => x.uid !== c.uid);
        const d = e.defOf(c.uid)!;
        if (d.type === 'baby') e.s.nursery.unshift(c.uid);
        else e.s.discard.push(c.uid);
      }
      const n = unicorns.length;
      e.log(`縮小光線命中！${victim.name} 的 ${n} 隻獨角獸被縮小送走`, 'leave');
      for (let i = 0; i < n; i++) {
        const baby = e.s.nursery.pop();
        if (!baby) break;
        victim.stable.push({ uid: baby, defId: baby.split('#')[0]! });
      }
      if (n > 0) {
        e.log(`${n} 隻幼獨角獸從育嬰室來到 ${victim.name} 的馬廄`, 'enter');
        e.afterStableChange(victim.id);
        e.checkWin();
      }
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },

  'magic_unicorn-swap': (e, res) => {
    if (!('mine' in res.data)) {
      const mine = e
        .player(res.playerId)!
        .stable.filter((c) => ['baby', 'basic', 'magic_unicorn'].includes(e.defOf(c.uid)!.type))
        .map((c) => ({ label: e.defOf(c.uid)!.nameZh, value: JSON.stringify({ pid: res.playerId, uid: c.uid }) }));
      if (mine.length === 0) {
        e.log('你的馬廄裡沒有獨角獸', 'sys');
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'mine', { playerId: res.playerId, title: '獨角獸交換：先選你自己的獨角獸', options: mine });
      return;
    }
    if (!('theirs' in res.data)) {
      const others = e.unicornOptionsAny([res.playerId]);
      if (others.length === 0) {
        e.finishMagicDiscard(res);
        e.done(res);
        return;
      }
      e.ask(res, 'theirs', { playerId: res.playerId, title: '獨角獸交換：再選對手的獨角獸', options: others });
      return;
    }
    if (!('swapped' in res.data)) {
      res.data.swapped = 1;
      const mine = e.parseStableChoice(res.data.mine);
      const theirs = e.parseStableChoice(res.data.theirs);
      if (mine && theirs) {
        doSwap(e, mine.uid, theirs.uid);
      }
    }
    e.finishMagicDiscard(res);
    e.done(res);
  },
};

function doSwap(e: Engine, aUid: string, bUid: string): void {
  const la = e.locateStableCard(aUid);
  const lb = e.locateStableCard(bUid);
  if (!la || !lb || la.pid === lb.pid) return;
  la.ref.stable = la.ref.stable.filter((c) => c.uid !== aUid);
  lb.ref.stable = lb.ref.stable.filter((c) => c.uid !== bUid);
  lb.ref.stable.push({ uid: aUid, defId: aUid.split('#')[0]! });
  la.ref.stable.push({ uid: bUid, defId: bUid.split('#')[0]! });
  e.log(`交換成功！雙方的獨角獸互換了馬廄`, 'move');
  if (e.stableHas(la.pid, 'barbed-wire')) e.pushFront(e.makeRes('barbed_discard', la.pid, {}));
  if (e.stableHas(lb.pid, 'barbed-wire')) e.pushFront(e.makeRes('barbed_discard', lb.pid, {}));
  e.afterStableChange(la.pid);
  e.afterStableChange(lb.pid);
  e.checkWin();
  e.tryEntryEffect(lb.pid, aUid);
  e.tryEntryEffect(la.pid, bUid);
}
