# 🦄 Unstable Unicorns Online

同人製作的《Unstable Unicorns》線上多人網頁版。卡牌機制還原官方第二版零售內容（主牌庫 114 張＋育嬰室 13 張），效果說明與介面文字為自行撰寫的精簡描述，美術以 emoji 呈現。本專案與 TeeTurtle / Unstable Games 無隸屬關係，請支持官方產品。

## 線上試玩

部署後網址：（見下方部署指令輸出）

## 遊戲特色

- **2–8 人**即時對戰，房間代碼制，複製連結即可邀請
- **WebSocket 即時同步**：出牌、Neigh 反應鏈（可連鎖互噓）、勝利判定全即時
- **完整基礎版卡表**：30 張魔法獨角獸、25 張魔法卡、升級／降級、瞬間卡全數實作
- **斷線重連**：座位 token 存於瀏覽器，重新整理自動歸位
- **卡通可愛風 UI**：手繪感配色、卡牌動畫、聊天室

## 技術架構

| 層 | 技術 |
|---|---|
| 前端 | Vite + TypeScript（無框架） |
| 後端 | Cloudflare Workers + Durable Objects |
| 即時通訊 | WebSocket（每房一個 Durable Object 實例） |
| 遊戲邏輯 | 自製步進式狀態機（可序列化、斷線可恢復） |

## 本機開發

```bash
npm install
npm run dev        # 建置前端並啟動 wrangler dev（http://127.0.0.1:8787）
npm run typecheck  # 型別檢查（server + client）
```

## 部署到 Cloudflare

```bash
npm run deploy     # = vite build + wrangler deploy
```

需要已登入 `wrangler`（`npx wrangler login`）。免費方案即可執行（Durable Objects 使用 SQLite 儲存類別）。

## 專案結構

```
src/
├── shared/          # 前後端共用
│   ├── types.ts     # 遊戲狀態與 WS 協定型別
│   ├── cards.ts     # 卡牌資料庫（114+13 張）
│   └── rng.ts       # 決定論式 PRNG
├── server/
│   ├── engine.ts    # 遊戲引擎核心（佇列式解析、Neigh 視窗）
│   ├── effects.ts   # 回合流程＋魔法獨角獸效果
│   ├── effects2.ts  # 共用工具＋回合觸發
│   ├── magic-effects.ts # 魔法卡效果
│   ├── room.ts      # Durable Object 房間
│   └── index.ts     # Worker 進入點
└── client/          # 前端（大廳／遊戲桌／聊天）
```

## 授權說明

程式碼供學習交流使用。遊戲名稱與概念歸 TeeTurtle / Unstable Games 所有。
