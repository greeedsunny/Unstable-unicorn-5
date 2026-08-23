// ── 自訂卡面圖片 ──────────────────────────────────────────
// 在 CARD_IMG 填入「卡牌 ID → 圖片網址」即可覆蓋內建插畫。
// 卡牌 ID 見 src/shared/cards.ts（例如 'rainbow-unicorn'、'neigh'）。
// 色系版可用 TYPE_IMG 針對整個類型設定（basic/baby/magic_unicorn/magic/instant/upgrade/downgrade）。

export const CARD_IMG: Record<string, string> = {
  // 範例：'rainbow-unicorn': 'https://example.com/rainbow.png',
};

export const TYPE_IMG: Partial<Record<string, string>> = {
  // 範例：basic: 'https://example.com/basic.png',
};
