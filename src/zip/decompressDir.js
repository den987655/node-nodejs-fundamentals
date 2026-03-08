import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createBrotliDecompress } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, 'workspace');
const compressedDir = path.join(workspacePath, 'compressed');
const archivePath = path.join(compressedDir, 'archive.br');
const decompressedDir = path.join(workspacePath, 'decompressed');

const decompressDir = async () => {
  try {
    await access(compressedDir);
    await access(archivePath);

    const chunks = [];

    await pipeline(
      createReadStream(archivePath),
      createBrotliDecompress(),
      new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      }),
    );

    const { entries = [] } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    await mkdir(decompressedDir, { recursive: true });

    for (const entry of entries) {
      const targetPath = path.join(decompressedDir, entry.path);

      if (entry.type === 'directory') {
        await mkdir(targetPath, { recursive: true });
        continue;
      }

      if (entry.type === 'file') {
        await mkdir(path.dirname(targetPath), { recursive: true });
        await new Promise((resolve, reject) => {
          const stream = createWriteStream(targetPath);
          stream.on('error', reject);
          stream.on('finish', resolve);
          stream.end(Buffer.from(entry.content ?? '', 'base64'));
        });
      }
    }
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await decompressDir();
