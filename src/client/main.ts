import { CARD_MAP } from '../shared/cards';
import type { ClientMsg, Prompt, PublicPlayer, ServerMsg, ServerView } from '../shared/types';
import { cardArt, cardBackArt, trashArt, cribArt } from './art';
import { CARD_IMG, TYPE_IMG } from './custom-art';

// ── 狀態 ─────────────────────────────────────────────────
const S = {
  ws: null as WebSocket | null,
  seat: localStorage.getItem('uu-seat') ?? '',
  room: localStorage.getItem('uu-room') ?? '',
  view: null as ServerView | null,
  sacrificeMode: false,
  pendingMulti: [] as unknown[],
  canDrawInstead: false,
  lastPromptId: '',
};

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => document.querySelector(sel)!;

function show(id: string): void {
  document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
  $(`#${id}`).classList.remove('hidden');
}

function toast(msg: string, err = false): void {
  const t = document.createElement('div');
  t.className = `toast${err ? ' err' : ''}`;
  t.textContent = msg;
  $('#toast-wrap').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── 連線 ─────────────────────────────────────────────────
function connect(room: string): void {
  S.room = room.toUpperCase();
  localStorage.setItem('uu-room', S.room);
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/api/room/${encodeURIComponent(S.room)}/ws`);
  S.ws = ws;

  ws.onopen = () => {
    send({ t: 'join', name: localStorage.getItem('uu-name') ?? '無名獨角獸', seat: S.seat || undefined });
  };
  ws.onmessage = (ev) => onServer(JSON.parse(ev.data as string) as ServerMsg);
  ws.onclose = () => toast('與伺服器斷線了，請重新整理', true);
}

function send(msg: ClientMsg): void {
  S.ws?.send(JSON.stringify(msg));
}

function onServer(msg: ServerMsg): void {
  switch (msg.t) {
    case 'welcome':
      break;
    case 'joined':
      S.seat = msg.seat;
      localStorage.setItem('uu-seat', msg.seat);
      break;
    case 'sync':
      S.view = msg.view;
      render();
      break;
    case 'error':
      toast(msg.msg, true);
      break;
    case 'chat':
      addChat(msg.from, msg.text);
      break;
  }
}

// ── 首頁／大廳 ───────────────────────────────────────────
function initHome(): void {
  const savedName = localStorage.getItem('uu-name') ?? '';
  ($('#inp-name') as HTMLInputElement).value = savedName;
  const urlRoom = new URLSearchParams(location.search).get('room');
  if (urlRoom) ($('#inp-code') as HTMLInputElement).value = urlRoom.toUpperCase();

  $('#btn-create').onclick = () => {
    if (!saveName()) return;
    const code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    connect(code);
  };
  $('#btn-join').onclick = () => {
    if (!saveName()) return;
    const code = ($('#inp-code') as HTMLInputElement).value.trim().toUpperCase();
    if (code.length < 3) return homeError('請輸入房間代碼');
    connect(code);
  };
  $('#btn-copy').onclick = () => {
    navigator.clipboard?.writeText(`${location.origin}${location.pathname}?room=${S.room}`);
    toast('邀請連結已複製！');
  };
  $('#btn-start').onclick = () => send({ t: 'start' });
  $('#btn-leave-lobby').onclick = () => location.reload();
}

function saveName(): boolean {
  const name = ($('#inp-name') as HTMLInputElement).value.trim();
  if (!name) return homeError('請先輸入暱稱');
  localStorage.setItem('uu-name', name);
  return true;
}

function homeError(msg: string): false {
  const el = $('#home-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  return false;
}

function addChat(from: string, text: string): void {
  const line = document.createElement('div');
  line.innerHTML = `<b>${escapeHtml(from)}：</b>${escapeHtml(text)}`;
  $('#chat-log').appendChild(line);
  $('#chat-log').scrollTop = 1e9;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ── 點卡回答提示 ─────────────────────────────────────────
function myPrompt(): Prompt | null {
  const v = S.view;
  const pr = v?.state.prompt;
  return pr && v && pr.playerId === v.youId ? pr : null;
}

function optionValueForUid(pr: Prompt, uid: string): unknown | null {
  for (const o of pr.options) {
    if (o.value === uid) return o.value;
    try {
      const parsed = JSON.parse(String(o.value)) as { uid?: unknown };
      if (parsed && typeof parsed === 'object' && parsed.uid === uid) return o.value;
    } catch {}
  }
  return null;
}

function isMultiSelected(val: unknown): boolean {
  return S.pendingMulti.some((v) => v === val);
}

function handleCardPromptClick(pr: Prompt, value: unknown): void {
  if (pr.kind === 'multi') {
    const i = S.pendingMulti.indexOf(value);
    if (i >= 0) S.pendingMulti.splice(i, 1);
    else S.pendingMulti.push(value);
    render();
  } else {
    send({ t: 'action', a: 'answer', promptId: pr.id, values: [value] });
  }
}

function applyCardSelectable(el: HTMLDivElement, uid: string, mini = false): void {
  const pr = myPrompt();
  if (!pr) return;
  const value = optionValueForUid(pr, uid);
  if (value === null) return;
  el.classList.add('selectable');
  if (pr.kind === 'multi' && isMultiSelected(value)) el.classList.add('selected');
  el.onclick = () => handleCardPromptClick(pr, value);
}

// ── 渲染主流程 ───────────────────────────────────────────
function render(): void {
  document.querySelector('.win-banner')?.remove();
  const v = S.view;
  if (!v) return;
  const st = v.state;

  if (st.phase === 'lobby') {
    show('screen-lobby');
    renderLobby(st.players);
    return;
  }

  show('screen-game');
  $('#topbar-code').textContent = S.room;
  $('#cnt-deck').textContent = String(st.deckCount);
  $('#cnt-discard').textContent = String(st.discardCount);
  $('#cnt-nursery').textContent = String(st.nurseryCount);
  $('#win-target').textContent = String(st.winTarget);

  const cur = st.players[st.turn];
  const isMyTurn = cur?.id === v.youId && st.phase === 'playing';
  $('#turn-banner').textContent =
    st.phase === 'ended' ? '遊戲結束' : isMyTurn ? `🌟 輪到你了！（${phaseLabel(st.turnPhase)}）` : `🐴 ${cur?.name} 的回合`;

  renderDiscard(st.discardTop);
  ($('.deck-pile') as HTMLElement).innerHTML = `<div class="pile-art">${cardBackArt()}</div><span>${st.deckCount}</span>`;
  ($('.nursery-pile') as HTMLElement).innerHTML = `<div class="pile-art">${cribArt()}</div><span>${st.nurseryCount}</span>`;
  renderOpponents(st.players, st.turn);
  renderLog(st.log);
  renderMyArea(v, isMyTurn);
  renderPrompt(v);
  renderNeighBar(v);
  renderEndBanner(v);

  const chatBtn = $('#btn-open-chat') as HTMLButtonElement;
  chatBtn.onclick = () => $('#chat-panel').classList.toggle('hidden');
  const sacBtn = $('#btn-sacrifice-mode') as HTMLButtonElement;
  sacBtn.classList.toggle('active', S.sacrificeMode);
  sacBtn.onclick = () => {
    S.sacrificeMode = !S.sacrificeMode;
    sacBtn.classList.toggle('active', S.sacrificeMode);
    render();
  };
}

function phaseLabel(p: string): string {
  return p === 'turn_start' ? '回合開始' : p === 'draw' ? '抽牌階段' : p === 'action' ? '行動階段' : '結束階段';
}

function renderLobby(players: PublicPlayer[]): void {
  $('#lobby-code').textContent = S.room;
  const ul = $('#lobby-players');
  ul.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${i + 1}. ${p.isHost ? '👑 ' : ''}${escapeHtml(p.name)}</span><span>${p.connected ? '🟢' : '🔴'}</span>`;
    ul.appendChild(li);
  });
  const me = players.find((p) => p.id === S.seat);
  ($('#btn-start') as HTMLButtonElement).disabled = !me?.isHost || players.length < 2;
}

