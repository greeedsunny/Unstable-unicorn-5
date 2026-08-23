import { INK, st, sparkle } from './art-prim';
import { uniHead } from './art-prim';

export function wireArt(): string {
  let s = `<path d="M 8 28 q 21 14 42 0 t 42 0" fill="none" stroke="#8f8fa3" stroke-width="4"/>`;
  s += `<path d="M 8 50 q 21 14 42 0 t 42 0" fill="none" stroke="#8f8fa3" stroke-width="4"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 16 + i * 14;
    const y = i % 2 === 0 ? 22 : 44;
    s += `<path d="M ${x} ${y} l 6 11 M ${x + 6} ${y} l -6 11" stroke="#c96f6f" stroke-width="3" stroke-linecap="round"/>`;
  }
  return s;
}

export function lightArt(): string {
  let s = `<circle cx="50" cy="42" r="14" fill="#ffe9a8" ${st(3)}/>`;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x1 = 50 + Math.cos(a) * 19;
    const y1 = 42 + Math.sin(a) * 19;
    const x2 = 50 + Math.cos(a) * 31;
    const y2 = 42 + Math.sin(a) * 31;
    s += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#ffd93d" stroke-width="4.4" stroke-linecap="round"/>`;
  }
  return s;
}

export function brokenStableArt(): string {
  let s = `<path d="M 20 64 v -28 l 13 -9 v 37 M 33 64 l 0 -37 l 15 7 v 30 M 66 64 v -32 l 14 7 v 25" fill="none" stroke="#c98850" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M 48 26 l 7 6 l -6 5 l 8 7" fill="none" stroke="#c96f6f" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 3"/>`;
  s += `<path d="M 14 66 h 72" stroke="#8f6b4f" stroke-width="5" stroke-linecap="round"/>`;
  return s;
}

export function camArt(): string {
  let s = `<rect x="24" y="26" width="44" height="32" rx="8" fill="#8f8fa3" ${st(3)}/>`;
  s += `<circle cx="46" cy="42" r="11" fill="${INK}"/><circle cx="46" cy="42" r="5.5" fill="#5aa9e6"/><circle cx="44" cy="40" r="2" fill="#fff"/>`;
  s += `<rect x="66" y="34" width="10" height="14" rx="3" fill="#c96f6f" ${st(2.4)}/>`;
  s += `<path d="M 32 58 l 4 10 M 60 58 l -4 10" stroke="#8f8fa3" stroke-width="4" stroke-linecap="round"/>`;
  s += `<circle cx="62" cy="32" r="2.4" fill="#ff6b6b"/>`;
  return s;
}

export function pandaArt(): string {
  let s = `<ellipse cx="50" cy="44" rx="27" ry="24" fill="#ffffff" ${st(3)}/>`;
  s += `<ellipse cx="32" cy="29" rx="9" ry="8" fill="${INK}" transform="rotate(-24 32 29)"/>`;
  s += `<ellipse cx="68" cy="29" rx="9" ry="8" fill="${INK}" transform="rotate(24 68 29)"/>`;
  s += `<circle cx="33" cy="30" r="2.6" fill="#fff"/><circle cx="67" cy="30" r="2.6" fill="#fff"/>`;
  s += `<ellipse cx="50" cy="48" rx="4" ry="2.8" fill="${INK}"/>`;
  s += `<path d="M 45 42 q 5 4 10 0" fill="none" ${st(2.6)}/>`;
  s += sparkle(20, 18, 4, '#8fce8f') + sparkle(80, 62, 4, '#8fce8f');
  return s;
}

export function candleArt(): string {
  let s = `<rect x="42" y="34" width="16" height="30" rx="4" fill="#fff2d9" ${st(3)}/>`;
  s += `<path d="M 50 33 q -9 -8 -3 -15 q 1 6 7 6 q -3 4 -4 9" fill="#ffbe55" ${st(2)}/>`;
  s += `<path d="M 50 19 v 7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  s += `<path d="M 26 70 q 24 8 48 0" fill="none" stroke="#a86ee0" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="6 5"/>`;
  s += sparkle(30, 30, 4, '#a86ee0') + sparkle(72, 26, 4, '#a86ee0');
  return s;
}

export function snailArt(): string {
  let s = `<circle cx="56" cy="42" r="18" fill="#ffb3d1" ${st(3)}/>`;
  s += `<circle cx="56" cy="42" r="10" fill="none" stroke="#e888ae" stroke-width="3"/>`;
  s += `<circle cx="56" cy="42" r="4" fill="none" stroke="#e888ae" stroke-width="2.6"/>`;
  s += `<path d="M 40 56 q -16 6 -22 -2 q -3 -7 6 -7 l 16 3" fill="#a8e6cf" ${st(3)}/>`;
  s += `<path d="M 30 48 l -3 -9 M 36 47 l 1 -9" stroke="#8fce8f" stroke-width="2.6" stroke-linecap="round"/>`;
  s += `<circle cx="29" cy="38" r="1.6" fill="${INK}"/>`;
  return s;
}

export function tinyBoxArt(): string {
  let s = `<rect x="26" y="28" width="48" height="38" rx="6" fill="#ffe9a8" ${st(3)}/>`;
  s += `<path d="M 26 42 h 48" ${st(2.6)}/>`;
  s += uniHead({ cx: 50, cy: 38, scale: 0.4, baby: true, mane: ['#a8d8f8'] });
  s += `<text x="50" y="62" text-anchor="middle" font-size="9" font-weight="bold" fill="${INK}">MAX 5</text>`;
  return s;
}

export function neighArt(superMode: boolean): string {
  const body = superMode ? '#ff8f5c' : '#ffffff';
  let s = `<ellipse cx="50" cy="46" rx="26" ry="21" fill="${body}" ${st(3)}/>`;
  s += `<polygon points="72,30 82,16 84,32" fill="${superMode ? '#ff6b3d' : '#e0a86a'}" ${st(2.4)}/>`;
  s += `<path d="M 74 34 q 10 -2 16 2 l -6 6 q -6 -2 -10 0" fill="${body}" ${st(2.6)}/>`;
  s += `<circle cx="42" cy="42" r="2.8" fill="${INK}"/><circle cx="58" cy="42" r="2.8" fill="${INK}"/>`;
  s += `<ellipse cx="50" cy="54" rx="10" ry="6.5" fill="#fce4ec" ${st(2.2)}/>`;
  s += `<ellipse cx="50" cy="53" rx="3.2" ry="2.4" fill="${INK}"/>`;
  const c = superMode ? '#ff6b3d' : '#ff7ab8';
  s += `<path d="M 18 30 l -11 -5 M 16 42 l -13 0 M 18 54 l -11 5" stroke="${c}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`;
  if (superMode) s += sparkle(84, 16, 6, '#ffd93d') + sparkle(12, 14, 4, '#ff7ab8');
  return s;
}
