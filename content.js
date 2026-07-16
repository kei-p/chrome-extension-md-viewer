// 描画ロジック本体。
// - window.__mdViewerApply(fallbackText, canRefetch): テキストを Markdown 描画してページを差し替える
//   UTF-8 解釈が ON なら元 URL を取得し直して UTF-8 でデコードする（文字化け対策）
// - file:// のプレーンテキスト表示のときだけ自動実行する
(function () {
  "use strict";

  // 設定を読む。既定は UTF-8 解釈 ON。
  function isUtf8Enabled() {
    try {
      return chrome.storage.sync.get({ utf8: true }).then((v) => v.utf8 !== false);
    } catch (e) {
      return Promise.resolve(true);
    }
  }

  // 元 URL のバイト列を取得し UTF-8 でデコードする。
  // cache: "force-cache" で、表示時にブラウザが取得済みのレスポンスをキャッシュから読む。
  // これにより有効期限付きの署名 URL（S3 等）へ再アクセスせずに済む。
  function decodeAsUtf8() {
    return fetch(location.href, { cache: "force-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      })
      .then((buf) => new TextDecoder("utf-8").decode(buf));
  }

  // fallbackText: 表示中テキスト。canRefetch: 再取得してよいか（プレーンテキスト表示のみ true）
  async function run(fallbackText, canRefetch) {
    // 既に変換済みなら、確定済みの元テキストで再描画する。
    // （変換後の DOM を読み直すと切替ボタンの文字などを拾ってしまうため）
    if (window.__mdViewerSource != null) {
      applyView(window.__mdViewerSource);
      return;
    }

    let text = fallbackText;
    // 生テキスト表示(canRefetch)かつ UTF-8 解釈 ON のときは、
    // バイト列を読み直して UTF-8 でデコードし文字化けを防ぐ（file:// / http(s) 共通）。
    if (canRefetch && (await isUtf8Enabled())) {
      try {
        text = await decodeAsUtf8();
      } catch (e) {
        // 取得失敗時は表示中テキストにフォールバック
        text = fallbackText;
      }
    }
    window.__mdViewerSource = text;
    applyView(text);
  }

  function applyView(rawText) {
    if (!rawText || rawText.trim() === "") return;

    // オリジナルの body を一度だけ退避する。
    // innerHTML 文字列ではなく子ノードごと動かすことで、元ページの見た目・機能を保つ。
    let original = window.__mdViewerOriginal;
    if (!original) {
      original = document.createElement("div");
      original.className = "md-viewer-original";
      while (document.body.firstChild) {
        original.appendChild(document.body.firstChild);
      }
      window.__mdViewerOriginal = original;
    }

    const renderedHtml = window.renderMarkdown(rawText);

    const container = document.createElement("article");
    container.className = "markdown-body";
    container.innerHTML = renderedHtml;

    const rawPre = document.createElement("pre");
    rawPre.className = "md-viewer-raw";
    rawPre.textContent = rawText;

    // Rendered / Raw / 閉じる を並べたセグメント切替
    const switcher = document.createElement("div");
    switcher.className = "md-viewer-switch";

    function makeBtn(label, active) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "md-viewer-switch-btn" + (active ? " is-active" : "");
      b.textContent = label;
      return b;
    }

    const renderedBtn = makeBtn("Rendered", true);
    const rawBtn = makeBtn("Raw", false);
    const originalBtn = makeBtn("閉じる", false);

    function show(mode) {
      container.style.display = mode === "rendered" ? "" : "none";
      rawPre.style.display = mode === "raw" ? "" : "none";
      original.style.display = mode === "original" ? "" : "none";
      // 閉じる（元の状態）を選んだらセレクタを隠す（再表示は拡張アイコンの再クリックで）
      switcher.style.display = mode === "original" ? "none" : "";
      renderedBtn.classList.toggle("is-active", mode === "rendered");
      rawBtn.classList.toggle("is-active", mode === "raw");
      originalBtn.classList.toggle("is-active", mode === "original");
    }
    renderedBtn.addEventListener("click", () => show("rendered"));
    rawBtn.addEventListener("click", () => show("raw"));
    originalBtn.addEventListener("click", () => show("original"));

    switcher.appendChild(renderedBtn);
    switcher.appendChild(rawBtn);
    switcher.appendChild(originalBtn);

    document.body.innerHTML = "";
    document.body.className = "md-viewer-active";
    document.body.appendChild(switcher);
    document.body.appendChild(container);
    document.body.appendChild(rawPre);
    document.body.appendChild(original);

    show("rendered");
  }

  window.__mdViewerApply = run;

  // 自動モード: file:// かつ Chrome のプレーンテキスト表示のときだけ実行。
  // （http(s) やその他ページはツールバーボタンでの手動実行に委ねる）
  function autoRun() {
    if (location.protocol !== "file:") return;
    if (!document.body) return;
    const pre = document.body.querySelector("pre");
    if (!pre || document.body.children.length !== 1) return;
    run(pre.textContent, true);
  }

  autoRun();
})();
