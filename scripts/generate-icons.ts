import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** 拡張アイコンの PNG サイズ。manifest の icons と action.default_icon に対応する */
export const ICON_SIZES = [16, 32, 48, 96, 128] as const;

/** アイコンの SVG 原本（リポジトリルートからの相対パス） */
export const ICON_SOURCE = 'public/icon/source.svg';

/** 出力先ディレクトリに対する生成ファイルのパス一覧を返す */
export function iconTargets(outDir: string): string[] {
  return ICON_SIZES.map((size) => join(outDir, `${size}.png`));
}

/** PNG の IHDR チャンクから幅と高さを読み取る */
export function pngDimensions(png: Uint8Array): { width: number; height: number } {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const [index, byte] of signature.entries()) {
    if (png[index] !== byte) {
      throw new Error('PNG のシグネチャが不正です');
    }
  }

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  if (view.getUint32(8) !== 13 || String.fromCharCode(...png.slice(12, 16)) !== 'IHDR') {
    throw new Error('PNG の IHDR チャンクが見つかりません');
  }

  return { width: view.getUint32(16), height: view.getUint32(20) };
}

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const svg = await readFile(join(root, ICON_SOURCE));
  const outDir = join(root, 'public/icon');
  await mkdir(outDir, { recursive: true });

  const { default: sharp } = await import('sharp');
  const targets = iconTargets('public/icon');
  await Promise.all(
    ICON_SIZES.map(async (size, index) => {
      const target = targets[index];
      if (!target) {
        throw new Error(`サイズ ${size} の出力先がありません`);
      }
      const png = await sharp(svg).resize(size, size).png().toBuffer();
      await writeFile(join(root, target), png);
      console.log(`generated ${target} (${size}x${size})`);
    }),
  );
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await main();
}
