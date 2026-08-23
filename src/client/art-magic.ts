import { INK, st, sparkle, heart } from './art-prim';
import { uniHead } from './art-prim';

export function kickArt(): string {
  let s = `<path d="M 22 54 q 14 -20 34 -18 q 16 2 18 16" fill="none" stroke="#e0a86a" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path d="M 74 52 q 7 4 5 11 l -13 0 q -2 -6 8 -11" fill="${INK}"/>`;
  s += `<path d="M 30 28 q -10 -2 -12 6" fill="none" stroke="#c96f6f" stroke-width="4" stroke-linecap="round"/>`;
  s += sparkle(24, 20, 5, '#ffd93d');
  return s;
}

export function stealHandArt(): string {
  let s = `<rect x="24" y="14" width="26" height="34" rx="4" fill="#dff3ff" ${st(2.8)} transform="rotate(-10 37 31)"/>`;
  s += `<circle cx="37" cy="26" r="5" fill="#ffcf5c" ${st(1.8)} transform="rotate(-10 37 31)"/>`;
  s += `<path d="M 58 70 q 2 -18 14 -24 l 9 8 q -10 6 -10 17 Z" fill="#ffd0b0" ${st(3)}/>`;
  s += `<path d="M 72 44 l 6 5 M 66 40 l 5 6" ${st(2)}/>`;
  return s;
}

export function cloverArt(): string {
  let s = `<circle cx="42" cy="34" r="12" fill="#58c98d" ${st(2.8)}/>`;
  s += `<circle cx="60" cy="34" r="12" fill="#58c98d" ${st(2.8)}/>`;
  s += `<circle cx="42" cy="50" r="12" fill="#58c98d" ${st(2.8)}/>`;
  s += `<circle cx="60" cy="50" r="12" fill="#58c98d" ${st(2.8)}/>`;
  s += `<path d="M 51 52 q 4 12 12 16" fill="none" stroke="#3da06e" stroke-width="4.4" stroke-linecap="round"/>`;
  s += sparkle(76, 20, 5) + sparkle(22, 60, 4);
  return s;
}

export function tornadoArt(): string {
  let s = `<path d="M 18 20 h 64 M 26 32 h 48 M 34 44 h 34 M 42 56 h 20" stroke="#5aa9e6" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  s += `<path d="M 46 68 q 4 6 12 6" fill="none" stroke="#a8d8f8" stroke-width="5" stroke-linecap="round"/>`;
  s += sparkle(80, 62, 5, '#ffd93d') + heart(16, 60, 5, '#a8d8f8');
  return s;
}

export function dealArt(): string {
  let s = `<ellipse cx="50" cy="52" rx="24" ry="18" fill="#ffd93d" ${st(3)}/>`;
  s += `<path d="M 36 38 l -8 -14 M 64 38 l 8 -14" ${st(4)}/>`;
  s += `<path d="M 40 50 q 4 5 10 0 q 6 5 10 0" fill="none" ${st(2.6)}/>`;
  s += `<text x="50" y="47" text-anchor="middle" font-size="12" font-weight="bold" fill="${INK}">$</text>`;
  return s;
}

export function kissArt(): string {
  let s = `<path d="M 50 66 C 22 46, 30 18, 50 32 C 70 18, 78 46, 50 66 Z" fill="#ff7ab8" ${st(3)}/>`;
  s += `<path d="M 36 34 q 6 -6 12 -2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
  s += sparkle(76, 20, 5) + sparkle(20, 26, 4, '#ffb3d1');
  return s;
}

export function vortexArt(): string {
  let s = `<path d="M 50 44 m 0 -4 a 4 4 0 1 1 -0.1 0" fill="${INK}"/>`;
  s += `<path d="M 50 44 a 10 10 0 1 0 10 10" fill="none" stroke="#a86ee0" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="M 60 54 a 18 18 0 1 0 -18 18" fill="none" stroke="#5cc9c0" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="M 42 72 a 27 27 0 1 0 -27 -27" fill="none" stroke="#ff7ab8" stroke-width="6" stroke-linecap="round"/>`;
  s += sparkle(80, 22, 4.5);
  return s;
}

export function retargetArt(): string {
  let s = `<circle cx="50" cy="44" r="18" fill="none" stroke="#c96f6f" stroke-width="4"/>`;
  s += `<path d="M 50 20 v 12 M 50 56 v 12 M 26 44 h 12 M 62 44 h 12" stroke="#c96f6f" stroke-width="4" stroke-linecap="round"/>`;
  s += `<circle cx="50" cy="44" r="4" fill="#c96f6f"/>`;
  s += `<path d="M 74 66 q 8 -2 8 -10 q 0 -6 -6 -8" fill="none" stroke="#5aa9e6" stroke-width="3.4" stroke-linecap="round"/>`;
  s += `<polygon points="74,50 70,58 79,57" fill="#5aa9e6"/>`;
  return s;
}

