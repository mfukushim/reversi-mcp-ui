# リバーシ MCP-UI

[![smithery badge](https://smithery.ai/badge/@mfukushim/reversi-mcp-ui)](https://smithery.ai/server/@mfukushim/reversi-mcp-ui)  

Japanese / [English](./README.md)

MCP-UIを利用したシンプルなリバーシです。  
自分の手番(黒固定)を画面上のクリックで操作できます。  

ですが、最大の特徴は **「リバーシのルールを裁定するのはMCPが行っているため、AIがゲームのルールをズルすることが困難」** な点です。  

リバーシは単純なのでAIがゲームルールのズルをすることはほとんどありませんが、複雑なゲームを行う場合はAIはズルをすることがよくあることは知られています。  
このMCPサーバーではゲームルールはMCPが処理するためAIはズルを行うことが困難です(注意: 現状いくつか制約があります)  

TypeScriptの比較的シンプルな構成にしているので、同様のボードゲームも参考にして作ることが出来ると考えます。  

[![riversiVideo](https://img.youtube.com/vi/19Vy0Cpxhnc/0.jpg)](https://youtu.be/19Vy0Cpxhnc?si=VR9PoeleZE2rNPdV&t=10)


## 動作するMCPクライアント  

MCP-UIのUI Actionsを完全にサポートするMCPクライアントが現時点存在しないため  
今のところ拙作のAvatar-Shellでの動作がわかりやすいですが、まだ不安定な部分が多いです。  
nanobot.aiではUI Actionに対応しているため、画面はスクロールしますがクリックでプレイが可能です。  

- [Avatar-Shell](https://github.com/mfukushim/avatar-shell)  
- [nanobot.ai](https://www.nanobot.ai/) 

石のクリック操作を除けば以下のMCPクライアントでもゲームプレイは可能です。クリックではなく手番で置く石の位置を会話で指定してください。  

- [Goose](https://github.com/block/goose/)  
- [Smithery.ai](https://smithery.ai/server/@mfukushim/reversi-mcp-ui)  

これらのMCPクライアントでもUI Actionsの実装が固まればクリックでの操作が可能になると考えます。  

> 注意 このMCPサーバーはui:// スキーマによるhtmlデータを一手ごとに出力します。 MCPクライアントの機能でui:タグをLLMが読み取る仕組みの場合、AIのトークンの使用量が多い場合があります。
> 使い始め時は想定外のトークン消費がないか確認してください。

## はじめかた 

#### 公開サーバー

リバーシMCP-UIは、CloudFlare AI Agent のMCPAgentの仕組みの上で作られており、Streamable-http接続に対応しています。  

Cloudflare workersでのデモを以下で公開しています。  

各MCPクライアントで以下のMCP設定を行ってください。  

```json
{
  "mcpServers": {
    "reversi": {
      "type": "streamable-http",
      "url": "https://reversi-mcp-ui.daisycodes.workers.dev/mcp"
    }
  }
}
```
> 注意: wrangler起動はDocker container内ではエラーになるようです。  

正常にreversiを接続後、「リバーシをプレイしてください」で実行可能です。  
AIの性能によっては「ユーザは黒の手番を指示します。アシスタントは白の手番を実行してください。」の指示も必要な場合があります。  

Smithery.ai では外部サーバーとして以下で公開しています。  
https://smithery.ai/server/@mfukushim/reversi-mcp-ui 

(公開サーバーは状況によっては停止するかもしれません)

#### ローカルサーバー

wranglerのローカル実行でローカルサーバーとして起動できます。

```shell
pnpm run dev # run wrangler local

or 

npm run dev # run wrangler local
````

各MCPクライアントで以下のMCP設定を行ってください。

```json
{
  "mcpServers": {
    "reversi": {
      "type": "streamable-http",
      "url": "http://localhost:8787/mcp"
    }
  }
}
```

## tool関数とUI Actions

#### tool functions

- new-game  
  ゲーム初期画面を表示します。ゲーム途中の場合は強制的に初期画面にします。
- get-board  
  リバーシ盤面を取得する。最初に実行時はゲーム初期画面を表示します。
- select-user  
  黒石(ユーザ手番)の石を配置します。座標はA1～H8で指定します。手番をパスするしかないときは PASS で呼び出します。ゲームを終わらせる/リセットする場合は NEW で呼び出します。  
  UI Actionsが実装されている環境では使わずにゲームできます。その場合MCPクライアントでselect-userのtool関数を呼び出せない設定にすればAIがユーザ手番を操作できません。    
- select-assistant  
  白石(AI手番)の石を配置します。座標はA1-H8で指定します。手番をパスするしかないときは PASS で呼び出します。


#### UI Actions

UI Actionは現時点では未実装、途中実装のMCPクライアントが多いです。現状reversi MCP-UIでは以下の挙動をすることを期待しています。

- tool select-user  
  ユーザがiframe画面内で手番を操作した(黒石を置いた。パスをした。ニューゲームした)  
  その操作をreversi MCPへAIを介さずに select-userでtool実行することを想定しています。  
  select-userの実行結果の中からtextを抽出して、それをuserの入力としてAIに送ります。
  "board updated. user put B at A1" など  
  これによりAIがなんらかのアクションを行うことを想定しています(ユーザが黒石を置いたことを知る。次にAIが白石を操作する必要がある判断をして select-assistant を実行する など)


## プログラム構成  

MCPサーバー内でリバーシのルール処理を実行します。このためルールの実行にAIは直接介入できません。  
これにより、AIでよく起きる「AIがルール上のズルをする」ことを抑止してゲームが出来ます。  

> 注意  
> 現在の仕様として、厳格には次のケースでAIがルールに干渉することがあります。  
> - AIがユーザの手番のtool (select-user) を勝手に呼び出してしまう可能性
> - AIがユーザの手番の操作を読み取ってしまう可能性 (リバーシでは問題になりませんが、打つ手や手札を隠すゲームなどでは対策要)  
> 
> これらはMCPの仕様やMCP-UIの仕様、MCPクライアントの仕様の影響を受けるため、将来的に解決可能かは不明です

#### ルールロジック

src/rule-logic/reversi.ts と src/rule-logic/board.html に同じjavascriptのリバーシ処理 class ReversiEngine を配置しています。
class ReversiEngine はChatGPTに生成を指示したリバーシルール処理です。  
本来MCP内だけでよいですが、クリック時の挙動判定をかねて同じ処理をhtml内javascriptにも置いています。  
盤面の状態の決定はMCP内の reversi.ts で行われて、MCPのセッションに保持されます。

#### 盤面生成

盤面の描画処理は src/rule-logic/board.html 内のhtml,css,javascriptにて描画しています。  
MCP側からの盤面情報に従って盤面情報を表示し、ユーザのクリックに対する簡易モーションを処理しています。  

html内に盤面情報を設定するのにsrc/rule-logic/boardDrawer.ts で、簡易的なテンプレート加工処理を行っています。


#### MCP処理部

src/index.ts でMCP, MCP-UI処理を行っています。
ほぼCloudflare MCPAgentのサンプルコードに準拠しています。

## ローカルデバッグとデプロイ

ほぼCloudflare MCPAgentの実行とデバッグに従います。  

```shell
pnpm install # install

pnpm run dev # start dev server

pnpm run inspector # start inspector

pnpm run deploy # deploy to cloudflare workers

```

## ガイド  

https://note.com/marble_walkers/n/nfa9fe4bb68df  
