---
status: accepted
---

# chrome.* をアダプタ層に隔離する

`chrome.tabs`、`chrome.bookmarks`、`chrome.storage` へのアクセスは `src/lib/chrome/` のアダプタに集約し、UI と純粋関数はアダプタ越しにのみ Chrome API を触る。Vitest は Node 上で動くため、コンポーネントテストではアダプタをモックに差し替える必要がある。直接呼ぶ方が短いが、テストのために全コンポーネントで `chrome` をスタブする構成は崩れやすい。
