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
