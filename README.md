# Simple Reversi for MCP-UI

This is a simple Reversi game that uses MCP-UI.
You can control your turn (fixed to black) by clicking on the screen.

However, its greatest feature is that **"the rules of Reversi are decided by the MCP, making it difficult for the AI to cheat the rules of the game."**

Because Reversi is simple, AI rarely cheats the game rules, but it's known that AI often cheats when playing more complex games.

In this MCP server, the game rules are handled by the MCP, making it difficult for AI to cheat (Note: There are currently some limitations).

The structure is relatively simple, so we believe it can be used as a reference for creating similar board games.


## Available MCP clients

Since there is currently no MCP client that fully supports MCP-UI UI Actions,
my own Avatar-Shell works the most reliably so far.

- [Avatar-Shell](https://github.com/mfukushim/avatar-shell)

The game can be played with the following MCP clients, except for the stone clicking operation. Instead of clicking, you can specify the position of the stone to be placed by conversation.

- [Goose](https://github.com/block/goose/)

I believe that once the implementation of UI Actions is finalized, it will be possible to operate these MCP clients by clicking.

## はじめかた

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

正常にreversiを接続後、「リバーシの盤面を見せてください」で実行可能です。  
AIの性能によっては「ユーザは黒の手番を指示します。アシスタントは白の手番を実行してください。」の指示も必要な場合があります。


## tool関数とUI Actions

#### tool functions

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

- notify  
  ユーザがiframe画面内で何かの操作を行ったことをAIに通知する(黒石を置いた。パスをした。ニューゲームした)。  
  board updated. user put B at A1 など  
  これによりAIがなんらかのアクションを行うことを想定しています(ユーザが黒石を置いたことを知る。次にAIが白石を操作する必要がある判断をする など)


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