function cardEl(uid: string, mini = false): HTMLDivElement {
  const def = CARD_MAP.get(uid.split('#')[0]!)!;
  const el = document.createElement('div');
  el.className = `${mini ? 'card-mini' : 'card'} t-${def.type}`;
  el.dataset.tipName = `${def.nameZh}`;
  el.dataset.tipEn = `${typeBadge(def)} · ${def.name}`;
  el.dataset.tipText = def.text;
  const imgUrl = CARD_IMG[def.id] ?? TYPE_IMG[def.type] ?? '';
  const artHtml = imgUrl
    ? `<img class="custom-img" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(def.nameZh)}" loading="lazy" onerror="this.outerHTML=window.__fallbackArt('${def.id}')">`
    : cardArt(def);
  el.innerHTML = mini
    ? `<div class="art">${artHtml}</div><span class="zh">${def.nameZh}</span>`
    : `<span class="badge">${typeBadge(def)}</span><div class="art">${artHtml}</div><span class="zh">${def.nameZh}</span><span class="en">${def.name}</span>`;
  return el;
}

function typeBadge(d: { type: string }): string {
  return { baby: '幼獨', basic: '基本', magic_unicorn: '魔法獨角獸', magic: '魔法', instant: '瞬間', upgrade: '升級', downgrade: '降級' }[d.type] ?? '?';
}

