# Simple Reversi for MCP-UI

This is a simple Reversi game that uses MCP-UI.
You can control your turn (fixed to black) by clicking on the screen.

However, its greatest feature is that **"the rules of Reversi are decided by the MCP, making it difficult for the AI to cheat the rules of the game."**

Because Reversi is simple, AI rarely cheats the game rules, but it's known that AI often cheats when playing more complex games.

In this MCP server, the game rules are handled by the MCP, making it difficult for AI to cheat (Note: There are currently some limitations).

The structure is relatively simple, so we believe it can be used as a reference for creating similar board games.


## Available MCP clients

Currently, there is no MCP client that fully supports MCP-UI UI Actions, so while my Avatar-Shell is easy to understand, there are still many unstable aspects.
nanobot.ai supports UI Actions, so the screen will scroll, but you can play by clicking.  

- [Avatar-Shell](https://github.com/mfukushim/avatar-shell)
- [nanobot.ai](https://www.nanobot.ai/)  

The game can be played with the following MCP clients, except for the stone clicking operation. Instead of clicking, you can specify the position of the stone to be placed by conversation.

- [Goose](https://github.com/block/goose/)

I believe that once the implementation of UI Actions is finalized, it will be possible to operate these MCP clients by clicking.

## Get started

#### Public Server

Reversi MCP-UI is built on the MCPAgent mechanism of CloudFlare AI Agent and supports Streamable-http connections.

A demo using Cloudflare workers is available below.

Please configure the following MCP settings on each MCP client.

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

After successfully connecting Reversi, you can start playing by clicking "Play Reversi".  
Depending on the AI's performance, you may also need to instruct the user to "It is your turn to play white pieces and place them in the best position."

Smithery.ai  
https://smithery.ai/server/@mfukushim/reversi-mcp-ui  

(The public server may be shut down in the future.)  

#### Local Server  

You can run it as a local server by running wrangler locally.  

```shell
pnpm run dev # run wrangler local

or 

npm run dev # run wrangler local
````

Please configure the following MCP settings on each MCP client.  

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



## Tool Functions and UI Actions

#### tool functions

- new-game  
  Displays the initial game screen. If the game is in progress, the initial screen will be displayed.
- get-board  
  Get the Reversi board. When you first run it, the initial game screen will be displayed.
- select-user  
  Places the black stone (user turn). Coordinates are specified from A1 to H8. If there is no choice but to pass the turn, call it with PASS. To end/reset the game, call it with NEW.
  In environments where UI Actions are implemented, you can play the game without using them. In that case, if you configure the MCP client so that the select-user tool function cannot be called, the AI will not be able to control the user turn.
- select-assistant  
  Place the white stone (AI turn). The coordinates are A1-H8. If you have no choice but to pass your turn, call it with PASS.


#### UI Actions

Currently, many MCP clients have not implemented UI Actions or are in the process of implementing them. Currently, we expect the following behaviors in reversi MCP-UI.

- tool select-user  
  The user controlled the turn within the iframe screen (placed a black stone, passed, started a new game)   
  It is assumed that this operation will be executed by the select-user tool on the reversi MCP without going through AI.
  Extract the text from the execution result of select-user and send it to the AI as user input.  
  Like "board updated. user put B at A1"  
  This is expected to allow the AI to take some action (for example, knowing that the user has placed a black stone, then determining that the AI needs to operate a white stone and executing select-assistant).  


## Program Structure

Reversi rules are processed within the MCP server. This means that the AI cannot directly intervene in the execution of the rules.
This prevents the AI from cheating according to the rules, which is a common occurrence with AI.
> Note  
> In the current specifications, strictly speaking, AI may interfere with the rules in the following cases:
> - The AI may call the tool (select-user) on the user's turn without permission.
> - The AI may be able to read the user's moves during their turn (this is not an issue in Reversi, but it is necessary to take measures in games where you hide your moves or cards).
>
> These issues are affected by the MCP specifications, MCP-UI specifications, and MCP client specifications, so it is unclear whether they can be resolved in the future.

#### Rule Logic

The equivalent JavaScript/Typescript reversi processing class ReversiEngine is located in src/rule-logic/reversi.ts and src/rule-logic/board.html.  
The class ReversiEngine is the reversi rule processing that ChatGPT is instructed to generate.    
Ideally, this would only be necessary within the MCP, but the same processing is also placed in the JavaScript within the HTML to determine the behavior when clicked.  
The state of the board is determined in reversi.ts in MCP and is stored in the MCP session.  

#### Board generation

The board is drawn using html, css, and javascript in src/rule-logic/board.html.  
The board information is displayed according to the information from the MCP, and simple motions are processed in response to user clicks.

To set the board information in the html, simple template processing is performed in src/rule-logic/boardDrawer.ts.  


#### MCP handling

MCP and MCP-UI processing is done in src/index.ts.
It is almost identical to the Cloudflare MCPAgent sample code.

## Local Debugging and Deployment

This mostly follows the instructions for running and debugging Cloudflare MCPAgent.  

```shell
pnpm install # install

pnpm run dev # start dev server

pnpm run inspector # start inspector

pnpm run deploy # deploy to cloudflare workers

```

## Guide (Japanese)  

https://note.com/marble_walkers/n/nfa9fe4bb68df  
