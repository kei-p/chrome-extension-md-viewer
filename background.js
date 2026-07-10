// UTF-8 矯正ルールセット（rules.json）の有効/無効を設定に合わせて切り替える。
// このルールは .md 系ページの Content-Type に charset=utf-8 を付与し、
// ブラウザのデコードを UTF-8 に固定して文字化けを防ぐ。
const RULESET_ID = "md_charset";

async function syncRuleset() {
  let enabled = true;
  try {
    const v = await chrome.storage.sync.get({ utf8: true });
    enabled = v.utf8 !== false;
  } catch (e) {
    // 取得失敗時は既定（ON）
  }
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(
      enabled
        ? { enableRulesetIds: [RULESET_ID] }
        : { disableRulesetIds: [RULESET_ID] }
    );
  } catch (e) {
    console.warn("Markdown Viewer: ルールセット切替に失敗", e);
  }
}

chrome.runtime.onInstalled.addListener(syncRuleset);
chrome.runtime.onStartup.addListener(syncRuleset);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.utf8) syncRuleset();
});

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
        // プレーンテキスト表示なら <pre> の中身、それ以外は可視テキストを使う。
        // 再取得(UTF-8 デコード)はプレーンテキスト表示のときだけ許可する。
        const pre = document.body && document.body.querySelector("pre");
        const isPlainText = pre && document.body.children.length === 1;
        const raw = isPlainText
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
