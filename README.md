# Markdown Viewer

表示中のテキストを Markdown としてレンダリング表示する Chrome 拡張機能です。ローカルの `.md` ファイルは自動で描画し、任意のページはツールバーのボタンから手動で適用できます。依存ライブラリなしの軽量な自前パーサで動作します。

## 主な機能

- **ローカルファイルの自動描画**: `file://` で開いた `.md` / `.markdown` / `.mdown` / `.mkd` / `.mkdn` / `.mdtext` / `.text` を自動で Markdown 描画に切り替え
- **任意ページへの手動適用**: ツールバーのボタンをクリックすると、現在のタブの表示内容を Markdown として描画（`activeTab` 権限で、クリックしたタブにのみ一時的にアクセス）
- **Raw / Rendered 切替**: 描画結果と元テキストをボタンで切り替え表示
- **文字化け対策（UTF-8 解釈）**: `http(s)` は `declarativeNetRequest` で `.md` 系ページの Content-Type に `charset=utf-8` を付与。`file://` は元データを取得し直して UTF-8 でデコード。設定画面で ON / OFF を切替可能（既定 ON）
- **ダークモード対応**: OS の配色設定に追従

## 対応 Markdown 記法

見出し / 段落 / 強調 / インラインコード / コードフェンス / 箇条書き・番号付きリスト（ネスト対応） / 引用 / 水平線 / GFM テーブル / リンク / 画像 / 取り消し線 / 自動リンク。

`javascript:` などの危険なスキームは無効化し、`data:` は画像のみ許可しています。

## インストール（開発時）

1. `chrome://extensions` を開く
2. 「デベロッパー モード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を選択し、このディレクトリを指定する

## 使い方

- **ローカルの Markdown ファイル**: `.md` などのファイルをブラウザで開くと自動的に描画されます
- **その他のページ**: 描画したいページでツールバーの拡張機能アイコンをクリックします
- **設定**: 拡張機能アイコンを右クリック →「オプション」から UTF-8 解釈の ON / OFF を切り替えられます

## 構成

- **manifest.json**: Manifest V3 設定（権限: `scripting` / `activeTab` / `storage` / `declarativeNetRequestWithHostAccess`）
- **background.js**: Service Worker。ツールバーボタンのクリック処理と UTF-8 矯正ルールセットの有効/無効切替
- **content.js**: 描画ロジック本体。テキストの Markdown 描画・ページ差し替え・Raw/Rendered 切替
- **markdown.js**: 依存なしの軽量 Markdown パーサ（`renderMarkdown(src)` を公開）
- **rules.json**: `.md` 系ページの Content-Type に `charset=utf-8` を付与する `declarativeNetRequest` ルール
- **options.html / options.js**: 設定画面（UTF-8 解釈の ON / OFF、`chrome.storage.sync` で永続化）
- **style.css**: 描画結果のスタイル（GitHub 風 / ダークモード対応）

## ライセンス

[MIT License](LICENSE) の下で公開しています。
