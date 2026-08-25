import type { CardDef, CardType } from './types';

// ── 卡牌資料庫（第二版零售版名單）─────────────────────────────
// 效果描述為自行撰寫的精簡功能性說明；美術以 emoji 呈現。

const BABY_COLORS = ['Pink', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Black', 'White', 'Brown', 'Rainbow', 'Death'] as const;
const BASIC_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Purple'] as const;
const BABY_ZH: Record<(typeof BABY_COLORS)[number], string> = {
  Pink: '粉', Red: '紅', Orange: '橙', Yellow: '黃', Green: '綠',
  Blue: '藍', Purple: '紫', Black: '黑', White: '白', Brown: '棕', Rainbow: '彩虹', Death: '暗黑',
};
const BASIC_ZH: Record<(typeof BASIC_COLORS)[number], string> = {
  Red: '紅', Orange: '橙', Yellow: '黃', Green: '綠', Blue: '藍', Indigo: '靛', Purple: '紫',
};

export const CARDS: CardDef[] = [
  // ── 幼獨角獸（育嬰室 13 張）──
  ...BABY_COLORS.map((c) => ({
    id: `baby-${c.toLowerCase()}`,
    name: `Baby Unicorn (${c})`,
    nameZh: `幼獨角獸（${BABY_ZH[c]}）`,
    type: 'baby' as const,
    emoji: '🐣',
    color: c,
    copies: 1,
    text: '計入勝利數量。若將被犧牲、消滅或被移回手牌，一律返回育嬰室（不會存在於手牌）。',
  })),
  {
    id: 'baby-narwhal',
    name: 'Baby Narwhal',
    nameZh: '幼角鯨',
    type: 'baby',
    emoji: '🐋',
    copies: 1,
    text: '計入勝利數量。若將被犧牲、消滅或被移回手牌，一律返回育嬰室（不會存在於手牌）。',
  },

  // ── 基本獨角獸（22 張）──
  ...BASIC_COLORS.map((c, i) => ({
    id: `basic-${c.toLowerCase()}-${i + 1}`,
    name: `Basic Unicorn (${c})`,
    nameZh: `基本獨角獸（${BASIC_ZH[c]}）`,
    type: 'basic' as const,
    emoji: '🦄',
    color: c,
    copies: 3,
    text: '一隻普通的獨角獸，沒有效果。',
  })),
  {
    id: 'narwhal-basic',
    name: 'Narwhal',
    nameZh: '角鯨',
    type: 'basic',
    emoji: '🐬',
    copies: 1,
    text: '一隻普通的角鯨獨角獸，沒有效果。',
  },

  // ── 魔法獨角獸（30 張）──
  {
    id: 'alluring-narwhal', name: 'Alluring Narwhal', nameZh: '迷人角鯨',
    type: 'magic_unicorn', emoji: '💫', copies: 1,
    text: '進場：可從任一馬廄偷走一張升級卡。',
  },
  {
    id: 'americorn', name: 'Americorn', nameZh: '美洲獨角獸',
    type: 'magic_unicorn', emoji: '🦅', copies: 1,
    text: '進場：從一名對手的手牌中隨機抽走一張，加入你的手牌。',
  },
  {
    id: 'annoying-flying-unicorn', name: 'Annoying Flying Unicorn', nameZh: '惱人飛飛獨角獸',
    type: 'magic_unicorn', emoji: '😤', copies: 1,
    text: '進場：可指定一名玩家棄 1 張牌。此卡被犧牲或消滅時，改為回到你的手牌。',
  },
  {
    id: 'black-knight-unicorn', name: 'Black Knight Unicorn', nameZh: '黑騎士獨角獸',
    type: 'magic_unicorn', emoji: '🛡️', copies: 1,
    text: '你的獨角獸將被消滅時，可改為犧牲此卡來抵擋。',
  },
  {
    id: 'chainsaw-unicorn', name: 'Chainsaw Unicorn', nameZh: '電鋸獨角獸',
    type: 'magic_unicorn', emoji: '🪚', copies: 1,
    text: '進場：可消滅任一馬廄的一張升級卡，或移除任一馬廄的一張降級卡。',
  },
  {
    id: 'classy-narwhal', name: 'Classy Narwhal', nameZh: '高雅角鯨',
    type: 'magic_unicorn', emoji: '🎩', copies: 1,
    text: '進場：可從牌庫搜尋一張升級卡加入手牌，然後洗牌。',
  },
  {
    id: 'dark-angel-unicorn', name: 'Dark Angel Unicorn', nameZh: '黑暗天使獨角獸',
    type: 'magic_unicorn', emoji: '😈', copies: 1,
    text: '進場：可犧牲一隻獨角獸，然後從棄牌堆揀一隻獨角獸加入你的馬廄。',
  },
  {
    id: 'extremely-destructive-unicorn', name: 'Extremely Destructive Unicorn', nameZh: '極度毀滅獨角獸',
    type: 'magic_unicorn', emoji: '💥', copies: 1,
    text: '進場：所有玩家（包括你）各犧牲一隻獨角獸。',
  },
  {
    id: 'ginormous-unicorn', name: 'Ginormous Unicorn', nameZh: '巨無霸獨角獸',
    type: 'magic_unicorn', emoji: '🐘', copies: 1,
    text: '勝利計數時此卡視為 2 隻。只要它在你的馬廄，你不能打出瞬間卡。',
  },
  {
    id: 'greedy-flying-unicorn', name: 'Greedy Flying Unicorn', nameZh: '貪心飛飛獨角獸',
    type: 'magic_unicorn', emoji: '💰', copies: 1,
    text: '進場：抽 1 張牌。此卡被犧牲或消滅時，改為回到你的手牌。',
  },
  {
    id: 'llamacorn', name: 'Llamacorn', nameZh: '草泥馬獨角獸',
    type: 'magic_unicorn', emoji: '🦙', copies: 1,
    text: '進場：所有玩家各棄 1 張牌，然後將棄牌堆洗回牌庫。',
  },
  {
    id: 'magical-flying-unicorn', name: 'Magical Flying Unicorn', nameZh: '魔法飛飛獨角獸',
    type: 'magic_unicorn', emoji: '✨', copies: 1,
    text: '進場：可從棄牌堆拿一張魔法卡加入手牌。此卡離場時，改為回到你的手牌。',
  },
  {
    id: 'magical-kittencorn', name: 'Magical Kittencorn', nameZh: '魔法小貓獨角獸',
    type: 'magic_unicorn', emoji: '🐱', copies: 1,
    text: '不能成為對手卡片效果的目標，也不會被消滅。',
  },
  {
    id: 'majestic-flying-unicorn', name: 'Majestic Flying Unicorn', nameZh: '華麗飛飛獨角獸',
    type: 'magic_unicorn', emoji: '👑', copies: 1,
    text: '進場：可從棄牌堆揀一隻獨角獸加入手牌。此卡離場時，改為回到你的手牌。',
  },
  {
    id: 'mermaid-unicorn', name: 'Mermaid Unicorn', nameZh: '美人魚獨角獸',
    type: 'magic_unicorn', emoji: '🧜', copies: 1,
    text: '進場：可將任一馬廄中的一張卡移回該馬廄主人的手牌。',
  },
  {
    id: 'mother-goose-unicorn', name: 'Mother Goose Unicorn', nameZh: '鵝媽媽獨角獸',
    type: 'magic_unicorn', emoji: '🪿', copies: 1,
    text: '進場：可從育嬰室直接帶一隻幼獨角獸加入你的馬廄。',
  },
  {
    id: 'narwhal-torpedo', name: 'Narwhal Torpedo', nameZh: '魚雷角鯨',
    type: 'magic_unicorn', emoji: '🚀', copies: 1,
    text: '進場：犧牲你馬廄中的所有降級卡。',
  },
  {
    id: 'necromancer-unicorn', name: 'Necromancer Unicorn', nameZh: '死靈法師獨角獸',
    type: 'magic_unicorn', emoji: '💀', copies: 1,
    text: '進場：可棄 2 張牌，然後從棄牌堆揀一隻獨角獸加入你的馬廄。',
  },
  {
    id: 'queen-bee-unicorn', name: 'Queen Bee Unicorn', nameZh: '蜂后獨角獸',
    type: 'magic_unicorn', emoji: '🐝', copies: 1,
    text: '只要此卡在你的馬廄，基本獨角獸不能進入其他玩家的馬廄。',
  },
  {
    id: 'rainbow-unicorn', name: 'Rainbow Unicorn', nameZh: '彩虹獨角獸',
    type: 'magic_unicorn', emoji: '🌈', copies: 1,
    text: '進場：可從你手中直接打出一隻基本獨角獸加入馬廄（不消耗出牌次數）。',
  },
  {
    id: 'rhinocorn', name: 'Rhinocorn', nameZh: '犀牛獨角獸',
    type: 'magic_unicorn', emoji: '🦏', copies: 1,
    text: '你的回合開始時：可消滅一隻獨角獸；若如此做，你的回合立即結束。',
  },
  {
    id: 'seductive-unicorn', name: 'Seductive Unicorn', nameZh: '妖豔獨角獸',
    type: 'magic_unicorn', emoji: '💋', copies: 1,
    text: '進場：從任一玩家的馬廄偷走一隻獨角獸。若此卡離開你的馬廄，被偷的獨角獸回到原主人馬廄。',
  },
  {
    id: 'shabby-the-narwhal', name: 'Shabby the Narwhal', nameZh: '破舊角鯨',
    type: 'magic_unicorn', emoji: '🧶', copies: 1,
    text: '進場：可從牌庫搜尋一張降級卡加入手牌，然後洗牌。',
  },
  {
    id: 'shark-with-a-horn', name: 'Shark With a Horn', nameZh: '獨角鯊',
    type: 'magic_unicorn', emoji: '🦈', copies: 1,
    text: '進場：可犧牲此卡；若如此做，消滅一隻獨角獸。',
  },
  {
    id: 'stabby-the-unicorn', name: 'Stabby the Unicorn', nameZh: '刺刺獨角獸',
    type: 'magic_unicorn', emoji: '🔪', copies: 1,
    text: '若此卡被犧牲或消滅，你可消滅一隻獨角獸。',
  },
  {
    id: 'swift-flying-unicorn', name: 'Swift Flying Unicorn', nameZh: '敏捷飛飛獨角獸',
    type: 'magic_unicorn', emoji: '⚡', copies: 1,
    text: '進場：可從棄牌堆拿一張瞬間卡加入手牌。此卡離場時，改為回到你的手牌。',
  },
  {
    id: 'the-great-narwhal', name: 'The Great Narwhal', nameZh: '偉大角鯨',
    type: 'magic_unicorn', emoji: '🌊', copies: 1,
    text: '進場：可從牌庫搜尋一張名稱含 Narwhal 的卡加入手牌，然後洗牌。',
  },
  {
    id: 'unicorn-oracle', name: 'Unicorn Oracle', nameZh: '獨角獸預言家',
    type: 'magic_unicorn', emoji: '🔮', copies: 1,
    text: '進場：檢視牌庫頂 3 張，將 1 張加入手牌，其餘以任意順序放回牌庫頂。',
  },
  {
    id: 'unicorn-phoenix', name: 'Unicorn Phoenix', nameZh: '不死鳳凰獨角獸',
    type: 'magic_unicorn', emoji: '🔥', copies: 1,
    text: '進場：棄 1 張牌。此卡被犧牲或消滅時，若你的手牌仍有牌，直接回到你的馬廄。',
  },
  {
    id: 'zombie-unicorn', name: 'Zombie Unicorn', nameZh: '殭屍獨角獸',
    type: 'magic_unicorn', emoji: '🧟', copies: 1,
    text: '你的回合開始時：可棄 1 張獨角獸卡，然後從棄牌堆揀一隻獨角獸加入你的馬廄。',
  },

  // ── 魔法卡（25 張）──
  {
    id: 'back-kick', name: 'Back Kick', nameZh: '後踢腿',
    type: 'magic', emoji: '🦵', copies: 3,
    text: '將另一名玩家馬廄中的一張卡移回其手牌，該玩家再棄 1 張牌。',
  },
  {
    id: 'blatant-thievery', name: 'Blatant Thievery', nameZh: '公然竊盜',
    type: 'magic', emoji: '🤏', copies: 1,
    text: '檢視一名玩家的手牌，從中拿取一張加入你的手牌。',
  },
  {
    id: 'change-of-luck', name: 'Change of Luck', nameZh: '轉運',
    type: 'magic', emoji: '🍀', copies: 2,
    text: '抽 2 張、棄 3 張，然後立刻再進行一個額外回合。',
  },
  {
    id: 'glitter-tornado', name: 'Glitter Tornado', nameZh: '閃光龍捲風',
    type: 'magic', emoji: '🌪️', copies: 2,
    text: '將每個馬廄（包括你的）中的一張卡移回其主人手牌。',
  },
  {
    id: 'good-deal', name: 'Good Deal', nameZh: '好交易',
    type: 'magic', emoji: '🤑', copies: 1,
    text: '抽 3 張牌，然後棄 1 張牌。',
  },
  {
    id: 'kiss-of-life', name: 'Kiss of Life', nameZh: '起死回生之吻',
    type: 'magic', emoji: '💄', copies: 1,
    text: '從棄牌堆揀一隻獨角獸加入你的馬廄。',
  },
  {
    id: 'mystical-vortex', name: 'Mystical Vortex', nameZh: '神秘漩渦',
    type: 'magic', emoji: '🌀', copies: 1,
    text: '所有玩家各棄 1 張牌，然後將棄牌堆洗回牌庫。',
  },
  {
    id: 're-target', name: 'Re-Target', nameZh: '重新瞄準',
    type: 'magic', emoji: '🎯', copies: 2,
    text: '將任一馬廄中的一張升級或降級卡移到另一名玩家的馬廄。',
  },
  {
    id: 'reset-button', name: 'Reset Button', nameZh: '重置按鈕',
    type: 'magic', emoji: '🔘', copies: 1,
    text: '所有玩家犧牲自己馬廄中的全部升級與降級卡，然後將棄牌堆洗回牌庫。',
  },
  {
    id: 'shake-up', name: 'Shake Up', nameZh: '大洗牌',
    type: 'magic', emoji: '🫨', copies: 1,
    text: '將此卡、你的手牌與棄牌堆全部洗入牌庫，然後抽 5 張牌。',
  },
  {
    id: 'targeted-destruction', name: 'Targeted Destruction', nameZh: '定點破壞',
    type: 'magic', emoji: '🔨', copies: 1,
    text: '犧牲或消滅一張升級／降級卡。',
  },
  {
    id: 'two-for-one', name: 'Two-For-One', nameZh: '二換一',
    type: 'magic', emoji: '✌️', copies: 2,
    text: '犧牲你自己的一張卡，然後消滅任意兩張卡。',
  },
  {
    id: 'unfair-bargain', name: 'Unfair Bargain', nameZh: '不公平交易',
    type: 'magic', emoji: '🤝', copies: 2,
    text: '與一名玩家交換整手手牌。',
  },
  {
    id: 'unicorn-poison', name: 'Unicorn Poison', nameZh: '獨角獸毒藥',
    type: 'magic', emoji: '☠️', copies: 3,
    text: '消滅一隻獨角獸。',
  },
  {
    id: 'unicorn-swap', name: 'Unicorn Swap', nameZh: '獨角獸交換',
    type: 'magic', emoji: '🔁', copies: 2,
    text: '用你馬廄中的一隻獨角獸，與另一名玩家馬廄中的一隻獨角獸交換。',
  },

  // ── 升級（14 張）──
  {
    id: 'glitter-bomb', name: 'Glitter Bomb', nameZh: '閃光炸彈',
    type: 'upgrade', emoji: '💣', copies: 2,
    text: '你的回合開始時：可犧牲 1 張卡，然後消滅 1 張卡。',
  },
  {
    id: 'yay', name: 'Yay', nameZh: '萬歲！',
    type: 'upgrade', emoji: '🎉', copies: 2,
    text: '你打出的卡不會被 Neigh（噓！）取消。',
  },
  {
    id: 'rainbow-aura', name: 'Rainbow Aura', nameZh: '彩虹光環',
    type: 'upgrade', emoji: '🌟', copies: 1,
    text: '你馬廄中的獨角獸不會被消滅（仍可被犧牲）。',
  },
  {
    id: 'double-dutch', name: 'Double Dutch', nameZh: '雙人跳繩',
    type: 'upgrade', emoji: '🪢', copies: 1,
    text: '你的回合開始時：可選擇本回合能打出 2 張牌。',
  },
  {
    id: 'caffeine-overload', name: 'Caffeine Overload', nameZh: '咖啡因過量',
    type: 'upgrade', emoji: '☕', copies: 2,
    text: '你的回合開始時：可犧牲 1 張卡，然後抽 2 張牌。',
  },
  {
    id: 'claw-machine', name: 'Claw Machine', nameZh: '夾娃娃機',
    type: 'upgrade', emoji: '🕹️', copies: 2,
    text: '你的回合開始時：可棄 1 張牌，然後抽 1 張牌。',
  },
  {
    id: 'rainbow-lasso', name: 'Rainbow Lasso', nameZh: '彩虹套索',
    type: 'upgrade', emoji: '🪄', copies: 2,
    text: '你的回合開始時：可棄 3 張牌，然後永久偷走另一個馬廄中的一隻獨角獸。',
  },
  {
    id: 'stable-artillery', name: 'Stable Artillery', nameZh: '馬廄砲台',
    type: 'upgrade', emoji: '🏹', copies: 2,
    text: '你的回合開始時：可棄 2 張牌，然後消滅一隻獨角獸。',
  },

  // ── 降級（8 張）──
  {
    id: 'barbed-wire', name: 'Barbed Wire', nameZh: '有刺鐵絲網',
    type: 'downgrade', emoji: '🚧', copies: 1,
    text: '此馬廄每次有獨角獸進入或離開時（不論原因），馬廄主人棄 1 張牌。',
  },
  {
    id: 'blinding-light', name: 'Blinding Light', nameZh: '致盲強光',
    type: 'downgrade', emoji: '🔆', copies: 1,
    text: '此馬廄中所有獨角獸的效果失效（視為基本獨角獸）。',
  },
  {
    id: 'broken-stable', name: 'Broken Stable', nameZh: '毀壞馬廄',
    type: 'downgrade', emoji: '🏚️', copies: 1,
    text: '此馬廄的主人不能打出升級卡。',
  },
  {
    id: 'nanny-cam', name: 'Nanny Cam', nameZh: '保母攝影機',
    type: 'downgrade', emoji: '📷', copies: 1,
    text: '此馬廄主人的手牌對所有人公開。',
  },
  {
    id: 'pandamonium', name: 'Pandamonium', nameZh: '貓熊亂象',
    type: 'downgrade', emoji: '🐼', copies: 1,
    text: '此馬廄中的獨角獸視為貓熊：針對獨角獸的敵方效果不能影響牠們（仍計入勝利數）。',
  },
  {
    id: 'sadistic-ritual', name: 'Sadistic Ritual', nameZh: '虐待狂儀式',
    type: 'downgrade', emoji: '🕯️', copies: 1,
    text: '此馬廄主人的回合開始時：必須犧牲一隻獨角獸，然後抽 1 張牌。',
  },
  {
    id: 'slowdown', name: 'Slowdown', nameZh: '減速',
    type: 'downgrade', emoji: '🐌', copies: 1,
    text: '此馬廄的主人不能打出瞬間卡。',
  },
  {
    id: 'tiny-stable', name: 'Tiny Stable', nameZh: '迷你馬廄',
    type: 'downgrade', emoji: '🥡', copies: 1,
    text: '此馬廄最多 5 隻獨角獸；一旦超過，必須立即犧牲至 5 隻以內。',
  },

  // ── 瞬間（15 張）──
  {
    id: 'neigh', name: 'Neigh', nameZh: '噓！',
    type: 'instant', emoji: '🐴', copies: 14,
    text: '在任何卡被打出的當下打出：取消那張卡，該卡直接進入棄牌堆、效果不結算。',
  },
  {
    id: 'super-neigh', name: 'Super Neigh', nameZh: '超級噓！',
    type: 'instant', emoji: '🐎', copies: 1,
    text: '同 Neigh，但不會被 Neigh 取消。',
  },

  // ── 經典回歸卡（第一版）──
  {
    id: 'puppicorn', name: 'Puppicorn', nameZh: '小狗獨角獸',
    type: 'magic_unicorn', emoji: '🐶', copies: 1,
    text: '每回合開始時，牠會跑到當前行動玩家的馬廄。不能被犧牲或消滅。',
  },
  {
    id: 'unicorn-shrinkray', name: 'Unicorn Shrinkray', nameZh: '獨角獸縮小光線',
    type: 'magic', emoji: '🔬', copies: 1,
    text: '選擇一名玩家：其馬廄的所有獨角獸直接進入棄牌堆（不觸發任何效果），然後相同數量的幼獨角獸從育嬰室進入其馬廄。',
  },
  {
    id: 'extra-tail', name: 'Extra Tail', nameZh: '多餘尾巴',
    type: 'upgrade', emoji: '🦱', copies: 3,
    text: '進場需求：你的馬廄需有基本獨角獸。你的回合開始時：可多抽 1 張牌。',
  },
  {
    id: 'rainbow-mane', name: 'Rainbow Mane', nameZh: '彩虹鬃毛',
    type: 'upgrade', emoji: '🎠', copies: 3,
    text: '進場需求：你的馬廄需有基本獨角獸。你的回合開始時：可從手中直接打出一隻基本獨角獸（不消耗出牌次數）。',
  },
  {
    id: 'summoning-ritual', name: 'Summoning Ritual', nameZh: '召喚儀式',
    type: 'upgrade', emoji: '📜', copies: 1,
    text: '進場需求：你的馬廄需有基本獨角獸。你的回合開始時：可棄 2 張獨角獸卡，從棄牌堆喚回一隻獨角獸。',
  },
  {
    id: 'unicorn-lasso', name: 'Unicorn Lasso', nameZh: '獨角獸套索',
    type: 'upgrade', emoji: '🪢', copies: 1,
    text: '進場需求：你的馬廄需有基本獨角獸。你的回合開始時：可借用另一個馬廄的一隻獨角獸，回合結束時歸還。',
  },

  {
    id: 'unicorn-lasso', name: 'Unicorn Lasso', nameZh: '獨角獸套索',
    type: 'upgrade', emoji: '🪢', copies: 1,
    text: '進場需求：你的馬廄需有基本獨角獸。你的回合開始時：可借用另一個馬廄的一隻獨角獸，回合結束時歸還。',
  },

  // ── Ultimate Unicorns 擴充 ──
  {
    id: 'ancestor-unicorn', name: 'Ancestor Unicorn', nameZh: '先祖獨角獸',
    type: 'magic_unicorn', emoji: '🗿', copies: 1,
    text: '進場：犧牲 1 張獨角獸卡，然後從牌庫搜尋一張獨角獸卡，帶直接入你的馬廄並洗牌。',
  },
  {
    id: 'archangel-unicorn', name: 'Archangel Unicorn', nameZh: '大天使獨角獸',
    type: 'magic_unicorn', emoji: '👼', copies: 1,
    text: '進場：犧牲 3 張卡。你馬廄的卡將被犧牲或消滅時，可改為棄 1 張牌保護。回合開始時：可多抽 1 張牌。',
  },
  {
    id: 'chronocorn', name: 'Chronocorn', nameZh: '時間獨角獸',
    type: 'magic_unicorn', emoji: '⏳', copies: 1,
    text: '進場：棄 1 張牌。此卡也可以當成瞬間卡打出。',
  },
  {
    id: 'elusive-oceloticorn', name: 'Elusive Oceloticorn', nameZh: '神出鬼沒豹貓獨角獸',
    type: 'magic_unicorn', emoji: '🐆', copies: 1,
    text: '進場：犧牲 2 張獨角獸卡。其他玩家不能打出 Neigh 卡，且此卡不會被 Neigh。',
  },
  {
    id: 'game-master-unicorn', name: 'Game Master Unicorn', nameZh: '遊戲主持人獨角獸',
    type: 'magic_unicorn', emoji: '🎲', copies: 1,
    text: '進場：棄掉整手手牌。回合開始時：可多抽 1 張牌。你的手牌上限 +3。',
  },
  {
    id: 'nine-tailed-foxicorn', name: 'Nine-Tailed Foxicorn', nameZh: '九尾狐獨角獸',
    type: 'magic_unicorn', emoji: '🦊', copies: 1,
    text: '進場：犧牲 2 張獨角獸卡，然後從牌庫搜尋一張獨角獸卡帶入馬廄並洗牌。此卡離場時：可從牌庫搜尋一張獨角獸卡帶入馬廄並洗牌。',
  },
  {
    id: 'rad-scientist-unicorn', name: 'The Rad Scientist Unicorn', nameZh: '狂科學家獨角獸',
    type: 'magic_unicorn', emoji: '🥼', copies: 1,
    text: '進場：犧牲 1 張卡。你馬廄的卡將被消滅時，可改為棄 2 張牌保護。',
  },
  {
    id: 'time-shifting-unicorn', name: 'Time-Shifting Unicorn', nameZh: '時移獨角獸',
    type: 'magic_unicorn', emoji: '🌀', copies: 1,
    text: '進場：犧牲 2 張卡。回合開始時：可檢視牌庫頂 3 張，並以任意順序放回。',
  },
  {
    id: 'unicorn-of-conniving-artistry', name: 'Unicorn of Conniving Artistry', nameZh: '巧計獨角獸',
    type: 'magic_unicorn', emoji: '🎭', copies: 1,
    text: '進場：犧牲 1 張獨角獸卡。你的獨角獸將被消滅時，可改為犧牲一張升級／降級卡保護。',
  },
  {
    id: 'unicorn-of-glory', name: 'Unicorn of Glory', nameZh: '榮耀獨角獸',
    type: 'magic_unicorn', emoji: '🏆', copies: 1,
    text: '進場：棄 1 張牌。當其他玩家在你的馬廄打出降級卡時：從牌庫搜尋一張升級卡帶入馬廄並洗牌。',
  },
];

export const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]));

export const UNICORN_TYPES: CardType[] = ['baby', 'basic', 'magic_unicorn'];

export function isUnicorn(t: CardType): boolean {
  return t === 'baby' || t === 'basic' || t === 'magic_unicorn';
}
