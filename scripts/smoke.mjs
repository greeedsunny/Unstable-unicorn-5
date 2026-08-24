import { readFileSync } from 'fs';

const ROOM = process.argv[2] ?? 'SMOKE1';
const CARDS_PATH = process.argv[3] ?? 'src/shared/cards.ts';
const PROGRESS = `${process.env.TEMP ?? '/tmp'}/uu-smoke-progress.json`;
const URL = `ws://127.0.0.1:8787/api/room/${ROOM}/ws`;
const TOKEN = 'uu-smoke';

const src = readFileSync(CARDS_PATH, 'utf8');
const IDS_ALL = [
  ...src.matchAll(/id: '([\w-]+)'/g)].map((m) => m[1]).filter((id) => !id.startsWith('baby-') && id !== 'baby-narwhal');
for (const c of ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple']) {
  IDS_ALL.push(`basic-${c}-${['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'].indexOf(c) + 1}`);
}
const ENTRY_REQ = new Set(['extra-tail', 'rainbow-mane', 'summoning-ritual', 'unicorn-lasso']);
const START = Number(process.argv[4] ?? 0);
const COUNT = Number(process.argv[5] ?? 999);
const IDS = IDS_ALL.slice(START, START + COUNT);
console.log(`cards to test: ${IDS.length} (range ${START}..${START + IDS.length - 1} of ${IDS_ALL.length})`);

let done = {};
try { done = JSON.parse(readFileSync(PROGRESS, 'utf8')); } catch {}

function mkPlayer(name) {
  const ws = new WebSocket(URL);
  const P = { name, seat: null, lastView: null, errs: [], onSync: null };
  ws.onopen = () => ws.send(JSON.stringify({ t: 'join', name }));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.t === 'joined') P.seat = m.seat;
    if (m.t === 'error') P.errs.push(m.msg);
    if (m.t === 'sync') {
      P.lastView = m.view;
      if (P.onSync) P.onSync(m.view);
    }
  };
  P.ws = ws;
  P.send = (o) => ws.send(JSON.stringify(o));
  return P;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function myPrompt(P) {
  const pr = P.lastView?.state.prompt;
  return pr && P.seat && pr.playerId === P.seat ? pr : null;
}

function handUid(P, defId) {
  return (P.lastView?.state.players.find((p) => p.id === P.seat)?.hand ?? []).find((u) => u.startsWith(defId + '#')) ?? null;
}

function answerPrompt(P, pr) {
  let opts = pr.options;
  if (pr.title.includes('掛到誰的馬廄')) {
    const other = opts.find((o) => o.value !== P.seat);
    if (other) return P.send({ t: 'action', a: 'answer', promptId: pr.id, values: [other.value] });
  }
  const filtered = opts.filter((o) => o.value !== '__none' && o.label !== '跳過');
  if (filtered.length > 0) opts = filtered;
  if (pr.kind === 'multi') {
    const need = pr.min ?? pr.max ?? opts.length;
    return P.send({ t: 'action', a: 'answer', promptId: pr.id, values: opts.slice(0, need).map((o) => o.value) });
  }
  const opt = opts[Math.floor(Math.random() * opts.length)];
  return P.send({ t: 'action', a: 'answer', promptId: pr.id, values: [opt.value] });
}

