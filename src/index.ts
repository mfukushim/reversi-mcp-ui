// import { Hono } from "hono";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// import { z } from "zod";
import {createUIResource} from "@mcp-ui/server";
import {generateReversiHTMLFromState} from "./rule-logic/boardDrawer.js";
import {ExportState, ReversiEngine} from "./rule-logic/reversi.js";
import {z} from "zod";
import {startHtml} from "./rule-logic/start";

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

  async init() {
    this.server.tool(
      "get-board",
      "get a reviersi board",
      {
      },
      async () => {
        return {
          content: [
            createUIResource({
              uri: "ui://reversi-mcp-ui/game-board",
              content: {
                type: "rawHtml",
                htmlString: generateReversiHTMLFromState(this.state.board,this.state.gameSession),
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
              text: `current turn: ${this.state.board.to}`,
              annotations: {
                audience: ["assistant"],
              },
            },
          ],
        }
      },
    );
    this.server.tool(
      "select-user",
      "user move a stone",
      {
        move: z.string(),
        //  TODO 暗号化またはサイン要  つまり 公開鍵をAIに知られない方法で送らなければならない サインのみならAIに漏れる形でもよい? AIが嘘の公開鍵をMCPに送る可能性があるのでサインでもダメか。。
        gameSession: z.string(), //  TODO 通信時に使用
      },
      async ({move}) => {
        try {
          const engine = new ReversiEngine()
          engine.import(this.state.board)
          const res = engine.playBlack(move)
          if(res.ok) {
            this.state.board = engine.export()
          } else {
            console.log('ng:',res.error)
            return {
              content: [
                {
                  type: "text",
                  text: `error: ${res.error}`,
                  annotations: {
                    audience: ["assistant"],
                  }
                }
              ]
            }
          }
        } catch (e:any) {
          console.log('error:',e.toString())
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
          content:[
            createUIResource({
              uri: "ui://reversi-mcp-ui/game-board",
              content: {
                type: "rawHtml",
                htmlString: generateReversiHTMLFromState(this.state.board,this.state.gameSession),
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
              text: `current board: ${this.state.board}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`,
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
        move: z.string(),
      },
      async ({move}) => {
        try {
          const engine = new ReversiEngine()
          engine.import(this.state.board)
          const res = engine.playWhite(move)
          if(res.ok) {
            this.state.board = engine.export()
          } else {
            console.log('ng:',res.error)
            return {
              content: [
                {
                  type: "text",
                  text: `error: ${res.error}`,
                  annotations: {
                    audience: ["assistant"],
                  }
                }
              ]
            }
          }
        } catch (e:any) {
          console.log('error:',e.toString())
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
          content:[
            createUIResource({
              uri: "ui://reversi-mcp-ui/game-board",
              content: {
                type: "rawHtml",
                htmlString: generateReversiHTMLFromState(this.state.board,this.state.gameSession),
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
              text: `current board: ${this.state.board}.  ${this.state.board.to === "W" ? 'Assistant\'s turn.' : 'User\'s turn.'}`,
              annotations: {
                audience: ["assistant"],
              },
            }
          ]
        }
      }
    )
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

    return new Response("Not found", { status: 404 });
  },
};


/*
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
*/
