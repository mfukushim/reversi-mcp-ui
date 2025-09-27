// reversi.ts
// Reversi Engine (A1=左上, "B"/"W", 64文字ボード). PASS 対応。
//  by ChatGPT 5

type Color = "B" | "W";
type Cell = "." | "B" | "W";

export interface ExportState {
  board: string;          // 64文字 (A1..H1, A2..H2, ... A8..H8)
  to: Color;              // 次手番
  legal: string[];        // 次手番の合法手 (座標)
  black: number;          // 黒の石数
  white: number;          // 白の石数
}

export interface PlayResult extends ExportState {
  ok: boolean;            // 着手が適法・反映済みなら true
  played?: string;        // 実際に打った座標（PASS なら "PASS"）
  flipped?: string[];     // 返った座標一覧
  message?: string;       // パスや終局のメッセージ
  error?: string;         // 反則時の説明
}

const DIRS: Array<[dr: number, dc: number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

function inRange(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function opp(color: Color): Color { return color === "B" ? "W" : "B"; }

function algebraicToRC(s: string): { r: number; c: number } {
  if (!/^[A-H][1-8]$/.test(s)) throw new Error(`Coordinates are in an invalid format: ${s}`); //  座標の形式が不正です
  const c = s.charCodeAt(0) - 65;         // 'A'→0
  const r = s.charCodeAt(1) - 49;         // '1'→0
  return { r, c };
}
function rcToAlgebraic(r: number, c: number): string {
  return String.fromCharCode(65 + c) + String.fromCharCode(49 + r);
}

function counts(board: Cell[][]) {
  let b = 0, w = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === "B") b++;
    else if (board[r][c] === "W") w++;
  }
  return { black: b, white: w };
}

function boardTo64(board: Cell[][]): string {
  let s = "";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) s += board[r][c];
  return s;
}

// function cloneBoard(board: Cell[][]): Cell[][] {
//   return board.map(row => row.slice()) as Cell[][];
// }

export class ReversiEngine {
  private b: Cell[] = Array(64).fill(".");
  private to: Color = "B";

  /** 標準初期配置で初期化 */
  init(): ExportState {
    console.log("Initializing ReversiEngine");
    this.b = Array(64).fill(".");
    // (r,c) を index に：idx = r*8 + c
    this.b[3 * 8 + 3] = "W";
    this.b[3 * 8 + 4] = "B";
    this.b[4 * 8 + 3] = "B";
    this.b[4 * 8 + 4] = "W";
    this.to = "B";
    return this.export();
  }

  /** 盤面・手番を外部から取り込む（検証 & 再計算） */
  import(state: Pick<ExportState, "board" | "to">): ExportState {
    // 検証：長さ・文字種
    if (state.board.length !== 64) {
      throw new Error("board は 64 文字である必要があります");
    }
    const arr: Cell[] = [];
    for (let i = 0; i < 64; i++) {
      const ch = state.board[i] as Cell;
      if (ch !== "." && ch !== "B" && ch !== "W") {
        throw new Error(`board の ${i} 文字目が不正です: '${state.board[i]}'`);
      }
      arr.push(ch);
    }
    if (state.to !== "B" && state.to !== "W") {
      throw new Error("to は 'B' または 'W' である必要があります");
    }
    this.b = arr;
    this.to = state.to;
    // 合法手/カウントは自前で再計算
    return this.export();
  }

  /** 現在状態を書き出し（legal/black/white 再計算） */
  export(): ExportState {
    const legal = this.legalMoves(this.to);
    const { black, white } = this.counts();
    return { board: this.b.join(""), to: this.to, legal, black, white };
  }

/** 黒の着手 */
  public playBlack(move: string) {
    return this.play("B", move);
  }

/** 白の着手 */
  public playWhite(move: string) {
    return this.play("W", move);
  }