function renderDiscard(top: string | null): void {
  const el = $('#discard-show');
  el.innerHTML = '';
  el.title = '點擊檢視棄牌堆';
  el.style.cursor = 'pointer';
  if (top) {
    const c = cardEl(top, true);
    c.classList.add('mini-card');
    el.appendChild(c);
  } else {
    el.innerHTML = `<div class="pile-art">${trashArt()}</div>`;
  }
  el.onclick = () => openDiscardViewer();
}

function openDiscardViewer(): void {
  const v = S.view;
  if (!v) return;
  const list = v.state.discardList ?? [];
  const box = $('#modal-box');
  box.innerHTML = `<h3>🗑️ 棄牌堆（${list.length} 張）</h3><div class="m-options" style="display:flex;flex-wrap:wrap;gap:8px;"></div><div class="m-actions"><button class="btn small" id="m-close">關閉</button></div>`;
  const wrap = box.querySelector('.m-options')!;
  if (list.length === 0) wrap.innerHTML = '<span style="opacity:.5">目前是空的</span>';
  for (const uid of [...list].reverse()) {
    wrap.appendChild(cardEl(uid, true));
  }
  box.querySelector('#m-close')!.addEventListener('click', () => $('#modal').classList.add('hidden'));
  $('#modal').classList.remove('hidden');
}

function renderOpponents(players: PublicPlayer[], turn: number): void {
  const wrap = $('#opponents');
  wrap.innerHTML = '';
  const pr = myPrompt();
  for (const p of players) {
    if (p.id === S.view!.youId) continue;
    const div = document.createElement('div');
    div.className = `opponent${p.id === players[turn]?.id ? ' current' : ''}${p.connected ? '' : ' disconnected'}`;
    const unicorns = p.stable.filter((c) => ['baby', 'basic', 'magic_unicorn'].includes(CARD_MAP.get(c.uid.split('#')[0]!)!.type));
    const attaches = p.stable.filter((c) => !unicorns.includes(c));
    div.innerHTML = `
      <h4><span>${p.isHost ? '👑 ' : ''}${escapeHtml(p.name)}</span>
      <span class="uni-count">🦄 ${p.unicornCount}</span></h4>
      <div class="stable-strip"></div>
      <div class="hand-note">🖐️ ${p.handCount} 張${p.handPublic && p.hand ? `：<span class="pub-hand"></span>` : ''}</div>`;
    const strip = div.querySelector('.stable-strip')!;
    for (const c of [...attaches.slice(0, 6), ...unicorns]) {
      const cel = cardEl(c.uid, true);
      applyCardSelectable(cel, c.uid, true);
      strip.appendChild(cel);
    }
    if (p.handPublic && p.hand) {
      const pub = div.querySelector('.pub-hand')!;
      pub.textContent = p.hand.map((u) => CARD_MAP.get(u.split('#')[0]!)?.nameZh).join('、');
    }
    if (pr && pr.kind !== 'multi') {
      const opt = pr.options.find((o) => o.value === p.id);
      if (opt) {
        div.classList.add('selectable-player');
        div.title = `點擊選擇 ${p.name}`;
        div.onclick = () => send({ t: 'action', a: 'answer', promptId: pr.id, values: [opt.value] });
      }
    }
    wrap.appendChild(div);
  }
}

function renderLog(log: { t: number; msg: string; cls?: string }[]): void {
  const list = $('#log-list');
  const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  list.innerHTML = '';
  for (const entry of log) {
    const d = document.createElement('div');
    if (entry.cls) d.className = `l-${entry.cls}`;
    d.textContent = entry.msg;
    list.appendChild(d);
  }
  if (atBottom) list.scrollTop = 1e9;
}

