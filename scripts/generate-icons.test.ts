import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ICON_SIZES, ICON_SOURCE, iconTargets, pngDimensions } from './generate-icons';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('iconTargets', () => {
  it('manifest が参照する全サイズの出力先を返す', () => {
    expect(iconTargets('public/icon')).toEqual(
      ICON_SIZES.map((size) => join('public/icon', `${size}.png`)),
    );
  });
});

describe('pngDimensions', () => {
  it('生成済み PNG の幅と高さがサイズと一致する', async () => {
    for (const size of ICON_SIZES) {
      const png = await readFile(join(root, 'public/icon', `${size}.png`));
      expect(pngDimensions(png)).toEqual({ width: size, height: size });
    }
  });

  it('PNG でないバイト列を拒否する', () => {
    expect(() => pngDimensions(new Uint8Array([0x89, 0x50, 0x4e]))).toThrow();
  });
});

describe('ICON_SOURCE', () => {
  it('SVG 原本がリポジトリに存在する', async () => {
    const svg = await readFile(join(root, ICON_SOURCE), 'utf8');
    expect(svg).toContain('viewBox="0 0 128 128"');
  });
});