  /** 現在手番で座標を打つ（合法でなければ false） */
  play(to:Color,coord: string): { ok: boolean; error?: string; placedIdx?: number } {
    if (to !== this.to) {
      return { ok: false, error: "手番不正" }
    }
    if (coord === "PASS") {
      const leg = this.legalMoves(this.to);
      if (leg.length) return { ok: false, error: "まだ合法手があります" };
      this.to = this.opp(this.to);
      return { ok: true };
    }
    if (!/^[A-H][1-8]$/.test(coord)) return { ok: false, error: "座標が不正です" };
    const i = this.idx(coord);
    if (this.b[i] !== ".") return { ok: false, error: "既に石があります" };

    const flips = this.flips(i, this.to);
    if (!flips.length) {
      console.log('board:',this.b,to,coord)
      return {ok: false, error: "取れません"};
    }

    // 反映
    this.b[i] = this.to;
    for (const j of flips) this.b[j] = this.to;

    // 相手に手番
    this.to = this.opp(this.to);
    // 相手が打てないなら自動パスで手番を戻す（終局判定は export() 側の legal で分かる）
    if (this.legalMoves(this.to).length === 0) {
      this.to = this.opp(this.to);
    }
    return { ok: true, placedIdx: i };
  }

  // ---- 内部ユーティリティ ----
  private opp(c: Color): Color { return c === "B" ? "W" : "B"; }
  private idx(coord: string): number {
    const c = coord.charCodeAt(0) - 65;
    const r = coord.charCodeAt(1) - 49;
    return r * 8 + c;
  }
  private rc(i: number): [number, number] { return [Math.floor(i / 8), i % 8]; }
  private coord(i: number): string {
    return String.fromCharCode(65 + (i % 8)) + String.fromCharCode(49 + Math.floor(i / 8));
  }
  private counts() {
    let black = 0, white = 0;
    for (const x of this.b) { if (x === "B") black++; else if (x === "W") white++; }
    return { black, white };
  }
  private legalMoves(color: Color): string[] {
    const res: string[] = [];
    for (let i = 0; i < 64; i++) {
      if (this.b[i] !== ".") continue;
      if (this.flips(i, color).length > 0) res.push(this.coord(i));
    }
    return res;
  }
  private flips(i: number, color: Color): number[] {
    if (this.b[i] !== ".") return [];
    const [r, c] = this.rc(i);
    const opp = this.opp(color);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    const res: number[] = [];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      const tmp: number[] = [];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && this.b[rr * 8 + cc] === opp) {
        tmp.push(rr * 8 + cc); rr += dr; cc += dc;
      }
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && this.b[rr * 8 + cc] === color && tmp.length) {
        res.push(...tmp);
      }
    }
    return res;
  }
}