function renderMyArea(v: ServerView, isMyTurn: boolean): void {
  const me = v.state.players.find((p) => p.id === v.youId)!;
  $('#my-count').textContent = String(me.unicornCount);

  // 馬廄（分組：獨角獸／升級／降級）
  const stable = $('#my-stable');
  stable.innerHTML = '';
  if (me.stable.length === 0) {
    stable.innerHTML = '<span class="slot-hint">馬廄空空如也…</span>';
  } else {
    const isUniC = (uid: string) => ['baby', 'basic', 'magic_unicorn'].includes(CARD_MAP.get(uid.split('#')[0]!)!.type);
    const groups: { label: string; cards: typeof me.stable }[] = [
      { label: '🦄 獨角獸', cards: me.stable.filter((c) => isUniC(c.uid)) },
      { label: '⬆ 升級', cards: me.stable.filter((c) => CARD_MAP.get(c.uid.split('#')[0]!)!.type === 'upgrade') },
      { label: '⬇ 降級', cards: me.stable.filter((c) => CARD_MAP.get(c.uid.split('#')[0]!)!.type === 'downgrade') },
    ];
    for (const g of groups) {
      if (g.cards.length === 0) continue;
      const sec = document.createElement('div');
      sec.className = 'stable-group';
      sec.innerHTML = `<div class="sg-label">${g.label} ×${g.cards.length}</div><div class="sg-row"></div>`;
      const row = sec.querySelector('.sg-row')!;
      for (const c of g.cards) {
        const el = cardEl(c.uid);
        applyCardSelectable(el, c.uid);
        if (S.sacrificeMode && !el.classList.contains('selectable')) {
          el.classList.add('sac-target');
          el.onclick = () => confirmModal(`要犧牲「${CARD_MAP.get(c.uid.split('#')[0]!)?.nameZh}」嗎？`, () => send({ t: 'action', a: 'sacrifice', uid: c.uid }));
        }
        row.appendChild(el);
      }
      stable.appendChild(sec);
    }
  }

  // 手牌
  const canPlayNow =
    isMyTurn &&
    v.state.turnPhase === 'action' &&
    v.state.playsLeft > 0 &&
    !v.state.prompt &&
    !v.state.neighWindow;
  S.canDrawInstead = canPlayNow;
  const drawSlot = $('#draw-slot');
  drawSlot.innerHTML = '';
  const actPr = myPrompt();
  const hasDrawOpt = !!actPr && actPr.options.some((o) => o.value === '__draw');
  if (hasDrawOpt || S.canDrawInstead) {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.style.marginLeft = '8px';
    b.textContent = '🎴 改為抽一張牌';
    b.title = '結束行動階段';
    b.onclick = () => {
      if (actPr && hasDrawOpt) send({ t: 'action', a: 'answer', promptId: actPr.id, values: ['__draw'] });
      else send({ t: 'action', a: 'draw_instead' });
    };
    drawSlot.appendChild(b);
  }
  const hand = $('#my-hand');
  hand.innerHTML = '';
  for (const uid of me.hand ?? []) {
    const def = CARD_MAP.get(uid.split('#')[0]!)!;
    const el = cardEl(uid);
    applyCardSelectable(el, uid);
    if (el.classList.contains('selectable')) {
      hand.appendChild(el);
      continue;
    }
    const playable = canPlayNow && ['basic', 'magic_unicorn', 'magic', 'upgrade', 'downgrade'].includes(def.type);
    if (playable) el.classList.add('playable');
    else el.classList.add('dim');
    el.onclick = () => {
      if (!playable) {
        if (isMyTurn && v.state.turnPhase === 'action' && !v.state.prompt && !v.state.neighWindow) {
          toast(def.type === 'instant' ? '瞬間卡只能在別人出牌時回應！' : '現在不能打這張牌', true);
        }
        return;
      }
      playHandCard(uid, def.type, v);
    };
    hand.appendChild(el);
  }
}

function playHandCard(uid: string, type: string, _v: ServerView): void {
  void type;
  send({ t: 'action', a: 'play_card', uid });
}

function confirmModal(text: string, yes: () => void): void {
  const box = $('#modal-box');
  box.innerHTML = `<h3>${text}</h3><div class="m-actions">
    <button class="btn primary" id="m-yes">確定</button>
    <button class="btn small" id="m-no">取消</button></div>`;
  box.querySelector('#m-yes')!.addEventListener('click', () => {
    $('#modal').classList.add('hidden');
    S.sacrificeMode = false;
    ($('#btn-sacrifice-mode') as HTMLButtonElement).classList.remove('active');
    yes();
  });
  box.querySelector('#m-no')!.addEventListener('click', () => $('#modal').classList.add('hidden'));
  $('#modal').classList.remove('hidden');
}

