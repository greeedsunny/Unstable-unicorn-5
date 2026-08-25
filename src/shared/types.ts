// ── 共用型別定義 ──────────────────────────────────────────────

export type CardType =
  | 'baby'          // 幼獨角獸（育嬰室）
  | 'basic'         // 基本獨角獸
  | 'magic_unicorn' // 魔法獨角獸
  | 'magic'         // 魔法卡（行動）
  | 'instant'       // 瞬間卡
  | 'upgrade'       // 升級
  | 'downgrade';    // 降級

export interface CardDef {
  id: string;
  name: string;      // 官方英文名稱
  nameZh: string;    // 中文譯名
  type: CardType;
  emoji: string;
  color?: string;    // 色系（基本/幼獨角獸）
  copies: number;    // 牌庫中張數
  text: string;      // 效果描述（自行撰寫的精簡功能性說明）
}

// 牌堆中的實體卡（uid 指向 CardDef）
export interface StableCard {
  uid: string;
  defId: string;
}

export interface PlayerState {
  id: string;          // 座位 token（斷線重連用）
  wsId: string | null; // 目前連線
  name: string;
  hand: string[];      // uid[]
  stable: StableCard[];
  connected: boolean;
  isHost: boolean;
}

export type ChoiceOption = {
  label: string;
  value: unknown;        // 提交時原樣回傳
};

export type Prompt = {
  id: string;
  resId: string;         // 對應 Resolution.rid
  playerId: string;      // 誰要回答
  title: string;
  kind: 'choice' | 'multi';
  min?: number;          // multi 用
  max?: number;
  options: ChoiceOption[];
};

// 解析步驟：所有效果與回合流程都以此驅動（可序列化、可續行）
export interface Resolution {
  key: string;           // 對應 HANDLERS[key]
  playerId: string;      // 主要執行者
  rid: string;           // 唯一 ID（prompt 路由用）
  data: Record<string, unknown>;
}

export interface NeighWindow {
  chain: { uid: string; byId: string; asInstant?: boolean }[]; // chain[0] = 原始卡，其後為回應的瞬間卡
  awaiting: string[];    // 尚未表態的玩家 id
  openedAt: number;      // 開啟時間（逾時自動通過用）
}

export interface LogEntry {
  t: number;             // 時間戳
  msg: string;
  cls?: string;          // 樣式類別
}

export type TurnPhase = 'turn_start' | 'draw' | 'action' | 'end';

export interface GameState {
  phase: 'lobby' | 'playing' | 'ended';
  players: PlayerState[];
  turn: number;                 // players 索引
  turnPhase: TurnPhase;
  playsLeft: number;            // 本回合剩餘可出牌數
  extraTurns: number;           // Change of Luck 等
  turnEnded: boolean;           // Rhinocorn 等提前結束
  deck: string[];
  discard: string[];
  nursery: string[];
  queue: Resolution[];          // 待解析堆疊（先進先出）
  prompt: Prompt | null;        // 目前等待的輸入
  neighWindow: NeighWindow | null;
  riders: Record<string, { uid: string; pid: string }>; // Seductive Unicorn 綁定
  lasso: Record<string, { home: string; by: string }>;  // Unicorn Lasso 借用中
  log: LogEntry[];
  winner: string | null;
  winTarget: number;
  seed: number;                 // RNG 種子（洗牌用）
  uidSeq: number;
}

// ── WebSocket 訊息協定 ───────────────────────────────────────

export type ClientMsg =
  | { t: 'join'; name: string; seat?: string }
  | { t: 'start' }
  | { t: 'leave' }
  | { t: 'chat'; text: string }
  | { t: 'action'; a: 'play_card'; uid: string; targetPlayerId?: string }
  | { t: 'action'; a: 'draw_instead' }
  | { t: 'action'; a: 'sacrifice'; uid: string }
  | { t: 'action'; a: 'answer'; promptId: string; values: unknown[] }
  | { t: 'action'; a: 'neigh'; uid?: string }   // uid 缺略 = pass
  | { t: 'action'; a: 'restart' }
  | { t: 'action'; a: 'abort' }
  | { t: 'action'; a: 'smoke_give'; defId: string; token: string };

export type ServerMsg =
  | { t: 'welcome' }
  | { t: 'joined'; seat: string }
  | { t: 'sync'; view: ServerView }
  | { t: 'error'; msg: string }
  | { t: 'chat'; from: string; text: string };

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  stable: StableCard[];
  handCount: number;
  handPublic: boolean;
  hand?: string[];       // 僅 Nanny Cam 或本人
  unicornCount: number;
};

export type ServerView = {
  youId: string;
  state: {
    phase: GameState['phase'];
    players: PublicPlayer[];
    turn: number;
    turnPhase: GameState['turnPhase'];
    playsLeft: number;
    deckCount: number;
    discardTop: string | null;
    discardList: string[];
    discardCount: number;
    nurseryCount: number;
    prompt: Prompt | null;
            neighWindow: { chain: { uid: string; byId: string }[]; canRespond: boolean } | null;    log: LogEntry[];
    winner: string | null;
    winTarget: number;
  };
};
