# Siderail

Chrome のサイドパネルに、ブックマークとタブを Arc のサイドバーに似た見た目で縦に並べる個人用の Chrome 拡張。

## 必要環境

- Node.js 24 以上
- pnpm 12

## セットアップ

```bash
pnpm install
pnpm build
```

## unpacked で Chrome に読み込む

1. `pnpm build` を実行し、`dist/chrome-mv3` を生成する
2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックする
5. 生成された `dist/chrome-mv3` ディレクトリを選択する
6. ツールバーの Siderail アイコンをクリックしてサイドパネルを開く（Chrome 114 以上）

コードを変更したら `pnpm build` を実行し、`chrome://extensions` の再読み込みボタンで反映する。

## タブ管理モード

設定ページ（`chrome://extensions` → Siderail → 「拡張機能のオプション」）で、タブ管理の方式を切り替えられる。

- **Arc 方式（既定）**: 上段のブックマークを Pinned、下段のピン留めしていないタブを Today として扱う。Pin から開いたタブは Chrome のピン留めタブになり、Today には表示されない。
- **Chrome 方式**: 従来どおり、ブックマークとすべてのタブを並べる。

変更は開いているサイドパネルにすぐ反映される。

## 開発

```bash
pnpm dev          # HMR 付きで開発する
pnpm lint         # oxlint
pnpm format:check # oxfmt による整形チェック
pnpm test         # vitest
```

`pnpm dev` では `dist/chrome-mv3-dev` が生成されるため、開発中はそちらを読み込む。

## ブラウザで UI を確認する

`pnpm dev` を起動し、Chrome で `http://localhost:3000/` を開くと、固定フィクスチャでサイドパネルの UI を確認できる。開発サーバー上で開いたときだけモックに切り替わり、拡張機能のサイドパネルでは従来どおり Chrome の実データを使う。

- 右端のハンドルをドラッグすると幅を変えられる（既定 320px、240–640px）
- ブックマークとタブの初期データは `src/dev/fixtures.ts` で編集する。ピン留めタブのフィクスチャが1つあり、対応するブックマークがないため未マップのピンとして表示される
- フォルダ開閉、タブ操作、ブックマークの追加・編集・削除・移動、ピンの解除はページ内のメモリにだけ反映され、リロードで初期状態に戻る。ブックマークをクリックしても実際のブラウザタブは開かない
- 区切り線をドラッグすると、上段と下段の高さを変えられる（フォーカス中は上下キーでも調整可能）
- favicon は開発サーバーが DuckDuckGo の favicon サービスへリダイレクトする。取得できない場合はスケルトン表示になる
- タブ管理モードは開発サーバー上ではフィクスチャの `chrome.storage.local` を空のまま起動するため、既定の Arc 方式になる

## アイコン

`public/icon/source.svg` が原本。各サイズの PNG を再生成する:

```bash
pnpm icons
```