// ── Prompt / Neigh / 結束畫面 ─────────────────────────────
function renderPrompt(v: ServerView): void {
  const bar = $('#prompt-bar');
  const pr = v.state.prompt;
  if (!pr) {
    bar.classList.add('hidden');
    S.lastPromptId = '';
    return;
  }
  // 行動階段：不出黃色框，改用發光手牌＋手牌區的抽牌按鈕
  if (pr.options.some((o) => o.value === '__draw')) {
    bar.classList.add('hidden');
    return;
  }
  if (pr.playerId !== v.youId) {
    bar.classList.remove('hidden');
    const who = v.state.players.find((p) => p.id === pr.playerId)?.name ?? '?';
    const turnOwner = v.state.players[v.state.turn]?.name ?? '?';
    bar.innerHTML = `<span class="ptitle">（輪到 ${escapeHtml(turnOwner)}）⏳ 等待 ${escapeHtml(who)}：${escapeHtml(pr.title)}</span>`;
    return;
  }

  if (S.lastPromptId !== pr.id) {
    S.lastPromptId = pr.id;
    S.pendingMulti = [];
  }

  bar.classList.remove('hidden');
  const multi = pr.kind === 'multi';
  const need = pr.min ?? pr.max ?? 1;
  bar.innerHTML = `<span class="ptitle">👉 ${escapeHtml(pr.title)}${
    promptHasCardTargets(pr) ? '<span class="phint">（也可直接點擊桌上發光的卡片）</span>' : ''
  }${multi ? `<span class="phint">已選 ${S.pendingMulti.length}/${need} — 點卡片選擇，按「確認」送出</span>` : ''}</span>`;

  if (multi) {
    const okBtn = document.createElement('button');
    okBtn.className = 'btn primary';
    okBtn.textContent = `確認（${S.pendingMulti.length}/${need}）`;
    okBtn.disabled = S.pendingMulti.length !== need;
    okBtn.onclick = () => send({ t: 'action', a: 'answer', promptId: pr.id, values: [...S.pendingMulti] });
    bar.appendChild(okBtn);
  }

  for (const opt of pr.options) {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.innerHTML = escapeHtml(opt.label);
    attachCardTipToButton(b, opt.value);
    if (!multi) {
      b.onclick = () => send({ t: 'action', a: 'answer', promptId: pr.id, values: [opt.value] });
    } else {
      b.onclick = () => toggleMulti(pr, opt.value);
      if (isMultiSelected(opt.value)) b.classList.add('primary');
    }
    bar.appendChild(b);
  }
}

