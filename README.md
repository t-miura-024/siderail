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

## 開発

```bash
pnpm dev          # HMR 付きで開発する
pnpm lint         # oxlint
pnpm format:check # oxfmt による整形チェック
pnpm test         # vitest
```

`pnpm dev` では `dist/chrome-mv3-dev` が生成されるため、開発中はそちらを読み込む。

## アイコン

`public/icon/source.svg` が原本。各サイズの PNG を再生成する:

```bash
pnpm icons
```
