Feature: フォルダプレビュー

  Scenario: 折りたたみフォルダにホバーすると配下のピンが Folder Preview に表示される
    Given Pinned のフォルダ "Develop" にピン "GitHub"、ピン "Jotter"、ピン "opencode" がこの順である
    And ピン "GitHub" のライブタブだけが開いている
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    Then Folder Preview に "GitHub"、"Jotter"、"opencode" がこの順で表示される
    And 開いているピン "GitHub" は通常の明るさで表示される
    And 閉じているピン "Jotter" と "opencode" は暗く表示される

  Scenario: peek 行があるフォルダでも閉じているピンが Folder Preview に表示される
    Given フォルダ "Communicate" が閉じていて、ピン "Mail" が peek 行として表示されている
    And フォルダ "Communicate" にピン "X" がある
    When フォルダ "Communicate" に500msホバーする
    Then Folder Preview に "Mail" と "X" が表示される

  Scenario: Folder Preview の行をクリックすると閉じているピンが開く
    Given Pinned のフォルダ "Develop" にピン "GitHub" がある
    And ピン "GitHub" に対応するライブタブがない
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    And Folder Preview の "GitHub" をクリックする
    Then "GitHub" の URL が Chrome のピン留めタブとして開く
    And フォルダ "Develop" の直下に peek 行 "GitHub" が表示される
    And Folder Preview が閉じる

  Scenario: Folder Preview の行をクリックすると開いているピンに切り替わる
    Given Pinned のフォルダ "Develop" にピン "GitHub" がある
    And ピン "GitHub" のライブタブが開いている
    And ピン "GitHub" のライブタブはアクティブではない
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    And Folder Preview の "GitHub" をクリックする
    Then ピン "GitHub" のライブタブがアクティブになる
    And Folder Preview が閉じる

  Scenario: アクティブなピンは Folder Preview でハイライトされる
    Given Pinned のフォルダ "Develop" にピン "GitHub" がある
    And ピン "GitHub" のライブタブがアクティブである
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    Then Folder Preview の "GitHub" の行がハイライトされる

  Scenario: Chrome 方式の折りたたみフォルダにホバーすると配下のブックマークが Folder Preview に表示される
    Given ブックマークバーにフォルダ "Develop" がある
    And フォルダ "Develop" にブックマーク "GitHub" とブックマーク "Jotter" がこの順である
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    Then Folder Preview に "GitHub" と "Jotter" がこの順で表示される

  Scenario: Chrome 方式の Folder Preview の行をクリックするとブックマークが開く
    Given ブックマークバーにフォルダ "Develop" がある
    And フォルダ "Develop" にブックマーク "GitHub" がある
    When フォルダ "Develop" を閉じる
    And フォルダ "Develop" に500msホバーする
    And Folder Preview の "GitHub" をクリックする
    Then "GitHub" の URL のタブが開く
    And Folder Preview が閉じる

  Scenario: フォルダの上を500ms未満で横切ると Folder Preview は出ない
    Given Pinned のフォルダ "Develop" が閉じている
    When フォルダ "Develop" の上を500ms未満で横切る
    Then Folder Preview は表示されない

  Scenario: フォルダ行と Folder Preview の両方から離れると閉じる
    Given Pinned のフォルダ "Develop" が閉じている
    And Folder Preview が表示されている
    When フォルダ "Develop" の行と Folder Preview の外へポインタを移す
    Then Folder Preview が閉じる

  Scenario: 展開中のフォルダでは Folder Preview を出さない
    Given Pinned のフォルダ "Develop" が開いている
    When フォルダ "Develop" に500msホバーする
    Then Folder Preview は表示されない

  Scenario: 空のフォルダでは Folder Preview を出さない
    Given Pinned のフォルダ "Empty" にピンもフォルダもない
    When フォルダ "Empty" に500msホバーする
    Then Folder Preview は表示されない

  Scenario: ドラッグ中は Folder Preview を出さない
    Given Pinned のフォルダ "Develop" が閉じている
    When ピンをドラッグしている
    And フォルダ "Develop" に500msホバーする
    Then Folder Preview は表示されない

  Scenario: 右クリックメニュー表示中は Folder Preview を出さない
    Given Pinned のフォルダ "Develop" が閉じている
    When フォルダ "Develop" を右クリックする
    Then フォルダの右クリックメニューが表示される
    And Folder Preview は表示されない

  Scenario: パネルの下端付近では Folder Preview を上に出す
    Given Pinned のフォルダ "Develop" がパネルの下端付近で閉じている
    When フォルダ "Develop" に500msホバーする
    Then Folder Preview はフォルダ行の上に表示される
    And Folder Preview はパネルの外にはみ出さない

  Scenario: Folder Preview には検索欄を出さない
    Given Folder Preview が表示されている
    Then Folder Preview に検索欄は表示されない