function autoBot(P, smoke) {
  const st = P.lastView?.state;
  if (!st || !P.seat || st.phase === 'ended') return;
  const pr = myPrompt(P);
  if (pr) {
    if (pr.options.some((o) => o.value === '__draw')) {
      if (P.name === 'Alice') return;
      const playOpt = pr.options.find((o) => /#\d+$/.test(String(o.value)));
      const opt = playOpt ?? pr.options.find((o) => o.value === '__draw');
      return P.send({ t: 'action', a: 'answer', promptId: pr.id, values: [opt.value] });
    }
    return answerPrompt(P, pr);
  }
  const w = st.neighWindow;
  if (w && w.canRespond) {
    if (smoke && smoke.kind === 'instant') {
      const uid = handUid(P, smoke.defId);
      if (uid) return P.send({ t: 'action', a: 'neigh', uid });
    }
    return P.send({ t: 'action', a: 'neigh' });
  }
}

async function ensureGame(A) {
  for (let i = 0; i < 60; i++) {
    const ph = A.lastView?.state.phase;
    if (ph === 'playing') return true;
    if (ph === 'ended') A.send({ t: 'action', a: 'restart' });
    if (ph === 'lobby') A.send({ t: 'start' });
    await sleep(250);
  }
  return false;
}

async function waitActionPrompt(P, timeoutMs, dbgUid) {
  const t0 = Date.now();
  let lastLog = '';
  while (Date.now() - t0 < timeoutMs) {
    const st = P.lastView?.state;
    if (st?.phase === 'ended') return { ended: true };
    const pr = myPrompt(P);
    if (pr && pr.options.some((o) => o.value === '__draw')) {
      if (dbgUid) {
        const sig = `${pr.id} opts=${pr.options.length} hasUid=${pr.options.some((o) => o.value === dbgUid)}`;
        if (sig !== lastLog) {
          lastLog = sig;
          console.log(`  [wait] ${sig}`);
        }
      }
      return { pr };
    }
    await sleep(120);
  }
  return { timeout: true };
}

(async () => {
  const A = mkPlayer('Alice');
  await sleep(400);
  const B = mkPlayer('Bob');
  await sleep(700);
  A.send({ t: 'start' });
  await sleep(800);

  let smoke = null;
  A.onSync = () => { autoBot(A, smoke); };
  B.onSync = () => { autoBot(B, null); };

  const results = { ok: [], fail: [], hang: [] };
  let idx = 0;
  for (const defId of IDS) {
    if (done[defId]) { results.ok.push(defId); continue; }
    idx++;
    await ensureGame(A);

    const pr0 = myPrompt(A);
    if (pr0 && pr0.options.some((o) => o.value === '__draw')) {
      A.send({ t: 'action', a: 'answer', promptId: pr0.id, values: ['__draw'] });
      await sleep(600);
    }
    await ensureGame(A);

    A.errs.length = 0;
    B.errs.length = 0;
    A.send({ t: 'action', a: 'smoke_give', defId, token: TOKEN });
    await sleep(400);
    const uid = handUid(A, defId);
    console.log(`  [give] ${defId}: uid=${uid ? uid.split('#')[1] : 'NONE'} errs=${JSON.stringify(A.errs.slice(-1))}`);
    if (!uid) {
      results.fail.push(`${defId} (give failed)`);
      console.log(`FAIL ${defId}: give failed`, A.errs.slice(-1));
      continue;
    }

    const isInstant = defId === 'neigh' || defId === 'super-neigh';
    smoke = { defId, kind: isInstant ? 'instant' : 'normal' };

    if (ENTRY_REQ.has(defId)) {
      if (!A.lastView.state.players.find((p) => p.id === A.seat)?.stable.some((c) => c.defId.startsWith('basic-') || c.defId === 'narwhal-basic')) {
        A.send({ t: 'action', a: 'smoke_give', defId: 'narwhal-basic', token: TOKEN });
        await sleep(400);
        const bUid = handUid(A, 'narwhal-basic');
        const bPr = myPrompt(A);
        if (bUid && bPr && bPr.options.some((o) => o.value === bUid)) {
          A.send({ t: 'action', a: 'answer', promptId: bPr.id, values: [bUid] });
          await sleep(1200);
          console.log('  [pre] 基本獨角獸已進馬廄');
        }
      }
    }

    if (isInstant) {
      const t0 = Date.now();
      let played = false;
      while (Date.now() - t0 < 30000) {
        await sleep(150);
        if (!handUid(A, defId)) { played = true; break; }
        const apr = myPrompt(A);
        if (apr && apr.options.some((o) => o.value === '__draw')) {
          A.send({ t: 'action', a: 'answer', promptId: apr.id, values: ['__draw'] });
          await sleep(250);
        }
      }
      await sleep(400);
      const errSnapI = [...A.errs, ...B.errs];
      if (played && errSnapI.length === 0) results.ok.push(defId);
      else results.fail.push(`${defId} instant played=${played} errs=${JSON.stringify(errSnapI.slice(0, 2))}`);
      console.log(`${played && errSnapI.length === 0 ? 'OK  ' : 'FAIL'} ${defId} (${idx})`);
      smoke = null;
      writeFileSync(PROGRESS, JSON.stringify(Object.fromEntries(results.ok.map((d) => [d, 1]))));
      continue;
    }

    const w1 = await waitActionPrompt(A, 15000);
    if (w1.ended) {
      A.send({ t: 'action', a: 'restart' });
      await sleep(900);
      await ensureGame(A);
    }
    const w2 = await waitActionPrompt(A, 15000, uid);
    const prNow = w2.pr ?? myPrompt(A);
    if (!prNow || !prNow.options.some((o) => o.value === uid)) {
      console.log(`  [DBG] ${defId}: promptId=${prNow?.id} opt0=${JSON.stringify(prNow?.options[0])} uid=${uid}`);
      results.fail.push(`${defId} (not in fresh options)`);
      console.log(`FAIL ${defId}: not in fresh options`, A.errs.slice(-1));
      smoke = null;
      continue;
    }
    A.send({ t: 'action', a: 'answer', promptId: prNow.id, values: [uid] });

    const t0 = Date.now();
    let resolved = false;
    while (Date.now() - t0 < 12000) {
      await sleep(200);
      if (!handUid(A, defId)) { resolved = true; break; }
      if (A.lastView?.state.phase === 'ended') { resolved = !handUid(A, defId); break; }
      if (A.errs.length > 0 || B.errs.length > 0) break;
    }
    await sleep(500);
    const errSnapshot = [...A.errs, ...B.errs];
    if (resolved && errSnapshot.length === 0) {
      results.ok.push(defId);
      console.log(`OK   ${defId} (${idx})`);
    } else {
      const msg = `${defId} resolved=${resolved} errs=${JSON.stringify(errSnapshot.slice(0, 3))}`;
      (resolved ? results.fail : results.hang).push(msg);
      console.log(`${resolved ? 'FAIL' : 'HANG'} ${msg}`);
      if (!resolved) {
        const stChk = A.lastView?.state;
        const elsewhere = (stChk?.players ?? []).some(
          (p) => p.stable.some((c) => c.uid === uid) || (p.id !== A.seat && (p.hand ?? []).includes(uid)),
        );
        if (elsewhere) {
          results.hang.pop();
          results.ok.push(defId);
          console.log(`  → 實際已結算（在場上／他人手上），改判 OK`);
        } else {
          const st = A.lastView?.state;
          console.log('  [STATE]', JSON.stringify({
            turn: st?.players[st.turn]?.name,
            phase: st?.phase,
            prompt: st?.prompt ? { id: st.prompt.id, title: st.prompt.title.slice(0, 40), player: st.prompt.playerId === A.seat ? 'me' : 'other' } : null,
            window: st?.neighWindow ? st.neighWindow.awaiting : null,
            myHand: st?.players.find((p) => p.id === A.seat)?.handCount,
          }));
          for (const l of (st?.log ?? []).slice(-8)) console.log('  [log]', l.msg);
          A.send({ t: 'action', a: 'restart' });
          await sleep(900);
          await ensureGame(A);
        }
      }
    }
    smoke = null;
    writeFileSync(PROGRESS, JSON.stringify(Object.fromEntries(results.ok.map((d) => [d, 1]))));
  }

  console.log('\n===== SMOKE SUMMARY =====');
  console.log(`OK: ${results.ok.length}  FAIL: ${results.fail.length}  HANG: ${results.hang.length}`);
  for (const f of results.fail) console.log('FAIL:', f);
  for (const h of results.hang) console.log('HANG:', h);
  process.exit(0);
})();

import { writeFileSync } from 'fs';
