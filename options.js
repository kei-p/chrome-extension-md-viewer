// 設定の読み込み・保存。既定は UTF-8 解釈 ON。
const box = document.getElementById("utf8");
const status = document.getElementById("status");

chrome.storage.sync.get({ utf8: true }, (v) => {
  box.checked = v.utf8 !== false;
});

box.addEventListener("change", () => {
  chrome.storage.sync.set({ utf8: box.checked }, () => {
    status.textContent = "保存しました";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  });
});
