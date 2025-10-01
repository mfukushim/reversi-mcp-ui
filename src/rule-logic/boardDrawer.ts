import {ExportState} from "./reversi";
import {postMessageUISizeChange} from "../utils/postMessageUISizeChange";


// reversi_page.ts
// 1) ReversiEngine に import 機能を追加
// 2) 外部の ExportState で初期化して描画する HTML を 1本の文字列で生成

// @ts-ignore
import board from "./board.html";

function render(tpl: string, data: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? "");
}
/**
 * 外部の ExportState を初期盤として埋め込み、自己完結の HTML を返す。
 * - handlerName: クリック時に呼ぶ window グローバル関数名
 */
export function generateReversiHTMLFromState(
  initial: ExportState,
  gameSession: string,
  handlerName = "reversiOnClick",
): string {
  // console.log('board:',board)
  // ここでは initial を JSON として埋め込み、ブラウザ内で import() してから描画します。
  const initialJson = JSON.stringify(initial);
  const out = render(board,{
    initialState: initialJson,
    gameSession: gameSession,
    postMessageUISizeChange,
  });
  // console.log('out:',out)
  return out;
}
