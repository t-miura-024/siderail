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
Tab Management Mode を切り替える、サイドパネルとは独立したページ。Settings Button から開くほか、Chrome の拡張機能ページからも開ける。
_Avoid_: 設定画面、ポップアップ

**Settings Button**（設定ボタン）:
サイドバー最上部のツールバー右端にある歯車。Options Page を新しいタブで開く。
_Avoid_: ギア、設定アイコン

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
Arc 方式の上段。Bookmark Bar 配下のツリーを Pin の一覧として表示する。フォルダはそのまま Pinned のフォルダになる。折りたたみ中のフォルダは、開いている子孫 Pin を Peek として直下に表示する。
_Avoid_: 固定タブ、ピン留め一覧

**Pin**（ピン）:
Pinned の1行。高さは40px固定。実体は Bookmark 1件で、対応するライブタブを持てる。ライブタブがない Pin をクリックすると、そのブックマークの URL を Chrome のピン留めタブとして開く。ライブタブの有無で Open Pin と Closed Pin に分かれる。
_Avoid_: ピン留めタブ（Chrome の `pinned` と区別するため）

**Open Pin**（開いているピン）:
ライブタブを持つ Pin。Pinned では通常の明るさで表示し、対応するタブがアクティブなら行全体をハイライトする。
_Avoid_: アクティブピン（アクティブなタブと区別するため）

**Closed Pin**（閉じているピン）:
ライブタブを持たない Pin。Pinned では favicon とタイトルを暗く表示し、ホバーで通常の明るさに戻す。
_Avoid_: 未ロードピン

**Navigated Pin**（遷移したピン）:
ライブタブがピン元の URL とは違う URL を表示している Pin。favicon は現在のサイトのものになる。favicon 側の左セグメントにホバーすると、ピン元の favicon にクロスフェードする。行の高さは40px固定のまま、favicon と操作ボタンは固定で、タイトルだけが少し上へ寄り、その下に「ピン元の URL に戻す」が出る。⌘ / Ctrl を押しながらホバーすると「ピンから切り離す」に変わり、⌘ / Ctrl + クリックで現在のページを通常タブとして切り離してピン元に戻す。行のタイトルは Pin のタイトルのまま。
_Avoid_: 離脱ピン

**Reset Button**（リセットボタン）:
Pin 行の左端のセグメント。favicon を含む。このセグメント全体がボタンで、遷移中はクリックするとピン元の URL に戻り、⌘ / Ctrl + クリックで切り離す。閉じているときは開き、開いていて遷移していないときはタブに切り替える。背景色は、ピン元と異なる URL を表示しているとき（リセットが機能するとき）のホバー中だけ表示する。
_Avoid_: favicon ボタン

**Close Button**（閉じるボタン）:
Pin 行の右端のセグメント。× を含み、行の右端から行の高さいっぱいに広がる。行のホバー中だけ × が見え、このセグメント全体をクリックするとライブタブを閉じる（Pin は残る）。再生中・ミュート中のタブでは、セグメント内にスピーカーボタンも並ぶ。
_Avoid_: × ボタン

**Row Indent**（行インデント）:
フォルダ階層に応じて行要素全体を右へずらす量。1段16pxで、内容の左余白は10px固定。背景・ホバー・アクティブのピルも行要素と一緒に動く。Chrome 方式のブックマーク行にも適用する。
_Avoid_: padding インデント

**Row Height**（行の高さ）:
サイドバーのすべての行の高さ。40px固定で、Pinned、Bookmark Section、Today、Tab Section、New Tab 行、Peek 行、Folder Preview の行を含む。ホバーしても高さは変わらない。
_Avoid_: 行間、リストの高さ、32px

**Peek**（peek 行）:
折りたたみ中のフォルダの直下に、開いている子孫 Pin だけを表示した行。閉じている Pin は含めない。ネストしたフォルダ内の開いている Pin も含み、インデントは Pin 本来の深さに従って Row Indent で行要素ごとずれる。Folder Preview がフォルダ全体を出すのに対し、Peek は常時見えるサマリとして開いている Pin だけを出す。
_Avoid_: プレビュー行、展開行

**Peeked Folder**（peek 中のフォルダ）:
折りたたみ中で、開いている子孫 Pin を1つ以上持つフォルダ。三点入りフォルダアイコンで表示する。展開中や、開いている子孫がない折りたたみフォルダは通常のフォルダアイコンを使う。
_Avoid_: 開いているフォルダ

**Folder Preview**（フォルダプレビュー）:
折りたたみ中のフォルダにマウスポインタを500ms置くと、そのフォルダ配下のすべての Pin / Bookmark をツリー順に平坦化して表示する、サイドパネル内の浮遊カード。行のクリックで開く・切り替えるだけを行い、×・ミュート・右クリック・ドラッグは持たない。空フォルダ、展開中のフォルダ、ドラッグ中、右クリックメニュー表示中は出さない。
_Avoid_: フォルダポップアップ、ホバー展開、プレビュー行

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
Chrome のタブ 1 つ。Tab Section と Today では favicon とタイトルの行として表示する。右端に閉じるボタンのセグメントがある。
_Avoid_: ページ

**Active Tab**（アクティブタブ）:
現在表示中の Tab。Tab Section と Today では角丸の背景でハイライトされる。Arc 方式では、アクティブなタブに対応する Pin もハイライトされる。
_Avoid_: 選択中タブ、カレントタブ

**Folder**（フォルダ）:
Bookmark Bar 配下のブックマークフォルダ。Chrome 方式では Bookmark Section で、Arc 方式では Pinned で開閉できる行として表示する。折りたたみ中に開いている子孫 Pin がある場合は Peeked Folder のアイコンになる。折りたたみ中はホバーで Folder Preview を出せる。
_Avoid_: ディレクトリ、グループ

**New Tab Row**（New Tab 行）:
2つのセクションの間にある `+ New Tab` の行。
_Avoid_: 追加ボタン、新規作成行
