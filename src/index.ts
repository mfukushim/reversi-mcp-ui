import {McpAgent} from "agents/mcp";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {createUIResource} from "@mcp-ui/server";
import {generateReversiHTMLFromState} from "./rule-logic/boardDrawer.js";
import {ExportState, ReversiEngine} from "./rule-logic/reversi.js";
import {z} from "zod";
import {CallToolResultSchema} from "@modelcontextprotocol/sdk/types.js";

type State = {
  board: ExportState;
  gameSession: string;
};

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env, State, {}> {
  server = new McpServer({
    name: "Reversi Game",
    version: "1.0.0",
    description: "A simple reversi game",
  });

  initialState: State = {
    board: new ReversiEngine().init(),
    gameSession: crypto.randomUUID()
  };

  async onStateUpdate(state: State) {
    console.log("state updated", state);
  }

  async init() {
    this.server.tool(
      "new-game",
      "Start a new Reversi game",
      {},
      () => {
        const engine = new ReversiEngine()
        engine.init()
        this.state.board = engine.export()
        this.setState({...this.state});
        return this.makeMessage(`current board: ${JSON.stringify(this.state.board)}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`)
      },
    );
    this.server.tool(
      "get-board",
      "get a Reversi board",
      {},
      () => {
        return this.makeMessage(`current board: ${JSON.stringify(this.state.board)}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`)
      },
    );
    this.server.tool(
      "select-user",
      "user move a stone",
      {
        move: z.string().describe('Where to place the black stone. Specify one of A1 to H8. Pass to PASS.'),
        //  TODO 暗号化またはサイン要  つまり 公開鍵をAIに知られない方法で送らなければならない サインのみならAIに漏れる形でもよい? AIが嘘の公開鍵をMCPに送る可能性があるのでサインでもダメか。。
        gameSession: z.string().optional(), //  TODO 通信時に使用
      },
      async ({move}) => {
        let m = ''
        try {
          const engine = new ReversiEngine()
          engine.import(this.state.board)
          const res = engine.playBlack(move)
          if (res.ok) {
            this.state.board = engine.export()
            this.setState({...this.state});
          } else {
            console.log('ng:', res.error)
            return {
              content: [
                this.getUiResource(),
                {
                  type: "text",
                  text: (move === "PASS" ? 'User made an incorrect choice. Attempting to pass despite having a legal move' : 'User made an incorrect choice. User tried to place ' + this.state.board.to + ' on ' + move) + '. error message is "' + res.error + '"',
                  annotations: {
                    audience: ["assistant"],
                  }
                }
              ]
            }
          }
          m = res.pass ? 'User passed' : res.reset ? 'User reset the game.' : 'User placed B on ' + move
        } catch (e: any) {
          console.log('error:', e.toString())
          return {
            content: [
              {
                type: "text",
                text: `error: ${e.message}`,
                annotations: {
                  audience: ["assistant"],
                }
              }
            ]
          }
        }

        return {
          content: [
            this.getUiResource(),
            {
              type: "text",
              text: 'Board updated. The game board is displayed to the user. ' + m + `. current board: ${JSON.stringify(this.state.board)}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`,
              annotations: {
                audience: ["assistant"],
              },
            }
          ]
        }
      }
    );
    this.server.tool(
      "select-assistant",
      "assistant move a stone",
      {
        move: z.string().describe('Where to place the white stone. Specify one of A1 to H8. Pass to PASS.'),
      },
      async ({move}) => {
        try {
          const engine = new ReversiEngine()
          engine.import(this.state.board)
          const res = engine.playWhite(move)
          if (res.ok) {
            this.state.board = engine.export()
            this.setState({...this.state});
          } else {
            console.log('ng:', res.error)
            return {
              content: [
                this.getUiResource(),
                {
                  type: "text",
                  text: `The choice is incorrect. ${res.error}` + `. current board: ${JSON.stringify(this.state.board)}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`,
                  annotations: {
                    audience: ["assistant"],
                  }
                }
              ]
            }
          }
        } catch (e: any) {
          console.log('error:', e.toString())
          return {
            content: [
              {
                type: "text",
                text: `error: ${e.message}`,
                annotations: {
                  audience: ["assistant"],
                }
              }
            ]
          }
        }

        return {
          content: [
            this.getUiResource(),
            {
              type: "text",
              text: `Board updated. The game board is displayed to the user. current board: ${JSON.stringify(this.state.board)}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`,
              annotations: {
                audience: ["assistant"],
              },
            }
          ]
        }
      }
    )
  }

  private makeMessage(message: string) {
    return {content:[
      createUIResource({
        uri: "ui://reversi-mcp-ui/game-board",
        content: {
          type: "rawHtml",
          htmlString: generateReversiHTMLFromState(this.state.board, this.state.gameSession),
        },
        encoding: "text",
        resourceProps: {
          annotations: {
            audience: ["user"],
          },
        },
      }),
      {
        type: "text",
        text: message,
        annotations: {
          audience: ["assistant"],
        },
      }
    ] } as z.infer<typeof CallToolResultSchema>
  }

  private setMessage(message: string) {
    return {
      type: "text",
      text: message,
      annotations: {
        audience: ["assistant"],
      },
    };
  }

  private getUiResource() {
    return createUIResource({
      uri: "ui://reversi-mcp-ui/game-board",
      content: {
        type: "rawHtml",
        htmlString: generateReversiHTMLFromState(this.state.board, this.state.gameSession),
      },
      encoding: "text",
      resourceProps: {
        annotations: {
          audience: ["user"],
        },
      },
    });
  }
}

/*
const app = new Hono()

app.mount('/sse', MyMCP.serveSSE('/sse').fetch, { replaceRequest: false })
app.mount('/mcp', MyMCP.serve('/mcp').fetch, { replaceRequest: false} )

export default app
*/

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", {status: 404});
  },
};