export function resetArt(): string {
  let s = `<path d="M 30 40 a 22 22 0 1 1 -4 20" fill="none" stroke="#58c98d" stroke-width="7" stroke-linecap="round"/>`;
  s += `<polygon points="34,26 20,32 33,41" fill="#58c98d" ${st(2.4)}/>`;
  s += `<rect x="40" y="34" width="20" height="26" rx="4" fill="#fff" ${st(2.6)}/>`;
  s += `<circle cx="50" cy="43" r="4" fill="#ffcf5c"/><rect x="44" y="50" width="12" height="3" rx="1.5" fill="#c9cede"/>`;
  return s;
}

export function shakeArt(): string {
  let s = `<rect x="20" y="24" width="26" height="36" rx="4" fill="#dff3ff" ${st(2.8)} transform="rotate(-14 33 42)"/>`;
  s += `<rect x="54" y="22" width="26" height="36" rx="4" fill="#ffe9f4" ${st(2.8)} transform="rotate(12 67 40)"/>`;
  s += uniHead({ cx: 33, cy: 42, scale: 0.4, baby: true, mane: ['#a86ee0'] });
  s += `<path d="M 62 32 l 8 -6 M 64 44 l 10 -2 M 60 54 l 8 6" stroke="#ffcf5c" stroke-width="3" stroke-linecap="round"/>`;
  return s;
}

export function hammerArt(): string {
  let s = `<rect x="30" y="18" width="30" height="16" rx="4" fill="#8f8fa3" ${st(2.8)} transform="rotate(-35 45 26)"/>`;
  s += `<path d="M 42 34 L 62 66" stroke="#8f6b4f" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M 24 62 l 8 -6 M 20 52 l 10 -3" stroke="#ffd93d" stroke-width="3.4" stroke-linecap="round"/>`;
  s += sparkle(74, 26, 4.5);
  return s;
}

export function twoSwapArt(): string {
  let s = `<rect x="18" y="22" width="28" height="38" rx="4" fill="#dff3ff" ${st(2.8)} transform="rotate(-8 32 41)"/>`;
  s += `<rect x="54" y="22" width="28" height="38" rx="4" fill="#ffe9f4" ${st(2.8)} transform="rotate(8 68 41)"/>`;
  s += `<path d="M 40 60 q 10 10 22 2" fill="none" stroke="#a86ee0" stroke-width="4" stroke-linecap="round"/>`;
  s += `<polygon points="60,66 70,62 64,72" fill="#a86ee0" ${st(2)}/>`;
  s += `<path d="M 60 20 q -10 -8 -20 0" fill="none" stroke="#ff7ab8" stroke-width="4" stroke-linecap="round"/>`;
  s += `<polygon points="40,14 30,18 36,8" fill="#ff7ab8" ${st(2)}/>`;
  return s;
}

export function bargainArt(): string {
  let s = `<path d="M 14 44 q 12 -14 26 -4 l 8 6 q 4 4 -1 7 q -4 2 -7 0 l -6 -4" fill="#ffd0b0" ${st(3)}/>`;
  s += `<path d="M 86 44 q -12 -14 -26 -4 l -8 6 q -4 4 1 7 q 4 2 7 0 l 6 -4" fill="#ffd0b0" ${st(3)}/>`;
  s += `<path d="M 40 60 q 10 8 20 0" fill="none" ${st(2.4)}/>`.replace('stroke-width="3"', 'stroke-width="2.4"');
  s += sparkle(50, 16, 6, '#ffd93d');
  return s;
}

export function swapUnicornArt(): string {
  let s = uniHead({ cx: 28, cy: 44, scale: 0.62, mane: ['#ff7ab8'], body: '#fff' });
  s += uniHead({ cx: 72, cy: 44, scale: 0.62, mane: ['#5aa9e6'], body: '#fff' });
  s += `<path d="M 42 30 q 8 -10 16 0" fill="none" stroke="#58c98d" stroke-width="4" stroke-linecap="round"/>`;
  s += `<polygon points="56,34 62,28 63,37" fill="#58c98d" ${st(2)}/>`;
  s += `<path d="M 58 58 q -8 10 -16 0" fill="none" stroke="#a86ee0" stroke-width="4" stroke-linecap="round"/>`;
  s += `<polygon points="44,62 38,68 37,59" fill="#a86ee0" ${st(2)}/>`;
  return s;
}
