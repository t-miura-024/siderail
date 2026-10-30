import { describe, expect, it } from 'vitest';
import { parseCollapsedFolderIds, toggleCollapsedFolder } from './folderState';

describe('parseCollapsedFolderIds', () => {
  it('保存値が配列でなければ空配列を返す', () => {
    expect(parseCollapsedFolderIds(undefined)).toEqual([]);
    expect(parseCollapsedFolderIds('folder-1')).toEqual([]);
    expect(parseCollapsedFolderIds({ folderId: true })).toEqual([]);
  });

  it('文字列以外の要素を除外する', () => {
    expect(parseCollapsedFolderIds(['folder-1', 1, null, 'folder-2'])).toEqual([
      'folder-1',
      'folder-2',
    ]);
  });

  it('文字列の配列はそのまま返す', () => {
    expect(parseCollapsedFolderIds(['folder-1', 'folder-2'])).toEqual(['folder-1', 'folder-2']);
  });
});

describe('toggleCollapsedFolder', () => {
  it('閉じていないフォルダを閉じた状態にする', () => {
    expect(toggleCollapsedFolder(['folder-1'], 'folder-2')).toEqual(['folder-1', 'folder-2']);
  });

  it('閉じているフォルダを開いた状態にする', () => {
    expect(toggleCollapsedFolder(['folder-1', 'folder-2'], 'folder-1')).toEqual(['folder-2']);
  });

  it('元の配列を変更しない', () => {
    const original = ['folder-1'];

    toggleCollapsedFolder(original, 'folder-2');

    expect(original).toEqual(['folder-1']);
  });
});
