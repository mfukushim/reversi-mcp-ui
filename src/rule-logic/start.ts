import {postMessageUISizeChange} from "../utils/postMessageUISizeChange";


export const startHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Reversi - Start</title>
<style>
  :root {
    --bg: #0f172a;      /* slate-900 */
    --fg: #e2e8f0;      /* slate-200 */
    --accent: #22c55e;  /* green-500 */
    --accent-d: #16a34a;/* green-600 */
  }
  * { box-sizing: border-box; }
  html, body {
    height: 100%;
    margin: 0;
    background: radial-gradient(1200px 800px at 50% -10%, #172554 0%, #0b1022 40%, var(--bg) 100%);
    color: var(--fg);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
  }
  .wrap {
    min-height: 100%;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .card {
    text-align: center;
    max-width: 720px;
  }
  h1 {
    margin: 0 0 24px 0;
    font-size: clamp(36px, 7vw, 72px);
    line-height: 1.1;
    letter-spacing: .02em;
    text-shadow: 0 10px 40px rgba(0,0,0,.6);
  }
  p.desc {
    margin: 0 0 28px 0;
    opacity: .85;
    font-size: clamp(14px, 2.4vw, 18px);
  }
  button#start {
    display: inline-block;
    width: min(92vw, 420px);
    padding: 18px 28px;
    font-size: clamp(18px, 3.8vw, 24px);
    font-weight: 800;
    letter-spacing: .04em;
    color: #08130a;
    background: linear-gradient(180deg, var(--accent) 0%, var(--accent-d) 100%);
    border: none;
    border-radius: 14px;
    box-shadow:
      0 10px 24px rgba(6, 95, 70, .45),
      inset 0 -4px 0 rgba(0,0,0,.18);
    cursor: pointer;
    transition: transform .06s ease, filter .15s ease;
  }
  button#start:hover { filter: brightness(1.06); }
  button#start:active { transform: translateY(1px); }
  .note {
    margin-top: 12px;
    font-size: 12px;
    opacity: .7;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Reversi</h1>
      <p class="desc">スタートすると、この端末にセッション用の UUID を保存し、親ウィンドウへ開始メッセージを送ります。</p>
      <button id="start" type="button" aria-label="ゲームを開始">START</button>
      <div class="note">Cookie: <code>reversi_session_uuid</code>（有効期限 30日 / SameSite=Lax）</div>
    </div>
  </div>

<script>
  // ===== 設定（必要なら変更可） =====
  const COOKIE_NAME = "reversi_session_uuid";
  const COOKIE_MAX_AGE_DAYS = 30;
  const POST_MESSAGE_TEXT = "REVERSI_START"; // 固定メッセージ
  const POST_MESSAGE_TARGET = "*";           // 必要に応じてオリジンを絞ってください

  // UUID v4 生成（crypto.randomUUID があればそれを使用）
  function genUUIDv4(){
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    // フォールバック（RFC4122 v4 準拠の近似）
    const rnd = crypto && crypto.getRandomValues ? () => crypto.getRandomValues(new Uint8Array(1))[0] : () => Math.floor(Math.random()*256);
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, ch => {
      const r = rnd() & 0xf;
      const v = ch === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Cookie セット
  function setCookie(name, value, days){
    const maxAge = Math.floor(days * 24 * 60 * 60);
    // path と SameSite は明示。HTTPS 環境なら Secure を付与
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = 'encodeURIComponent(name)'+'='+encodeURIComponent(value)+'; Max-Age='+maxAge.toString()+'; Path=/; SameSite=Lax'+secure;
  }

  // 既存 Cookie 取得（存在すれば返す）
  function getCookie(name){
    const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[-./*+?^$}{()|[\\]\\\\]/g, "\\\\$&") + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // メイン動作
  function start(){
    let uuid = getCookie(COOKIE_NAME);
    if (!uuid) {
      uuid = genUUIDv4();
      setCookie(COOKIE_NAME, uuid, COOKIE_MAX_AGE_DAYS);
    }
    // 固定メッセージを親へ送信
    try {
      window.parent.postMessage(POST_MESSAGE_TEXT, POST_MESSAGE_TARGET);
    } catch (e) {
      console.error("postMessage 送信に失敗:", e);
    }

    // 任意：開始後の遷移や UI 変化があればここで
    const btn = document.getElementById("start");
    btn.disabled = true;
    btn.textContent = "STARTED";
  }

  document.getElementById("start").addEventListener("click", start);
  // Enter/Space での操作もサポート
  document.getElementById("start").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); start(); }
  });
</script>`
  +postMessageUISizeChange+
`</body>
</html>`;