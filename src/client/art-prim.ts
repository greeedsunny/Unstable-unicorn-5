// 卡面插畫：共用原件（原創 kawaii 風向量插畫）

export const INK = '#4a3b52';

export function st(w = 3): string {
  return `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
}

export function svgWrap(inner: string): string {
  return `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

export function sparkle(x: number, y: number, r = 5, color = '#ffd93d'): string {
  const q = r * 0.22;
  return `<path d="M ${x} ${y - r} Q ${x + q} ${y - q} ${x + r} ${y} Q ${x + q} ${y + q} ${x} ${y + r} Q ${x - q} ${y + q} ${x - r} ${y} Q ${x - q} ${y - q} ${x} ${y - r} Z" fill="${color}" ${st(2)}/>`;
}

export function heart(x: number, y: number, s = 6, color = '#ff7ab8'): string {
  return `<path d="M ${x} ${y + s * 0.55} C ${x - s * 1.3} ${y - s * 0.4}, ${x - s * 0.55} ${y - s * 1.15}, ${x} ${y - s * 0.35} C ${x + s * 0.55} ${y - s * 1.15}, ${x + s * 1.3} ${y - s * 0.4}, ${x} ${y + s * 0.55} Z" fill="${color}" ${st(2)}/>`;
}

function eyeDot(x: number, y: number): string {
  return `<circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/><circle cx="${x + 1}" cy="${y - 1.2}" r="0.9" fill="#fff"/>`;
}

function eyes(mood: string, lx: number, rx: number, y: number): string {
  if (mood === 'dot') return eyeDot(lx, y) + eyeDot(rx, y);
  if (mood === 'angry')
    return (
      `<path d="M ${lx - 4} ${y - 5} L ${lx + 4} ${y - 2}" fill="none" ${st(2.6)}/>` +
      `<path d="M ${rx + 4} ${y - 5} L ${rx - 4} ${y - 2}" fill="none" ${st(2.6)}/>` +
      eyeDot(lx, y + 2) + eyeDot(rx, y + 2)
    );
  if (mood === 'squeeze')
    return (
      `<path d="M ${lx - 4} ${y - 3} Q ${lx} ${y + 2} ${lx + 4} ${y - 3}" fill="none" ${st(2.8)}/>` +
      `<path d="M ${rx - 4} ${y - 3} Q ${rx} ${y + 2} ${rx + 4} ${y - 3}" fill="none" ${st(2.8)}/>`
    );
  if (mood === 'wink')
    return eyeDot(lx, y) + `<path d="M ${rx - 4} ${y + 1} Q ${rx} ${y - 5} ${rx + 4} ${y + 1}" fill="none" ${st(3)}/>`;
  return (
    `<path d="M ${lx - 4} ${y + 1} Q ${lx} ${y - 5} ${lx + 4} ${y + 1}" fill="none" ${st(3)}/>` +
    `<path d="M ${rx - 4} ${y + 1} Q ${rx} ${y - 5} ${rx + 4} ${y + 1}" fill="none" ${st(3)}/>`
  );
}

export interface UniOpts {
  body?: string;
  mane?: string[];
  hornColor?: string;
  mood?: string;
  cx?: number;
  cy?: number;
  scale?: number;
  baby?: boolean;
  wings?: string;
  catEars?: boolean;
  antenna?: boolean;
  beeWings?: boolean;
  stitches?: boolean;
  whiskers?: boolean;
  flames?: string;
  crown?: boolean;
  extraBack?: string;
  extraFront?: string;
}

export function uniHead(o: UniOpts = {}): string {
  const cx = o.cx ?? 50;
  const hy = o.cy ?? 46;
  const k = o.scale ?? 1;
  const body = o.body ?? '#ffffff';
  const m0 = o.mane?.[0] ?? '#a86ee0';
  const m1 = o.mane?.[1] ?? '#ff7ab8';
  const hr = 24 * k;
  let s = o.extraBack ?? '';

  if (o.beeWings) {
    s += `<ellipse cx="${cx - 27}" cy="${hy - 6}" rx="11" ry="7" fill="#e3f4ff" ${st(2.4)} transform="rotate(-28 ${cx - 27} ${hy - 6})"/>`;
    s += `<ellipse cx="${cx + 27}" cy="${hy - 6}" rx="11" ry="7" fill="#e3f4ff" ${st(2.4)} transform="rotate(28 ${cx + 27} ${hy - 6})"/>`;
  } else if (o.wings) {
    const wx = hr - 3;
    s += `<path d="M ${cx - wx} ${hy - 2} C ${cx - wx - 15} ${hy - 18}, ${cx - wx - 17} ${hy + 9}, ${cx - wx + 3} ${hy + 11} Z" fill="${o.wings}" ${st(2.6)}/>`;
    s += `<path d="M ${cx + wx} ${hy - 2} C ${cx + wx + 15} ${hy - 18}, ${cx + wx + 17} ${hy + 9}, ${cx + wx - 3} ${hy + 11} Z" fill="${o.wings}" ${st(2.6)}/>`;
  }

  if (o.flames) {
    s += `<path d="M ${cx - 13} ${hy - 13 * k} q -9 -12 -1 -19 q 0 9 9 11 q -5 -14 7 -17 q -3 10 8 12 q 9 -5 10 -14 q 5 13 -8 21 Z" fill="${o.flames}" ${st(2.6)}/>`;
    s += `<circle cx="${cx - 16 * k}" cy="${hy + 6 * k}" r="8" fill="#ffbe55" ${st(2.4)}/>`;
    s += `<circle cx="${cx + 16 * k}" cy="${hy + 8 * k}" r="7.5" fill="#ff8f5c" ${st(2.4)}/>`;
  } else {
    s += `<circle cx="${cx - 17 * k}" cy="${hy + 4 * k}" r="9" fill="${m0}" ${st(2.6)}/>`;
    s += `<circle cx="${cx + 16 * k}" cy="${hy + 6 * k}" r="8.5" fill="${m1}" ${st(2.6)}/>`;
    s += `<circle cx="${cx - 8 * k}" cy="${hy + 14 * k}" r="8" fill="${m1}" ${st(2.6)}/>`;
  }

  if (!o.catEars) {
    s += `<path d="M ${cx - 13 * k} ${hy - 15 * k} q -4 -9 3 -11 q 4 4 5 9 Z" fill="${body}" ${st(2.6)}/>`;
    s += `<path d="M ${cx + 13 * k} ${hy - 15 * k} q 4 -9 -3 -11 q -4 4 -5 9 Z" fill="${body}" ${st(2.6)}/>`;
  } else {
    s += `<path d="M ${cx - 15 * k} ${hy - 12 * k} L ${cx - 12 * k} ${hy - 24 * k} L ${cx - 3 * k} ${hy - 17 * k} Z" fill="${body}" ${st(2.6)}/>`;
    s += `<path d="M ${cx + 15 * k} ${hy - 12 * k} L ${cx + 12 * k} ${hy - 24 * k} L ${cx + 3 * k} ${hy - 17 * k} Z" fill="${body}" ${st(2.6)}/>`;
    s += `<path d="M ${cx - 12 * k} ${hy - 14.5 * k} L ${cx - 10.5 * k} ${hy - 20 * k} L ${cx - 6 * k} ${hy - 17 * k} Z" fill="#ffb3d1"/>`;
    s += `<path d="M ${cx + 12 * k} ${hy - 14.5 * k} L ${cx + 10.5 * k} ${hy - 20 * k} L ${cx + 6 * k} ${hy - 17 * k} Z" fill="#ffb3d1"/>`;
  }

  s += `<ellipse cx="${cx}" cy="${hy}" rx="${hr}" ry="${20 * k}" fill="${body}" ${st(3)}/>`;

  const ht = (o.baby ? 12 : 18) * k;
  const hyTop = hy - 17 * k;
  s += `<polygon points="${cx},${hyTop - ht} ${cx - 5 * k},${hyTop + 1} ${cx + 5 * k},${hyTop + 1}" fill="${o.hornColor ?? '#ffcf5c'}" ${st(2.6)}/>`;
  s += `<path d="M ${cx - 3 * k} ${hyTop - ht * 0.38} L ${cx + 3.2 * k} ${hyTop - ht * 0.45}" ${st(1.7)} fill="none"/>`;
  s += `<path d="M ${cx - 1.9 * k} ${hyTop - ht * 0.72} L ${cx + 2 * k} ${hyTop - ht * 0.77}" ${st(1.7)} fill="none"/>`;

  if (o.antenna) {
    s += `<path d="M ${cx - 8} ${hyTop} q -4 -8 -10 -9" fill="none" ${st(2.4)}/><circle cx="${cx - 18}" cy="${hyTop - 9.5}" r="2.6" fill="${INK}"/>`;
    s += `<path d="M ${cx + 8} ${hyTop} q 4 -8 10 -9" fill="none" ${st(2.4)}/><circle cx="${cx + 18}" cy="${hyTop - 9.5}" r="2.6" fill="${INK}"/>`;
  }
  if (o.crown) {
    s += `<path d="M ${cx - 10} ${hyTop - ht + 1} l 3 -6 l 3.5 4 l 3.5 -6 l 3.5 6 l 3.5 -4 l 3 6 Z" fill="#ffd93d" ${st(2)}/>`;
  }

  const eyY = hy + 3 * k;
  s += eyes(o.mood ?? 'happy', cx - 9 * k, cx + 9 * k, eyY);
  s += `<ellipse cx="${cx - 16 * k}" cy="${eyY + 5 * k}" rx="4.2" ry="2.5" fill="#ffb3d1" opacity="0.85"/>`;
  s += `<ellipse cx="${cx + 16 * k}" cy="${eyY + 5 * k}" rx="4.2" ry="2.5" fill="#ffb3d1" opacity="0.85"/>`;
  s += `<ellipse cx="${cx}" cy="${eyY + 9 * k}" rx="5" ry="3.2" fill="#fce4ec" ${st(1.8)}/>`;
  s += `<circle cx="${cx - 1.6}" cy="${eyY + 8.6 * k}" r="0.7" fill="${INK}"/><circle cx="${cx + 1.6}" cy="${eyY + 8.6 * k}" r="0.7" fill="${INK}"/>`;

  if (o.stitches) {
    s += `<path d="M ${cx + 6 * k} ${hy - 10 * k} l 8 4 M ${cx + 10 * k} ${hy - 12 * k} l 0 8 M ${cx + 8 * k} ${hy - 6 * k} l 6 2" ${st(1.8)}/>`;
  }
  if (o.whiskers) {
    s += `<path d="M ${cx - hr - 2} ${eyY + 3 * k} l -9 -2 M ${cx - hr - 2} ${eyY + 7 * k} l -9 1 M ${cx + hr + 2} ${eyY + 3 * k} l 9 -2 M ${cx + hr + 2} ${eyY + 7 * k} l 9 1" ${st(1.8)}/>`;
    s += `<path d="M ${cx - 3} ${eyY + 8 * k} q 3 3 6 0" fill="none" ${st(2)}/>`;
  }
  s += o.extraFront ?? '';
  return s;
}
