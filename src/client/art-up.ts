import { INK, st, sparkle, heart } from './art-prim';
import { uniHead } from './art-prim';

export function bombArt(): string {
  let s = `<circle cx="48" cy="50" r="22" fill="${INK}"/>`;
  s += `<circle cx="41" cy="43" r="6" fill="#6f6f85"/>`;
  s += `<path d="M 56 34 q 4 -10 12 -10" fill="none" stroke="#8f6b4f" stroke-width="4" stroke-linecap="round"/>`;
  s += sparkle(72, 20, 5, '#ff8f5c') + sparkle(80, 32, 3.4, '#ffd93d');
  return s;
}

export function partyArt(): string {
  let s = `<polygon points="30,58 62,26 70,34 38,66 Z" fill="#ff7ab8" ${st(2.8)}/>`;
  s += `<path d="M 62 26 l 14 -14 M 70 34 l 16 -6" ${st(2.4)}/>`;
  s += `<circle cx="82" cy="14" r="3.4" fill="#ffd93d"/><circle cx="90" cy="24" r="2.8" fill="#5aa9e6"/><circle cx="74" cy="8" r="2.8" fill="#58c98d"/>`;
  s += sparkle(20, 30, 4) + heart(28, 16, 5);
  return s;
}

export function auraArt(): string {
  let s = `<path d="M 16 54 a 34 28 0 0 1 68 0" fill="none" stroke="#ffd93d" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M 23 58 a 27 22 0 0 1 54 0" fill="none" stroke="#ff7ab8" stroke-width="5" stroke-linecap="round" opacity="0.75"/>`;
  s += uniHead({ cx: 50, cy: 48, scale: 0.66, mane: ['#a86ee0'] });
  return s;
}

export function ropeArt(): string {
  let s = `<path d="M 16 26 q 34 40 68 -6" fill="none" stroke="#c98850" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="M 16 26 q 34 40 68 -6" fill="none" stroke="#e0a86a" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 5"/>`;
  s += `<circle cx="16" cy="26" r="5" fill="#8f6b4f" ${st(2.4)}/><circle cx="84" cy="20" r="5" fill="#8f6b4f" ${st(2.4)}/>`;
  return s;
}

export function coffeeArt(): string {
  let s = `<path d="M 28 28 h 36 v 22 q 0 16 -18 16 q -18 0 -18 -16 Z" fill="#fff" ${st(3)}/>`;
  s += `<path d="M 64 32 q 14 2 10 12 q -3 8 -12 6" fill="none" ${st(3)}/>`;
  s += `<path d="M 38 20 q -3 -6 2 -10 M 50 20 q -3 -6 2 -10" fill="none" stroke="#c98850" stroke-width="3.4" stroke-linecap="round"/>`;
  s += `<path d="M 32 44 h 28" stroke="#a86ee0" stroke-width="4" stroke-linecap="round"/>`;
  return s;
}

export function clawArt(): string {
  let s = `<rect x="24" y="10" width="52" height="58" rx="8" fill="#dff3ff" ${st(3)}/>`;
  s += `<rect x="30" y="16" width="40" height="26" rx="4" fill="#fff" ${st(2.4)}/>`;
  for (const x of [40, 50, 60]) s += `<circle cx="${x}" cy="35" r="5" fill="#ffb3d1" ${st(1.8)}/>`;
  s += `<path d="M 44 16 l -5 11 M 50 16 l 0 13 M 56 16 l 5 11" stroke="#8f8fa3" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="42" cy="53" r="7" fill="#ffd93d" ${st(2.2)}/><circle cx="58" cy="55" r="6" fill="#58c98d" ${st(2.2)}/>`;
  s += `<rect x="34" y="61" width="32" height="5" rx="2.5" fill="#a86ee0"/>`;
  return s;
}

export function lassoArt(): string {
  let s = `<ellipse cx="46" cy="46" rx="24" ry="18" fill="none" stroke="#ff7ab8" stroke-width="6" transform="rotate(-18 46 46)" stroke-dasharray="14 6" stroke-linecap="round"/>`;
  s += `<path d="M 66 30 q 14 -8 18 4" fill="none" stroke="#c98850" stroke-width="4" stroke-linecap="round"/>`;
  s += heart(76, 20, 7);
  s += sparkle(22, 24, 5);
  return s;
}

export function slingArt(): string {
  let s = `<path d="M 30 20 L 46 52 M 62 24 L 48 52" stroke="#8f6b4f" stroke-width="4.4" stroke-linecap="round"/>`;
  s += `<path d="M 30 20 Q 46 34 62 24" fill="none" stroke="#c96f6f" stroke-width="3.4"/>`;
  s += `<circle cx="46" cy="56" r="7" fill="${INK}"/>`;
  s += sparkle(76, 44, 4.5, '#ff8f5c');
  return s;
}
