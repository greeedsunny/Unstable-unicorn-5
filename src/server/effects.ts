import { isUnicorn } from '../shared/cards';
import type { CardDef, ChoiceOption, Resolution } from '../shared/types';
import type { Engine } from './engine';
import { MAGIC_HANDLERS } from './magic-effects';
import {
  TS_TRIGGERS,
  guardEnded,
  registerMore,
  reviveFromDiscard,
  ownUnicorns,
  stableAttachCards,
} from './effects2';

export type Handler = (e: Engine, res: Resolution) => void;

export const HANDLERS: Record<string, Handler> = {
  phase_start: (e, res) => {
    if (guardEnded(e, res)) return;
    const p = e.cur();
    e.s.turnPhase = 'turn_start';
    const triggers: { uid: string; defId: string }[] = [];
    for (const c of p.stable) {
      const d = e.defOf(c.uid)!;
      if (TS_TRIGGERS.has(d.id)) triggers.push({ uid: c.uid, defId: d.id });
    }
    const i = Number(res.data.i ?? 0);
    if (i < triggers.length) {
      const t = triggers[i]!;
      res.data.i = i + 1;
      e.pushFront(e.makeRes(`ts_${t.defId}`, p.id, { src: t.uid }));
      return;
    }
    e.pushBack(e.makeRes('draw_phase', p.id));
    e.done(res);
  },

  draw_phase: (e, res) => {
    if (guardEnded(e, res)) return;
    const p = e.cur();
    e.s.turnPhase = 'draw';
    e.drawTo(p.id, 1);
    if (e.s.phase !== 'playing') return;
    if (e.s.playsLeft <= 0) e.s.playsLeft = 1;
    e.pushBack(e.makeRes('action_phase', p.id));
    e.done(res);
  },

  action_phase: (e, res) => {
    if (guardEnded(e, res)) return;
    const p = e.cur();
    if (e.s.turnEnded) {
      e.pushBack(e.makeRes('end_phase', p.id));
      e.removeRes(res);
      return;
    }
    if (!('act' in res.data)) {
      if (e.s.playsLeft <= 0) {
        e.pushBack(e.makeRes('end_phase', p.id));
        e.removeRes(res);
        return;
      }
      e.s.turnPhase = 'action';
      const opts: ChoiceOption[] = [];
      for (const uid of p.hand) {
        const d = e.defOf(uid)!;
        if (!(d.type === 'basic' || d.type === 'magic_unicorn' || d.type === 'magic' || d.type === 'upgrade' || d.type === 'downgrade')) continue;
        if (!e.canPlayType(p.id, d.type)) continue;
        if (d.type === 'basic' && e.queenBeeBlocksBasicEnter(p.id)) continue;
        if (!e.entryReqOk(p.id, d.id)) continue;
        opts.push({ label: `打出 ${d.nameZh}`, value: uid });
      }
      opts.push({ label: '改為抽一張牌', value: '__draw' });
      e.ask(res, 'act', { playerId: p.id, title: `行動階段：還可打出 ${e.s.playsLeft} 張牌`, options: opts });
      return;
    }
    const act = res.data.act;
    delete res.data.act;
    if (act === '__draw') {
      e.drawTo(p.id, 1);
      e.log(`${p.name} 改為抽一張牌`, 'play');
      e.s.playsLeft = 0;
    } else {
      const err = e.initiatePlay(p.id, String(act));
      if (err) {
        e.log(err, 'sys');
        e.removeRes(res);
        return;
      }
      e.s.playsLeft--;
    }
    if (e.s.phase === 'ended') return;
    if (e.s.playsLeft > 0 && !e.s.turnEnded) return;
    e.pushBack(e.makeRes('end_phase', p.id));
    e.removeRes(res);
  },

  end_phase: (e, res) => {
    if (guardEnded(e, res)) return;
    const p = e.cur();
    e.s.turnPhase = 'end';
    for (const [uid, info] of Object.entries(e.s.lasso ?? {})) {
      if (info.by === p.id) {
        e.moveUnicorn(p.id, uid, info.home, '套索到期，歸還');
        delete e.s.lasso![uid];
        e.tryEntryEffect(info.home, uid);
      }
    }
    const limit = 7 + (e.stableHas(p.id, 'game-master-unicorn') ? 3 : 0);
    const excess = p.hand.length - limit;
    if (excess > 0) {
      if (!('d' in res.data)) {
        e.ask(res, 'd', {
          playerId: p.id,
          title: `手牌上限 7 張：請棄 ${excess} 張`,
          kind: 'multi',
          min: excess,
          max: excess,
          options: e.handOptions(p.id),
        });
        return;
      }
      const uids = res.data.d as string[];
      e.discardUids(uids);
      e.log(`${p.name} 棄了 ${uids.length} 張牌`, 'leave');
    }
    const nx = e.nextTurnIndex();
    e.done(res);
    e.beginTurn(nx);
  },

  place_attach: (e, res) => {
    if (guardEnded(e, res)) return;
    if (!('tgt' in res.data)) {
      e.ask(res, 'tgt', { playerId: res.playerId, title: '選擇要掛到誰的馬廄', options: e.playerOptions() });
      return;
    }
    if (!('attached' in res.data)) {
      res.data.attached = 1;
      e.attachTo(String(res.data.tgt), String(res.data.src));
      const ad = e.defOf(String(res.data.src))!;
      if (ad.type === 'downgrade' && String(res.data.tgt) !== res.playerId && !e.blindingLighted(String(res.data.tgt)) && e.stableHas(String(res.data.tgt), 'unicorn-of-glory')) {
        e.removeRes(res);
        e.pushFront(e.makeRes('glory_search', String(res.data.tgt), {}));
        return;
      }
    }
    e.done(res);
  },

  destroy_unicorn_any: (e, res) => {
    if (guardEnded(e, res)) return;
    if (!('t' in res.data)) {
      let opts = e.destroyUnicornOptions(String(res.data.by ?? res.playerId));
      if (opts.length === 0) {
        e.done(res);
        return;
      }
      if (res.data.__optional) opts = [{ label: '跳過', value: '__none' }, ...opts];
      e.ask(res, 't', { playerId: res.playerId, title: String(res.data.__title ?? '選擇一隻獨角獸'), options: opts });
      return;
    }
    if (res.data.t === '__none') {
      e.done(res);
      return;
    }
    const c = e.parseStableChoice(res.data.t);
    if (!c) {
      e.done(res);
      return;
    }
    if (e.destroyUnicorn(res, String(res.data.by ?? res.playerId), c.uid)) return;
    e.done(res);
  },

  shield_black_knight: (e, res) => {
    if (!('go' in res.data)) {
      e.ask(res, 'go', {
        playerId: res.playerId,
        title: '黑騎士獨角獸：要犧牲它來保護你的獨角獸嗎？',
        options: [
          { label: '犧牲黑騎士，保護目標！', value: 'y' },
          { label: '不，讓它被消滅', value: 'n' },
        ],
      });
      return;
    }
    const byId = String(res.data.byId ?? '');
    const uid = String(res.data.uid ?? '');
    if (e.isYes(res.data.go)) {
      const bk = e.player(res.playerId)?.stable.find((c) => c.defId === 'black-knight-unicorn');
      if (bk) e.sacrificeCard(res.playerId, bk.uid);
      e.log(`黑騎士獨角獸挺身而出，${e.defOf(uid)?.nameZh} 得救了！`, 'block');
    } else {
      e.destroyNow(res.playerId, uid, byId);
    }
    e.done(res);
  },

  barbed_discard: (e, res) => {
    const p = e.player(res.playerId);
    if (!p || p.hand.length === 0 || !e.stableHas(p.id, 'barbed-wire')) {
      e.done(res);
      return;
    }
    if (!('u' in res.data)) {
      e.ask(res, 'u', { playerId: p.id, title: '有刺鐵絲網：馬廄有變動，棄 1 張牌', options: e.handOptions(p.id) });
      return;
    }
    e.discardUids([String(res.data.u)]);
    e.log(`${p.name} 因鐵絲網棄了 1 張牌`, 'leave');
    e.done(res);
  },

  tiny_enforce: (e, res) => {
    const pid = res.playerId;
    if (e.realUnicornCount(pid) > 5) {
      if ('t' in res.data) {
        e.sacrificeCard(pid, String(res.data.t));
        delete res.data.t;
      }
      if (e.realUnicornCount(pid) > 5) {
        e.ask(res, 't', { playerId: pid, title: '迷你馬廄：超過 5 隻，必須犧牲一隻獨角獸', options: ownUnicorns(e, pid) });
        return;
      }
    }
    e.done(res);
  },
};

