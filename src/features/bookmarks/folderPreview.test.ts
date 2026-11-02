import { describe, expect, it } from 'vitest';
import { computeFolderPreviewLayout, getFolderPreviewContentHeight } from './folderPreview';

const panel = { left: 0, top: 0, width: 320, height: 800 };

describe('computeFolderPreviewLayout', () => {
  it('パネル幅が狭いときは左右8pxの余白に収める', () => {
    expect(
      computeFolderPreviewLayout({ left: 10, top: 100, bottom: 140 }, { ...panel, width: 240 }, 3),
    ).toEqual({
      left: 8,
      top: 144,
      width: 224,
      maxHeight: 648,
      above: false,
    });
  });

  it('パネル幅が広いときは最大320pxにしてフォルダ行の下へ出す', () => {
    expect(
      computeFolderPreviewLayout(
        { left: 150, top: 200, bottom: 240 },
        { ...panel, left: 100, top: 50, width: 640, height: 600 },
        3,
      ),
    ).toEqual({
      left: 150,
      top: 244,
      width: 320,
      maxHeight: 398,
      above: false,
    });
  });

  it('右端のフォルダではカードをパネル内の左へ寄せる', () => {
    expect(
      computeFolderPreviewLayout({ left: 600, top: 100, bottom: 140 }, { ...panel, width: 640 }, 3),
    ).toEqual({
      left: 312,
      top: 144,
      width: 320,
      maxHeight: 648,
      above: false,
    });
  });

  it('下端に近いフォルダではカードを上へ反転する', () => {
    expect(computeFolderPreviewLayout({ left: 10, top: 700, bottom: 740 }, panel, 3)).toEqual({
      left: 8,
      top: 696,
      width: 304,
      maxHeight: 688,
      above: true,
    });
  });

  it('下に内容が入りきらない場合は上に十分な空間があれば反転する', () => {
    expect(computeFolderPreviewLayout({ left: 10, top: 648, bottom: 688 }, panel, 3)).toEqual({
      left: 8,
      top: 644,
      width: 304,
      maxHeight: 636,
      above: true,
    });
  });

  it('上にも下にも十分な空間がないときはパネル内の高さに切り詰める', () => {
    expect(
      computeFolderPreviewLayout(
        { left: 10, top: 90, bottom: 130 },
        { ...panel, width: 200, height: 200 },
        3,
      ),
    ).toEqual({
      left: 8,
      top: 86,
      width: 184,
      maxHeight: 78,
      above: true,
    });
  });
});

describe('getFolderPreviewContentHeight', () => {
  it('行数からカードの高さを見積もる', () => {
    expect(getFolderPreviewContentHeight(3)).toBe(142);
  });

  it('行数が0のときは0を返す', () => {
    expect(getFolderPreviewContentHeight(0)).toBe(0);
  });
});
