Feature: サイドバーの表示

  Scenario: ブックマークバー配下が階層どおりに表示される
    Given ブックマークバーにフォルダ "Communicate" がある
    And フォルダ "Communicate" にブックマーク "Mail" がある
    When サイドパネルを開く
    Then フォルダ "Communicate" が表示される
    And フォルダ "Communicate" の下にブックマーク "Mail" が表示される

  Scenario: フォルダを閉じる
    Given ブックマークバーにフォルダ "Communicate" がある
    And フォルダ "Communicate" にブックマーク "Mail" がある
    When フォルダ "Communicate" をクリックする
    Then ブックマーク "Mail" が表示されなくなる

  Scenario: 保存状態がないフォルダは開いた状態で表示される
    Given ブックマークバーにフォルダ "Communicate" がある
    And フォルダ "Communicate" にブックマーク "Mail" がある
    And フォルダ "Communicate" の開閉状態が保存されていない
    When サイドパネルを開く
    Then フォルダ "Communicate" の下にブックマーク "Mail" が表示される

  Scenario: フォルダの開閉状態が復元される
    Given フォルダ "Communicate" が閉じられている
    When サイドパネルを閉じて開き直す
    Then フォルダ "Communicate" は閉じたままである

  Scenario: フォルダ名の絵文字がそのまま表示される
    Given ブックマークバーにフォルダ "💬 Communicate" がある
    When サイドパネルを開く
    Then フォルダ行に絵文字 "💬" が表示される

  Scenario: ブックマークの子項目に favicon が表示される
    Given ブックマークバーにフォルダ "Communicate" がある
    And フォルダ "Communicate" にブックマーク "Mail" がある
    When サイドパネルを開く
    Then ブックマーク "Mail" の行に favicon が表示される

  Scenario: ブックマークバー以外のルートは表示されない
    Given その他のブックマークにフォルダ "Archive" がある
    When サイドパネルを開く
    Then フォルダ "Archive" は表示されない

  Scenario: 区切り線に Clear は表示されない
    When サイドパネルを開く
    Then 区切り線の右に "Clear" は表示されない

  Scenario: ブックマークバーが空でもタブ一覧は表示される
    Given ブックマークバーにブックマークもフォルダもない
    When サイドパネルを開く
    Then タブ一覧が表示される
