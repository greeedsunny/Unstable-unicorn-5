import { INK, st, uniHead, heart, sparkle } from './art-prim';

function narwhalBody(body = '#7ec8f2', belly = '#e8f8ff'): string {
  let s = `<path d="M 22 46 Q 20 24 44 22 Q 72 20 80 38 Q 84 48 74 56 Q 60 66 40 62 Q 24 58 22 46 Z" fill="${body}" ${st(3)}/>`;
  s += `<path d="M 30 52 Q 44 60 62 54" fill="none" ${st(2)} opacity="0.5"/>`;
  s += `<path d="M 78 36 q 10 -6 12 -14 q -2 10 4 16 Z" fill="${body}" ${st(2.6)}/>`;
  s += `<ellipse cx="46" cy="50" rx="14" ry="9" fill="${belly}" opacity="0.85"/>`;
  s += `<circle cx="42" cy="36" r="2.8" fill="${INK}"/><circle cx="43.2" cy="35" r="1" fill="#fff"/>`;
  s += `<path d="M 34 41 q 4 4 9 1" fill="none" ${st(2.4)}/>`;
  s += `<path d="M 30 26 q 2 -8 8 -9 M 34 27 q 3 -6 8 -6" fill="none" ${st(2)} />`;
  return s;
}

export function narwhalArt(o: { hat?: boolean; rocket?: boolean; patch?: boolean; waves?: boolean; crown?: boolean; hearts?: boolean; big?: boolean } = {}): string {
  let s = '';
  if (o.waves) {
    s += `<path d="M 6 64 q 10 -8 20 0 t 20 0 t 20 0 t 20 0" fill="none" stroke="#5aa9e6" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M 12 70 q 10 -8 20 0 t 20 0 t 20 0" fill="none" stroke="#a8d8f8" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  if (o.rocket) {
    s += `<path d="M 30 66 l -6 10 l 12 -4 Z" fill="#ff8f5c" ${st(2.4)}/><path d="M 40 68 l -2 9 l 8 -6 Z" fill="#ffd93d" ${st(2.4)}/>`;
  }
  s += narwhalBody();
  s += `<polygon points="52,18 46,4 58,10" fill="#ffcf5c" ${st(2.6)}/>`;
  s += `<path d="M 49 13 L 55 11" ${st(1.7)}/>`;
  if (o.patch) s += `<circle cx="66" cy="44" r="7" fill="#c96f6f" ${st(2.2)} opacity="0.9"/><path d="M 60 40 l 12 8" ${st(2)}/>`;
  if (o.hat) s += `<rect x="38" y="8" width="18" height="12" rx="2" fill="${INK}"/><rect x="32" y="19" width="30" height="4" rx="2" fill="${INK}"/>`;
  if (o.crown) s += `<path d="M 42 12 l 3 -7 l 4 5 l 4 -5 l 4 7 Z" fill="#ffd93d" ${st(2)}/>`;
  if (o.hearts) s += heart(76, 20, 6) + heart(86, 30, 4);
  return s;
}

export function llamaArt(): string {
  let s = `<path d="M 40 66 Q 36 46 40 34 Q 42 26 50 26 Q 58 26 60 34 Q 64 46 60 66 Z" fill="#fff6e8" ${st(3)}/>`;
  s += `<ellipse cx="50" cy="20" rx="15" ry="11" fill="#fff6e8" ${st(3)}/>`;
  s += `<path d="M 39 13 l -2 -9 l 8 5 Z" fill="#fff6e8" ${st(2.6)}/>`;
  s += `<path d="M 61 13 l 2 -9 l -8 5 Z" fill="#fff6e8" ${st(2.6)}/>`;
  s += `<path d="M 40 14 q 5 -5 10 0 q 5 -5 10 0" fill="none" ${st(2.4)}/>`;
  s += `<circle cx="45" cy="20" r="2.4" fill="${INK}"/><circle cx="55" cy="20" r="2.4" fill="${INK}"/>`;
  s += `<ellipse cx="50" cy="25" rx="5" ry="3.4" fill="#f3d9b1" ${st(1.8)}/>`;
  s += `<circle cx="48.4" cy="24.6" r="0.7" fill="${INK}"/><circle cx="51.6" cy="24.6" r="0.7" fill="${INK}"/>`;
  s += `<path d="M 30 40 q -8 2 -6 10 M 70 40 q 8 2 6 10" fill="none" ${st(2.4)}/>`;
  return s;
}

export function rhinoArt(): string {
  let s = `<ellipse cx="50" cy="46" rx="28" ry="23" fill="#b8b8c8" ${st(3)}/>`;
  s += `<polygon points="52,20 47,34 57,34" fill="#e8e8f2" ${st(2.6)}/>`;
  s += `<polygon points="30,30 27,39 36,37" fill="#e8e8f2" ${st(2.4)}/>`;
  s += `<path d="M 40 50 q 10 6 20 0" fill="none" ${st(2.4)}/>`;
  s += `<circle cx="40" cy="42" r="2.6" fill="${INK}"/><circle cx="58" cy="42" r="2.6" fill="${INK}"/>`;
  s += `<path d="M 36 37 l 7 -3 M 63 37 l -7 -3" fill="none" ${st(2.4)}/>`;
  s += `<ellipse cx="24" cy="46" rx="5" ry="7" fill="#ff9cb0" ${st(2.2)}/>`;
  s += `<circle cx="24" cy="43.5" r="1.2" fill="${INK}"/><circle cx="24" cy="48.5" r="1.2" fill="${INK}"/>`;
  return s;
}

export function sharkArt(): string {
  let s = `<path d="M 18 44 Q 30 24 54 26 Q 76 28 82 42 L 92 36 L 88 48 L 94 58 L 80 54 Q 68 64 48 62 Q 26 60 18 44 Z" fill="#8fb8de" ${st(3)}/>`;
  s += `<path d="M 48 26 L 54 10 L 62 26 Z" fill="#6f9cc4" ${st(2.6)}/>`;
  s += `<path d="M 30 56 Q 44 66 62 58" fill="none" ${st(2)} opacity="0.4"/>`;
  s += `<path d="M 60 46 l 5 5 l 5 -5 l 5 5 l 4 -4" fill="#fff" ${st(2.2)}/>`;
  s += `<circle cx="36" cy="40" r="3" fill="${INK}"/><circle cx="37.4" cy="38.8" r="1.1" fill="#fff"/>`;
  s += `<polygon points="26,34 20,26 30,29" fill="#ffcf5c" ${st(2.4)}/>`;
  return s;
}

export function gooseArt(): string {
  let s = `<ellipse cx="52" cy="50" rx="26" ry="20" fill="#ffffff" ${st(3)}/>`;
  s += `<path d="M 30 58 q -12 2 -14 -8 q 8 0 12 4" fill="#ffffff" ${st(2.6)}/>`;
  s += `<path d="M 62 34 q 2 -14 12 -14 q 9 0 8 10 q -1 8 -10 9" fill="#ffffff" ${st(2.8)}/>`;
  s += `<polygon points="82,28 94,31 82,35" fill="#ffb347" ${st(2.4)}/>`;
  s += `<circle cx="76" cy="24" r="2.2" fill="${INK}"/>`;
  s += `<path d="M 40 44 q 8 -6 16 0 M 44 56 q 8 -6 16 0" fill="none" ${st(2)} opacity="0.35"/>`;
  return s;
}

export function pandaFace(): string {
  let s = `<ellipse cx="50" cy="44" rx="27" ry="24" fill="#ffffff" ${st(3)}/>`;
  s += `<ellipse cx="32" cy="30" rx="9" ry="8" fill="${INK}" transform="rotate(-24 32 30)"/>`;
  s += `<ellipse cx="68" cy="30" rx="9" ry="8" fill="${INK}" transform="rotate(24 68 30)"/>`;
  s += `<circle cx="33" cy="31" r="2.6" fill="#fff"/><circle cx="67" cy="31" r="2.6" fill="#fff"/>`;
  s += `<path d="M 46 44 q 4 4 8 0" fill="none" ${st(2.6)}/>`;
  s += `<ellipse cx="50" cy="49" rx="4" ry="2.6" fill="${INK}"/>`;
  s += `<ellipse cx="26" cy="46" rx="3.4" ry="2.2" fill="#ff9cb0" opacity=".8"/><ellipse cx="74" cy="46" rx="3.4" ry="2.2" fill="#ff9cb0" opacity=".8"/>`;
  return s;
}

export function potionArt(color = '#8fe388'): string {
  let s = `<path d="M 44 14 h 12 v 10 l 10 12 q 6 8 0 16 q -6 8 -16 8 q -10 0 -16 -8 q -6 -8 0 -16 l 10 -12 Z" fill="#dff3ff" ${st(3)}/>`;
  s += `<path d="M 30 48 q 20 10 40 0 q -2 12 -20 12 q -18 0 -20 -12 Z" fill="${color}" ${st(2.4)}/>`;
  s += `<circle cx="42" cy="52" r="2.2" fill="#fff" opacity="0.9"/><circle cx="54" cy="56" r="1.6" fill="#fff" opacity="0.9"/>`;
  s += `<rect x="42" y="8" width="16" height="7" rx="2" fill="#c9a2e8" ${st(2.4)}/>`;
  return s;
}

export function cardBackArt(): string {
  let s = `<rect x="14" y="8" width="72" height="64" rx="10" fill="#e8dcfa" ${st(3)}/>`;
  s += `<path d="M 22 16 h 56 v 48 h -56 Z" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 4"/>`;
  s += uniHead({ cx: 50, cy: 44, scale: 0.72, mane: ['#a86ee0', '#5aa9e6'], mood: 'happy' });
  s += sparkle(24, 20, 4) + sparkle(76, 60, 4) + sparkle(78, 18, 3, '#ff7ab8');
  return s;
}

export function trashArt(): string {
  let s = `<path d="M 32 24 h 36 l -4 42 q -0.5 6 -7 6 h -14 q -6.5 0 -7 -6 Z" fill="#e8eaf0" ${st(3)}/>`;
  s += `<rect x="27" y="16" width="46" height="8" rx="4" fill="#c9cede" ${st(2.8)}/>`;
  s += `<path d="M 44 12 h 12 v 4 h -12 Z" fill="#c9cede" ${st(2.4)}/>`;
  s += `<path d="M 42 34 v 26 M 50 34 v 26 M 58 34 v 26" ${st(2.4)}/>`.replace('stroke-width="3"', 'stroke-width="2.4"');
  return s;
}

export function cribArt(): string {
  let s = `<path d="M 20 30 h 60 M 20 30 v 36 M 80 30 v 36" fill="none" stroke="#c98850" stroke-width="5" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M ${28 + i * 11} 32 v 32" stroke="#e0a86a" stroke-width="3.4" stroke-linecap="round"/>`;
  s += uniHead({ cx: 50, cy: 46, scale: 0.62, baby: true, mane: ['#ffd93d'], body: '#fffdf5' });
  return s;
}

export const CHAR_ART: Record<string, () => string> = {
  'alluring-narwhal': () => narwhalArt({ hearts: true }),
  'americorn': () => uniHead({ mane: ['#ff6b6b', '#5aa9e6'], mood: 'dot', extraFront: sparkle(76, 22, 5, '#ff6b6b') }),
  'annoying-flying-unicorn': () => uniHead({ wings: '#ffe9a8', mood: 'angry', mane: ['#ffb3d1'] }),
  'black-knight-unicorn': () =>
    uniHead({
      body: '#8f8fa3',
      mane: ['#5c5c73'],
      extraFront:
        `<path d="M 30 34 q 20 -14 40 0 l 0 10 q -20 8 -40 0 Z" fill="#7d7d95" ${st(2.8)}/>` +
        `<rect x="38" y="40" width="24" height="9" rx="4" fill="${INK}"/>`,
    }),
  'chainsaw-unicorn': () =>
    uniHead({ mane: ['#c96f6f'], extraFront: `<circle cx="74" cy="58" r="13" fill="#c9cede" ${st(2.8)}/><circle cx="74" cy="58" r="4" fill="${INK}"/><path d="M 63 52 l 22 12 M 63 64 l 22 -12" ${st(2)}/>` }),
  'classy-narwhal': () => narwhalArt({ hat: true }),
  'dark-angel-unicorn': () => uniHead({ body: '#b39ddb', wings: '#5c5c73', mane: ['#4527a0'], hornColor: '#ffe082', mood: 'wink', extraBack: `<ellipse cx="50" cy="12" rx="12" ry="3.5" fill="none" stroke="#ffd93d" stroke-width="3"/>` }),
  'extremely-destructive-unicorn': () =>
    uniHead({ mood: 'angry', mane: ['#ff8f5c'], extraBack: `<circle cx="20" cy="20" r="6" fill="#ff8f5c" ${st(2)}/><circle cx="82" cy="16" r="5" fill="#ffd93d" ${st(2)}/><path d="M 14 40 l -8 4 M 86 40 l 8 4" ${st(2.6)}/>` }),
  'ginormous-unicorn': () => uniHead({ scale: 1.28, cy: 48, mane: ['#a86ee0', '#ffd93d'], mood: 'dot' }),
  'greedy-flying-unicorn': () => uniHead({ wings: '#ffe9a8', mane: ['#ffd93d'], extraFront: `<circle cx="78" cy="60" r="8" fill="#ffd93d" ${st(2.4)}/><text x="78" y="64" text-anchor="middle" font-size="10" font-weight="bold" fill="${INK}">$</text>` }),
  'llamacorn': () => llamaArt(),
  'magical-flying-unicorn': () => uniHead({ wings: '#e3d1ff', mane: ['#a86ee0'], extraFront: sparkle(20, 20, 5) + sparkle(80, 26, 4) + sparkle(26, 62, 3.4) }),
  'magical-kittencorn': () => uniHead({ catEars: true, mane: ['#ffb3d1', '#a8e6cf'], whiskers: true }),
  'majestic-flying-unicorn': () => uniHead({ wings: '#ffe082', crown: true, mane: ['#ff7ab8', '#a86ee0'] }),
  'mermaid-unicorn': () =>
    uniHead({
      mane: ['#5cc9c0', '#a8e6cf'],
      extraFront:
        `<path d="M 34 60 a 6 6 0 1 1 0.1 0 M 66 60 a 6 6 0 1 1 0.1 0" fill="none" ${st(2.2)}/>` +
        `<path d="M 30 58 l 4 -4 l 4 4 l -4 4 Z" fill="#ff9cb0" ${st(1.8)}/>` +
        `<path d="M 62 58 l 4 -4 l 4 4 l -4 4 Z" fill="#ff9cb0" ${st(1.8)}/>`,
    }),
  'mother-goose-unicorn': () => gooseArt(),
  'narwhal-torpedo': () => narwhalArt({ rocket: true }),
  'necromancer-unicorn': () => uniHead({ body: '#cfe8d8', stitches: true, mane: ['#5c8a72'], mood: 'squeeze', extraFront: sparkle(80, 20, 4.5, '#a5d6a7') }),
  'queen-bee-unicorn': () => uniHead({ antenna: true, beeWings: true, mane: ['#ffd93d', '#ff8f5c'], extraBack: `<path d="M 12 14 l 6 0 l 3 5 l -3 5 l -6 0 l -3 -5 Z M 88 60 l 6 0 l 3 5 l -3 5 l -6 0 l -3 -5 Z" fill="#ffe9a8" ${st(2)}/>` }),
  'rainbow-unicorn': () =>
    uniHead({
      mane: ['#ff6b6b'],
      extraBack:
        `<path d="M 8 34 q 42 -30 84 0" fill="none" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M 10 40 q 40 -26 80 0" fill="none" stroke="#ffb347" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M 12 46 q 38 -22 76 0" fill="none" stroke="#ffd93d" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M 14 52 q 36 -18 72 0" fill="none" stroke="#58c98d" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M 16 58 q 34 -14 68 0" fill="none" stroke="#5aa9e6" stroke-width="5" stroke-linecap="round"/>`,
    }),
  'rhinocorn': () => rhinoArt(),
  'seductive-unicorn': () => uniHead({ mane: ['#ff7ab8'], mood: 'wink', extraFront: heart(78, 20, 7) + `<path d="M 70 62 q 4 4 9 2" ${st(2)} fill="none"/>` }),
  'shabby-the-narwhal': () => narwhalArt({ patch: true }),
  'shark-with-a-horn': () => sharkArt(),
  'stabby-the-unicorn': () => uniHead({ mane: ['#9aa0ab'], mood: 'dot', extraFront: `<path d="M 70 52 l 16 10 l -3 4 l -16 -9 Z" fill="#c9cede" ${st(2.2)}/><circle cx="72" cy="54" r="3.4" fill="#8f6b4f" ${st(2)}/>` }),
  'swift-flying-unicorn': () => uniHead({ wings: '#a8d8f8', mane: ['#5aa9e6'], extraBack: `<path d="M 6 34 l 14 -4 M 4 44 l 16 0 M 8 54 l 14 4" stroke="#5aa9e6" stroke-width="3.4" stroke-linecap="round"/>` }),
  'the-great-narwhal': () => narwhalArt({ waves: true }),
  'unicorn-oracle': () =>
    uniHead({
      mane: ['#5cc9c0'],
      extraFront:
        `<circle cx="76" cy="54" r="12" fill="#d8f3ff" ${st(2.8)}/>` +
        `<path d="M 70 50 q 6 -6 13 -1" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
        sparkle(64, 40, 4),
    }),
  'unicorn-phoenix': () => uniHead({ flames: '#ff6b3d', mane: ['#ffbe55'], hornColor: '#ff8f5c' }),
  'zombie-unicorn': () => uniHead({ body: '#b8d8b8', stitches: true, mane: ['#6f9c6f'], mood: 'squeeze' }),
};