/*
export class ReversiEngine {
  private board: Cell[][];
  private toMove: Color;

  constructor() {
    this.board = this.makeEmpty();
    this.toMove = "B";
  }

  /!** 盤面を初期化（標準初期配置、手番=黒） *!/
  public init(): ExportState {
    this.board = this.makeEmpty();
    this.board[3][3] = "W"; this.board[3][4] = "B";
    this.board[4][3] = "B"; this.board[4][4] = "W";
    this.toMove = "B";
    return this.export();
  }

  /!** 現在の盤面を書き出し *!/
  public export(): ExportState {
    const legal = this.legalMoves(this.toMove);
    const { black, white } = counts(this.board);
    return { board: boardTo64(this.board), to: this.toMove, legal, black, white };
  }

  /!** 黒の着手 *!/
  public playBlack(move: string): PlayResult {
    return this.play("B", move);
  }

  /!** 白の着手 *!/
  public playWhite(move: string): PlayResult {
    return this.play("W", move);
  }

  // ---- 内部実装 ----

  private makeEmpty(): Cell[][] {
    return Array.from({ length: 8 }, () => Array<Cell>(8).fill("."));
  }

  // private colorAt(r: number, c: number): Cell { return this.board[r][c]; }

  /!** color 側の合法手（座標配列）。返り数>0 のみ合法。 *!/
  private legalMoves(color: Color): string[] {
    const res: string[] = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (this.board[r][c] !== ".") continue;
      if (this.collectFlips(r, c, color).length > 0) res.push(rcToAlgebraic(r, c));
    }
    return res;
  }

  /!** (r,c) に打った時に返る相手石の座標一覧（なければ空配列） *!/
  private collectFlips(r: number, c: number, color: Color): Array<[number, number]> {
    if (this.board[r][c] !== ".") return [];
    const oppCol = opp(color);
    const flips: Array<[number, number]> = [];
    for (const [dr, dc] of DIRS) {
      let rr = r + dr, cc = c + dc;
      const line: Array<[number, number]> = [];
      if (!inRange(rr, cc) || this.board[rr][cc] !== oppCol) continue; // 隣が相手でなければ無効
      while (inRange(rr, cc) && this.board[rr][cc] === oppCol) {
        line.push([rr, cc]);
        rr += dr; cc += dc;
      }
      if (inRange(rr, cc) && this.board[rr][cc] === color && line.length > 0) {
        flips.push(...line);
      }
    }
    return flips;
  }

  /!** 実着手（PASS含む）。色不一致・ルール違反ならエラーを返す。 *!/
  private play(color: Color, move: string): PlayResult {
    if (color !== this.toMove) {
      return this.result(false, `The move is ${this.toMove} (not ${color})`); //  手番は ${this.toMove} です（${color} ではありません）
    }

    // パス処理
    const legalNow = this.legalMoves(color);
    if (move === "PASS") {
      if (legalNow.length > 0) {
        return this.result(false, `There are still legal moves. You cannot PASS (legal moves: ${legalNow.join(", ")})`);  //  まだ合法手があります。PASS はできません（合法手:
      }
      // パスは合法。相手に手番移行
      this.toMove = opp(this.toMove);
      const oppLegals = this.legalMoves(this.toMove);
      if (oppLegals.length === 0) {
        // 連続パス -> 終局
        const message = this.finishMessage();
        return this.result(true, undefined, "PASS", [], message, "NONE");
      } else {
        return this.result(true, undefined, "PASS", [], `PASS。手番は ${this.toMove} に移ります。`);
      }
    }

    // 座標着手
    let r: number, c: number;
    try {
      ({ r, c } = algebraicToRC(move));
    } catch (e:any) {
      return this.result(false, e.message ?? "Coordinate Error");  //  座標エラー
    }
    if (this.board[r][c] !== ".") {
      return this.result(false, `${move} already has a stone`);  //  は既に石があります
    }
    const flips = this.collectFlips(r, c, color);
    if (flips.length === 0) {
      return this.result(false, `Illegal moves: ${move} cannot sandwich an opponent's stone`);  //は相手石を挟めません（不合法）
    }

    // 反映
    this.board[r][c] = color;
    for (const [rr, cc] of flips) this.board[rr][cc] = color;

    // 相手へ手番移行。ただし相手に合法手がなければ自動パスで手番は戻る
    const next = opp(this.toMove);
    this.toMove = next;
    const nextLegals = this.legalMoves(this.toMove);
    if (nextLegals.length === 0) {
      // 相手パス（自動）
      this.toMove = color;
      // 両者とも合法手なしなら終局
      const myLegals = this.legalMoves(this.toMove);
      if (myLegals.length === 0) {
        const message = this.finishMessage();
        return this.result(true, undefined, move, flips.map(([rr, cc]) => rcToAlgebraic(rr, cc)), message, "NONE");
      } else {
        return this.result(true, undefined, move, flips.map(([rr, cc]) => rcToAlgebraic(rr, cc)), `As the opponent has no legal moves, ${color}'s turn continues.`);  //  相手に合法手がないため ${color} の手番が続きます。
      }
    }

    // 通常継続
    return this.result(true, undefined, move, flips.map(([rr, cc]) => rcToAlgebraic(rr, cc)));
  }

  private finishMessage(): string {
    const { black, white } = counts(this.board);
    if (black > white) return `End game: Black ${black} - White ${white}. Black wins.`; //  終局：黒 ${black} - 白 ${white}。黒の勝ち。
    if (white > black) return `End game: Black ${black} - White ${white}. White wins.`; //  終局：黒 ${black} - 白 ${white}。白の勝ち。
    return `End game: Black ${black} - White ${white}. Draw.`;  //  終局：黒 ${black} - 白 ${white}。引き分け。
  }

  private result(
    ok: boolean,
    error?: string,
    played?: string,
    flipped?: string[],
    message?: string,
    forceTo?: Color | "NONE",
  ): PlayResult {
    const exp = this.export();
    const to = (forceTo ?? exp.to) as Color | "NONE";
    return {
      ok,
      error,
      played,
      flipped,
      message,
      board: exp.board,
      to: to === "NONE" ? (exp.to as Color) : (to as Color), // export() は Color 固定なので暫定で同値返却
      legal: to === "NONE" ? [] : exp.legal,
      black: exp.black,
      white: exp.white,
    };
  }
}
*/
