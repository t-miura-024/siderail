Feature: Arc 方式のタブ管理

  Scenario: 既定では Arc 方式で表示される
    Given 保存されたタブ管理モードがない
    When サイドパネルを開く
    Then 上段にブックマークバー配下の Pinned が表示される
    And 下段にピン留めしていないタブが Today として表示される

  Scenario: 設定で Chrome 方式に切り替えられる
    Given タブ管理モードが "arc" である
    When 設定ページで "chrome" を選ぶ
    Then サイドパネルがリロードなしで Chrome 方式の表示に変わる

  Scenario: Pin をクリックするとピン留めタブとして開く
    Given Pinned にピン "Mail" がある
    And ピン "Mail" に対応するライブタブがない
    When ピン "Mail" をクリックする
    Then "Mail" の URL が Chrome のピン留めタブとして開く

  Scenario: ピン留めタブは Today に表示されない
    Given Pinned にピン "Mail" がある
    And ピン "Mail" のライブタブが開いている
    When サイドパネルを開く
    Then Today に "Mail" のタブは表示されない

  Scenario: Pinned の × はタブだけを閉じる
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    When ピン "Mail" の行にホバーして "×" をクリックする
    Then "Mail" のタブが閉じる
    And Pinned にピン "Mail" が残る

  Scenario: Today のタブを Pinned へドラッグするとピンになる
    Given Today にタブ "GitHub" がある
    And Pinned にピン "Mail" がある
    When タブ "GitHub" をピン "Mail" の下へドラッグする
    Then ブックマークバーに "GitHub" のブックマークが追加される
    And タブ "GitHub" がピン留めタブになる
    And Today からタブ "GitHub" が消える

  Scenario: Pinned のピンを Today へドラッグするとピン解除される
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    And Today にタブ "GitHub" がある
    When ピン "Mail" をタブ "GitHub" の下へドラッグする
    Then ブックマークバーから "Mail" のブックマークが削除される
    And "Mail" のタブがピン留めを解除され、Today に表示される

  Scenario: ピン解除を取り消せる
    Given ピン "Mail" を Today へドラッグしてピン解除した
    When トーストの "元に戻す" をクリックする
    Then ブックマークバーに "Mail" のブックマークが元の位置へ戻る
    And "Mail" のタブが再びピン留めされる

  Scenario: favicon のクリックでピン元の URL に戻る
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    And そのタブが "https://mail.example.com/other" を表示している
    When ピン "Mail" の favicon をクリックする
    Then そのタブが "https://mail.example.com/inbox" を表示する

  Scenario: 未マップのピンが Pinned に表示される
    Given Chrome でタブ "News" がピン留めされている
    And "News" の URL に対応するブックマークがない
    When サイドパネルを開く
    Then Pinned の末尾に "News" が未マップのピンとして表示される
    And 右クリックメニューの "ピンとして保存" でブックマークバーに追加できる

  Scenario: ブラウザ再起動後にタブがピンへ結び直される
    Given ブックマークバーに "Mail" のブックマークがある
    And ブラウザを再起動して "Mail" の URL のピン留めタブが復元された
    When サイドパネルを開く
    Then ピン "Mail" がライブタブとして表示される

  Scenario: 再生中のピンをミュートできる
    Given Pinned にピン "Music" があり、ライブタブが音を出している
    When ピン "Music" の行にスピーカーアイコンが表示される
    And スピーカーアイコンをクリックする
    Then そのタブがミュートされる

  Scenario: 閉じているピンは暗く表示される
    Given Pinned にピン "Mail" がある
    And ピン "Mail" に対応するライブタブがない
    When サイドパネルを開く
    Then ピン "Mail" の favicon とタイトルが暗く表示される

  Scenario: 開いているピンは通常の明るさで表示される
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    And ピン "Mail" のライブタブはアクティブではない
    When サイドパネルを開く
    Then ピン "Mail" は暗く表示されない

  Scenario: 閉じているピンはホバーで明るくなる
    Given Pinned にピン "Mail" があり、ライブタブがない
    When ピン "Mail" の行にホバーする
    Then ピン "Mail" の favicon とタイトルが通常の明るさになる

  Scenario: ピン元と違う URL を表示しているピンは現在のサイトの favicon になる
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    And そのタブが "https://example.com/" を表示している
    When サイドパネルを開く
    Then ピン "Mail" の favicon が "https://example.com/" のものになる
    And ピン "Mail" のタイトルは "Mail" のままである

  Scenario: 遷移したピンの favicon はホバーでピン元に切り替わる
    Given Pinned にピン "Mail" があり、ライブタブが "https://example.com/" を表示している
    When ピン "Mail" の favicon 側の左セグメントにホバーする
    Then favicon がピン元の URL のものにクロスフェードする
    And タイトルの左位置はホバー前後で変わらない
    And favicon と操作ボタンは上下に動かない
    And タイトルだけが少し上へ寄る
    And タイトルの下に "ピン元の URL に戻す" が表示される
    And 行の高さは40pxのまま変わらない
    And セグメントをクリックするとピン元の URL に戻る

  Scenario: favicon 側の左セグメント全体がリセットボタンになる
    Given ピン "Mail" のライブタブが "https://example.com/" を表示している
    When ピン "Mail" の行の左端（favicon の左余白）をクリックする
    Then ピンのライブタブがピン元の URL に戻る

  Scenario: 右セグメント全体が閉じるボタンになる
    Given Pinned にピン "Mail" があり、ライブタブが開いている
    When ピン "Mail" の行の右端（× の右余白）をクリックする
    Then "Mail" のタブが閉じる
    And Pinned にピン "Mail" が残る

  Scenario: フォルダ配下の行は行要素全体がインデントされる
    Given Pinned のフォルダ "test1" の中にフォルダ "test1-1" がある
    When サイドパネルを開く
    Then フォルダ "test1" の行は左端から0pxの位置から始まる
    And フォルダ "test1-1" の行は左端から16pxの位置から始まる
    And 行のホバー背景とアクティブのピルも行要素と同じ位置から始まる
    And 内容の左余白は10pxで一定である

  Scenario: 修飾キーを押しながらホバーすると切り離しの案内に変わる
    Given ピン "Mail" のライブタブが "https://example.com/" を表示している
    When ピン "Mail" の favicon にホバーし、⌘ または Ctrl を押す
    Then サブタイトルが "ピンから切り離す" に変わる

  Scenario: 修飾キーを押しながら favicon をクリックすると切り離される
    Given ピン "Mail" のライブタブが "https://example.com/" を表示している
    When ピン "Mail" の favicon を ⌘ または Ctrl を押しながらクリックする
    Then "https://example.com/" がピン留めされていない通常タブとして Today に開く
    And ピン "Mail" のライブタブはピン元の URL に戻る
    And ピン "Mail" の "/" が消える

  Scenario: 折りたたみフォルダの開いているピンが peek 行として表示される
    Given Pinned のフォルダ "Communicate" にピン "Mail" とピン "X" がある
    And ピン "Mail" のライブタブだけが開いている
    When フォルダ "Communicate" を閉じる
    Then フォルダ "Communicate" の直下にピン "Mail" が peek 行として表示される
    And ピン "X" は表示されない
    And フォルダ "Communicate" のアイコンが三点入りフォルダになる

  Scenario: peek 行はツリー順で、ピン本来の深さにインデントされる
    Given Pinned のフォルダ "Communicate" にピン "Mail"、ピン "X"、ピン "Slack" がこの順である
    And ピン "Mail" とピン "Slack" のライブタブが開いている
    When フォルダ "Communicate" を閉じる
    Then peek 行は "Mail"、"Slack" の順で表示される
    And peek 行の行要素はピン本来の深さに応じて右へずれる

  Scenario: ネストしたフォルダ内の開いているピンは本来の深さで表示される
    Given Pinned のフォルダ "Tools" の中にフォルダ "Design" があり、その中にピン "Figma" がある
    And ピン "Figma" のライブタブが開いている
    When フォルダ "Tools" を閉じる
    Then フォルダ "Tools" の直下にピン "Figma" が peek 行として表示される
    And ピン "Figma" は2段目の深さにインデントされる
    And フォルダ "Design" は表示されない

  Scenario: 開いているピンがなくなると peek 表示が消える
    Given フォルダ "Communicate" が閉じていて、ピン "Mail" が peek 行として表示されている
    When ピン "Mail" のライブタブを閉じる
    Then フォルダ "Communicate" の下から peek 行が消える
    And フォルダ "Communicate" のアイコンが通常の折りたたみフォルダに戻る

  Scenario: フォルダを展開すると peek 行は通常の子行になる
    Given フォルダ "Communicate" が閉じていて、ピン "Mail" が peek 行として表示されている
    When フォルダ "Communicate" を開く
    Then peek 行は表示されなくなる
    And ピン "Mail" はフォルダの通常の子行として表示される