// 魔法卡與其餘處理器合併進來
for (const [k, h] of Object.entries(MAGIC_HANDLERS)) HANDLERS[k] = h;
registerMore(HANDLERS);

// ── 魔法獨角獸進場效果 ──────────────────────────────────────

HANDLERS['entry_alluring-narwhal'] = (e, res) => {
  if (!('go' in res.data)) {
    const opts = stableAttachCards(e, (d) => d.type === 'upgrade', [res.playerId]);
    if (opts.length === 0) {
      e.done(res);
      return;
    }
    e.ask(res, 'go', { playerId: res.playerId, title: '迷人角鯨：偷走一張升級卡？', options: [{ label: '跳過', value: '__n' }, ...opts] });
    return;
  }
  if (res.data.go !== '__n') {
    const c = e.parseStableChoice(res.data.go);
    if (c) e.moveAttachTo(res.playerId, c.uid);
  }
  e.done(res);
};

HANDLERS['entry_americorn'] = (e, res) => {
  if (!('v' in res.data)) {
    const victims = e.s.players.filter((p) => p.id !== res.playerId && p.hand.length > 0);
    if (victims.length === 0) {
      e.done(res);
      return;
    }
    e.ask(res, 'v', {
      playerId: res.playerId,
      title: '美洲獨角獸：從誰的手牌抽走一張？',
      options: victims.map((p) => ({ label: `${p.name}（${p.hand.length} 張）`, value: p.id })),
    });
    return;
  }
  const victim = e.player(String(res.data.v));
  if (victim && victim.hand.length > 0) {
    const idx = Math.floor(e.consumeRand()() * victim.hand.length);
    const uid = victim.hand.splice(idx, 1)[0]!;
    e.player(res.playerId)?.hand.push(uid);
    e.log(`${e.nameOf(res.playerId)} 從 ${victim.name} 手上抽走了一張牌`, 'move');
  }
  e.done(res);
};

