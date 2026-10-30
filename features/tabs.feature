Feature: タブ一覧の操作

  Scenario: 現在のウィンドウのタブが並び順どおりに表示される
    Given 現在のウィンドウにタブ "GitHub Docs" とタブ "Google" がこの順で開いている
    When サイドパネルを開く
    Then タブ "GitHub Docs" がタブ "Google" より上に表示される

  Scenario: タブ行に favicon が表示される
    Given 現在のウィンドウにタブ "GitHub Docs" が開いている
    When サイドパネルを開く
    Then タブ "GitHub Docs" の行に favicon が表示される

  Scenario: アクティブタブがハイライトされる
    Given 現在のウィンドウでタブ "GitHub Docs" がアクティブである
    When サイドパネルを開く
    Then タブ "GitHub Docs" の行が角丸の背景でハイライトされる

  Scenario: タブをクリックするとそのタブに切り替わる
    Given 現在のウィンドウにタブ "GitHub Docs" が開いている
    And 現在のウィンドウでタブ "Google" がアクティブである
    When タブ "GitHub Docs" の行をクリックする
    Then タブ "GitHub Docs" がアクティブになる

  Scenario: タブのタイトルが変わると行に反映される
    Given サイドパネルが開いている
    And 現在のウィンドウにタブ "GitHub Docs" が開いている
    When そのタブのタイトルが "GitHub Docs - API" に変わる
    Then タブ一覧の行が "GitHub Docs - API" と表示される

  Scenario: タブ行の × でタブを閉じる
    Given 現在のウィンドウにタブ "Google" が開いている
    When タブ "Google" の行にホバーする
    And 現れた "×" をクリックする
    Then タブ "Google" が閉じる

  Scenario: New Tab で新しいタブが開く
    When "+ New Tab" をクリックする
    Then 新しいタブが開き、アクティブになる

  Scenario: 開いていないブックマークは新しいタブで開く
    Given ブックマークバーにブックマーク "Mail" がある
    And ブックマーク "Mail" の URL が "https://mail.example.com/inbox" である
    And 現在のウィンドウに同じ URL のタブがない
    When ブックマーク "Mail" をクリックする
    Then 現在のウィンドウに "https://mail.example.com/inbox" のタブが新しく開く

  Scenario: 開いているブックマークは既存のタブに切り替わる
    Given ブックマークバーにブックマーク "Mail" がある
    And ブックマーク "Mail" の URL が "https://mail.example.com/inbox" である
    And 現在のウィンドウに "https://mail.example.com/inbox" のタブがある
    When ブックマーク "Mail" をクリックする
    Then そのタブがアクティブになる

  Scenario: 末尾スラッシュとハッシュを無視して既存タブに切り替わる
    Given ブックマークバーにブックマーク "Calendar" がある
    And ブックマーク "Calendar" の URL が "https://calendar.example.com/week" である
    And 現在のウィンドウに "https://calendar.example.com/week/#top" のタブがある
    When ブックマーク "Calendar" をクリックする
    Then そのタブがアクティブになる

  Scenario: 同じ URL のタブが複数ある場合はタブ順で最初のタブに切り替わる
    Given ブックマークバーにブックマーク "Mail" がある
    And ブックマーク "Mail" の URL が "https://mail.example.com/inbox" である
    And 現在のウィンドウに "https://mail.example.com/inbox" のタブが 2 つある
    When ブックマーク "Mail" をクリックする
    Then タブ順で最初の "https://mail.example.com/inbox" のタブがアクティブになる

  Scenario: 他のウィンドウにだけ開いているブックマークは新しいタブで開く
    Given ブックマークバーにブックマーク "Mail" がある
    And ブックマーク "Mail" の URL が "https://mail.example.com/inbox" である
    And 他のウィンドウにだけ "https://mail.example.com/inbox" のタブがある
    When ブックマーク "Mail" をクリックする
    Then 現在のウィンドウに "https://mail.example.com/inbox" のタブが新しく開く

  Scenario: 開いたタブがタブ一覧に反映される
    Given サイドパネルが開いている
    When 新しいタブを開く
    Then 新しいタブがタブ一覧に表示される

  Scenario: 閉じたタブがタブ一覧から消える
    Given サイドパネルが開いている
    And 現在のウィンドウにタブ "Google" が開いている
    When タブ "Google" を閉じる
    Then タブ "Google" がタブ一覧から消える

  Scenario: タブを並べ替えると順序が反映される
    Given サイドパネルが開いている
    And 現在のウィンドウにタブ "GitHub Docs" とタブ "Google" がこの順で開いている
    When タブ "Google" をタブ "GitHub Docs" の前へ移動する
    Then タブ "Google" がタブ "GitHub Docs" より上に表示される

  Scenario: ブックマークの変更が反映される
    Given サイドパネルが開いている
    And ブックマークバーにフォルダ "Communicate" がある
    When フォルダ "Communicate" にブックマーク "X" が追加される
    Then フォルダ "Communicate" の下にブックマーク "X" が表示される
