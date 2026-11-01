# Siderail

Chrome のサイドパネルに、ブックマークとタブの縦一覧を Arc のサイドバーに似た見た目で表示する拡張機能。タブ管理の方式を Chrome 方式と Arc 方式から選べる。

## Language

**Side Panel**（サイドパネル）:
Chrome のブラウザ UI のうち、Sidebar を描画する面。ツールバーの拡張アイコンから開く。
_Avoid_: サイドバー（面を指す意味で）

**Tab Management Mode**（タブ管理モード）:
サイドパネルがブックマークとタブをどう扱うかの方式。`arc` と `chrome` の2つがあり、Options Page で切り替える。保存値がないときは `arc`。
_Avoid_: 表示モード、テーマ

**Chrome Mode**（Chrome 方式）:
Bookmark Section にブックマークを、Tab Section にすべてのタブを表示する方式。従来の Siderail の挙動。
_Avoid_: 通常モード

**Arc Mode**（Arc 方式）:
Bookmark Section を Pinned、Tab Section を Today として扱う方式。ピン留めタブを Today から除き、Pin から開いたタブは Chrome のピン留めタブにする。
_Avoid_: Arc 風モード

**Options Page**（設定ページ）:
Tab Management Mode を切り替える、サイドパネルとは独立したページ。Chrome の拡張機能ページから開く。
_Avoid_: 設定画面、ポップアップ

**Sidebar**（サイドバー）:
サイドパネルに描画される縦一覧全体。上段と下段の2セクションからなり、それぞれ独立してスクロールする。間の Divider をドラッグして高さの配分を変更できる。上段と下段の意味は Tab Management Mode によって変わる。
_Avoid_: ナビゲーション

**Divider**（区切り線）:
上段と下段の間にある高さ調整用の境界。ドラッグまたは上下キーで両者の高さを変えられる。
_Avoid_: ボーダー、罫線

**Bookmark Section**（ブックマークセクション）:
Chrome 方式の上段。Bookmark Bar 配下をそのまま写したツリー。フォルダの開閉と、ブックマーク・フォルダの追加、編集、削除、ブックマークのドラッグによる並べ替え・フォルダ移動ができる。Arc 方式では同じデータを Pinned として表示する。
_Avoid_: お気に入り、リンク集

**Pinned**（ピン一覧）:
Arc 方式の上段。Bookmark Bar 配下のツリーを Pin の一覧として表示する。フォルダはそのまま Pinned のフォルダになる。
_Avoid_: 固定タブ、ピン留め一覧

**Pin**（ピン）:
Pinned の1行。実体は Bookmark 1件で、対応するライブタブを持てる。ライブタブがない Pin をクリックすると、そのブックマークの URL を Chrome のピン留めタブとして開く。
_Avoid_: ピン留めタブ（Chrome の `pinned` と区別するため）

**Pinned Tab Map**（ピンとタブの対応）:
Pin の Bookmark ID とライブタブ ID の対応。`chrome.storage.session` に保存し、タブが閉じるまで維持する。ブラウザ再起動後は URL が一致する Pin にだけ結び直す。
_Avoid_: タブマップ

**Unmapped Pin**（未マップのピン）:
Chrome 側でピン留めされているが、対応する Bookmark がないタブ。Pinned の末尾に表示し、ブックマークとして保存できる。
_Avoid_: 孤立タブ

**Today**（今日のタブ）:
Arc 方式の下段。現在のウィンドウのタブのうち、ピン留めされていないものを Chrome の並び順で表示する。
_Avoid_: 未固定タブ、タブ一覧

**Tab Section**（タブ一覧）:
Chrome 方式の下段。現在のウィンドウの Tab を Chrome の並び順で並べた一覧。タブをドラッグして並べ替えられる。Arc 方式では Today としてピン留めタブを除いて表示する。
_Avoid_: タブバー、タブストリップ

**Bookmark Bar**（ブックマークバー）:
Chrome ブックマークツリーのルートのうち、Bookmark Section と Pinned が表示対象とするノード。他のルートは表示しない。
_Avoid_: お気に入りバー

**Bookmark**（ブックマーク）:
Bookmark Bar 配下のブックマーク 1 件。Chrome 方式では favicon とタイトルの行として、Arc 方式では Pin として表示する。
_Avoid_: お気に入り、リンク

**Tab**（タブ）:
Chrome のタブ 1 つ。Tab Section と Today では favicon とタイトルの行として表示する。
_Avoid_: ページ

**Active Tab**（アクティブタブ）:
現在表示中の Tab。Tab Section と Today では角丸の背景でハイライトされる。Arc 方式では、アクティブなタブに対応する Pin もハイライトされる。
_Avoid_: 選択中タブ、カレントタブ

**Folder**（フォルダ）:
Bookmark Bar 配下のブックマークフォルダ。Chrome 方式では Bookmark Section で、Arc 方式では Pinned で開閉できる行として表示する。
_Avoid_: ディレクトリ、グループ

**New Tab Row**（New Tab 行）:
2つのセクションの間にある `+ New Tab` の行。
_Avoid_: 追加ボタン、新規作成行
