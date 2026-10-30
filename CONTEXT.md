# Siderail

Chrome のサイドパネルに、ブックマークとタブの縦一覧を Arc のサイドバーに似た見た目で表示する拡張機能。

## Language

**Side Panel**（サイドパネル）:
Chrome のブラウザ UI のうち、Sidebar を描画する面。ツールバーの拡張アイコンから開く。
_Avoid_: サイドバー（面を指す意味で）

**Sidebar**（サイドバー）:
サイドパネルに描画される縦一覧全体。上段の Bookmark Section と下段の Tab Section からなる。
_Avoid_: ナビゲーション

**Bookmark Section**（ブックマークセクション）:
Sidebar の上段。Bookmark Bar 配下をそのまま写した読み取り専用のツリー。
_Avoid_: お気に入り、リンク集

**Bookmark Bar**（ブックマークバー）:
Chrome ブックマークツリーのルートのうち、Bookmark Section が表示対象とするノード。他のルートは表示しない。
_Avoid_: お気に入りバー

**Bookmark**（ブックマーク）:
Bookmark Bar 配下のブックマーク 1 件。Bookmark Section では favicon とタイトルの行として表示する。
_Avoid_: お気に入り、リンク

**Tab Section**（タブ一覧）:
Sidebar の下段。現在のウィンドウの Tab を Chrome の並び順で並べた一覧。
_Avoid_: タブバー、タブストリップ

**Tab**（タブ）:
Chrome のタブ 1 つ。Tab Section では favicon とタイトルの行として表示する。
_Avoid_: ページ

**Active Tab**（アクティブタブ）:
現在表示中の Tab。Tab Section では角丸の背景でハイライトされる。
_Avoid_: 選択中タブ、カレントタブ

**Folder**（フォルダ）:
Bookmark Bar 配下のブックマークフォルダ。Bookmark Section では開閉できる行として表示し、フォルダ名に含まれる絵文字はそのまま表示する。
_Avoid_: ディレクトリ、グループ

**New Tab Row**（New Tab 行）:
Bookmark Section と Tab Section の間にある `+ New Tab` の行。
_Avoid_: 追加ボタン、新規作成行

**Mirror**（ミラー）:
Chrome のブックマークを読み取り専用でそのまま表示する関係。編集は Chrome 側で行う。
_Avoid_: 同期、インポート
