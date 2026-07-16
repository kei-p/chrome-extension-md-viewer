// ツールバーボタンのクリックで、現在のタブの表示内容を Markdown 描画に切り替える。
// activeTab 権限により、クリックしたタブにだけ一時的にアクセスできる。
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["style.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["markdown.js", "content.js"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof window.__mdViewerApply !== "function") return;
        // 実際の MIME が text/plain(系) のときだけ「生テキスト」とみなす。
        // GitHub 等の text/html ページはここで弾き、可視テキストを使う。
        // 再取得(UTF-8 デコード)も生テキストのときだけ許可する。
        const isPlainText =
          document.contentType === "text/plain" ||
          document.contentType === "text/markdown";
        const pre = document.body && document.body.querySelector("pre");
        const raw =
          isPlainText && pre
            ? pre.textContent
            : document.body
            ? document.body.innerText
            : "";
        window.__mdViewerApply(raw, isPlainText);
      },
    });
  } catch (e) {
    // chrome:// や Web Store など注入できないページでは何もしない
    console.warn("Markdown Viewer: このページには適用できません", e);
  }
});