HANDLERS['entry_annoying-flying-unicorn'] = (e, res) => {
  if (!('go' in res.data)) {
    const victims = e.s.players.filter((p) => p.hand.length > 0);
    if (victims.length === 0) {
      e.done(res);
      return;
    }
    e.ask(res, 'go', {
      playerId: res.playerId,
      title: '惱人飛飛獨角獸：指定一人棄牌？',
      options: [{ label: '跳過', value: '__n' }, ...victims.map((p) => ({ label: p.name, value: p.id }))],
    });
    return;
  }
  if (res.data.go !== '__n') {
    const v = e.player(String(res.data.go));
    if (v && v.hand.length > 0) {
      if (!('d' in res.data)) {
        e.ask(res, 'd', { playerId: v.id, title: '惱人飛飛獨角獸：棄 1 張牌', options: e.handOptions(v.id) });
        return;
      }
      e.discardUids([String(res.data.d)]);
    }
  }
  e.done(res);
};

HANDLERS['entry_chainsaw-unicorn'] = (e, res) => {
  if (!('k' in res.data)) {
    const ups = stableAttachCards(e, (d) => d.type === 'upgrade');
    const downs = stableAttachCards(e, (d) => d.type === 'downgrade');
    const opts: ChoiceOption[] = [{ label: '跳過', value: '__n' }];
    if (ups.length > 0) opts.push({ label: '消滅一張升級卡', value: '__up' });
    if (downs.length > 0) opts.push({ label: '移除一張降級卡', value: '__down' });
    e.ask(res, 'k', { playerId: res.playerId, title: '電鋸獨角獸：發動什麼？', options: opts });
    return;
  }
  const k = String(res.data.k);
  if (k === '__n') {
    e.done(res);
    return;
  }
  if (!('t' in res.data)) {
    const opts = k === '__up' ? stableAttachCards(e, (d) => d.type === 'upgrade') : stableAttachCards(e, (d) => d.type === 'downgrade');
    e.ask(res, 't', { playerId: res.playerId, title: '電鋸獨角獸：選擇目標', options: opts });
    return;
  }
  if (!('cut' in res.data)) {
    res.data.cut = 1;
    const c = e.parseStableChoice(res.data.t);
    if (c) e.forceRemoveToDiscard(c.uid, k === '__up' ? '消滅' : '移除');
  }
  e.done(res);
};

HANDLERS['entry_dark-angel-unicorn'] = (e, res) => {
  if (!('go' in res.data)) {
    const canSac = ownUnicorns(e, res.playerId).length > 0;
    const canRevive = e.discardOptions((d) => isUnicorn(d.type)).length > 0;
    if (!canSac || !canRevive) {
      e.done(res);
      return;
    }
    e.ask(res, 'go', { playerId: res.playerId, title: '黑暗天使獨角獸：犧牲一隻，換回一位？', options: e.ynOptions() });
    return;
  }
  if (!e.isYes(res.data.go)) {
    e.done(res);
    return;
  }
  if (!('sac' in res.data)) {
    e.ask(res, 'sac', { playerId: res.playerId, title: '黑暗天使：犧牲哪一隻？', options: ownUnicorns(e, res.playerId) });
    return;
  }
  if (!('rv' in res.data)) {
    if (!('saced' in res.data)) {
      res.data.saced = 1;
      e.sacrificeCard(res.playerId, String(res.data.sac));
    }
    const opts = e.discardOptions((d) => isUnicorn(d.type));
    if (opts.length === 0) {
      e.done(res);
      return;
    }
    e.ask(res, 'rv', { playerId: res.playerId, title: '黑暗天使：喚醒棄牌堆的哪一隻？', options: opts });
    return;
  }
  reviveFromDiscard(e, res.playerId, String(res.data.rv));
  e.done(res);
};

HANDLERS['entry_extremely-destructive-unicorn'] = (e, res) => {
  if (guardEnded(e, res)) return;
  const players = e.s.players;
  let j = Number(res.data.j ?? 0);
  while (j < players.length && ownUnicorns(e, players[j]!.id).length === 0) j++;
  if (j >= players.length) {
    e.done(res);
    return;
  }
  const f = `s${j}`;
  if (!(f in res.data)) {
    e.ask(res, f, {
      playerId: players[j]!.id,
      title: '極度毀滅獨角獸：每個人都要犧牲一隻獨角獸',
      options: ownUnicorns(e, players[j]!.id),
    });
    return;
  }
  e.sacrificeCard(players[j]!.id, String(res.data[f]));
  res.data.j = j + 1;
};
