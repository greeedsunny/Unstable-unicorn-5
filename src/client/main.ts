import { CARD_MAP } from '../shared/cards';
import type { ClientMsg, Prompt, PublicPlayer, ServerMsg, ServerView } from '../shared/types';

// ── 狀態 ─────────────────────────────────────────────────
const S = {
  ws: null as WebSocket | null,
  seat: localStorage.getItem('uu-seat') ?? '',
  room: localStorage.getItem('uu-room') ?? '',
  view: null as ServerView | null,
  sacrificeMode: false,
  pendingMulti: [] as unknown[],
  canDrawInstead: false,
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

// ── 渲染主流程 ───────────────────────────────────────────
function render(): void {
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
  $('#deck-num').textContent = String(st.deckCount);
  $('#nursery-num').textContent = String(st.nurseryCount);
  $('#win-target').textContent = String(st.winTarget);

  const cur = st.players[st.turn];
  const isMyTurn = cur?.id === v.youId && st.phase === 'playing';
  $('#turn-banner').textContent =
    st.phase === 'ended' ? '遊戲結束' : isMyTurn ? `🌟 輪到你了！（${phaseLabel(st.turnPhase)}）` : `🐴 ${cur?.name} 的回合`;

  renderDiscard(st.discardTop);
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
  el.title = `${def.name}\n${def.text}`;
  el.innerHTML = mini
    ? `<span class="emoji">${def.emoji}</span><span class="zh">${def.nameZh}</span>`
    : `<span class="badge">${typeBadge(def)}</span><span class="emoji">${def.emoji}</span><span class="zh">${def.nameZh}</span><span class="en">${def.name}</span>`;
  return el;
}

function typeBadge(d: { type: string }): string {
  return { baby: '幼獨', basic: '基本', magic_unicorn: '魔法獨角獸', magic: '魔法', instant: '瞬間', upgrade: '升級', downgrade: '降級' }[d.type] ?? '?';
}

function renderDiscard(top: string | null): void {
  const el = $('#discard-show');
  el.innerHTML = '';
  if (top) {
    const c = cardEl(top, true);
    c.classList.add('mini-card');
    el.appendChild(c);
  } else {
    el.append('🗑️');
  }
}

function renderOpponents(players: PublicPlayer[], turn: number): void {
  const wrap = $('#opponents');
  wrap.innerHTML = '';
  for (const p of players) {
    const div = document.createElement('div');
    div.className = `opponent${p.id === players[turn]?.id ? ' current' : ''}${p.connected ? '' : ' disconnected'}`;
    const unicorns = p.stable.filter((c) => ['baby', 'basic', 'magic_unicorn'].includes(CARD_MAP.get(c.uid.split('#')[0]!)!.type));
    const attaches = p.stable.filter((c) => !unicorns.includes(c));
    div.innerHTML = `
      <h4><span>${p.isHost ? '👑 ' : ''}${escapeHtml(p.name)}${p.id === S.view!.youId ? '（你）' : ''}</span>
      <span class="uni-count">🦄 ${p.unicornCount}</span></h4>
      <div class="stable-strip"></div>
      <div class="hand-note">🖐️ ${p.handCount} 張${p.handPublic && p.hand ? `：<span class="pub-hand"></span>` : ''}</div>`;
    const strip = div.querySelector('.stable-strip')!;
    for (const c of [...attaches.slice(0, 6), ...unicorns]) strip.appendChild(cardEl(c.uid, true));
    if (p.handPublic && p.hand) {
      const pub = div.querySelector('.pub-hand')!;
      pub.textContent = p.hand.map((u) => CARD_MAP.get(u.split('#')[0]!)?.nameZh).join('、');
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

  // 馬廄
  const stable = $('#my-stable');
  stable.innerHTML = '';
  if (me.stable.length === 0) stable.innerHTML = '<span class="slot-hint">馬廄空空如也…</span>';
  for (const c of me.stable) {
    const el = cardEl(c.uid);
    if (S.sacrificeMode) {
      el.classList.add('sac-target');
      el.onclick = () => confirmModal(`要犧牲「${CARD_MAP.get(c.uid.split('#')[0]!)?.nameZh}」嗎？`, () => send({ t: 'action', a: 'sacrifice', uid: c.uid }));
    }
    stable.appendChild(el);
  }

  // 手牌
  const canPlayNow =
    isMyTurn &&
    v.state.turnPhase === 'action' &&
    v.state.playsLeft > 0 &&
    !v.state.prompt &&
    !v.state.neighWindow;
  const hand = $('#my-hand');
  hand.innerHTML = '';
  for (const uid of me.hand ?? []) {
    const def = CARD_MAP.get(uid.split('#')[0]!)!;
    const el = cardEl(uid);
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

  // 抽牌代替按鈕（放在 prompt bar 前由 renderPrompt 處理）
  S.canDrawInstead = canPlayNow;
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
    if (S.canDrawInstead) {
      bar.classList.remove('hidden');
      bar.innerHTML = `<span class="ptitle">🌟 你的行動階段：點手牌打出，或改為抽牌</span>`;
      const b = document.createElement('button');
      b.className = 'btn small primary';
      b.textContent = '🎴 改為抽一張牌';
      b.onclick = () => send({ t: 'action', a: 'draw_instead' });
      bar.appendChild(b);
    }
    return;
  }
  if (pr.playerId !== v.youId) {
    bar.classList.remove('hidden');
    const who = v.state.players.find((p) => p.id === pr.playerId)?.name ?? '?';
    bar.innerHTML = `<span class="ptitle">⏳ 等待 ${escapeHtml(who)}：${escapeHtml(pr.title)}</span>`;
    return;
  }

  bar.classList.remove('hidden');
  bar.innerHTML = `<span class="ptitle">👉 ${escapeHtml(pr.title)}</span>`;

  const multi = pr.kind === 'multi';
  S.pendingMulti = [];
  for (const opt of pr.options) {
    const b = document.createElement('button');
    b.className = 'btn small';
    b.innerHTML = escapeHtml(opt.label);
    if (!multi) {
      b.onclick = () => send({ t: 'action', a: 'answer', promptId: pr.id, values: [opt.value] });
    } else {
      b.onclick = () => {
        const val = opt.value;
        const i = S.pendingMulti.indexOf(val);
        if (i >= 0) {
          S.pendingMulti.splice(i, 1);
          b.classList.remove('primary');
        } else {
          S.pendingMulti.push(val);
          b.classList.add('primary');
        }
        const need = pr.min ?? pr.max ?? 1;
        let okBtn = bar.querySelector<HTMLButtonElement>('#multi-ok');
        if (!okBtn) {
          okBtn = document.createElement('button');
          okBtn.id = 'multi-ok';
          okBtn.className = 'btn primary';
          okBtn.textContent = '確認';
          bar.appendChild(okBtn);
          okBtn.onclick = () =>
            send({ t: 'action', a: 'answer', promptId: pr.id, values: [...S.pendingMulti] });
        }
        okBtn.textContent = `確認（${S.pendingMulti.length}/${need}）`;
        okBtn.disabled = S.pendingMulti.length !== need;
      };
    }
    bar.appendChild(b);
  }
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

// ── 啟動 ─────────────────────────────────────────────────
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
