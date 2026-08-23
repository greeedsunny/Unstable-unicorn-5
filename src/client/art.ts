import type { CardDef } from '../shared/types';
import { svgWrap, sparkle } from './art-prim';
import { CHAR_ART, narwhalArt, cardBackArt, trashArt, cribArt } from './art-chars';
import { bombArt, partyArt, auraArt, ropeArt, coffeeArt, clawArt, lassoArt, slingArt } from './art-up';
import { wireArt, lightArt, brokenStableArt, camArt, pandaArt, candleArt, snailArt, tinyBoxArt, neighArt } from './art-down';
import {
  kickArt, stealHandArt, cloverArt, tornadoArt, dealArt, kissArt, vortexArt,
  retargetArt, resetArt, shakeArt, hammerArt, twoSwapArt, bargainArt, swapUnicornArt,
} from './art-magic';

const ITEM_ART: Record<string, () => string> = {
  'back-kick': kickArt,
  'blatant-thievery': stealHandArt,
  'change-of-luck': cloverArt,
  'glitter-tornado': tornadoArt,
  'good-deal': dealArt,
  'kiss-of-life': kissArt,
  'mystical-vortex': vortexArt,
  're-target': retargetArt,
  'reset-button': resetArt,
  'shake-up': shakeArt,
  'targeted-destruction': hammerArt,
  'two-for-one': twoSwapArt,
  'unfair-bargain': bargainArt,
  'unicorn-poison': () => potionArt('#8fe388'),
  'unicorn-swap': swapUnicornArt,

  'glitter-bomb': bombArt,
  'yay': partyArt,
  'rainbow-aura': auraArt,
  'double-dutch': ropeArt,
  'caffeine-overload': coffeeArt,
  'claw-machine': clawArt,
  'rainbow-lasso': lassoArt,
  'stable-artillery': slingArt,

  'barbed-wire': wireArt,
  'blinding-light': lightArt,
  'broken-stable': brokenStableArt,
  'nanny-cam': camArt,
  'pandamonium': pandaArt,
  'sadistic-ritual': candleArt,
  'slowdown': snailArt,
  'tiny-stable': tinyBoxArt,

  'neigh': () => neighArt(false),
  'super-neigh': () => neighArt(true),
};

function potionArt(color: string): string {
  let s = `<path d="M 44 14 h 12 v 10 l 10 12 q 6 8 0 16 q -6 8 -16 8 q -10 0 -16 -8 q -6 -8 0 -16 l 10 -12 Z" fill="#eef7ff" ${'stroke="#4a3b52" stroke-width="3"'}/>`;
  s += `<path d="M 30 48 q 20 10 40 0 q -2 12 -20 12 q -18 0 -20 -12 Z" fill="${color}" stroke="#4a3b52" stroke-width="2.4"/>`;
  s += `<circle cx="42" cy="52" r="2.2" fill="#fff" opacity="0.9"/><circle cx="54" cy="56" r="1.6" fill="#fff" opacity="0.9"/>`;
  s += `<rect x="42" y="8" width="16" height="7" rx="2" fill="#c9a2e8" stroke="#4a3b52" stroke-width="2.4"/>`;
  return s;
}

// 基本／幼獨角獸色系
const COLOR_MAP: Record<string, string> = {
  red: '#ffb3b3', orange: '#ffd0a8', yellow: '#fff3ae', green: '#c8f0d0',
  blue: '#bcdcf5', indigo: '#ccd4f5', purple: '#e2ccf5', pink: '#ffd6ea',
  black: '#c8c8d8', white: '#ffffff', brown: '#e8cdb0', rainbow: '#ffffff',
  death: '#d8cfe8',
};

function fallbackByType(def: CardDef): string {
  const color = def.color ? COLOR_MAP[def.color.toLowerCase()] ?? undefined : undefined;
  switch (def.type) {
    case 'baby':
      return uniBaby(color);
    case 'basic':
      return def.id === 'narwhal-basic'
        ? narwhalArt()
        : uniStd(color ?? '#ffffff', ['#a86ee0', '#ff7ab8']);
    case 'magic_unicorn':
      return uniStd('#ffffff', ['#a86ee0', '#ff7ab8'], true);
    case 'magic':
      return wandArt();
    case 'instant':
      return neighArt(false);
    case 'upgrade':
      return arrowUp();
    default:
      return arrowDown();
  }
}

import { uniHead } from './art-prim';

function uniStd(body?: string, mane?: string[], sparkly = false): string {
  const inner = uniHead({ body, mane });
  return sparkly ? inner + sparkle(84, 18, 4) : inner;
}

function uniBaby(body?: string): string {
  return uniHead({ body: body ?? '#fffdf5', mane: [body ?? '#ffe9a8'], baby: true, scale: 0.9, cy: 48 });
}

function wandArt(): string {
  let s = `<path d="M 34 62 L 62 26" stroke="#8f6b4f" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="M 30 58 L 58 22" stroke="#a8825f" stroke-width="3" stroke-linecap="round"/>`;
  s += sparkle(66, 20, 7) + sparkle(78, 34, 4.5, '#ff7ab8') + sparkle(56, 12, 4, '#5aa9e6');
  return s;
}

function arrowUp(): string {
  return (
    `<path d="M 50 66 L 50 30 M 50 30 L 32 48 M 50 30 L 68 48" stroke="#58c98d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    sparkle(24, 24, 4.5)
  );
}

function arrowDown(): string {
  return (
    `<path d="M 50 20 L 50 56 M 50 56 L 32 38 M 50 56 L 68 38" stroke="#7d6b99" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<path d="M 30 70 h 40" stroke="#7d6b99" stroke-width="6" stroke-linecap="round"/>`
  );
}

export function cardArt(def: CardDef): string {
  const fn = CHAR_ART[def.id] ?? ITEM_ART[def.id];
  const inner = fn ? fn() : fallbackByType(def);
  return svgWrap(inner);
}

export { cardBackArt, trashArt, cribArt };