function attachCardTipToButton(b: HTMLButtonElement, value: unknown): void {
  let defId: string | null = null;
  if (typeof value === 'string' && /#\d+$/.test(value)) defId = value.split('#')[0]!;
  else {
    try {
      const parsed = JSON.parse(String(value)) as { uid?: string } | null;
      if (parsed?.uid) defId = parsed.uid.split('#')[0]!;
    } catch {}
  }
  if (!defId) return;
  const def = CARD_MAP.get(defId);
  if (!def) return;
  b.dataset.tipName = def.nameZh;
  b.dataset.tipEn = `${typeBadge(def)} · ${def.name}`;
  b.dataset.tipText = def.text;
}

function toggleMulti(pr: Prompt, value: unknown): void {
  const i = S.pendingMulti.indexOf(value);
  if (i >= 0) S.pendingMulti.splice(i, 1);
  else S.pendingMulti.push(value);
  render();
}

function promptHasCardTargets(pr: Prompt): boolean {
  return pr.options.some((o) => {
    if (typeof o.value === 'string' && /#\d+$/.test(o.value)) return true;
    try {
      const p = JSON.parse(String(o.value)) as { uid?: unknown } | null;
      return !!(p && typeof p === 'object' && p.uid);
    } catch {
      return false;
    }
  });
}

function renderNeighBar(v: ServerView): void {
  const bar = $('#neigh-bar');
  const w = v.state.neighWindow;
  if (!w || v.state.phase !== 'playing') {
    bar.classList.add('hidden');
    return;
  }
  const srcDef = CARD_MAP.get(w.sourceUid.split('#')[0]!);
  const by = v.state.players.find((p) => p.id === w.byId)?.name ?? '?';
  bar.classList.remove('hidden');

  if (!w.canRespond) {
    $('#neigh-text').innerHTML = `${escapeHtml(by)} 打出了「<b>${srcDef?.nameZh}</b>」—— 你已表態`;
    ($('#btn-neigh') as HTMLButtonElement).style.display = 'none';
    ($('#btn-pass') as HTMLButtonElement).style.display = 'none';
    return;
  }

  $('#neigh-text').innerHTML = `⚡ ${escapeHtml(by)} 打出了「<b>${srcDef?.nameZh}</b>」！要 Neigh 嗎？`;
  const neighBtn = $('#btn-neigh') as HTMLButtonElement;
  neighBtn.style.display = '';
  ($('#btn-pass') as HTMLButtonElement).style.display = '';

  neighBtn.onclick = () => {
    const me = v.state.players.find((p) => p.id === v.youId)!;
    const instants = (me.hand ?? []).filter((u) => CARD_MAP.get(u.split('#')[0]!)?.type === 'instant');
    if (instants.length === 0) {
      toast('你沒有瞬間卡！', true);
      return;
    }
    if (instants.length === 1) {
      send({ t: 'action', a: 'neigh', uid: instants[0] });
      return;
    }
    const box = $('#modal-box');
    box.innerHTML = '<h3>要用哪張瞬間卡？</h3><div class="m-options"></div>';
    const opts = box.querySelector('.m-options')!;
    for (const uid of instants) {
      const el = cardEl(uid);
      el.onclick = () => {
        $('#modal').classList.add('hidden');
        send({ t: 'action', a: 'neigh', uid });
      };
      opts.appendChild(el);
    }
    $('#modal').classList.remove('hidden');
  };

  $('#btn-pass').onclick = () => send({ t: 'action', a: 'neigh' });
}

function renderEndBanner(v: ServerView): void {
  document.querySelector('.win-banner')?.remove();
  if (v.state.phase !== 'ended') return;
  const winner = v.state.players.find((p) => p.id === v.state.winner);
  const div = document.createElement('div');
  div.className = 'win-banner';
  const isMe = winner?.id === v.youId;
  div.innerHTML = `
    <div class="confetti">🎉🦄🎉</div>
    <h1>${winner ? `${escapeHtml(winner.name)} ${isMe ? '贏了！！' : '獲勝！'}` : '沒有人獲勝'}</h1>
    <p>${isMe ? '你的馬廄閃閃發光 ✨' : winner ? `率先湊齊 ${v.state.winTarget} 隻獨角獸！` : ''}</p>
    <div class="btn-row">
      <button class="btn primary" id="btn-again">🔄 再來一局</button>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#btn-again')!.addEventListener('click', () => send({ t: 'action', a: 'restart' }));
}

// ── 可愛風提示框 ─────────────────────────────────────────
const tipBox = document.createElement('div');
tipBox.id = 'uu-tip';
tipBox.classList.add('hidden');
document.body.appendChild(tipBox);

function positionTip(ev: MouseEvent): void {
  const pad = 16;
  const r = tipBox.getBoundingClientRect();
  let x = ev.clientX + pad;
  let y = ev.clientY + pad;
  if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
  tipBox.style.left = `${x}px`;
  tipBox.style.top = `${y}px`;
}

document.addEventListener('mouseover', (ev) => {
  const t = (ev.target as HTMLElement).closest?.('[data-tip-name]') as HTMLElement | null;
  if (!t) {
    tipBox.classList.add('hidden');
    return;
  }
  const ds = t.dataset;
  tipBox.innerHTML = `<div class="tt-name">${escapeHtml(ds.tipName ?? '')}</div><div class="tt-en">${escapeHtml(ds.tipEn ?? '')}</div><div class="tt-text">${escapeHtml(ds.tipText ?? '')}</div>`;
  tipBox.classList.remove('hidden');
  positionTip(ev);
});
document.addEventListener('mousemove', (ev) => {
  if (!tipBox.classList.contains('hidden')) positionTip(ev);
});
document.addEventListener('mouseout', (ev) => {
  if ((ev.target as HTMLElement).closest?.('[data-tip-name]')) tipBox.classList.add('hidden');
});

// ── 啟動 ─────────────────────────────────────────────────
(window as unknown as { __fallbackArt: (id: string) => string }).__fallbackArt = (id: string): string => {
  const def = CARD_MAP.get(id);
  return def ? cardArt(def) : '';
};
$('#chat-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const inp = $('#chat-inp') as HTMLInputElement;
  if (!inp.value.trim()) return;
  send({ t: 'chat', text: inp.value });
  inp.value = '';
});

initHome();

const autoRoom = new URLSearchParams(location.search).get('room');
if (autoRoom && localStorage.getItem('uu-name')) {
  saveName();
  connect(autoRoom);
}
